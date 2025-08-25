from flask import Blueprint, request, jsonify
from controllers.product_controller import product_controller
from middleware.auth_middleware import auth_required, optional_auth
import functools
import time

# Crear Blueprint para las rutas de productos
product_routes = Blueprint('products', __name__, url_prefix='/api/products')

# Decorador para manejar errores en las rutas
def handle_route_errors(f):
    """
    Decorador para manejar errores comunes en las rutas
    """
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            print(f"❌ Error no manejado en ruta {request.endpoint}: {e}")
            return jsonify({
                "success": False,
                "error": "Error interno del servidor",
                "message": "Ha ocurrido un error inesperado"
            }), 500
    return wrapper

# =================== NUEVAS RUTAS PRINCIPALES ===================

@product_routes.route('/all', methods=['GET'])
@optional_auth
@handle_route_errors
def get_all_products():
    """
    GET /api/products/all?page=1&limit=50&sort_by=scraped_at&supermarket=plazavea
    
    Obtiene todos los productos guardados en la base de datos con paginación
    
    Query Parameters:
    - page (opcional): Página actual (por defecto 1)
    - limit (opcional): Productos por página (por defecto 50, máximo 100)
    - sort_by (opcional): price, price_desc, name, scraped_at, updated_at (por defecto scraped_at)
    - supermarket (opcional): Filtrar por supermercado específico
    
    Respuesta:
    {
        "success": true,
        "products": [...],
        "pagination": {
            "current_page": 1,
            "total_pages": 10,
            "total_products": 500,
            "products_per_page": 50,
            "has_next": true,
            "has_prev": false
        }
    }
    """
    return product_controller.get_all_saved_products()

@product_routes.route('/update-database', methods=['POST'])
@auth_required  # Solo usuarios autenticados pueden forzar actualizaciones
@handle_route_errors
def manual_database_update():
    """
    POST /api/products/update-database
    
    Actualiza manualmente la base de datos con productos populares
    
    Body JSON (opcional):
    {
        "force_update": false    # Opcional: forzar actualización aunque sea reciente
    }
    
    Respuesta:
    {
        "success": true,
        "message": "Actualización de base de datos iniciada",
        "status": "processing",
        "terms_to_process": 25,
        "estimated_time_minutes": 50
    }
    """
    return product_controller.manual_database_update()

# =================== RUTAS EXISTENTES MEJORADAS ===================

@product_routes.route('/search', methods=['POST'])
@optional_auth  # Permitir uso sin autenticación pero mejor con auth
@handle_route_errors
def search_products():
    """
    POST /api/products/search
    
    Busca productos en tiempo real en las APIs de supermercados
    
    Body JSON:
    {
        "query": "arroz",              # Requerido
        "supermarket": "plazavea",     # Opcional (si no se especifica, busca en todos)
        "limit": 20,                   # Opcional (por defecto 20)
        "save_to_db": true             # Opcional (por defecto true)
    }
    
    Respuesta:
    {
        "success": true,
        "query": "arroz",
        "results": {...},
        "database_save": {...}
    }
    """
    return product_controller.search_products()

@product_routes.route('/search/saved', methods=['GET'])
@optional_auth
@handle_route_errors
def search_saved_products():
    """
    GET /api/products/search/saved?query=arroz&supermarket=plazavea&limit=50&sort_by=price
    
    Busca productos guardados en la base de datos
    
    Query Parameters:
    - query (requerido): Término de búsqueda
    - supermarket (opcional): Filtrar por supermercado
    - limit (opcional): Límite de resultados (por defecto 50)
    - sort_by (opcional): price, price_desc, name, scraped_at (por defecto price)
    
    Respuesta:
    {
        "success": true,
        "products_count": 25,
        "products": [...]
    }
    """
    return product_controller.search_saved_products()

@product_routes.route('/compare', methods=['GET'])
@optional_auth
@handle_route_errors
def get_price_comparison():
    """
    GET /api/products/compare?product_name=arroz&days_back=7
    
    Obtiene comparación de precios entre supermercados
    
    Query Parameters:
    - product_name (requerido): Nombre del producto a comparar
    - days_back (opcional): Días hacia atrás para buscar (por defecto 7)
    
    Respuesta:
    {
        "success": true,
        "comparison": {...},
        "summary": {...}
    }
    """
    return product_controller.get_price_comparison()

