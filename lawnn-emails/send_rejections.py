"""
Lawnn — send rejection emails (no portfolio / work samples).

These applicants did not include a portfolio, so we can't complete the review.
This script ONLY sends email (no database changes) — each person gets the
rejection note plus a link to re-apply once they have a portfolio ready.

Run:
  pip install requests
  set BREVO_API_KEY=xkeysib-...                (Windows: use `set`; mac/linux: `export`)
  set BREVO_SENDER=info@lawnndesign.com        (a sender you've verified in Brevo)
  python send_rejections.py

Delivery is via the Brevo transactional API, so every send appears in your Brevo
dashboard (delivered / opened / bounced).
"""

import os
import requests   # pip install requests

# ─────────────────────────────────────────────────────────────────────────────
# Recipients — (first name, email). Names mapped from the application roster;
# three Arabic-script names transliterated to match each person's own email.
# ─────────────────────────────────────────────────────────────────────────────
REJECT_STUDENTS = [
    ("Sama",     "sama3abdo1@gmail.com"),
    ("Mariam",   "Mariam.nabil.2622@gmail.com"),
    ("Salma",    "salmalokafawzy867@gmail.com"),
    ("Merolla",  "sheriflola11012008@gmail.com"),
    ("Moaaz",    "moaazelsharkawy205@gmail.com"),
    ("Menna",    "mennaaymanhussien2007@gmail.com"),
    ("Merolla",  "sherifkamal40@gmail.com"),
    ("Maryam",   "maryamelmansy15@gmail.com"),
    ("Amera",    "ameragoda359@gmail.com"),
    ("Pakinam",  "pakinamsaeed156@gmail.com"),
    ("Leqaa",    "leqaaahmedwafaa@gmail.com"),
    ("Salma",    "salmaosamasaied.1.1@gmail.com"),
    ("Omar",     "omar.khaled.ahmed.2008@gmail.com"),
    ("Habiba",   "habibawaleed76@gmail.com"),
    ("Salma",    "sk7739545@gmail.com"),
    ("Sama",     "samahamdy710@gmail.com"),
    ("Hanin",    "haninm531@icloud.com"),
    ("Shahd",    "oshaaavvv242004@gmail.com"),
    ("Raghed",   "raghedgamal3@gmail.com"),
    ("Merna",    "Mernaatef098@gmail.com"),
    ("Samar",    "2004samr@gmail.com"),
]

# Re-apply form (included as the "Apply Again" button).
FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScm-OxEG4iucDm8NreNmvsSaXARH0KJE3Al8JZ8e53AlsmvEw/viewform"

# ── Secrets come from the environment (never commit these) ────────────────────
BREVO_API_KEY = os.environ.get("BREVO_API_KEY", "")
BREVO_SENDER  = os.environ.get("BREVO_SENDER", "")
FROM_NAME     = "The Lawnn Team"
SUBJECT       = "Update on your Lawnn application"


def email_bodies(name):
    """Returns (plaintext, html) for one applicant, greeted by first name."""
    paras = [
        "Thank you so much for your interest in joining Lawnn. We truly appreciate the time you took to apply and your enthusiasm for our platform.",
        "At this time, we are unable to move forward with your application. To properly categorize your creative level and ensure you are set up for success, we rely heavily on seeing your previous work. Because your application did not include a portfolio or work samples, we aren't able to complete our review process right now.",
        "We know that putting together a portfolio takes time and effort, but it is the best way for us to understand your unique style and capabilities.",
        "Please don't let this discourage you! You can always apply again as soon as you have a complete portfolio or work samples ready to share. Everyone is welcome in our creative student community here at Lawnn, and we would absolutely love to see what you create in the future.",
        "We are cheering you on and hope to hear from you again soon.",
    ]

    plain = (
        f"Dear {name},\n\n"
        + "\n\n".join(paras)
        + f"\n\nApply again here: {FORM_URL}\n\n"
        + f"Warmly,\n{FROM_NAME}"
    )

    para_html = "".join(
        f'<p style="margin:0 0 14px">{p}</p>' for p in paras
    )
    html = f"""\
<div style="font-family:Arial,sans-serif;color:#21326c;line-height:1.6;max-width:520px">
  <p style="margin:0 0 14px">Dear {name},</p>
  {para_html}
  <p style="margin:24px 0">
    <a href="{FORM_URL}" style="background:#ff9044;color:#fff;text-decoration:none;
       padding:12px 22px;border-radius:9999px;font-weight:600;display:inline-block">
       Apply Again
    </a>
  </p>
  <p style="font-size:13px;color:#21326c99">Or paste this link into your browser:<br>{FORM_URL}</p>
  <p style="margin-top:24px">Warmly,<br>{FROM_NAME}</p>
</div>"""
    return plain, html


def send_email(to_email, name):
    plain, html = email_bodies(name)
    resp = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={"api-key": BREVO_API_KEY, "accept": "application/json",
                 "content-type": "application/json"},
        json={
            "sender": {"name": FROM_NAME, "email": BREVO_SENDER},
            "to": [{"email": to_email, "name": name}],
            "subject": SUBJECT,
            "htmlContent": html,
            "textContent": plain,
        },
        timeout=30,
    )
    if resp.status_code >= 300:
        raise RuntimeError(f"Brevo API {resp.status_code}: {resp.text}")


def main():
    if not (BREVO_API_KEY and BREVO_SENDER):
        raise SystemExit("Set BREVO_API_KEY and BREVO_SENDER in your environment first.")

    # De-dup by email while preserving the first name we mapped.
    seen, queue = set(), []
    for name, email in REJECT_STUDENTS:
        e = email.strip().lower()
        if e and e not in seen:
            seen.add(e)
            queue.append((name.strip(), e))

    sent, failed = [], []
    for name, email in queue:
        try:
            send_email(email, name)
            sent.append(email)
            print(f"  + sent   {email} — {name}")
        except Exception as exc:  # noqa: BLE001
            failed.append((email, str(exc)))
            print(f"  x FAIL   {email} — {exc}")

    print("\n──────── summary ────────")
    print(f"  emailed : {len(sent)}")
    print(f"  failed  : {len(failed)}")
    for email, reason in failed:
        print(f"    - {email}: {reason}")


if __name__ == "__main__":
    main()
