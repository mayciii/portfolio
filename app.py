import os
import re
from flask import Flask, render_template, jsonify, request
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file (never commit credentials!)
load_dotenv()

app = Flask(__name__)

# ─── MAIL CONFIG (pulled from environment variables) ────────────────────────
app.config['MAIL_SERVER']   = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT']     = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS']  = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME', '')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD', '')

# Set TESTING=true in your .env to print emails to console instead of sending
TESTING = os.getenv('TESTING', 'false').lower() == 'true'

mail = None
if not TESTING:
    try:
        from flask_mail import Mail, Message as MailMessage
        mail = Mail(app)
    except ImportError:
        print("[WARNING] Flask-Mail not installed. Run: pip install Flask-Mail")
        print("[WARNING] Falling back to console/test mode.")
        TESTING = True

# ─── PORTFOLIO DATA ──────────────────────────────────────────────────────────
PORTFOLIO_DATA = {
    "name": "May Sigrid Dimaano",
    "title": "Aspiring Full Stack Developer",
    "email": "sigriddimaano@gmail.com",
    "github": "https://github.com/mayciii",
    "linkedin": "https://www.linkedin.com/in/may-sigrid-dimaano-4052a43aa",
    "about": (
        "Passionate developer with experience in frontend and backend development. "
        "I enjoy building modern, scalable, and user-friendly applications."
    ),
    "skills": [
        {"name": "HTML",       "category": "Web Development",       "level": 90},
        {"name": "CSS",        "category": "Web Development",       "level": 85},
        {"name": "JavaScript", "category": "Web Development",       "level": 80},
        {"name": "Python",     "category": "Programming Languages", "level": 75},
        {"name": "Java",       "category": "Programming Languages", "level": 70},
    ],
    "projects": [
        {
            "title": "Smart Blood Donor Eligibility Screening System",
            "description": (
                "Implements AI logic to check and analyze the health assessment of potential "
                "blood donors, ensuring only qualified individuals proceed to donation."
            ),
            "technologies": ["Python", "TKinter"],
            "github": "https://github.com/mayciii/Smart-Blood-Donor-Eligibilty-Screening-System",
        },
        {
            "title": "Console-Based Barangay Equipment Borrowing and Return Tracking System",
            "description": (
                "Centralizes equipment tracking and borrower records to provide real-time updates "
                "on item availability and automated transaction logging."
            ),
            "technologies": ["Java", "OOP"],
            "github": (
                "https://github.com/mayciii/"
                "Console-Based-barangay-Equipment-Borrowing-and-Return-Tracking-System"
            ),
        },
        {
            "title": "SABTRACK: Web-based Waste Tracking & Reporting System for Barangay Sabang",
            "description": (
                "A web-based waste management system for Barangay Sabang that lets residents and "
                "officials view collection schedules, report issues, receive announcements, and "
                "learn proper waste disposal — all in one user-friendly platform."
            ),
            "technologies": ["HTML", "CSS", "Python", "Flask", "SQLite"],
            "github": "https://github.com/mayciii/project3",
        },
    ],
}

# ─── HELPERS ────────────────────────────────────────────────────────────────
EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$')

def validate_email(email: str) -> bool:
    return bool(EMAIL_REGEX.match(email))

def send_contact_email(name: str, email: str, subject: str, message: str) -> bool:
    """Send a contact form email, or print to console in TESTING mode."""
    if TESTING or mail is None:
        print(
            "\n=== CONTACT FORM SUBMISSION (TEST MODE) ===\n"
            f"  From   : {name} <{email}>\n"
            f"  Subject: {subject}\n"
            f"  Message: {message}\n"
            "===========================================\n"
        )
        return True

    try:
        from flask_mail import Message as MailMessage
        recipient = app.config.get('MAIL_USERNAME')
        if not recipient:
            print("[ERROR] MAIL_USERNAME is not set.")
            return False

        msg = MailMessage(
            subject=f"Portfolio Contact: {subject}",
            sender=recipient,
            recipients=[recipient],
            reply_to=email,
            body=(
                f"Name:    {name}\n"
                f"Email:   {email}\n"
                f"Subject: {subject}\n\n"
                f"Message:\n{message}"
            ),
        )
        mail.send(msg)
        return True
    except Exception as exc:
        print(f"[ERROR] Failed to send email: {exc}")
        return False

# ─── ROUTES ─────────────────────────────────────────────────────────────────
@app.route("/")
def home():
    return render_template("index.html", data=PORTFOLIO_DATA, year=datetime.now().year)


@app.route("/api/portfolio")
def api_portfolio():
    return jsonify(PORTFOLIO_DATA)


@app.route("/api/contact", methods=["POST"])
def api_contact():
    """Receive JSON contact form submissions and dispatch an email."""
    payload = request.get_json(silent=True) or {}

    name    = payload.get("name", "").strip()
    email   = payload.get("email", "").strip()
    message = payload.get("message", "").strip()
    subject = payload.get("subject", "").strip() or "Portfolio Contact"

    # ── Validation ──────────────────────────────────────────────────────────
    errors = {}
    if not name:
        errors["name"] = "Name is required."
    elif len(name) > 120:
        errors["name"] = "Name must be under 120 characters."

    if not email:
        errors["email"] = "Email is required."
    elif not validate_email(email):
        errors["email"] = "Invalid email address."

    if not message:
        errors["message"] = "Message is required."
    elif len(message) > 5000:
        errors["message"] = "Message must be under 5,000 characters."

    if len(subject) > 200:
        errors["subject"] = "Subject must be under 200 characters."

    if errors:
        return jsonify({"success": False, "errors": errors}), 400

    # ── Send ─────────────────────────────────────────────────────────────────
    if send_contact_email(name, email, subject, message):
        return jsonify({"success": True, "message": "Message sent successfully."}), 200

    return jsonify({
        "success": False,
        "error": "Failed to send your message. Please try again later.",
    }), 500


# ─── ENTRY POINT ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    app.run(debug=debug_mode)
