"""
Lawnn — re-nudge students who never finished getting onboarded.

WHY THIS EXISTS (and why send_acceptances.py can't do it)
────────────────────────────────────────────────────────
`send_acceptances.py` enrols brand-new students. Its `enrol()` bails out the
moment the email already has a `users` row, so re-running it against people who
were already created just prints "skip — already exists" and sends nothing.
Everyone we want to reach here already has an account, so this is a separate job.

TWO GROUPS, TWO DIFFERENT EMAILS
────────────────────────────────
  NEVER_ACCEPTED  — has an invite that was never used (student_invites.acceptedAt
                    IS NULL). They never set a password. The original 7-day links
                    expired on 22 Jul unclicked. We overwrite their invite row
                    with a FRESH token + expiry and re-send the acceptance email.

  STALLED         — accepted the invite (password is set) but the profile is
                    still incomplete, so they never reached admin review. They
                    must NOT get a set-password link — that link would fail and
                    confuse them. They get a "come finish your profile" nudge
                    pointing at the normal login page.

Group membership is computed from the database, never from a hardcoded list, so
this stays correct as students trickle in.

Run — PowerShell (the default shell in Windows Terminal / VS Code):
  pip install psycopg2-binary requests
  $env:BREVO_API_KEY = 'xkeysib-...'
  $env:BREVO_SENDER  = 'info@lawnndesign.com'
  $env:DATABASE_URL  = 'postgresql://...'   # DIRECT connection, port 5432 —
                                            # NOT the :6543 pgbouncer pooler
  python resend_invites.py

Do NOT use `set NAME=value` in PowerShell. There `set` is an alias for
Set-Variable, so it silently creates a PowerShell variable named "NAME=value"
instead of an environment variable, and Python never sees it. `set` is cmd.exe
syntax; in cmd the equivalent is:
  set BREVO_API_KEY=xkeysib-...

Single quotes matter for DATABASE_URL: the password contains $ and !, which
PowerShell would otherwise try to expand.
"""

import os
import secrets
import hashlib
from urllib.parse import quote

import psycopg2
import requests

# ─────────────────────────────────────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────────────────────────────────────
FRONTEND_URL = "https://lawnndesign.com"

BREVO_API_KEY = os.environ.get("BREVO_API_KEY", "")
BREVO_SENDER  = os.environ.get("BREVO_SENDER", "")
DATABASE_URL  = os.environ.get("DATABASE_URL", "")
FROM_NAME     = "The Lawnn Team"

INVITE_DAYS = 14  # the original 7 expired unclicked; HANDOFF §8 flags that risk

# Never email these, whatever the query says:
#   - raneemelhoreny7@ : her 9 Aug link is still live and unclicked; reissuing
#                        would kill the link already sitting in her inbox
#   - seifomaraly4@    : internal test account
#   - student@         : seeded demo account (no invite row, complete profile)
SKIP_EMAILS = {
    "raneemelhoreny7@gmail.com",
    "seifomaraly4@gmail.com",
    "student@lawnndesign.com",
}

# ─────────────────────────────────────────────────────────────────────────────
# Group queries
# ─────────────────────────────────────────────────────────────────────────────
# "Onboarding complete" mirrors backend/src/routes/profiles.js profileComplete():
# a non-blank bio AND >=1 skill AND >=1 portfolio piece that has a real file.
_COMPLETE = """
      (p.bio IS NOT NULL AND btrim(p.bio) <> '')
  AND EXISTS (SELECT 1 FROM profile_skills ps WHERE ps."profileId" = p.id)
  AND EXISTS (SELECT 1 FROM portfolio_items pi
               WHERE pi."profileId" = p.id
                 AND (pi."imageUrl" IS NOT NULL OR pi."pdfUrl" IS NOT NULL))
"""

Q_NEVER_ACCEPTED = f"""
SELECT u.id, u.name, u.email, u."communityOnly"
FROM users u
JOIN student_invites si ON si."userId" = u.id
LEFT JOIN profiles p ON p."userId" = u.id
WHERE u.role = 'student'
  AND u.suspended = false
  AND si."acceptedAt" IS NULL
  AND NOT ({_COMPLETE})
ORDER BY u.name
"""

Q_STALLED = f"""
SELECT u.id, u.name, u.email, u."communityOnly"
FROM users u
JOIN student_invites si ON si."userId" = u.id
JOIN profiles p ON p."userId" = u.id
WHERE u.role = 'student'
  AND u.suspended = false
  AND si."acceptedAt" IS NOT NULL
  AND NOT ({_COMPLETE})
ORDER BY u.name
"""


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
def first_name(name):
    parts = (name or "").split()
    return parts[0] if parts else "there"


