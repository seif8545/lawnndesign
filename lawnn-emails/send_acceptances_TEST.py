"""
Lawnn — send acceptance emails + enrol accepted students.

Two groups:
  FULL_STUDENTS      -> full student powers (feed + apply to jobs)
  COMMUNITY_STUDENTS -> "community access": can sign in, build a profile, comment
                        and engage, but CANNOT apply to jobs yet (weak portfolio).

For every person this script:
  1. Creates the account directly in the database (role = student; the
     communityOnly flag decides the tier).
  2. Creates a one-time invite token.
  3. Emails a set-password link:  <FRONTEND_URL>/?token=<token>&email=<email>
     Opening it shows the set-password page, saves the new password to the DB,
     then logs them straight in to the normal first-time onboarding.

Secrets come from environment variables, never the file.

Run:
  pip install psycopg2-binary requests
  set BREVO_API_KEY=xkeysib-...                (Windows: use `set`; mac/linux: `export`)
  set BREVO_SENDER=info@lawnndesign.com        (a sender you've verified in Brevo)
  set DATABASE_URL=postgresql://...            (your Supabase DIRECT connection string)
  python send_acceptances.py

Delivery is via the Brevo transactional API, so every send appears in your Brevo
dashboard (delivered / opened / bounced).
"""

import os
import secrets
import hashlib
from urllib.parse import quote

import psycopg2
import requests   # pip install requests

# ─────────────────────────────────────────────────────────────────────────────
# 1) FULL STUDENTS — full access (feed + apply to jobs). (Name, email) pairs.
# ─────────────────────────────────────────────────────────────────────────────
FULL_STUDENTS = [
    ("Seif",                                 "seifomaraly123+lawnn@gmail.com"),
]

# ─────────────────────────────────────────────────────────────────────────────
# 2) COMMUNITY STUDENTS — community access only (no job applications yet).
# ─────────────────────────────────────────────────────────────────────────────
COMMUNITY_STUDENTS = [
    # empty for this test — Seif goes through as a full-access student above
]

# ─────────────────────────────────────────────────────────────────────────────
# 3) Your live site (where the invite link opens). No trailing slash.
# ─────────────────────────────────────────────────────────────────────────────
FRONTEND_URL = "https://lawnndesign.com"

# ── Secrets come from the environment (never commit these) ────────────────────
BREVO_API_KEY = os.environ.get("BREVO_API_KEY", "")
BREVO_SENDER  = os.environ.get("BREVO_SENDER", "")   # a verified sender address in Brevo
DATABASE_URL  = os.environ.get("DATABASE_URL", "")
FROM_NAME     = "The Lawnn Team"

INVITE_DAYS = 7  # how long the set-password link stays valid


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────
def new_id():
    # A unique text id (the app normally uses cuid; any unique string works as a PK/FK).
    return "c" + secrets.token_hex(12)


def initials_from_name(name):
    parts = [w[0] for w in name.split() if w]
    return ("".join(parts)[:4] or "NS").upper()


def first_name(name):
    parts = name.split()
    return parts[0] if parts else "there"


def enrol(cur, name, email, community):
    """Create user + profile + invite. Returns the raw invite token, or None if
    the email already has an account (skipped)."""
    cur.execute("SELECT 1 FROM users WHERE email = %s", (email,))
    if cur.fetchone():
        return None

    uid          = new_id()
    initials     = initials_from_name(name)
    placeholder  = secrets.token_urlsafe(24)   # never used; replaced when they set a password
    raw_token    = secrets.token_hex(32)
    token_hash   = hashlib.sha256(raw_token.encode()).hexdigest()

    cur.execute(
        'INSERT INTO users (id, email, password, name, initials, "updatedAt", "communityOnly") '
        "VALUES (%s, %s, %s, %s, %s, NOW(), %s)",
        (uid, email, placeholder, name, initials, community),
    )
    cur.execute(
        'INSERT INTO profiles (id, "userId", "updatedAt") VALUES (%s, %s, NOW())',
        (new_id(), uid),
    )
    cur.execute(
        'INSERT INTO student_invites (id, "userId", "tokenHash", "expiresAt") '
        "VALUES (%s, %s, %s, NOW() + make_interval(days => %s))",
        (new_id(), uid, token_hash, INVITE_DAYS),
    )
    return raw_token


