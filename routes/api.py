import logging
import re
import secrets
from datetime import date as date_type
from flask import Blueprint, jsonify, request, current_app
from flask_mail import Message
from models import db, Service, TimeSlot, Appointment
from extensions import mail, limiter

log = logging.getLogger(__name__)

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

api_bp = Blueprint("api", __name__, url_prefix="/api")


@api_bp.route("/services", methods=["GET"])
def get_services():
    services = Service.query.order_by(Service.id).all()
    return jsonify([
        {
            "id": s.id,
            "name": s.name,
            "duration_minutes": s.duration_minutes,
            "price": s.price,
            "image_filename": s.image_filename,
        }
        for s in services
    ])


@api_bp.route("/slots", methods=["GET"])
def get_slots():
    service_id = request.args.get("service_id", type=int)
    date_str = request.args.get("date")

    if not service_id or not date_str:
        return jsonify({
            "error": {
                "code": "MISSING_PARAMS",
                "message": "service_id and date are required",
            }
        }), 400

    try:
        slot_date = date_type.fromisoformat(date_str)
    except ValueError:
        return jsonify({
            "error": {
                "code": "INVALID_DATE",
                "message": "date must be YYYY-MM-DD",
            }
        }), 400

    slots = (
        TimeSlot.query
        .filter_by(service_id=service_id, date=slot_date, is_booked=False)
        .order_by(TimeSlot.start_time)
        .all()
    )

    return jsonify([
        {
            "id": slot.id,
            "start_time": slot.start_time.strftime("%H:%M"),
            "end_time": slot.end_time.strftime("%H:%M"),
        }
        for slot in slots
    ])


def _send_confirmation_email(appointment, slot, service):
    """Send HTML confirmation email to the client. Silently skips if mail is unconfigured."""
    if not current_app.config.get("MAIL_USERNAME"):
        log.warning("MAIL_USERNAME not configured — skipping confirmation email")
        return

    day_str = slot.date.strftime("%A, %d %B %Y")
    time_str = f"{slot.start_time.strftime('%H:%M')} – {slot.end_time.strftime('%H:%M')}"

    html_body = f"""
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4F1EC;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EC;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:4px;overflow:hidden;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#1A1815;padding:32px 40px;">
              <p style="margin:0;font-family:Georgia,serif;font-size:22px;color:#8C6840;letter-spacing:0.04em;">SOLENNE</p>
              <p style="margin:6px 0 0;font-size:13px;color:#9E9589;letter-spacing:0.08em;text-transform:uppercase;">Appointment Confirmed</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 24px;font-size:16px;color:#1A1815;line-height:1.6;">
                Hi <strong>{appointment.client_name}</strong>,
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#4A4540;line-height:1.7;">
                Your appointment has been confirmed. We look forward to seeing you.
              </p>

              <!-- Booking details card -->
              <table width="100%" cellpadding="0" cellspacing="0"
                     style="background:#F4F1EC;border-radius:4px;padding:24px;margin-bottom:32px;">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #E0D9CE;">
                    <span style="font-size:11px;color:#8C6840;letter-spacing:0.08em;text-transform:uppercase;">Service</span><br>
                    <span style="font-size:16px;color:#1A1815;font-weight:600;">{service.name}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #E0D9CE;">
                    <span style="font-size:11px;color:#8C6840;letter-spacing:0.08em;text-transform:uppercase;">Date</span><br>
                    <span style="font-size:16px;color:#1A1815;font-weight:600;">{day_str}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <span style="font-size:11px;color:#8C6840;letter-spacing:0.08em;text-transform:uppercase;">Time</span><br>
                    <span style="font-size:16px;color:#1A1815;font-weight:600;">{time_str}</span>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;color:#6A6460;line-height:1.7;">
                If you need to reschedule or have any questions, please call us directly.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1A1815;padding:20px 40px;">
              <p style="margin:0;font-size:12px;color:#6A6460;line-height:1.6;">
                This is an automated confirmation. Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

    plain_body = (
        f"Appointment Confirmed — Solenne\n\n"
        f"Hi {appointment.client_name},\n\n"
        f"Service: {service.name}\n"
        f"Date:    {day_str}\n"
        f"Time:    {time_str}\n\n"
        f"We look forward to seeing you.\n"
    )

    msg = Message(
        subject="Your Appointment is Confirmed — Solenne",
        sender=current_app.config["MAIL_USERNAME"],
        recipients=[appointment.client_email],
        body=plain_body,
        html=html_body,
    )

    try:
        mail.send(msg)
        log.info("Confirmation email sent to %s for appointment %s", appointment.client_email, appointment.id)
    except Exception:
        log.exception(
            "Failed to send confirmation email for appointment %s to %s",
            appointment.id,
            appointment.client_email,
        )


@api_bp.route("/book", methods=["POST"])
@limiter.limit("30 per hour")
def book_appointment():
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({
            "error": {"code": "INVALID_JSON", "message": "Request body must be valid JSON"}
        }), 400

    required = ("service_id", "slot_id", "client_name", "client_email", "client_phone")
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({
            "error": {
                "code": "MISSING_FIELDS",
                "message": f"Missing or empty fields: {', '.join(missing)}",
            }
        }), 400

    if not isinstance(data["service_id"], int) or not isinstance(data["slot_id"], int):
        return jsonify({
            "error": {"code": "INVALID_FIELDS", "message": "service_id and slot_id must be integers"}
        }), 400

    if not _EMAIL_RE.match(data["client_email"]):
        return jsonify({
            "error": {"code": "INVALID_EMAIL", "message": "client_email is not a valid email address"}
        }), 400

    slot = TimeSlot.query.filter_by(
        id=data["slot_id"],
        service_id=data["service_id"],
    ).first()

    if slot is None:
        return jsonify({
            "error": {"code": "SLOT_NOT_FOUND", "message": "Slot not found for this service"}
        }), 404

    if slot.is_booked:
        return jsonify({
            "error": {"code": "SLOT_ALREADY_BOOKED", "message": "This slot has already been booked"}
        }), 409

    if slot.date < date_type.today():
        return jsonify({
            "error": {"code": "SLOT_IN_PAST", "message": "Cannot book a slot in the past"}
        }), 400

    slot.is_booked = True
    token = secrets.token_urlsafe(32)
    appointment = Appointment(
        service_id=data["service_id"],
        slot_id=data["slot_id"],
        client_name=str(data["client_name"]).strip(),
        client_email=str(data["client_email"]).strip().lower(),
        client_phone=str(data["client_phone"]).strip(),
        access_token=token,
    )
    db.session.add(appointment)
    db.session.commit()

    _send_confirmation_email(appointment, slot, slot.service)

    return jsonify({"appointment_id": appointment.id, "access_token": token}), 201


@api_bp.route("/confirm/<string:token>", methods=["GET"])
def get_confirmation(token):
    appointment = Appointment.query.filter_by(access_token=token).first()
    if appointment is None:
        return jsonify({
            "error": {"code": "APPOINTMENT_NOT_FOUND", "message": "Appointment not found"}
        }), 404

    slot = appointment.slot
    service = appointment.service

    return jsonify({
        "id": appointment.id,
        "client_name": appointment.client_name,
        "client_email": appointment.client_email,
        "client_phone": appointment.client_phone,
        "service_name": service.name,
        "date": slot.date.isoformat(),
        "start_time": slot.start_time.strftime("%H:%M"),
        "end_time": slot.end_time.strftime("%H:%M"),
        "status": appointment.status,
    })