@product_routes.route('/popular-searches', methods=['GET'])
@optional_auth
@handle_route_errors
def get_popular_searches():
    """
    GET /api/products/popular-searches?limit=10
    
    Obtiene las búsquedas más populares
    
    Query Parameters:
    - limit (opcional): Número de búsquedas a devolver (por defecto 10, máximo 100)
    
    Respuesta:
    {
        "success": true,
        "popular_searches": [...],
        "count": 10
    }
    """
    return product_controller.get_popular_searches()

@product_routes.route('/supermarkets', methods=['GET'])
@handle_route_errors
def get_available_supermarkets():
    """
    GET /api/products/supermarkets
    
    Obtiene lista de supermercados disponibles
    
    Respuesta:
    {
        "success": true,
        "supermarkets": {...},
        "count": 4
    }
    """
    return product_controller.get_available_supermarkets()

@product_routes.route('/search/async', methods=['POST'])
@auth_required  # Requiere autenticación para búsquedas asíncronas
@handle_route_errors
def async_search_and_save():
    """
    POST /api/products/search/async
    
    Realiza búsqueda asíncrona y guarda en segundo plano
    Útil para búsquedas que pueden tomar mucho tiempo
    
    Body JSON:
    {
        "query": "arroz",
        "supermarket": "plazavea",     # Opcional
        "limit": 50                    # Opcional
    }
    
    Respuesta:
    {
        "success": true,
        "search_id": "search_1234567890_123456",
        "status": "processing"
    }
    """
    return product_controller.async_search_and_save()

@product_routes.route('/search/status/<search_id>', methods=['GET'])
@auth_required
@handle_route_errors
def get_search_status(search_id):
    """
    GET /api/products/search/status/{search_id}
    
    Obtiene el estado de una búsqueda asíncrona
    
    Respuesta:
    {
        "success": true,
        "search_id": "search_1234567890_123456",
        "status": "completed"
    }
    """
    return product_controller.get_search_status(search_id)

@product_routes.route('/statistics', methods=['GET'])
@optional_auth
@handle_route_errors
def get_product_statistics():
    """
    GET /api/products/statistics
    
    Obtiene estadísticas generales de productos en la base de datos
    
    Respuesta:
    {
        "success": true,
        "statistics": {
            "total_products": 1250,
            "supermarkets": [...],
            "top_categories": [...],
            "price_summary": {...}
        }
    }
    """
    return product_controller.get_product_statistics()

# =================== RUTAS ADICIONALES ===================

@product_routes.route('/recent', methods=['GET'])
@optional_auth
@handle_route_errors
def get_recent_products():
    """
    GET /api/products/recent?days_back=7&limit=50
    
    Obtiene productos agregados/actualizados recientemente
    
    Query Parameters:
    - days_back (opcional): Días hacia atrás (por defecto 7)
    - limit (opcional): Límite de productos (por defecto 50)
    
    Respuesta:
    {
        "success": true,
        "products": [...],
        "count": 25
    }
    """
    try:
        days_back = int(request.args.get('days_back', 7))
        limit = int(request.args.get('limit', 50))
        
        if days_back < 1 or days_back > 30:
            return jsonify({
                "success": False,
                "error": "Parámetro inválido",
                "message": "days_back debe estar entre 1 y 30"
            }), 400
        
        if limit < 1 or limit > 100:
            return jsonify({
                "success": False,
                "error": "Parámetro inválido", 
                "message": "limit debe estar entre 1 y 100"
            }), 400
        
        products = product_controller.product_model.get_recent_products(days_back, limit)
        
        return jsonify({
            "success": True,
            "products": products,
            "count": len(products),
            "days_back": days_back
        }), 200
        
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": "Parámetro inválido",
            "message": "Los parámetros deben ser números válidos"
        }), 400
        
    except Exception as e:
        print(f"❌ Error obteniendo productos recientes: {e}")
        return jsonify({
            "success": False,
            "error": "Error interno del servidor",
            "message": str(e)
        }), 500

