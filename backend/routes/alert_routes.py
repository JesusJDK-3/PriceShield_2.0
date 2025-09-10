# alert_routes.py - RUTAS DE ALERTAS COMPLETAS Y CORREGIDAS
from flask import Blueprint, request, jsonify
from controllers.alert_controller import alert_controller
from datetime import datetime, timedelta

# Crear el Blueprint para alertas
alert_routes = Blueprint('alert_routes', __name__, url_prefix='/api/alerts')

@alert_routes.route('/active', methods=['GET'])
def get_active_alerts():
    """
    GET /api/alerts/active
    Obtiene todas las alertas activas
    """
    try:
        limit = int(request.args.get('limit', 50))
        
        if limit > 200:  # Limitar para evitar sobrecarga
            limit = 200
        
        alerts = alert_controller.get_active_alerts()
        
        # Verificar si la respuesta es un tuple (response, status_code)
        if isinstance(alerts, tuple):
            return alerts
        else:
            return alerts
            
    except Exception as e:
        print(f"❌ Error en ruta /active: {e}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "alerts": []
        }), 500

@alert_routes.route('/count', methods=['GET'])
def get_alerts_count():
    """
    GET /api/alerts/count
    Obtiene el conteo de alertas no leídas
    """
    try:
        return alert_controller.get_active_alerts_count()
        
    except Exception as e:
        print(f"❌ Error en ruta /count: {e}")
        return jsonify({
            "success": False,
            "count": 0,
            "message": "Error interno del servidor"
        }), 500

@alert_routes.route('/<alert_id>/read', methods=['POST'])
def mark_alert_as_read(alert_id):
    """
    POST /api/alerts/<alert_id>/read
    Marca una alerta como leída
    """
    try:
        return alert_controller.mark_as_read(alert_id)
        
    except Exception as e:
        print(f"❌ Error en ruta /read: {e}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor"
        }), 500

@alert_routes.route('/<alert_id>/ignore', methods=['POST'])
def ignore_alert(alert_id):
    """
    POST /api/alerts/<alert_id>/ignore
    Ignora/desactiva una alerta
    """
    try:
        return alert_controller.ignore_alert(alert_id)
        
    except Exception as e:
        print(f"❌ Error en ruta /ignore: {e}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor"
        }), 500

# NUEVA RUTA CORREGIDA: Esta era la que faltaba
@alert_routes.route('/product/<product_id>/mark-read', methods=['POST', 'OPTIONS'])
def mark_product_alerts_read(product_id):
    """
    POST /api/alerts/product/<product_id>/mark-read
    RUTA CORREGIDA: Marca todas las alertas de un producto como leídas
    """
    # Manejar preflight CORS
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'OK'})
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
    
    try:
        if not product_id:
            return jsonify({
                "success": False,
                "message": "ID de producto requerido"
            }), 400
        
        from models.alert_model import alert_model
        
        # Marcar como leídas todas las alertas del producto
        result = alert_model.mark_as_read_by_product(product_id)
        
        if result and result.modified_count > 0:
            return jsonify({
                "success": True,
                "message": f"{result.modified_count} alertas marcadas como leídas",
                "modified_count": result.modified_count,
                "product_id": product_id
            })
        else:
            return jsonify({
                "success": True,
                "message": "No hay alertas pendientes para este producto",
                "modified_count": 0,
                "product_id": product_id
            })
        
    except Exception as e:
        print(f"❌ Error en ruta mark-product-alerts-read: {e}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "modified_count": 0
        }), 500

@alert_routes.route('/product/<product_id>/read-all', methods=['POST'])
def mark_product_alerts_read_alt(product_id):
    """
    POST /api/alerts/product/<product_id>/read-all
    Ruta alternativa para marcar alertas de producto como leídas
    """
    try:
        return mark_product_alerts_read(product_id)
        
    except Exception as e:
        print(f"❌ Error en ruta /read-all: {e}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor"
        }), 500

@alert_routes.route('/summary', methods=['GET'])
def get_alert_summary():
    """
    GET /api/alerts/summary
    Obtiene resumen estadístico de alertas
    """
    try:
        from models.alert_model import alert_model
        
        summary = alert_model.get_user_alert_summary()
        
        return jsonify({
            "success": True,
            "summary": summary
        })
        
    except Exception as e:
        print(f"❌ Error en ruta /summary: {e}")
        return jsonify({
            "success": False,
            "summary": {
                "total_alerts": 0,
                "unread_alerts": 0,
                "price_increases": 0,
                "price_decreases": 0,
                "read_alerts": 0
            }
        }), 500

