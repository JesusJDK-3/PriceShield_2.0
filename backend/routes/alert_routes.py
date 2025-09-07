from flask import Blueprint
from controllers.alert_controller import alert_controller

alert_routes = Blueprint('alert_routes', __name__, url_prefix='/api/alerts')

@alert_routes.route('/active', methods=['GET'])
def get_active_alerts():
    return alert_controller.get_active_alerts()

@alert_routes.route('/active/count', methods=['GET'])
def get_active_alerts_count():
    return alert_controller.get_active_alerts_count()