@product_routes.route('/categories/<category>', methods=['GET'])
@optional_auth
@handle_route_errors
def get_products_by_category(category):
    """
    GET /api/products/categories/{category}?limit=20
    
    Obtiene productos por categoría específica
    
    Query Parameters:
    - limit (opcional): Límite de productos (por defecto 20)
    
    Respuesta:
    {
        "success": true,
        "category": "lacteos",
        "products": [...],
        "count": 15
    }
    """
    try:
        limit = int(request.args.get('limit', 20))
        
        if limit < 1 or limit > 100:
            limit = 20
        
        products = product_controller.product_model.get_products_by_category(category, limit)
        
        return jsonify({
            "success": True,
            "category": category,
            "products": products,
            "count": len(products)
        }), 200
        
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": "Parámetro inválido",
            "message": "El parámetro 'limit' debe ser un número"
        }), 400
        
    except Exception as e:
        print(f"❌ Error obteniendo productos por categoría: {e}")
        return jsonify({
            "success": False,
            "error": "Error interno del servidor",
            "message": str(e)
        }), 500

@product_routes.route('/product-history-unified', methods=['GET'])
@optional_auth
@handle_route_errors
def get_product_history_unified():
    """
    GET /api/products/product-history-unified?product_name=arroz&days_back=30
    """
    try:
        product_name = request.args.get('product_name', '').strip()
        days_back = int(request.args.get('days_back', 30))
        
        if not product_name:
            return jsonify({
                "success": False,
                "error": "Parámetro 'product_name' es requerido"
            }), 400
        
        # Usar el nuevo método
        products = product_controller.product_model.get_product_unified_history(
            product_name, days_back
        )
        
        return jsonify({
            "success": True,
            "products": products,
            "count": len(products)
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Error interno del servidor",
            "message": str(e)
        }), 500

@product_routes.route('/health', methods=['GET'])
@handle_route_errors
def health_check():
    """
    GET /api/products/health
    
    Verifica el estado de salud del servicio de productos
    """
    try:
        # Verificar conexión con base de datos
        product_count = product_controller.product_model.products_collection.count_documents({})
        
        # Verificar APIs de supermercados (simple ping)
        supermarkets_status = {}
        try:
            from services.api_scraper import supermarket_api
            for key, info in supermarket_api.SUPERMERCADOS_API.items():
                supermarkets_status[key] = {
                    "name": info["name"],
                    "active": info["active"]
                }
        except Exception as e:
            supermarkets_status = {"error": "No se pudo verificar APIs"}
        
        # Verificar scheduler
        try:
            from services.scheduler import database_scheduler
            scheduler_status = database_scheduler.is_running
        except Exception as e:
            scheduler_status = False
        
        return jsonify({
            "success": True,
            "service": "products",
            "status": "healthy",
            "database": {
                "connected": True,
                "total_products": product_count
            },
            "supermarkets": supermarkets_status,
            "scheduler": {
                "active": scheduler_status
            },
            "timestamp": getattr(request, 'timestamp', time.time())
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "service": "products",
            "status": "unhealthy",
            "error": str(e)
        }), 503

@product_routes.route('/categories', methods=['GET'])
@optional_auth
@handle_route_errors
def get_categories():
    """
    GET /api/products/categories
    
    Obtiene todas las categorías disponibles de productos
    """
    try:
        # Obtener categorías únicas de la base de datos
        pipeline = [
            {"$unwind": "$categories"},
            {"$group": {
                "_id": "$categories",
                "product_count": {"$sum": 1}
            }},
            {"$sort": {"product_count": -1}},
            {"$project": {
                "category": "$_id",
                "product_count": 1,
                "_id": 0
            }}
        ]
        
        categories = list(product_controller.product_model.products_collection.aggregate(pipeline))
        
        return jsonify({
            "success": True,
            "categories": categories,
            "total_categories": len(categories)
        }), 200
        
    except Exception as e:
        print(f"❌ Error obteniendo categorías: {e}")
        return jsonify({
            "success": False,
            "error": "Error interno del servidor",
            "message": str(e)
        }), 500

@product_routes.route('/brands', methods=['GET'])
@optional_auth
@handle_route_errors
def get_brands():
    """
    GET /api/products/brands?limit=50
    
    Obtiene todas las marcas disponibles de productos
    """
    try:
        limit = int(request.args.get('limit', 50))
        
        # Obtener marcas únicas de la base de datos
        pipeline = [
            {"$match": {"brand": {"$ne": "Sin marca", "$ne": None, "$ne": ""}}},
            {"$group": {
                "_id": "$brand",
                "product_count": {"$sum": 1}
            }},
            {"$sort": {"product_count": -1}},
            {"$limit": limit},
            {"$project": {
                "brand": "$_id",
                "product_count": 1,
                "_id": 0
            }}
        ]
        
        brands = list(product_controller.product_model.products_collection.aggregate(pipeline))
        
        return jsonify({
            "success": True,
            "brands": brands,
            "total_brands": len(brands)
        }), 200
        
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": "Parámetro inválido",
            "message": "El parámetro 'limit' debe ser un número"
        }), 400
        
    except Exception as e:
        print(f"❌ Error obteniendo marcas: {e}")
        return jsonify({
            "success": False,
            "error": "Error interno del servidor",
            "message": str(e)
        }), 500

