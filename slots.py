from datetime import date, datetime, time, timedelta
from models import db, Service, TimeSlot

_BUSINESS_START = time(9, 0)
_BUSINESS_END = time(18, 0)
_DAYS_AHEAD = 30


def generate_slots() -> None:
    """Generate rolling 30-day slots for every service. Safe to call on every startup."""
    services = Service.query.all()
    today = date.today()

    for service in services:
        for offset in range(_DAYS_AHEAD):
            _generate_day(service, today + timedelta(days=offset))

    db.session.commit()


def _generate_day(service: "Service", slot_date: date) -> None:
    duration = timedelta(minutes=service.duration_minutes)
    cursor = datetime.combine(slot_date, _BUSINESS_START)
    end_of_day = datetime.combine(slot_date, _BUSINESS_END)

    while cursor + duration <= end_of_day:
        start = cursor.time()
        end = (cursor + duration).time()

        exists = TimeSlot.query.filter_by(
            service_id=service.id,
            date=slot_date,
            start_time=start,
        ).first()

        if not exists:
            db.session.add(TimeSlot(
                service_id=service.id,
                date=slot_date,
                start_time=start,
                end_time=end,
            ))

        cursor += duration
