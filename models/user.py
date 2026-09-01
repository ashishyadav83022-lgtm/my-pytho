from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False) # 'Trainee', 'Trainer', 'Admin'
    is_approved = db.Column(db.Boolean, default=False) # Admin approval status
    
    # Profile Details (Trainee/Trainer)
    qualifications = db.Column(db.Text, nullable=True)
    work_experience = db.Column(db.Text, nullable=True)
    skills = db.Column(db.String(255), nullable=True) # e.g. "Python, SQL, Meteorology"
    interests = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    