# Agregar estas rutas en product_routes.py

@product_routes.route('/price-history', methods=['GET'])
@optional_auth
@handle_route_errors
def get_product_price_history():
    """
    GET /api/products/price-history?product_name=arroz&supermarket=plazavea&days_back=30
    
    Obtiene el historial de precios específico de un producto
    
    Query Parameters:
    - product_name (requerido): Nombre exacto del producto
    - supermarket (opcional): Filtrar por supermercado específico
    - days_back (opcional): Días hacia atrás para buscar (por defecto 30)
    
    Respuesta:
    {
        "success": true,
        "product_name": "arroz",
        "history": [...],
        "summary": {...}
    }
    """
    try:
        # Obtener parámetros
        product_name = request.args.get('product_name', '').strip()
        supermarket_key = request.args.get('supermarket')
        days_back = int(request.args.get('days_back', 30))
        
        if not product_name:
            return jsonify({
                "success": False,
                "error": "Parámetro 'product_name' es requerido",
                "message": "Debe proporcionar el nombre exacto del producto"
            }), 400
        
        if len(product_name) < 2:
            return jsonify({
                "success": False,
                "error": "Nombre muy corto",
                "message": "El nombre del producto debe tener al menos 2 caracteres"
            }), 400
        
        if days_back < 1 or days_back > 365:
            return jsonify({
                "success": False,
                "error": "Rango de días inválido",
                "message": "days_back debe estar entre 1 y 365 días"
            }), 400
        
        # Obtener historial de precios
        history_data = product_controller.product_model.get_product_price_history(
            product_name=product_name,
            supermarket_key=supermarket_key,
            days_back=days_back
        )
        
        if not history_data:
            return jsonify({
                "success": True,
                "product_name": product_name,
                "history": [],
                "summary": {
                    "total_records": 0,
                    "date_range": "Sin datos",
                    "price_range": {"min": 0, "max": 0},
                    "supermarkets": []
                },
                "message": "No se encontró historial para este producto"
            }), 200
        
        # Calcular resumen
        prices = [record["price"] for record in history_data]
        supermarkets = list(set([record["supermarket_name"] for record in history_data]))
        dates = [record["date"] for record in history_data]
        
        summary = {
            "total_records": len(history_data),
            "date_range": {
                "from": min(dates),
                "to": max(dates)
            },
            "price_range": {
                "min": min(prices),
                "max": max(prices),
                "avg": round(sum(prices) / len(prices), 2)
            },
            "supermarkets": supermarkets,
            "days_with_data": len(set(dates))
        }
        
        return jsonify({
            "success": True,
            "product_name": product_name,
            "supermarket_filter": supermarket_key,
            "days_back": days_back,
            "history": history_data,
            "summary": summary
        }), 200
        
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": "Parámetro inválido",
            "message": str(e)
        }), 400
    
    except Exception as e:
        print(f"❌ Error obteniendo historial de precios: {e}")
        return jsonify({
            "success": False,
            "error": "Error interno del servidor",
            "message": str(e)
        }), 500

