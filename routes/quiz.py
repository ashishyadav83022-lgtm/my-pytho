from flask import Blueprint, jsonify

quiz_bp = Blueprint('quiz', __name__)

@quiz_bp.route('/generate', methods=['POST'])
def generate():
    return jsonify({"status": "success", "message": "Quiz route working"})