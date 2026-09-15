"""
QA Test Suite — BUG-01: slots horizon regression
Sahadeva | 2026-09-15

Verifies that generate_slots() produces time slots across the full 30-day
horizon after Bhima's fix (DAYS_AHEAD 7 → 30).

Test matrix
-----------
TC-01  Today (day 0)             — must have slots  [regression guard: was OK before fix]
TC-02  Day 6                     — must have slots  [regression guard: was OK before fix]
TC-03  Day 7                     — must have slots  [first date that broke before fix]
TC-04  Day 8                     — must have slots  [reported failure point per BUG-01]
TC-05  Day 29                    — must have slots  [upper boundary of new 30-day horizon]
TC-06  Day 30                    — must be EMPTY    [just outside horizon — must not exceed]
TC-07  Idempotency               — calling generate_slots() twice must not create duplicates
TC-08  GET /api/slots — day 8+   — API must return non-empty JSON array for day 8
TC-09  GET /api/slots — day 29   — API must return non-empty JSON array for day 29 (boundary)
TC-10  GET /api/slots — day 30   — API must return empty JSON array [] for day 30
"""

import os
import pytest
from datetime import date, timedelta

# ---------------------------------------------------------------------------
# Minimal test config — SQLite in-memory, no real mail, no prod env vars
# ---------------------------------------------------------------------------

os.environ.setdefault("SECRET_KEY", "test-secret-key-sahadeva")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("MAIL_USERNAME", "")
os.environ.setdefault("MAIL_PASSWORD", "")
os.environ.setdefault("ADMIN_EMAIL", "admin@test.com")
os.environ.setdefault("ADMIN_PASSWORD", "testpass")


@pytest.fixture(scope="module")
def app():
    from app import create_app
    from config import Config

    class TestConfig(Config):
        TESTING = True
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
        SECRET_KEY = "test-secret-key-sahadeva"
        MAIL_USERNAME = None  # disable email sending

    flask_app = create_app(TestConfig)
    yield flask_app


@pytest.fixture(scope="module")
def client(app):
    return app.test_client()


@pytest.fixture(scope="module")
def db_ctx(app):
    """Return app context + db reference; slots already seeded via create_app."""
    with app.app_context():
        from models import db, Service, TimeSlot
        yield db, Service, TimeSlot


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _slots_on_day(TimeSlot, service_id: int, offset: int):
    target = date.today() + timedelta(days=offset)
    return TimeSlot.query.filter_by(service_id=service_id, date=target).all()


def _first_service_id(Service):
    svc = Service.query.first()
    assert svc is not None, "No services seeded — test environment is broken"
    return svc.id


# ---------------------------------------------------------------------------
# TC-01 to TC-06 — slot generation correctness
# ---------------------------------------------------------------------------

class TestSlotHorizon:
    def test_tc01_today_has_slots(self, db_ctx):
        db, Service, TimeSlot = db_ctx
        svc_id = _first_service_id(Service)
        slots = _slots_on_day(TimeSlot, svc_id, offset=0)
        assert len(slots) > 0, "TC-01 FAIL: No slots for today (day 0)"

    def test_tc02_day6_has_slots(self, db_ctx):
        db, Service, TimeSlot = db_ctx
        svc_id = _first_service_id(Service)
        slots = _slots_on_day(TimeSlot, svc_id, offset=6)
        assert len(slots) > 0, "TC-02 FAIL: No slots for day 6 (old boundary)"

    def test_tc03_day7_has_slots(self, db_ctx):
        """Day 7 was the first date broken before the fix (range(7) stops at index 6)."""
        db, Service, TimeSlot = db_ctx
        svc_id = _first_service_id(Service)
        slots = _slots_on_day(TimeSlot, svc_id, offset=7)
        assert len(slots) > 0, "TC-03 FAIL: No slots for day 7 — fix did not extend horizon"

    def test_tc04_day8_has_slots(self, db_ctx):
        """Primary BUG-01 failure point."""
        db, Service, TimeSlot = db_ctx
        svc_id = _first_service_id(Service)
        slots = _slots_on_day(TimeSlot, svc_id, offset=8)
        assert len(slots) > 0, "TC-04 FAIL: No slots for day 8 — BUG-01 not fixed"

    def test_tc05_day29_has_slots(self, db_ctx):
        """Upper boundary — day 29 is the last day in range(30)."""
        db, Service, TimeSlot = db_ctx
        svc_id = _first_service_id(Service)
        slots = _slots_on_day(TimeSlot, svc_id, offset=29)
        assert len(slots) > 0, "TC-05 FAIL: No slots for day 29 — horizon is shorter than 30"

    def test_tc06_day30_has_no_slots(self, db_ctx):
        """Day 30 is outside the horizon — must NOT be pre-generated."""
        db, Service, TimeSlot = db_ctx
        svc_id = _first_service_id(Service)
        slots = _slots_on_day(TimeSlot, svc_id, offset=30)
        assert len(slots) == 0, (
            f"TC-06 FAIL: {len(slots)} slot(s) found for day 30 — horizon exceeds expected 30 days"
        )