@product_routes.route('/price-trend', methods=['GET'])
@optional_auth
@handle_route_errors
def get_product_price_trend():
    """
    GET /api/products/price-trend?product_name=arroz&days_back=30
    
    Obtiene la tendencia de precios de un producto (datos agregados para gráficos)
    
    Query Parameters:
    - product_name (requerido): Nombre del producto
    - days_back (opcional): Días hacia atrás (por defecto 30)
    
    Respuesta:
    {
        "success": true,
        "product_name": "arroz",
        "chart_data": {
            "labels": ["01 Dec", "02 Dec", ...],
            "prices": [2.50, 2.45, ...],
            "dates": ["2024-12-01", "2024-12-02", ...]
        }
    }
    """
    try:
        # Obtener parámetros
        product_name = request.args.get('product_name', '').strip()
        days_back = int(request.args.get('days_back', 30))
        
        if not product_name:
            return jsonify({
                "success": False,
                "error": "Parámetro 'product_name' es requerido"
            }), 400
        
        if days_back < 1 or days_back > 365:
            days_back = 30
        
        # Obtener datos de tendencia
        trend_data = product_controller.product_model.get_product_price_trend(
            product_name=product_name,
            days_back=days_back
        )
        
        if not trend_data["labels"]:
            # Si no hay datos, devolver estructura vacía pero válida
            return jsonify({
                "success": True,
                "product_name": product_name,
                "chart_data": {
                    "labels": ["Sin historial"],
                    "prices": [0],
                    "dates": [],
                    "data_points": 0
                },
                "message": "No se encontraron datos de tendencia para este producto"
            }), 200
        
        return jsonify({
            "success": True,
            "product_name": product_name,
            "days_back": days_back,
            "chart_data": trend_data,
            "message": f"Tendencia con {trend_data['data_points']} puntos de datos"
        }), 200
        
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": "Parámetro inválido",
            "message": str(e)
        }), 400
    
    except Exception as e:
        print(f"❌ Error obteniendo tendencia de precios: {e}")
        return jsonify({
            "success": False,
            "error": "Error interno del servidor",
            "message": str(e)
        }), 500
# =================== RUTAS DE CONTROL DEL SCHEDULER ===================

@product_routes.route('/scheduler/status', methods=['GET'])
@auth_required
@handle_route_errors
def get_scheduler_status():
    """
    GET /api/products/scheduler/status
    
    Obtiene el estado del programador de tareas
    """
    try:
        from services.scheduler import database_scheduler
        
        return jsonify({
            "success": True,
            "scheduler": {
                "active": database_scheduler.is_running,
                "next_update": "Diario a las 02:00 AM",
                "cleanup": "Domingos a las 03:00 AM",
                "popular_terms_count": len(database_scheduler.popular_terms)
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Error obteniendo estado del scheduler",
            "message": str(e)
        }), 500

@product_routes.route('/scheduler/force-update', methods=['POST'])
@auth_required
@handle_route_errors
def force_scheduler_update():
    """
    POST /api/products/scheduler/force-update
    
    Fuerza una actualización inmediata del scheduler (solo para testing)
    """
    try:
        from services.scheduler import database_scheduler
        
        result = database_scheduler.force_update_now()
        
        return jsonify({
            "success": True,
            "message": result,
            "status": "started"
        }), 202
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Error forzando actualización",
            "message": str(e)
        }), 500
        

# =================== MIDDLEWARE Y MANEJO DE ERRORES ===================

# Middleware para agregar timestamp a las peticiones
@product_routes.before_request
def before_request():
    """
    Se ejecuta antes de cada petición a las rutas de productos
    """
    request.timestamp = time.time()
    
    # Log de la petición
    print(f"📡 {request.method} {request.endpoint} - {request.remote_addr}")

@product_routes.after_request
def after_request(response):
    """
    Se ejecuta después de cada petición a las rutas de productos
    """
    # Agregar headers CORS si es necesario
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    
    # Log de la respuesta
    duration = time.time() - getattr(request, 'timestamp', time.time())
    print(f"📡 {request.method} {request.endpoint} - {response.status_code} - {duration:.2f}s")
    
    return response

# Manejo de errores específicos del Blueprint
@product_routes.errorhandler(404)
def not_found(error):
    """Maneja errores 404 en rutas de productos"""
    return jsonify({
        "success": False,
        "error": "Ruta no encontrada",
        "message": f"La ruta solicitada no existe en el servicio de productos"
    }), 404

@product_routes.errorhandler(405)
def method_not_allowed(error):
    """Maneja errores 405 (método no permitido)"""
    return jsonify({
        "success": False,
        "error": "Método no permitido",
        "message": f"El método {request.method} no está permitido para esta ruta"
    }), 405

@product_routes.errorhandler(429)
def rate_limit_exceeded(error):
    """Maneja errores 429 (demasiadas peticiones)"""
    return jsonify({
        "success": False,
        "error": "Demasiadas peticiones",
        "message": "Ha excedido el límite de peticiones. Intente nuevamente en unos momentos"
    }), 429

@product_routes.errorhandler(500)
def internal_server_error(error):
    """Maneja errores 500 del servidor"""
    return jsonify({
        "success": False,
        "error": "Error interno del servidor",
        "message": "Ha ocurrido un error interno. Intente nuevamente más tarde"
    }), 500