def refresh_invite(cur, user_id):
    """Overwrite this user's invite with a new token + expiry. Returns the raw
    token. The row already exists (userId is UNIQUE), so this is an UPDATE."""
    raw_token  = secrets.token_hex(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    cur.execute(
        'UPDATE student_invites '
        'SET "tokenHash" = %s, "expiresAt" = NOW() + make_interval(days => %s), '
        '    "acceptedAt" = NULL '
        'WHERE "userId" = %s',
        (token_hash, INVITE_DAYS, user_id),
    )
    if cur.rowcount != 1:
        raise RuntimeError(f"expected to update 1 invite row, updated {cur.rowcount}")
    return raw_token


def build_link(raw_token, email):
    return f"{FRONTEND_URL}/?token={raw_token}&email={quote(email)}"


# ─────────────────────────────────────────────────────────────────────────────
# Email copy
# ─────────────────────────────────────────────────────────────────────────────
def invite_bodies(name, link, community):
    """Acceptance email — same warm copy as the original send, plus one line
    acknowledging that this is a fresh link because the old one lapsed."""
    first = first_name(name)

    if community:
        subject = "Your Lawnn invite — here's a fresh link 🎉"
        intro = (
            f"Hi {first},\n\n"
            "We reviewed your work samples a little while ago and we saw so much potential in "
            "what you do — we're still thrilled to welcome you to Lawnn!\n\n"
            "We noticed you haven't set up your account yet, and your original setup link has "
            "since expired. That's completely our timing, not yours — so here's a brand new one.\n\n"
            "Your account is set up for community access. This means you won't be able to take on "
            "client work just yet. You will get full access to all of our platform resources, "
            "guides, and tools designed to help you level up your skills and build a standout "
            "portfolio.\n\n"
            "Once your portfolio reaches the standard needed for professional client projects, "
            "we'll unlock your ability to start freelancing and making money.\n\n"
            "Set up your account below to get started:"
        )
    else:
        subject = "Your Lawnn invite — here's a fresh link 🎉"
        intro = (
            f"Hi {first},\n\n"
            "A little while ago we went through your portfolio, loved your work, and welcomed you "
            "to Lawnn. We're still just as glad to have you!\n\n"
            "We noticed you haven't set up your account yet, and your original setup link has "
            "since expired. That's on our timing, not yours — so here's a brand new one.\n\n"
            "You're one step away from building out your profile and connecting with clients. "
            "Set your password below and you're in:"
        )

    plain = (
        f"{intro}\n\n{link}\n\n"
        f"This link is valid for {INVITE_DAYS} days.\n\n"
        f"If you'd rather not continue, just ignore this email — no hard feelings.\n\n"
        f"Warmly,\n{FROM_NAME}"
    )
    html = f"""\
<div style="font-family:Arial,sans-serif;color:#21326c;line-height:1.6;max-width:520px">
  <p style="white-space:pre-line">{intro}</p>
  <p style="margin:24px 0">
    <a href="{link}" style="background:#ff9044;color:#fff;text-decoration:none;
       padding:12px 22px;border-radius:9999px;font-weight:600;display:inline-block">
       Set up your account
    </a>
  </p>
  <p style="font-size:13px;color:#21326c99">Or paste this link into your browser:<br>{link}</p>
  <p style="font-size:13px;color:#21326c99">This link is valid for {INVITE_DAYS} days.</p>
  <p style="font-size:13px;color:#21326c99">If you'd rather not continue, just ignore this
     email — no hard feelings.</p>
  <p style="margin-top:24px">Warmly,<br>{FROM_NAME}</p>
</div>"""
    return subject, plain, html


def nudge_bodies(name):
    """For students who already have a password but never finished the profile.
    Deliberately NO set-password link — theirs is already used up."""
    first = first_name(name)
    subject = "You're almost there — finish your Lawnn profile"
    intro = (
        f"Hi {first},\n\n"
        "You've set up your Lawnn account — nice one! But your profile isn't quite finished, "
        "and until it is, our team can't review you and clients can't find you.\n\n"
        "Three things are needed to complete it:\n"
        "  •  A short bio telling clients who you are\n"
        "  •  A few skills so the right briefs reach you\n"
        "  •  At least one portfolio piece uploaded\n\n"
        "It takes about five minutes. Just sign in with the password you already set and the "
        "app will walk you through whatever is still missing.\n\n"
        "Once you're done, our team reviews your profile and then your work goes live to clients."
    )
    plain = (
        f"{intro}\n\n{FRONTEND_URL}\n\n"
        f"Stuck on any step? Reply to this email and we'll help.\n\n"
        f"Warmly,\n{FROM_NAME}"
    )
    html = f"""\
<div style="font-family:Arial,sans-serif;color:#21326c;line-height:1.6;max-width:520px">
  <p style="white-space:pre-line">{intro}</p>
  <p style="margin:24px 0">
    <a href="{FRONTEND_URL}" style="background:#ff9044;color:#fff;text-decoration:none;
       padding:12px 22px;border-radius:9999px;font-weight:600;display:inline-block">
       Finish my profile
    </a>
  </p>
  <p style="font-size:13px;color:#21326c99">Stuck on any step? Reply to this email and we'll help.</p>
  <p style="margin-top:24px">Warmly,<br>{FROM_NAME}</p>
</div>"""
    return subject, plain, html


def send_email(to_email, name, subject, plain, html):
    resp = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={"api-key": BREVO_API_KEY, "accept": "application/json",
                 "content-type": "application/json"},
        json={
            "sender": {"name": FROM_NAME, "email": BREVO_SENDER},
            "to": [{"email": to_email, "name": name}],
            "subject": subject,
            "htmlContent": html,
            "textContent": plain,
        },
        timeout=30,
    )
    if resp.status_code >= 300:
        raise RuntimeError(f"Brevo API {resp.status_code}: {resp.text}")


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────
def fetch(cur, query):
    cur.execute(query)
    return [r for r in cur.fetchall() if r[2].strip().lower() not in SKIP_EMAILS]


