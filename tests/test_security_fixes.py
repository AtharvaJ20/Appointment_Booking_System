"""
Regression tests — Day 6 security fixes
Bhima | 2026-09-15

Covers:
  F-01  IDOR fix: confirmation endpoint now requires access_token, not bare integer ID
  F-03  /api/book returns access_token in response
  F-05  Security headers present on all responses
  F-06  Admin before_request: all admin routes (except login) require session auth
  F-09  Server-side past-date guard on POST /api/book
"""

import os
import pytest

os.environ.setdefault("SECRET_KEY", "test-secret-key-bhima")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("MAIL_USERNAME", "")
os.environ.setdefault("MAIL_PASSWORD", "")
os.environ.setdefault("ADMIN_EMAIL", "admin@test.com")
os.environ.setdefault("ADMIN_PASSWORD", "TestPass123!")


@pytest.fixture(scope="module")
def app():
    from app import create_app
    from config import Config

    class TestConfig(Config):
        TESTING = True
        SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
        SECRET_KEY = "test-secret-key-bhima"
        MAIL_USERNAME = None
        SESSION_COOKIE_SECURE = False  # disable so test client (HTTP) can set cookies

    flask_app = create_app(TestConfig)
    yield flask_app


@pytest.fixture(scope="module")
def client(app):
    return app.test_client()


@pytest.fixture(scope="module")
def app_ctx(app):
    with app.app_context():
        yield app


def _first_available_slot(app):
    with app.app_context():
        from models import TimeSlot
        slot = TimeSlot.query.filter_by(is_booked=False).first()
        assert slot is not None, "No available slots — seed failed"
        return slot.id, slot.service_id


def _book_appointment(client, app):
    slot_id, service_id = _first_available_slot(app)
    resp = client.post("/api/book", json={
        "service_id": service_id,
        "slot_id": slot_id,
        "client_name": "Security Tester",
        "client_email": "test@example.com",
        "client_phone": "9999999999",
    })
    assert resp.status_code == 201, f"Booking failed: {resp.get_json()}"
    return resp.get_json()


# ── F-01 + F-03 — access_token in booking response and confirmation lookup ───


class TestConfirmationIDOR:
    def test_book_returns_access_token(self, client, app):
        data = _book_appointment(client, app)
        assert "access_token" in data, "F-03: access_token missing from booking response"
        assert "appointment_id" in data, "appointment_id missing from booking response"
        token = data["access_token"]
        assert len(token) > 20, f"access_token looks too short: {token!r}"

    def test_confirm_with_valid_token_returns_200(self, client, app):
        data = _book_appointment(client, app)
        token = data["access_token"]
        resp = client.get(f"/api/confirm/{token}")
        assert resp.status_code == 200, f"Valid token returned {resp.status_code}: {resp.get_json()}"
        body = resp.get_json()
        assert body["client_name"] == "Security Tester"

    def test_confirm_with_wrong_token_returns_404(self, client, app):
        resp = client.get("/api/confirm/completely-wrong-token-value-xyz")
        assert resp.status_code == 404, (
            f"F-01: Wrong token returned {resp.status_code} — IDOR not fixed"
        )

    def test_confirm_bare_integer_id_not_routed(self, client, app):
        """The old /api/confirm/1 route no longer exists as an integer route."""
        resp = client.get("/api/confirm/1")
        # Flask will route "1" as a string token and look it up — returns 404 (not found)
        # It must NOT return 200 with appointment PII
        assert resp.status_code == 404, (
            f"F-01: Integer ID '1' returned {resp.status_code} — bare-ID IDOR may still be present"
        )
        body = resp.get_json()
        assert "client_email" not in body, "F-01: PII returned without valid token"
        assert "client_phone" not in body, "F-01: PII returned without valid token"


# ── F-05 — security headers ──────────────────────────────────────────────────


