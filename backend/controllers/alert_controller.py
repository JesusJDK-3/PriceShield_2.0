from flask import jsonify
from models.alert_model import alert_model

class AlertController:
    def get_active_alerts(self):
        alerts = alert_model.get_active_alerts()
        # Convierte ObjectId a string
        for alert in alerts:
            if "_id" in alert:
                alert["_id"] = str(alert["_id"])
        return jsonify(alerts), 200

    def get_active_alerts_cget_active_alerts_count(self):
        count = alert_model.get_active_alerts_count()
        return jsonify({"active_alerts_count": count}), 200

alert_controller = AlertController()