@alert_routes.route('/bulk-read', methods=['POST'])
def bulk_mark_as_read():
    """
    POST /api/alerts/bulk-read
    Marca múltiples alertas como leídas
    Body: {"alert_ids": ["id1", "id2", ...]}
    """
    try:
        data = request.get_json()
        alert_ids = data.get('alert_ids', [])
        
        if not alert_ids:
            return jsonify({
                "success": False,
                "message": "Lista de IDs de alertas requerida"
            }), 400
        
        from models.alert_model import alert_model
        result = alert_model.bulk_mark_as_read(alert_ids)
        
        return jsonify({
            "success": True,
            "message": f"{result.get('modified_count', 0)} alertas marcadas como leídas",
            "modified_count": result.get('modified_count', 0)
        }), 200
        
    except Exception as e:
        print(f"❌ Error en ruta /bulk-read: {e}")
        return jsonify({
            "success": False,
            "message": "Error interno del servidor",
            "modified_count": 0
        }), 500

@alert_routes.route('/supermarket/<supermarket_key>', methods=['GET'])
def get_alerts_by_supermarket(supermarket_key):
    """
    GET /api/alerts/supermarket/<supermarket_key>
    Obtiene alertas filtradas por supermercado
    """
    try:
        limit = int(request.args.get('limit', 50))
        
        from models.alert_model import alert_model
        alerts = alert_model.get_alerts_by_supermarket(supermarket_key, limit)
        
        return jsonify({
            "success": True,
            "alerts": alerts,
            "supermarket_key": supermarket_key,
            "total": len(alerts)
        }), 200
        
    except Exception as e:
        print(f"❌ Error en ruta por supermercado: {e}")
        return jsonify({
            "success": False,
            "alerts": [],
            "message": "Error interno del servidor"
        }), 500

@alert_routes.route('/maintenance/fix-invalid', methods=['POST'])
def fix_invalid_alerts():
    """
    POST /api/alerts/maintenance/fix-invalid
    HERRAMIENTA DE MANTENIMIENTO: Corrige alertas con datos incorrectos
    """
    try:
        from models.alert_model import alert_model
        result = alert_model.fix_existing_invalid_alerts()
        
        return jsonify({
            "success": True,
            "message": "Mantenimiento de alertas completado",
            "result": result
        }), 200
        
    except Exception as e:
        print(f"❌ Error en mantenimiento: {e}")
        return jsonify({
            "success": False,
            "message": "Error en mantenimiento",
            "result": {"fixed": 0, "deleted": 0, "total_processed": 0}
        }), 500

@alert_routes.route('/maintenance/cleanup', methods=['POST'])
def cleanup_old_alerts():
    """
    POST /api/alerts/maintenance/cleanup
    Limpia alertas muy antiguas (>30 días)
    """
    try:
        days_old = int(request.json.get('days_old', 30)) if request.json else 30
        
        from models.alert_model import alert_model
        deleted_count = alert_model.cleanup_old_alerts(days_old)
        
        return jsonify({
            "success": True,
            "message": f"Limpieza completada: {deleted_count} alertas eliminadas",
            "deleted_count": deleted_count,
            "days_old": days_old
        }), 200
        
    except Exception as e:
        print(f"❌ Error en limpieza: {e}")
        return jsonify({
            "success": False,
            "message": "Error en limpieza",
            "deleted_count": 0
        }), 500

@alert_routes.route('/product/<product_id>/alerts', methods=['GET'])
def get_product_alerts(product_id):
    """
    GET /api/alerts/product/<product_id>/alerts
    NUEVA: Obtiene todas las alertas de un producto específico
    """
    try:
        if not product_id:
            return jsonify({
                "success": False,
                "message": "ID de producto requerido"
            }), 400
        
        from models.alert_model import alert_model
        from services.db import db
        
        # Obtener alertas del producto
        alerts = list(db.alerts.find({
            "product_id": product_id,
            "active": True
        }).sort([("created_at", -1)]))
        
        formatted_alerts = []
        for alert in alerts:
            alert["_id"] = str(alert["_id"])
            
            # Formatear fecha
            if alert.get("created_at"):
                try:
                    dt = datetime.fromisoformat(alert["created_at"])
                    alert["formatted_date"] = dt.strftime("%d %b, %H:%M")
                except:
                    alert["formatted_date"] = "Fecha inválida"
            
            formatted_alerts.append(alert)
        
        return jsonify({
            "success": True,
            "alerts": formatted_alerts,
            "product_id": product_id,
            "total": len(formatted_alerts)
        })
        
    except Exception as e:
        print(f"❌ Error obteniendo alertas del producto: {e}")
        return jsonify({
            "success": False,
            "alerts": [],
            "message": "Error interno del servidor"
        }), 500