class TestSecurityHeaders:
    def test_x_frame_options_deny(self, client):
        resp = client.get("/api/services")
        assert resp.headers.get("X-Frame-Options") == "DENY", (
            "F-05: X-Frame-Options: DENY missing"
        )

    def test_x_content_type_options_nosniff(self, client):
        resp = client.get("/api/services")
        assert resp.headers.get("X-Content-Type-Options") == "nosniff", (
            "F-05: X-Content-Type-Options: nosniff missing"
        )

    def test_referrer_policy(self, client):
        resp = client.get("/api/services")
        assert resp.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin", (
            "F-05: Referrer-Policy missing"
        )

    def test_csp_present_and_denies_frame_ancestors(self, client):
        resp = client.get("/api/services")
        csp = resp.headers.get("Content-Security-Policy", "")
        assert csp, "F-05: Content-Security-Policy header missing"
        assert "frame-ancestors 'none'" in csp, (
            f"F-05: frame-ancestors 'none' not in CSP: {csp!r}"
        )

    def test_headers_present_on_api_endpoints(self, client):
        for path in ["/api/services", "/api/admin/bookings"]:
            resp = client.get(path)
            assert "X-Frame-Options" in resp.headers, (
                f"F-05: X-Frame-Options missing on {path}"
            )


# ── F-06 — before_request auth guard ─────────────────────────────────────────


class TestAdminAuthGuard:
    def test_bookings_requires_auth(self, client):
        resp = client.get("/api/admin/bookings")
        assert resp.status_code == 401, (
            f"F-06: /api/admin/bookings returned {resp.status_code} without auth"
        )

    def test_complete_requires_auth(self, client):
        resp = client.post("/api/admin/complete/1")
        assert resp.status_code == 401, (
            f"F-06: /api/admin/complete/1 returned {resp.status_code} without auth"
        )

    def test_logout_requires_auth(self, client):
        resp = client.post("/api/admin/logout")
        assert resp.status_code == 401, (
            "F-06: /api/admin/logout returned non-401 without auth — before_request missing"
        )

    def test_login_does_not_require_auth(self, client):
        """Login endpoint must be reachable without a session."""
        resp = client.post("/api/admin/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword",
        })
        # 401 from bad credentials, not from missing session
        assert resp.status_code == 401
        body = resp.get_json()
        assert body["error"]["code"] == "INVALID_CREDENTIALS", (
            "Login endpoint returned wrong error code — may be blocked by before_request"
        )

    def test_authenticated_session_can_access_bookings(self, client, app):
        with client.session_transaction() as sess:
            sess["admin"] = True
        resp = client.get("/api/admin/bookings")
        assert resp.status_code == 200, (
            f"Authenticated admin session returned {resp.status_code} on /api/admin/bookings"
        )
        # Clean up session
        with client.session_transaction() as sess:
            sess.clear()


# ── F-09 — server-side past-date guard ───────────────────────────────────────


@pytest.fixture(scope="class")
def past_slot_ids(app):
    """Insert one unbooked past-dated slot once for the whole class. Returns (slot_id, service_id)."""
    from datetime import date, timedelta, time as time_type
    with app.app_context():
        from models import db, TimeSlot, Service
        service = Service.query.first()
        assert service is not None, "No service seeded"
        yesterday = date.today() - timedelta(days=1)
        past_slot = TimeSlot(
            service_id=service.id,
            date=yesterday,
            start_time=time_type(23, 0),
            end_time=time_type(23, 45),
            is_booked=False,
        )
        db.session.add(past_slot)
        db.session.commit()
        yield past_slot.id, service.id


class TestPastDateBookingGuard:
    """POST /api/book must reject slots whose date is before today, regardless of frontend."""

    def test_booking_past_slot_returns_400(self, client, past_slot_ids):
        slot_id, service_id = past_slot_ids
        resp = client.post("/api/book", json={
            "service_id": service_id,
            "slot_id": slot_id,
            "client_name": "Past Tester",
            "client_email": "past@example.com",
            "client_phone": "8888888888",
        })
        assert resp.status_code == 400, (
            f"F-09: Past-dated slot returned {resp.status_code} — server-side date guard missing"
        )
        body = resp.get_json()
        assert body["error"]["code"] == "SLOT_IN_PAST", (
            f"F-09: Expected SLOT_IN_PAST error code, got: {body}"
        )

    def test_booking_past_slot_does_not_mark_it_booked(self, client, app, past_slot_ids):
        """A rejected past-date booking must not flip is_booked on the slot."""
        slot_id, service_id = past_slot_ids
        client.post("/api/book", json={
            "service_id": service_id,
            "slot_id": slot_id,
            "client_name": "Past Tester",
            "client_email": "past@example.com",
            "client_phone": "8888888888",
        })
        with app.app_context():
            from models import TimeSlot
            slot = TimeSlot.query.get(slot_id)
            assert not slot.is_booked, (
                "F-09: Past-slot booking attempt incorrectly marked the slot as booked"
            )
