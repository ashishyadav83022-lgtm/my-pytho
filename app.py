from flask import Flask, jsonify
from flask_cors import CORS
from models.user import db

from routes.auth import auth_bp
from routes.quiz import quiz_bp
from routes.courses import courses_bp
from routes.admin import admin_bp
from routes.competency import competency_bp

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///capacity_connect.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(quiz_bp, url_prefix='/api/quiz')
app.register_blueprint(courses_bp, url_prefix='/api/courses')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(competency_bp, url_prefix='/api/competency')

@app.route('/')
def home():
    return jsonify({"status": "Capacity Connect Core Backend Operations Active!"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)