@alert_routes.route('/recent', methods=['GET'])
def get_recent_alerts():
    """
    GET /api/alerts/recent
    NUEVA: Obtiene alertas más recientes
    """
    try:
        hours_back = int(request.args.get('hours_back', 24))
        limit = int(request.args.get('limit', 10))
        
        from datetime import timedelta
        from services.db import db
        
        time_limit = datetime.now() - timedelta(hours=hours_back)
        
        alerts = list(db.alerts.find({
            "active": True,
            "created_at": {"$gte": time_limit.isoformat()}
        }).sort([("created_at", -1)]).limit(limit))
        
        formatted_alerts = []
        for alert in alerts:
            alert["_id"] = str(alert["_id"])
            
            if alert.get("created_at"):
                try:
                    dt = datetime.fromisoformat(alert["created_at"])
                    alert["formatted_date"] = dt.strftime("%d %b, %H:%M")
                    alert["time_ago"] = self._calculate_time_ago(dt)
                except:
                    alert["formatted_date"] = "Fecha inválida"
                    alert["time_ago"] = "Desconocido"
            
            formatted_alerts.append(alert)
        
        return jsonify({
            "success": True,
            "alerts": formatted_alerts,
            "period_hours": hours_back,
            "total": len(formatted_alerts)
        })
        
    except Exception as e:
        print(f"❌ Error obteniendo alertas recientes: {e}")
        return jsonify({
            "success": False,
            "alerts": [],
            "message": "Error interno del servidor"
        }), 500

def _calculate_time_ago(dt):
    """Calcula tiempo transcurrido en formato amigable"""
    try:
        now = datetime.now()
        diff = now - dt
        
        if diff.days > 0:
            return f"hace {diff.days} día{'s' if diff.days > 1 else ''}"
        elif diff.seconds >= 3600:
            hours = diff.seconds // 3600
            return f"hace {hours} hora{'s' if hours > 1 else ''}"
        elif diff.seconds >= 60:
            minutes = diff.seconds // 60
            return f"hace {minutes} minuto{'s' if minutes > 1 else ''}"
        else:
            return "hace un momento"
    except:
        return "Desconocido"

# Ruta de prueba para verificar que el Blueprint funciona
@alert_routes.route('/test', methods=['GET'])
def test_alerts():
    """
    GET /api/alerts/test
    Ruta de prueba para verificar que las alertas funcionan
    """
    return jsonify({
        "success": True,
        "message": "Sistema de alertas funcionando correctamente",
        "timestamp": datetime.now().isoformat(),
        "routes_available": [
            "GET /api/alerts/active",
            "GET /api/alerts/count", 
            "GET /api/alerts/summary",
            "GET /api/alerts/recent",
            "POST /api/alerts/<id>/read",
            "POST /api/alerts/<id>/ignore",
            "POST /api/alerts/product/<id>/mark-read",
            "POST /api/alerts/product/<id>/read-all",
            "POST /api/alerts/bulk-read",
            "GET /api/alerts/supermarket/<key>",
            "GET /api/alerts/product/<id>/alerts",
            "POST /api/alerts/maintenance/fix-invalid",
            "POST /api/alerts/maintenance/cleanup"
        ]
    }), 200

# AGREGAR ESTAS RUTAS A TU alert_routes.py

@alert_routes.route('/test/create', methods=['POST'])
def create_test_alerts():
    """
    POST /api/alerts/test/create
    Crea alertas de prueba para testing
    """
    try:
        return alert_controller.create_test_alerts()
        
    except Exception as e:
        print(f"❌ Error creando alertas de prueba: {e}")
        return jsonify({
            "success": False,
            "message": "Error creando alertas de prueba"
        }), 500

@alert_routes.route('/system/status', methods=['GET'])
def get_system_status():
    """
    GET /api/alerts/system/status
    Obtiene el estado del sistema de alertas
    """
    try:
        return alert_controller.get_system_status()
        
    except Exception as e:
        print(f"❌ Error obteniendo estado del sistema: {e}")
        return jsonify({
            "success": False,
            "message": "Error obteniendo estado del sistema"
        }), 500