def main():
    # Name only what's actually missing — a blanket "set all three" message sends
    # you hunting for variables that are already fine.
    missing = [n for n, v in (("BREVO_API_KEY", BREVO_API_KEY),
                              ("BREVO_SENDER",  BREVO_SENDER),
                              ("DATABASE_URL",  DATABASE_URL)) if not v]
    if missing:
        raise SystemExit(
            "Missing environment variable(s): " + ", ".join(missing) + "\n\n"
            "In PowerShell, set them like this (note $env: — plain `set` is cmd\n"
            "syntax and silently does nothing here):\n"
            + "".join(f"  $env:{n} = '...'\n" for n in missing)
        )

    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False
    cur = conn.cursor()

    never = fetch(cur, Q_NEVER_ACCEPTED)
    stalled = fetch(cur, Q_STALLED)
    conn.rollback()  # the reads above need no transaction held open

    print(f"\nnever set a password : {len(never)}")
    print(f"stalled mid-onboarding: {len(stalled)}")
    print(f"skipped by name      : {len(SKIP_EMAILS)} ({', '.join(sorted(SKIP_EMAILS))})\n")

    sent, failed = [], []

    # ── Group 1: fresh invite + acceptance email ────────────────────────────
    for user_id, name, email, community in never:
        tier = "community" if community else "full"
        try:
            cur = conn.cursor()
            token = refresh_invite(cur, user_id)
            conn.commit()  # persist the new token before emailing it
            link = build_link(token, email)
            subject, plain, html = invite_bodies(name, link, community)
            send_email(email, name, subject, plain, html)
            sent.append((email, f"invite/{tier}"))
            print(f"  + invite  {email} ({tier}) — {name}")
        except Exception as exc:  # noqa: BLE001
            conn.rollback()
            failed.append((email, str(exc)))
            print(f"  x FAIL    {email} ({tier}) — {exc}")

    # ── Group 2: finish-your-profile nudge (no token touched) ───────────────
    for user_id, name, email, community in stalled:
        try:
            subject, plain, html = nudge_bodies(name)
            send_email(email, name, subject, plain, html)
            sent.append((email, "nudge"))
            print(f"  + nudge   {email} — {name}")
        except Exception as exc:  # noqa: BLE001
            failed.append((email, str(exc)))
            print(f"  x FAIL    {email} — {exc}")

    conn.close()

    print("\n──────── summary ────────")
    print(f"  emailed : {len(sent)}")
    print(f"  failed  : {len(failed)}")
    for email, reason in failed:
        print(f"    - {email}: {reason}")
    print("\nRe-running is safe: anyone who has since finished drops out of both "
          "queries automatically.")


if __name__ == "__main__":
    main()
