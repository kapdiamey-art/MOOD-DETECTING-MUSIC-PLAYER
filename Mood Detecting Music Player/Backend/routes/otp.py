"""
OTP Send & Verify endpoints - implemented in FastAPI backend.
Uses Brevo SMTP. Credentials must be set as environment variables on Render.
"""

import os
import random
import smtplib
import threading
import time
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv
from fastapi import APIRouter

load_dotenv()

router = APIRouter()

# In-memory OTP store: email -> { otp, expires_at, attempts }
_otp_store: dict = {}
_store_lock = threading.Lock()

OTP_EXPIRY_SECONDS = 5 * 60   # 5 minutes
MAX_ATTEMPTS = 5

# Brevo SMTP config (must be set as env vars on Render)
SMTP_HOST  = os.getenv("BREVO_SMTP_HOST", "smtp-relay.brevo.com")
SMTP_PORT  = int(os.getenv("BREVO_SMTP_PORT", "587"))
SMTP_USER  = os.getenv("BREVO_SMTP_USER", "")
SMTP_PASS  = os.getenv("BREVO_SMTP_PASS", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "")


def _generate_otp() -> str:
    return str(random.randint(100000, 999999))


def _send_email(to_email: str, otp: str) -> None:
    """Send the OTP email via Brevo SMTP."""
    if not SMTP_USER or not SMTP_PASS or not EMAIL_FROM:
        raise ValueError(
            "SMTP credentials not configured. "
            "Please set BREVO_SMTP_USER, BREVO_SMTP_PASS, EMAIL_FROM "
            "in the Render environment variables."
        )

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your Moodify Verification OTP"
    msg["From"]    = f"Moodify <{EMAIL_FROM}>"
    msg["To"]      = to_email

    text_body = (
        f"Your Moodify verification OTP is {otp}.\n\n"
        f"This OTP will expire in 5 minutes.\n\n"
        f"If you did not create a Moodify account, you can ignore this email."
    )

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;
                padding: 30px; border: 1px solid #ddd; border-radius: 12px;">
      <h2 style="text-align:center;">🎵 Moodify</h2>
      <p>Your verification OTP is:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px;
                  text-align: center; padding: 20px; background: #f5f5f5;
                  border-radius: 10px;">{otp}</div>
      <p>This OTP will expire in <strong>5 minutes</strong>.</p>
      <p style="color:#777;">If you did not request this OTP, you can ignore this email.</p>
    </div>
    """

    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SMTP_USER, SMTP_PASS)
        server.sendmail(EMAIL_FROM, to_email, msg.as_string())


@router.get("/check")
async def otp_check():
    """Debug: shows whether SMTP credentials are configured on this server."""
    return {
        "smtp_user_set":  bool(SMTP_USER),
        "smtp_pass_set":  bool(SMTP_PASS),
        "email_from_set": bool(EMAIL_FROM),
        "smtp_host":      SMTP_HOST,
        "smtp_port":      SMTP_PORT,
        "status": "ready" if (SMTP_USER and SMTP_PASS and EMAIL_FROM) else "MISSING env vars - add to Render dashboard"
    }


@router.post("/send-otp")
async def send_otp(data: dict):
    email = (data.get("email") or "").strip().lower()

    if not email or "@" not in email or "." not in email.split("@")[-1]:
        return {"success": False, "message": "Please enter a valid email address."}

    otp = _generate_otp()

    with _store_lock:
        _otp_store[email] = {
            "otp": otp,
            "expires_at": time.time() + OTP_EXPIRY_SECONDS,
            "attempts": 0,
        }

    try:
        _send_email(email, otp)
        print(f"[OTP] Sent to {email}")
        return {"success": True, "message": "OTP sent successfully."}
    except Exception as e:
        print(f"[OTP] Failed for {email}: {e}")
        with _store_lock:
            _otp_store.pop(email, None)
        # Return the real error so it shows in the browser for debugging
        return {"success": False, "message": f"Failed to send OTP: {str(e)}"}


@router.post("/verify-otp")
async def verify_otp(data: dict):
    email = (data.get("email") or "").strip().lower()
    otp   = (data.get("otp")   or "").strip()

    if not email or not otp:
        return {"success": False, "message": "Email and OTP are required."}

    with _store_lock:
        record = _otp_store.get(email)

        if not record:
            return {"success": False, "message": "OTP not found. Please request a new OTP."}

        if time.time() > record["expires_at"]:
            _otp_store.pop(email, None)
            return {"success": False, "message": "OTP has expired. Please request a new OTP."}

        if record["attempts"] >= MAX_ATTEMPTS:
            _otp_store.pop(email, None)
            return {"success": False, "message": "Too many incorrect attempts. Please request a new OTP."}

        if record["otp"] != otp:
            record["attempts"] += 1
            return {"success": False, "message": "Incorrect OTP. Please try again."}

        _otp_store.pop(email, None)

    print(f"[OTP] Verified for {email}")
    return {"success": True, "message": "OTP verified successfully."}
