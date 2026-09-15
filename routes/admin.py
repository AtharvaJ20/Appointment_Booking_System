import hmac
import logging
from datetime import date as date_type
from flask import Blueprint, jsonify, request, session, current_app
from models import db, Appointment, TimeSlot, Service
from extensions import limiter

log = logging.getLogger(__name__)

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.before_request
def require_admin_session():
    if request.endpoint == "admin.admin_login":
        return None
    if not session.get("admin"):
        return jsonify({
            "error": {"code": "UNAUTHORIZED", "message": "Authentication required"}
        }), 401


@admin_bp.route("/login", methods=["POST"])
@limiter.limit("10 per 15 minutes")
def admin_login():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({
            "error": {"code": "INVALID_JSON", "message": "Request body must be valid JSON"}
        }), 400

    submitted_email = str(data.get("email", "")).strip().lower()
    submitted_password = str(data.get("password", ""))

    expected_email = (current_app.config.get("ADMIN_EMAIL") or "").strip().lower()
    expected_password = current_app.config.get("ADMIN_PASSWORD") or ""

    # Constant-time comparison prevents timing-based credential enumeration
    email_match = hmac.compare_digest(submitted_email, expected_email)
    password_match = hmac.compare_digest(submitted_password, expected_password)

    if not (email_match and password_match):
        log.warning("Admin login failed from IP %s", request.remote_addr)
        return jsonify({
            "error": {"code": "INVALID_CREDENTIALS", "message": "Invalid email or password"}
        }), 401

    session.clear()
    session["admin"] = True
    session.permanent = False
    log.info("Admin login successful from IP %s", request.remote_addr)
    return jsonify({"ok": True})


@admin_bp.route("/bookings", methods=["GET"])
def admin_bookings():
    date_str = request.args.get("date")

    query = (
        db.session.query(Appointment, TimeSlot, Service)
        .join(TimeSlot, Appointment.slot_id == TimeSlot.id)
        .join(Service, Appointment.service_id == Service.id)
    )

    if date_str:
        try:
            filter_date = date_type.fromisoformat(date_str)
        except ValueError:
            return jsonify({
                "error": {"code": "INVALID_DATE", "message": "date must be YYYY-MM-DD"}
            }), 400
        query = query.filter(TimeSlot.date == filter_date)

    rows = query.order_by(TimeSlot.date.desc(), TimeSlot.start_time).all()

    return jsonify([
        {
            "id": appt.id,
            "client_name": appt.client_name,
            "client_email": appt.client_email,
            "client_phone": appt.client_phone,
            "service_name": svc.name,
            "date": slot.date.isoformat(),
            "start_time": slot.start_time.strftime("%H:%M"),
            "end_time": slot.end_time.strftime("%H:%M"),
            "status": appt.status,
        }
        for appt, slot, svc in rows
    ])


@admin_bp.route("/complete/<int:appointment_id>", methods=["POST"])
def admin_complete(appointment_id: int):
    appointment = db.session.get(Appointment, appointment_id)
    if appointment is None:
        return jsonify({
            "error": {"code": "APPOINTMENT_NOT_FOUND", "message": "Appointment not found"}
        }), 404

    if appointment.status != "Completed":
        appointment.status = "Completed"
        db.session.commit()
        log.info("Appointment %d marked Completed", appointment_id)

    # Idempotent — already Completed is also a success
    return jsonify({"ok": True})


@admin_bp.route("/logout", methods=["POST"])
def admin_logout():
    session.clear()
    return jsonify({"ok": True})
