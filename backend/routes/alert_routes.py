from flask import Blueprint, request, jsonify
from models.alert_model import alert_model

alert_routes = Blueprint('alerts', __name__, url_prefix='/api/alerts')

@alert_routes.route('/', methods=['GET'])
def get_alerts():
    """
    GET /api/alerts?limit=50&unread_only=true
    """
    try:
        limit = int(request.args.get('limit', 50))
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        # Validar límite
        if limit > 100:
            limit = 100
        elif limit < 1:
            limit = 10
        
        alerts = alert_model.get_user_alerts(limit=limit, unread_only=unread_only)
        summary = alert_model.get_alerts_summary()
        
        return jsonify({
            "success": True,
            "alerts": alerts,
            "summary": summary,
            "total_returned": len(alerts)
        }), 200
        
    except ValueError:
        return jsonify({
            "success": False,
            "error": "Parámetro 'limit' debe ser un número válido"
        }), 400
    except Exception as e:
        print(f"Error en get_alerts: {e}")
        return jsonify({
            "success": False,
            "error": "Error interno del servidor",
            "message": str(e)
        }), 500

@alert_routes.route('/<alert_id>/read', methods=['PUT'])
def mark_as_read(alert_id):
    """
    PUT /api/alerts/{alert_id}/read
    """
    try:
        # Validar format de ObjectId
        if len(alert_id) != 24:
            return jsonify({
                "success": False,
                "error": "ID de alerta inválido"
            }), 400
            
        success = alert_model.mark_alert_as_read(alert_id)
        
        if success:
            return jsonify({
                "success": True,
                "message": "Alerta marcada como leída"
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": "No se encontró la alerta o ya estaba marcada como leída"
            }), 404
        
    except Exception as e:
        print(f"Error en mark_as_read: {e}")
        return jsonify({
            "success": False,
            "error": "Error interno del servidor"
        }), 500

@alert_routes.route('/<alert_id>/ignore', methods=['PUT'])
def ignore_alert(alert_id):
    """
    PUT /api/alerts/{alert_id}/ignore
    """
    try:
        # Validar format de ObjectId
        if len(alert_id) != 24:
            return jsonify({
                "success": False,
                "error": "ID de alerta inválido"
            }), 400
            
        success = alert_model.ignore_alert(alert_id)
        
        if success:
            return jsonify({
                "success": True,
                "message": "Alerta ignorada correctamente"
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": "No se encontró la alerta o ya estaba ignorada"
            }), 404
        
    except Exception as e:
        print(f"Error en ignore_alert: {e}")
        return jsonify({
            "success": False,
            "error": "Error interno del servidor"
        }), 500

@alert_routes.route('/summary', methods=['GET'])
def get_alerts_summary():
    """
    GET /api/alerts/summary
    Endpoint dedicado para obtener solo el resumen
    """
    try:
        summary = alert_model.get_alerts_summary()
        
        return jsonify({
            "success": True,
            "summary": summary
        }), 200
        
    except Exception as e:
        print(f"Error en get_alerts_summary: {e}")
        return jsonify({
            "success": False,
            "error": "Error interno del servidor"
        }), 500

@alert_routes.route('/cleanup', methods=['POST'])
def cleanup_old_alerts():
    """
    POST /api/alerts/cleanup
    Limpia alertas antiguas (solo para administración)
    """
    try:
        days_old = int(request.json.get('days_old', 30)) if request.json else 30
        
        deleted_count = alert_model.clean_old_alerts(days_old=days_old)
        
        return jsonify({
            "success": True,
            "deleted_count": deleted_count,
            "message": f"Se eliminaron {deleted_count} alertas antiguas"
        }), 200
        
    except Exception as e:
        print(f"Error en cleanup_old_alerts: {e}")
        return jsonify({
            "success": False,
            "error": "Error interno del servidor"
        }), 500

@alert_routes.route('/test-create', methods=['POST'])
def test_create_alert():
    """
    POST /api/alerts/test-create
    Endpoint de prueba para crear una alerta manual (solo para testing)
    """
    try:
        if not request.json:
            return jsonify({
                "success": False,
                "error": "Se requieren datos JSON"
            }), 400
            
        product_data = {
            "unique_id": request.json.get("product_id", "test_product_001"),
            "name": request.json.get("name", "Producto de Prueba"),
            "supermarket": request.json.get("supermarket", "Supermercado Test"),
            "supermarket_key": request.json.get("supermarket_key", "test_market"),
            "url": request.json.get("url", "https://example.com"),
            "brand": request.json.get("brand", "Marca Test"),
            "categories": ["test", "prueba"]
        }
        
        old_price = float(request.json.get("old_price", 10.0))
        new_price = float(request.json.get("new_price", 15.0))
        
        alert_id = alert_model.create_price_change_alert(
            product_data=product_data,
            old_price=old_price,
            new_price=new_price
        )
        
        if alert_id:
            return jsonify({
                "success": True,
                "alert_id": str(alert_id),
                "message": "Alerta de prueba creada exitosamente"
            }), 201
        else:
            return jsonify({
                "success": False,
                "error": "No se pudo crear la alerta (cambio no significativo?)"
            }), 400
        
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": f"Error en los datos: {str(e)}"
        }), 400
    except Exception as e:
        print(f"Error en test_create_alert: {e}")
        return jsonify({
            "success": False,
            "error": "Error interno del servidor"
        }), 500