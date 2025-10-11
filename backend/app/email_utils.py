import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List
from .config import settings


def send_email(to_email: str, subject: str, html_content: str, text_content: str = None):
    """
    Send an email using SMTP
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML content of the email
        text_content: Plain text content (optional, defaults to HTML stripped)
    """
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        # Use the correct sender name and email
        sender_name = settings.smtp_from_name or settings.smtp_sender_name or "Dangan"
        sender_email = settings.smtp_from_email or settings.smtp_sender_email or settings.smtp_user
        message["From"] = f"{sender_name} <{sender_email}>"
        message["To"] = to_email
        
        # Add text and HTML parts
        if text_content:
            part1 = MIMEText(text_content, "plain")
            message.attach(part1)
        
        part2 = MIMEText(html_content, "html")
        message.attach(part2)
        
        # Send email
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            # Try both username formats (smtp_username/smtp_user)
            username = settings.smtp_username or settings.smtp_user
            password = settings.smtp_password or settings.smtp_pass
            if username and password:
                server.login(username, password)
            server.send_message(message)
        
        print(f"✅ Email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send email to {to_email}: {str(e)}")
        raise e


def send_password_reset_email(to_email: str, reset_token: str, user_name: str = "User"):
    """
    Send password reset email with reset link
    
    Args:
        to_email: Recipient email address
        reset_token: Password reset token
        user_name: User's name for personalization
    """
    reset_link = f"{settings.frontend_url}/reset-password?token={reset_token}"
    
    subject = "Password Reset Request - Dangan"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background-color: #1976d2;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }}
            .content {{
                background-color: #f9f9f9;
                padding: 30px;
                border-radius: 0 0 5px 5px;
            }}
            .button {{
                display: inline-block;
                padding: 12px 30px;
                background-color: #1976d2;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            }}
            .footer {{
                text-align: center;
                margin-top: 20px;
                color: #666;
                font-size: 12px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Request</h1>
            </div>
            <div class="content">
                <p>Hello {user_name},</p>
                <p>We received a request to reset your password for your Dangan account.</p>
                <p>Click the button below to reset your password:</p>
                <center>
                    <a href="{reset_link}" class="button">Reset Password</a>
                </center>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #1976d2;">{reset_link}</p>
                <p><strong>This link will expire in 1 hour.</strong></p>
                <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
                <p>Best regards,<br>Dangan Team</p>
            </div>
            <div class="footer">
                <p>This is an automated email. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    Hello {user_name},
    
    We received a request to reset your password for your Dangan account.
    
    Click the link below to reset your password:
    {reset_link}
    
    This link will expire in 1 hour.
    
    If you didn't request a password reset, please ignore this email.
    
    Best regards,
    Dangan Team
    """
    
    return send_email(to_email, subject, html_content, text_content)

