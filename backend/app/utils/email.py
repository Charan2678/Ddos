import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

def send_reset_email(to_email: str, reset_link: str):
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print("SMTP Credentials not configured.")
        return False
        
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Reset Your Password - DDoS Shield"
        msg["From"] = f"DDoS Shield <{SMTP_EMAIL}>"
        msg["To"] = to_email

        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <div style="max-w-md mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-sm mt-10">
                <h2 style="color: #2563eb;">DDoS Shield - Password Reset</h2>
                <p>Hello,</p>
                <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
                <p>Click the button below to set a new password. This link will expire in 15 minutes.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
                </div>
                <p style="font-size: 12px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:<br>{reset_link}</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin-top: 30px;">
                <p style="font-size: 12px; color: #9ca3af; text-align: center;">Secure Automated System &bull; DDoS Shield</p>
            </div>
          </body>
        </html>
        """

        part = MIMEText(html_content, "html")
        msg.attach(part)

        # Connect to Gmail SMTP server
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        server.quit()
        
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False
