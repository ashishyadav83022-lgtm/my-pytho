from flask import Blueprint, request, jsonify
from models.user import User

competency_bp = Blueprint('competency', __name__)

# SEARCH SUITABLE TRAINERS BY SUBJECT / SKILL
@competency_bp.route('/match-trainers', methods=['GET'])
def match_trainers():
    subject_query = request.args.get('subject', '').strip().lower()
    if not subject_query:
        return jsonify({"status": "error", "message": "Subject query parameter is required"}), 400

    approved_trainers = User.query.filter_by(role='Trainer', is_approved=True).all()
    
    matched = []
    for trainer in approved_trainers:
        if trainer.skills and subject_query in trainer.skills.lower():
            matched.append({
                "id": trainer.id,
                "name": trainer.name,
                "email": trainer.email,
                "skills": trainer.skills,
                "qualifications": trainer.qualifications,
                "experience": trainer.work_experience
            })
            
    return jsonify({"status": "success", "total_matches": len(matched), "trainers": matched}), 200