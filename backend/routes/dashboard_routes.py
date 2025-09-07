from flask import Blueprint, jsonify
from models.product_model import product_model
from models.alert_model import alert_model

dashboard_routes = Blueprint('dashboard_routes', __name__, url_prefix='/api/dashboard')

@dashboard_routes.route('/stats', methods=['GET'])
def get_dashboard_stats():
    total_products = product_model.get_total_products()
    total_supermarkets = product_model.get_total_supermarkets()
    active_alerts = alert_model.get_active_alerts_count()
    total_updates = product_model.get_total_updates()
    return jsonify({
        "total_products": total_products,
        "total_supermarkets": total_supermarkets,
        "active_alerts": active_alerts,
        "total_updates": total_updates
    }), 200