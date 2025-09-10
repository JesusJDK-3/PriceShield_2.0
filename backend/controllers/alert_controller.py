# alert_controller.py - VERSIÓN MEJORADA
from flask import jsonify, request
from models.alert_model import alert_model
from datetime import datetime

class AlertController:
    def get_active_alerts(self):
        """
        Obtiene todas las alertas activas - CORREGIDA
        """
        try:
            # El método del modelo ya devuelve una lista formateada
            alerts = alert_model.get_active_alerts()

            # 🔥 Agregar campo de imagen a cada alerta
            
            
            # CORRECCIÓN: Devolver estructura consistente
            return jsonify({
                "success": True,
                "alerts": alerts,
                "total": len(alerts),
                "timestamp": datetime.now().isoformat()
            }), 200
            
        except Exception as e:
            print(f"❌ Error en controlador de alertas: {e}")
            return jsonify({
                "success": False,
                "message": "Error interno del servidor",
                "alerts": [],
                "total": 0
            }), 500

    def get_active_alerts_count(self):
        """
        Obtiene el conteo de alertas activas no leídas
        """
        try:
            count = alert_model.get_active_alerts_count()
            
            return jsonify({
                "success": True,
                "count": count,
                "timestamp": datetime.now().isoformat()
            }), 200
            
        except Exception as e:
            print(f"❌ Error obteniendo conteo: {e}")
            return jsonify({
                "success": False,
                "count": 0,
                "message": f"Error interno: {str(e)}"
            }), 500

    def mark_as_read(self, alert_id):
        """
        Marca una alerta como leída
        """
        try:
            if not alert_id:
                return jsonify({
                    "success": False,
                    "message": "ID de alerta requerido"
                }), 400
            
            # Validar formato de ObjectId
            from bson import ObjectId
            try:
                ObjectId(alert_id)
            except:
                return jsonify({
                    "success": False,
                    "message": "Formato de ID inválido"
                }), 400
            
            result = alert_model.mark_as_read(alert_id)
            
            if result and result.modified_count > 0:
                return jsonify({
                    "success": True,
                    "message": "Alerta marcada como leída",
                    "alert_id": alert_id
                }), 200
            else:
                return jsonify({
                    "success": False,
                    "message": "Alerta no encontrada o ya estaba leída",
                    "alert_id": alert_id
                }), 404
                
        except Exception as e:
            print(f"❌ Error marcando alerta como leída: {e}")
            return jsonify({
                "success": False,
                "message": f"Error interno: {str(e)}"
            }), 500

    def ignore_alert(self, alert_id):
        """
        Ignora/desactiva una alerta
        """
        try:
            if not alert_id:
                return jsonify({
                    "success": False,
                    "message": "ID de alerta requerido"
                }), 400
            
            # Validar formato de ObjectId
            from bson import ObjectId
            try:
                ObjectId(alert_id)
            except:
                return jsonify({
                    "success": False,
                    "message": "Formato de ID inválido"
                }), 400
            
            result = alert_model.ignore_alert(alert_id)
            
            if result and result.modified_count > 0:
                return jsonify({
                    "success": True,
                    "message": "Alerta ignorada exitosamente",
                    "alert_id": alert_id
                }), 200
            else:
                return jsonify({
                    "success": False,
                    "message": "Alerta no encontrada o ya estaba inactiva",
                    "alert_id": alert_id
                }), 404
                
        except Exception as e:
            print(f"❌ Error ignorando alerta: {e}")
            return jsonify({
                "success": False,
                "message": f"Error interno: {str(e)}"
            }), 500

    def mark_product_alerts_as_read(self, product_id):
        """
        Marca todas las alertas de un producto como leídas
        """
        try:
            if not product_id:
                return jsonify({
                    "success": False,
                    "message": "ID de producto requerido"
                }), 400
            
            # Decodificar URL si es necesario
            import urllib.parse
            product_id_decoded = urllib.parse.unquote(product_id)
            
            print(f"🔍 Marcando alertas del producto: {product_id_decoded}")
            
            result = alert_model.mark_as_read_by_product(product_id_decoded)
            
            if result:
                modified_count = result.modified_count
                return jsonify({
                    "success": True,
                    "message": f"{modified_count} alertas marcadas como leídas" if modified_count > 0 else "No hay alertas pendientes",
                    "modified_count": modified_count,
                    "product_id": product_id_decoded
                }), 200
            else:
                return jsonify({
                    "success": False,
                    "message": "Error procesando solicitud",
                    "modified_count": 0
                }), 500
                
        except Exception as e:
            print(f"❌ Error marcando alertas del producto: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({
                "success": False,
                "message": f"Error interno: {str(e)}",
                "modified_count": 0
            }), 500

    def get_alert_summary(self):
        """
        Obtiene resumen estadístico de alertas
        """
        try:
            summary = alert_model.get_user_alert_summary()
            
            return jsonify({
                "success": True,
                "summary": summary,
                "timestamp": datetime.now().isoformat()
            }), 200
            
        except Exception as e:
            print(f"❌ Error obteniendo resumen: {e}")
            return jsonify({
                "success": False,
                "summary": {
                    "total_alerts": 0,
                    "unread_alerts": 0,
                    "price_increases": 0,
                    "price_decreases": 0,
                    "read_alerts": 0
                },
                "message": f"Error: {str(e)}"
            }), 500

    def create_test_alerts(self):
        """
        NUEVA: Método para crear alertas de prueba
        """
        try:
            from services.db import db
            
            # Crear algunas alertas de prueba
            test_alerts = [
                {
                    "product_name": "Leche Gloria Entera 1L",
                    "product_id": "wong_leche_gloria_entera_1l",
                    "supermarket": "Wong",
                    "supermarket_key": "wong",
                    "old_price": 4.50,
                    "new_price": 4.90,
                    "price_difference": 0.40,
                    "percentage_change": 8.9,
                    "is_price_increase": True,
                    "change_type": "subida",
                    "alert_text": "↑8.9%",
                    "alert_color": "red",
                    "active": True,
                    "is_read": False,
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat(),
                    "alert_type": "same_product_price_change",
                    "source": "test_creation"
                },
                {
                    "product_name": "Aceite Primor 1L",
                    "product_id": "metro_aceite_primor_1l",
                    "supermarket": "Metro",
                    "supermarket_key": "metro",
                    "old_price": 12.90,
                    "new_price": 11.50,
                    "price_difference": -1.40,
                    "percentage_change": -10.9,
                    "is_price_increase": False,
                    "change_type": "bajada",
                    "alert_text": "↓10.9%",
                    "alert_color": "green",
                    "active": True,
                    "is_read": False,
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat(),
                    "alert_type": "same_product_price_change",
                    "source": "test_creation"
                }
            ]
            
            result = db.alerts.insert_many(test_alerts)
            
            return jsonify({
                "success": True,
                "message": f"{len(result.inserted_ids)} alertas de prueba creadas",
                "created_count": len(result.inserted_ids)
            }), 200
            
        except Exception as e:
            print(f"❌ Error creando alertas de prueba: {e}")
            return jsonify({
                "success": False,
                "message": f"Error: {str(e)}"
            }), 500

    def get_system_status(self):
        """
        NUEVA: Estado del sistema de alertas
        """
        try:
            from services.db import db
            
            # Contar alertas por estado
            total_alerts = db.alerts.count_documents({})
            active_alerts = db.alerts.count_documents({"active": True})
            unread_alerts = db.alerts.count_documents({"active": True, "is_read": False})
            recent_alerts = db.alerts.count_documents({
                "active": True,
                "created_at": {"$gte": (datetime.now() - timedelta(hours=24)).isoformat()}
            })
            
            # Obtener última alerta
            last_alert = db.alerts.find_one({}, sort=[("created_at", -1)])
            last_alert_time = None
            if last_alert:
                try:
                    last_alert_time = datetime.fromisoformat(last_alert["created_at"]).strftime("%d/%m/%Y %H:%M")
                except:
                    last_alert_time = "Formato inválido"
            
            return jsonify({
                "success": True,
                "status": {
                    "total_alerts": total_alerts,
                    "active_alerts": active_alerts,
                    "unread_alerts": unread_alerts,
                    "recent_alerts_24h": recent_alerts,
                    "last_alert_created": last_alert_time,
                    "database_connected": True,
                    "alert_model_available": True
                },
                "timestamp": datetime.now().isoformat()
            }), 200
            
        except Exception as e:
            print(f"❌ Error obteniendo estado del sistema: {e}")
            return jsonify({
                "success": False,
                "status": {
                    "database_connected": False,
                    "error": str(e)
                }
            }), 500

# Importaciones adicionales necesarias
from datetime import timedelta

# Crear instancia global
alert_controller = AlertController()