import logging

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import EmailStr

from app.core.config import settings

logger = logging.getLogger(__name__)

# Configure FastAPI-Mail
# MAIL_STARTTLS is typically True for port 587, False for 465.
# MAIL_SSL_TLS is True for 465, False for 587.
def get_mail_config() -> ConnectionConfig | None:
    if not settings.smtp_host:
        return None

    # Handle port-based encryption correctly
    is_ssl = settings.smtp_port == 465
    is_tls = settings.smtp_port == 587 or settings.smtp_port == 25

    try:
        return ConnectionConfig(
            MAIL_USERNAME=settings.smtp_username,
            MAIL_PASSWORD=settings.smtp_password,
            MAIL_FROM=settings.smtp_from_email,
            MAIL_PORT=settings.smtp_port,
            MAIL_SERVER=settings.smtp_host,
            MAIL_STARTTLS=is_tls,
            MAIL_SSL_TLS=is_ssl,
            USE_CREDENTIALS=bool(settings.smtp_username and settings.smtp_password),
            VALIDATE_CERTS=True,
        )
    except Exception as exc:
        logger.error("Failed to initialize email config: %s", exc)
        return None


async def send_reservation_otp_email(email: str, name: str, otp: str, store_name: str) -> None:
    """Send the 6-digit OTP to the user via email."""
    if not email:
        return

    conf = get_mail_config()
    if not conf:
        logger.warning(
            "SMTP not configured. Skipping OTP email to %s (OTP: %s)", email, otp
        )
        return

    html_body = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #0a1628;">Your HoldIt Reservation</h2>
        <p>Hi {name},</p>
        <p>Your item has been successfully reserved at <strong>{store_name}</strong>. Please present the following OTP at the counter to claim your item:</p>
        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #3b82f6;">{otp}</span>
        </div>
        <p>This code is valid for 10 minutes. If you do not pick up your item, the reservation will expire.</p>
        <p>Thanks,<br>The HoldIt Team</p>
    </div>
    """

    message = MessageSchema(
        subject="Your Reservation OTP Code",
        recipients=[email],
        body=html_body,
        subtype=MessageType.html,
    )

    try:
        fm = FastMail(conf)
        await fm.send_message(message)
        logger.info("OTP email sent successfully to %s", email)
    except Exception as exc:
        logger.error("Failed to send OTP email to %s: %s", email, exc)


async def send_payment_receipt_email(email: str, name: str, amount_rupees: float, payment_id: str, store_name: str) -> None:
    """Send a digital receipt after successful payment."""
    if not email:
        return

    conf = get_mail_config()
    if not conf:
        logger.warning(
            "SMTP not configured. Skipping receipt email to %s for payment %s", email, payment_id
        )
        return

    html_body = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #0a1628;">Payment Confirmed</h2>
        <p>Hi {name},</p>
        <p>We successfully received your payment for the reservation at <strong>{store_name}</strong>.</p>
        <table style="width: 100%; margin: 24px 0; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 0; color: #64748b;">Transaction ID</td>
                <td style="padding: 12px 0; text-align: right; font-weight: 500;">{payment_id}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 0; color: #64748b;">Amount Paid</td>
                <td style="padding: 12px 0; text-align: right; font-weight: bold;">₹{amount_rupees:.2f}</td>
            </tr>
        </table>
        <p>You can view your reservation details and OTP on the HoldIt app.</p>
        <p>Thanks,<br>The HoldIt Team</p>
    </div>
    """

    message = MessageSchema(
        subject="Payment Receipt - HoldIt",
        recipients=[email],
        body=html_body,
        subtype=MessageType.html,
    )

    try:
        fm = FastMail(conf)
        await fm.send_message(message)
        logger.info("Payment receipt sent successfully to %s", email)
    except Exception as exc:
        logger.error("Failed to send payment receipt to %s: %s", email, exc)
