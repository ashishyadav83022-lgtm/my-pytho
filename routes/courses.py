from flask import Blueprint, jsonify

courses_bp = Blueprint('courses', __name__)

@courses_bp.route('/', methods=['GET'])
def get_courses():
    return jsonify({"status": "success", "message": "Courses route working"})