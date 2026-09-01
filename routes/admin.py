from flask import Blueprint, request, jsonify
from models.user import db, User
from models.announcement import Announcement

admin_bp = Blueprint('admin', __name__)

# 1. GET PENDING USERS (Unapproved Trainers & Admins)
@admin_bp.route('/pending-users', methods=['GET'])
def pending_users():
    users = User.query.filter_by(is_approved=False).all()
    return jsonify({
        "status": "success",
        "pending_users": [
            {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "role": u.role,
                "qualifications": u.qualifications
            } for u in users
        ]
    }), 200

# 2. APPROVE USER API
@admin_bp.route('/approve-user/<int:user_id>', methods=['PUT'])
def approve_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404
        
    user.is_approved = True
    db.session.commit()
    return jsonify({"status": "success", "message": f"{user.role} {user.name} approved successfully"}), 200

# 3. POST ANNOUNCEMENT (Publish to Homepage)
@admin_bp.route('/announcements', methods=['POST'])
def post_announcement():
    data = request.get_json()
    if not data or not data.get('title') or not data.get('content'):
        return jsonify({"status": "error", "message": "Title and content are required"}), 400
        
    announcement = Announcement(title=data['title'], content=data['content'])
    db.session.add(announcement)
    db.session.commit()
    return jsonify({"status": "success", "message": "Announcement published successfully"}), 201