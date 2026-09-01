import jwt
import datetime
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models.user import db, User

auth_bp = Blueprint('auth', __name__)
SECRET_KEY = "moes_capacity_connect_secret_key"  # Production me ise .env me rakhein

# 1. USER REGISTER API
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({"status": "error", "message": "Name, email, and password are required"}), 400
        
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"status": "error", "message": "Email already registered"}), 400

    hashed_password = generate_password_hash(data['password'])
    user_role = data.get('role', 'Trainee')
    
    # Trainees auto-approved; Trainers/Admins require admin review
    is_approved_status = True if user_role == 'Trainee' else False

    new_user = User(
        name=data['name'],
        email=data['email'],
        password_hash=hashed_password,
        role=user_role,
        is_approved=is_approved_status,
        qualifications=data.get('qualifications', ''),
        work_experience=data.get('work_experience', ''),
        skills=data.get('skills', ''),
        interests=data.get('interests', '')
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"status": "success", "message": f"{user_role} registered successfully"}), 201

# 2. USER LOGIN API
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()
    
    if not user or not check_password_hash(user.password_hash, data.get('password')):
        return jsonify({"status": "error", "message": "Invalid email or password"}), 401

    token = jwt.encode({
        'user_id': user.id,
        'role': user.role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, SECRET_KEY, algorithm="HS256")

    return jsonify({
        "status": "success",
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_approved": user.is_approved
        }
    }), 200

# 3. UPDATE PROFILE API (Qualifications, Experience, Skills)
@auth_bp.route('/profile/<int:user_id>', methods=['PUT'])
def update_profile(user_id):
    data = request.get_json()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404

    user.qualifications = data.get('qualifications', user.qualifications)
    user.work_experience = data.get('work_experience', user.work_experience)
    user.skills = data.get('skills', user.skills)
    user.interests = data.get('interests', user.interests)
    
    db.session.commit()
    return jsonify({"status": "success", "message": "Profile updated successfully"}), 200