# ---------------------------------------------------------------------------
# TC-07 — idempotency
# ---------------------------------------------------------------------------

class TestIdempotency:
    def test_tc07_double_generate_no_duplicates(self, db_ctx, app):
        """generate_slots() twice must not create duplicate rows."""
        db, Service, TimeSlot = db_ctx
        svc_id = _first_service_id(Service)

        with app.app_context():
            from slots import generate_slots
            count_before = TimeSlot.query.filter_by(service_id=svc_id).count()
            generate_slots()
            count_after = TimeSlot.query.filter_by(service_id=svc_id).count()

        assert count_before == count_after, (
            f"TC-07 FAIL: Slot count changed from {count_before} to {count_after} "
            "after second generate_slots() call — duplicates created"
        )


# ---------------------------------------------------------------------------
# TC-08 to TC-10 — API contract via GET /api/slots
# ---------------------------------------------------------------------------

class TestApiSlots:
    def _get_slots(self, client, svc_id: int, offset: int):
        target = (date.today() + timedelta(days=offset)).isoformat()
        return client.get(f"/api/slots?service_id={svc_id}&date={target}")

    def test_tc08_api_day8_returns_slots(self, client, db_ctx, app):
        with app.app_context():
            from models import Service
            svc_id = Service.query.first().id
        resp = self._get_slots(client, svc_id, offset=8)
        assert resp.status_code == 200, f"TC-08 FAIL: HTTP {resp.status_code}"
        data = resp.get_json()
        assert isinstance(data, list), "TC-08 FAIL: Response is not a JSON array"
        assert len(data) > 0, "TC-08 FAIL: Empty slot array for day 8 — BUG-01 still present"

    def test_tc09_api_day29_returns_slots(self, client, db_ctx, app):
        with app.app_context():
            from models import Service
            svc_id = Service.query.first().id
        resp = self._get_slots(client, svc_id, offset=29)
        assert resp.status_code == 200, f"TC-09 FAIL: HTTP {resp.status_code}"
        data = resp.get_json()
        assert isinstance(data, list), "TC-09 FAIL: Response is not a JSON array"
        assert len(data) > 0, "TC-09 FAIL: Empty slot array for day 29 — horizon boundary off-by-one"

    def test_tc10_api_day30_returns_empty(self, client, db_ctx, app):
        with app.app_context():
            from models import Service
            svc_id = Service.query.first().id
        resp = self._get_slots(client, svc_id, offset=30)
        assert resp.status_code == 200, f"TC-10 FAIL: HTTP {resp.status_code}"
        data = resp.get_json()
        assert isinstance(data, list), "TC-10 FAIL: Response is not a JSON array"
        assert len(data) == 0, (
            f"TC-10 FAIL: {len(data)} slot(s) returned for day 30 — horizon exceeds 30 days"
        )
