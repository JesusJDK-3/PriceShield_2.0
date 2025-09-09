from services.db import db
from datetime import datetime  # <-- AGREGA ESTA LÍNEA

class Alert:
    def __init__(self):
        self.alerts_collection = db["alerts"]

    def get_active_alerts_count(self):
        return self.alerts_collection.count_documents({"active": True})

    def get_active_alerts(self):
        return list(self.alerts_collection.find({"active": True}))

    def create_price_change_alert(self, product_data, old_price, new_price):
        alert_doc = {
            "product_name": product_data.get("name"),
            "supermarket_name": product_data.get("supermarket"),
            "change_type": "subida" if new_price > old_price else "bajada",
            "old_price": old_price,
            "new_price": new_price,
            "percentage_change": round(((new_price - old_price) / old_price) * 100, 2) if old_price else 0,
            "active": True,
            "leido": False,
            "created_at": datetime.now().isoformat(),
            "product_id": product_data.get("unique_id"),
            "url": product_data.get("url"),
            "categories": product_data.get("categories", []),
            "image": product_data.get("image") or (product_data.get("images")[0] if product_data.get("images") else None)
        }

        self.alerts_collection.insert_one(alert_doc)

alert_model = Alert()