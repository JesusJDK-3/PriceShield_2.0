from services.db import db
from datetime import datetime, timedelta
import re

class Alert:
    def __init__(self):
        self.alerts_collection = db['alerts']
        self.user_alert_settings_collection = db['user_alert_settings']
    
    def create_price_change_alert(self, product_data, old_price, new_price):
        """
        Crea una alerta cuando cambia el precio de un producto
        """
        try:
            # Validar datos de entrada
            if not product_data or not isinstance(old_price, (int, float)) or not isinstance(new_price, (int, float)):
                print("⚠️ Datos inválidos para crear alerta")
                return None
            
            if old_price <= 0 or new_price <= 0:
                print("⚠️ Precios inválidos para alerta")
                return None
                
            price_change = new_price - old_price
            percentage_change = (price_change / old_price) * 100 if old_price > 0 else 0
            
            # Generar unique_id si no existe
            unique_id = product_data.get("unique_id")
            if not unique_id:
                # Generar ID único basado en nombre y supermercado
                name = product_data.get("name", "").lower()
                supermarket = product_data.get("supermarket_key", "")
                clean_name = re.sub(r'[^a-z0-9]', '', name)
                unique_id = f"{supermarket}_{clean_name[:20]}"
            
            alert_doc = {
                "type": "price_change",
                "product_id": unique_id,
                "product_name": product_data.get("name", "Producto sin nombre"),
                "supermarket": product_data.get("supermarket", "Desconocido"),
                "supermarket_key": product_data.get("supermarket_key", "unknown"),
                "old_price": float(old_price),
                "new_price": float(new_price),
                "price_change": round(float(price_change), 2),
                "percentage_change": round(float(percentage_change), 2),
                "is_price_increase": price_change > 0,
                "created_at": datetime.now().isoformat(),
                "is_read": False,
                "is_ignored": False,
                "product_url": product_data.get("url"),
                "product_brand": product_data.get("brand"),
                "product_categories": product_data.get("categories", [])
            }
            
            # Solo crear alerta si el cambio es significativo (>= 3% para ser más sensible)
            if abs(percentage_change) >= 3:
                result = self.alerts_collection.insert_one(alert_doc)
                print(f"✅ Alerta creada: {product_data.get('name')} - {percentage_change:.1f}%")
                return result.inserted_id
            else:
                print(f"📊 Cambio no significativo: {product_data.get('name')} - {percentage_change:.1f}%")
            
            return None
            
        except Exception as e:
            print(f"❌ Error creando alerta: {e}")
            return None
    
    def get_user_alerts(self, limit=50, unread_only=False):
        """
        Obtiene alertas del usuario
        """
        try:
            filter_query = {}
            if unread_only:
                filter_query["is_read"] = False
                filter_query["is_ignored"] = False
            
            alerts = list(self.alerts_collection.find(
                filter_query
            ).sort([("created_at", -1)]).limit(limit))
            
            # Limpiar ObjectId para JSON
            for alert in alerts:
                alert["_id"] = str(alert["_id"])
                # Asegurar que los precios sean números
                alert["old_price"] = float(alert.get("old_price", 0))
                alert["new_price"] = float(alert.get("new_price", 0))
            
            print(f"📋 Obtenidas {len(alerts)} alertas")
            return alerts
            
        except Exception as e:
            print(f"❌ Error obteniendo alertas: {e}")
            return []
    
    def mark_alert_as_read(self, alert_id):
        """
        Marca una alerta como leída
        """
        try:
            from bson import ObjectId
            result = self.alerts_collection.update_one(
                {"_id": ObjectId(alert_id)},
                {
                    "$set": {
                        "is_read": True,
                        "read_at": datetime.now().isoformat()
                    }
                }
            )
            
            success = result.modified_count > 0
            if success:
                print(f"✅ Alerta {alert_id} marcada como leída")
            else:
                print(f"⚠️ No se pudo marcar la alerta {alert_id} como leída")
                
            return success
            
        except Exception as e:
            print(f"❌ Error marcando alerta como leída: {e}")
            return False
    
    def ignore_alert(self, alert_id):
        """
        Ignora una alerta
        """
        try:
            from bson import ObjectId
            result = self.alerts_collection.update_one(
                {"_id": ObjectId(alert_id)},
                {
                    "$set": {
                        "is_ignored": True,
                        "ignored_at": datetime.now().isoformat()
                    }
                }
            )
            
            success = result.modified_count > 0
            if success:
                print(f"🙈 Alerta {alert_id} ignorada")
            else:
                print(f"⚠️ No se pudo ignorar la alerta {alert_id}")
                
            return success
            
        except Exception as e:
            print(f"❌ Error ignorando alerta: {e}")
            return False
    
    def get_alerts_summary(self):
        """
        Obtiene resumen de alertas
        """
        try:
            # Usar agregaciones más eficientes
            pipeline = [
                {
                    "$facet": {
                        "total": [{"$count": "count"}],
                        "unread": [
                            {"$match": {"is_read": False, "is_ignored": False}},
                            {"$count": "count"}
                        ],
                        "price_increases": [
                            {"$match": {"is_price_increase": True, "is_read": False, "is_ignored": False}},
                            {"$count": "count"}
                        ],
                        "recent": [
                            {
                                "$match": {
                                    "created_at": {"$gte": (datetime.now() - timedelta(days=7)).isoformat()}
                                }
                            },
                            {"$count": "count"}
                        ]
                    }
                }
            ]
            
            result = list(self.alerts_collection.aggregate(pipeline))
            
            if result:
                data = result[0]
                summary = {
                    "total_alerts": data["total"][0]["count"] if data["total"] else 0,
                    "unread_alerts": data["unread"][0]["count"] if data["unread"] else 0,
                    "price_increases": data["price_increases"][0]["count"] if data["price_increases"] else 0,
                    "recent_alerts": data["recent"][0]["count"] if data["recent"] else 0
                }
            else:
                summary = {
                    "total_alerts": 0,
                    "unread_alerts": 0,
                    "price_increases": 0,
                    "recent_alerts": 0
                }
                
            print(f"📊 Resumen de alertas: {summary}")
            return summary
            
        except Exception as e:
            print(f"❌ Error obteniendo resumen: {e}")
            return {
                "total_alerts": 0,
                "unread_alerts": 0,
                "price_increases": 0,
                "recent_alerts": 0
            }
    
    def clean_old_alerts(self, days_old=30):
        """
        Limpia alertas muy antiguas
        """
        try:
            cutoff_date = datetime.now() - timedelta(days=days_old)
            
            result = self.alerts_collection.delete_many({
                "created_at": {"$lt": cutoff_date.isoformat()},
                "is_read": True  # Solo eliminar las ya leídas
            })
            
            print(f"🧹 Limpiadas {result.deleted_count} alertas antiguas")
            return result.deleted_count
            
        except Exception as e:
            print(f"❌ Error limpiando alertas antiguas: {e}")
            return 0

# Crear instancia global
alert_model = Alert()