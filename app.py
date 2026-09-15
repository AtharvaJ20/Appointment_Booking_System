import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from config import Config
from models import db
from extensions import mail, limiter
from routes.api import api_bp
from routes.admin import admin_bp


_DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "dist")


def create_app(config=Config):
    app = Flask(__name__, static_folder=None)
    app.config.from_object(config)

    db.init_app(app)
    mail.init_app(app)
    limiter.init_app(app)

    # CORS active only in dev — Vite dev server runs on port 5173
    if app.debug:
        app.config["SESSION_COOKIE_SECURE"] = False  # HTTP localhost — Secure cookies dropped otherwise
        CORS(
            app,
            resources={r"/api/*": {"origins": "http://localhost:5173"}},
            supports_credentials=True,
        )

    app.register_blueprint(api_bp)
    app.register_blueprint(admin_bp)

    @app.after_request
    def set_security_headers(response):
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src https://fonts.gstatic.com; "
            "img-src 'self' data:; "
            "connect-src 'self'; "
            "frame-ancestors 'none';"
        )
        return response

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_spa(path):
        if not os.path.isdir(_DIST):
            return jsonify({"message": "Frontend not built. Run: cd frontend && npm run build"}), 503
        target = os.path.join(_DIST, path)
        if path and os.path.isfile(target):
            return send_from_directory(_DIST, path)
        return send_from_directory(_DIST, "index.html")

    with app.app_context():
        os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), "instance"), exist_ok=True)
        db.create_all()
        _seed_services()
        from slots import generate_slots
        generate_slots()

    return app


def _seed_services():
    from models import Service
    if Service.query.count() == 0:
        services = [
            Service(name="Haircut & Styling",  duration_minutes=45, price=800,  image_filename="Haircut.png"),
            Service(name="Hair Coloring",       duration_minutes=90, price=2500, image_filename="Hair coloring.png"),
            Service(name="Facial Treatment",    duration_minutes=60, price=1500, image_filename="facial.png"),
            Service(name="Blow Dry & Styling",  duration_minutes=45, price=600,  image_filename="styling.png"),
        ]
        db.session.add_all(services)
        db.session.commit()


app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
