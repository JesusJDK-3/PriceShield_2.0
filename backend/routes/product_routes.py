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

# Rutas adicionales para funcionalidades específicas

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
        for key, info in product_controller.supermarket_api.SUPERMERCADOS_API.items():
            supermarkets_status[key] = {
                "name": info["name"],
                "active": info["active"]
            }
        
        return jsonify({
            "success": True,
            "service": "products",
            "status": "healthy",
            "database": {
                "connected": True,
                "total_products": product_count
            },
            "supermarkets": supermarkets_status,
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
            {"$match": {"brand": {"$ne": "Sin marca"}}},
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