def build_link(raw_token, email):
    return f"{FRONTEND_URL}/?token={raw_token}&email={quote(email)}"


def email_bodies(name, link, community):
    """Returns (subject, plaintext, html). Greeting uses the student's first name."""
    first = first_name(name)

    if community:
        subject = "Welcome to the Lawnn community! 🎉"
        intro = (
            f"Hi {first},\n\n"
            "We have some wonderful news. We reviewed your work samples and we see so much "
            "potential in what you do. We are absolutely thrilled to officially welcome you to Lawnn!\n\n"
            "Our platform is built to help art and design students grow, and we want to set you up "
            "for absolute success. Because Lawnn connects students directly with paying clients, we "
            "want to make sure you feel completely ready and confident before you start taking on "
            "professional projects.\n\n"
            "For right now, your account is set up for community access. This means you will not be "
            "able to post jobs or take on client work just yet. However, you will get full access to "
            "all of our platform resources, guides, and tools designed to help you level up your "
            "skills and build a standout portfolio.\n\n"
            "In a month's time, we will do a formal evaluation of your updated work. This gives you "
            "plenty of time to practice and grow using our resources! Once your portfolio reaches the "
            "standard needed for professional client projects, we will unlock your ability to start "
            "freelancing and making money.\n\n"
            "We are so excited to be part of your creative journey and we cannot wait to see how much "
            "your work evolves. Set up your account below to get started:"
        )
    else:
        subject = "You are officially in! Welcome to Lawnn 🎉"
        intro = (
            f"Hi {first},\n\n"
            "We have some wonderful news. We spent time looking through your portfolio, and we "
            "absolutely loved your work. We are so thrilled to officially welcome you to the Lawnn "
            "community!\n\n"
            "You are incredibly close to connecting with clients and taking the next big step in your "
            "creative career. There's just one step left — set up your account using the button below "
            "to build out your profile and get full access to our community resources.\n\n"
            "We are beyond excited to have your talent on the platform, and we really look forward to "
            "seeing you thrive. Set your password to get started:"
        )

    plain = (
        f"{intro}\n\n{link}\n\n"
        f"This link is valid for {INVITE_DAYS} days.\n\n"
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
  <p style="margin-top:24px">Warmly,<br>{FROM_NAME}</p>
</div>"""
    return subject, plain, html


def send_email(to_email, name, link, community):
    subject, plain, html = email_bodies(name, link, community)
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
def main():
    if not (BREVO_API_KEY and BREVO_SENDER and DATABASE_URL):
        raise SystemExit("Set BREVO_API_KEY, BREVO_SENDER and DATABASE_URL in your environment first.")

    # Build {email: name}, lower-casing emails. Full wins if anyone is in both lists.
    full = {}
    for name, email in FULL_STUDENTS:
        email = email.strip().lower()
        if email:
            full[email] = name.strip()

    community = {}
    for name, email in COMMUNITY_STUDENTS:
        email = email.strip().lower()
        if email and email not in full:
            community[email] = name.strip()

    if not full and not community:
        raise SystemExit("Both lists are empty — add some students first.")

    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = False

    created, skipped, failed = [], [], []

    queue = ([(email, name, True) for email, name in community.items()]
             + [(email, name, False) for email, name in full.items()])

    for email, name, is_community in queue:
        tier = "community" if is_community else "full"
        try:
            cur = conn.cursor()
            token = enrol(cur, name, email, is_community)
            if token is None:
                conn.rollback()
                skipped.append((email, "already has an account"))
                print(f"  - skip   {email} ({tier}) — already exists")
                continue
            conn.commit()  # account is saved before we email, so a mail error never loses it

            link = build_link(token, email)
            send_email(email, name, link, is_community)
            created.append((email, tier))
            print(f"  + sent   {email} ({tier}) — {name}")
        except Exception as exc:  # noqa: BLE001
            conn.rollback()
            failed.append((email, str(exc)))
            print(f"  x FAIL   {email} ({tier}) — {exc}")

    conn.close()

    print("\n──────── summary ────────")
    print(f"  enrolled + emailed : {len(created)}")
    print(f"  skipped (existing) : {len(skipped)}")
    print(f"  failed             : {len(failed)}")
    for email, reason in failed:
        print(f"    - {email}: {reason}")


if __name__ == "__main__":
    main()
