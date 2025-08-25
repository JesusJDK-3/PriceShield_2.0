from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os
import atexit

# Importar las rutas
from routes.auth_routes import auth_bp
from routes.product_routes import product_routes
from routes.alert_routes import alert_routes  # NUEVA IMPORTACIÓN

# Importar el scheduler
from services.scheduler import database_scheduler

# Cargar variables de entorno del archivo .env
load_dotenv()

# Crear la aplicación Flask
app = Flask(__name__)

# Configurar CORS para permitir peticiones desde react (puerto 5173 de vite)
CORS(app, origins=['http://localhost:5173'])

# Configurar la clave secreta para sesiones
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

# Registrar las rutas de autenticación con el prefijo /api/auth
app.register_blueprint(auth_bp, url_prefix='/api/auth')

# Registrar las rutas de productos con el prefijo /api/products
app.register_blueprint(product_routes, url_prefix='/api/products')

# Registrar las rutas de alertas con el prefijo /api/alerts
app.register_blueprint(alert_routes)  # NUEVO REGISTRO

# Ruta de prueba para verificar que el servidor funciona
@app.route('/')
def home():
    return {'message': 'PriceShield Backend funcionando correctamente!'}

# Ruta de verificación de estado de la API
@app.route('/api/health')
def api_health():
    """
    Endpoint para verificar el estado general de la API
    """
    return {
        'status': 'healthy',
        'service': 'PriceShield Backend',
        'version': '1.0.0',
        'scheduler_active': database_scheduler.is_running,
        'endpoints': {
            'auth': '/api/auth/*',
            'products': '/api/products/*',
            'alerts': '/api/alerts/*'  # ACTUALIZAR DOCUMENTACIÓN
        }
    }

# Nueva ruta para controlar el scheduler manualmente
@app.route('/api/scheduler/status')
def scheduler_status():
    """
    Devuelve el estado del programador de tareas
    """
    return {
        'scheduler_active': database_scheduler.is_running,
        'next_update': 'Diario a las 02:00 AM',
        'cleanup': 'Domingos a las 03:00 AM'
    }

@app.route('/api/scheduler/force-update', methods=['POST'])
def force_update():
    """
    Fuerza una actualización inmediata (solo para testing)
    """
    result = database_scheduler.force_update_now()
    return {'message': result, 'status': 'started'}

def initialize_app():
    """
    Inicializa servicios de la aplicación
    """
    print("🚀 Inicializando PriceShield Backend...")
    
    # Iniciar el programador de tareas
    try:
        database_scheduler.start_scheduler()
        print("✅ Programador de tareas iniciado correctamente")
    except Exception as e:
        print(f"⚠️ Error iniciando programador: {e}")
    
    print("✅ Aplicación inicializada correctamente")

def cleanup():
    """
    Limpieza al cerrar la aplicación
    """
    print("🛑 Cerrando PriceShield Backend...")
    
    try:
        database_scheduler.stop_scheduler()
        print("✅ Programador de tareas detenido")
    except Exception as e:
        print(f"⚠️ Error deteniendo programador: {e}")

# 🧹 NUEVA RUTA: Limpiar productos duplicados
@app.route('/api/admin/clean-duplicates', methods=['GET', 'POST'])
def clean_duplicates():
    """
    Limpia productos duplicados de la base de datos (UNA SOLA VEZ)
    """
    try:
        from models.product_model import product_model
        deleted_count = product_model.clean_duplicate_products()
        
        return {
            'success': True, 
            'deleted_count': deleted_count,
            'message': f'✅ Eliminados {deleted_count} productos duplicados'
        }
    except Exception as e:
        return {
            'success': False, 
            'error': str(e),
            'message': f'❌ Error limpiando duplicados: {e}'
        }, 500

# 🔧 NUEVA RUTA: Ver estadísticas de duplicados (sin eliminar)
@app.route('/api/admin/duplicates-stats', methods=['GET']) 
def duplicates_stats():
    """
    Muestra cuántos duplicados hay SIN eliminarlos
    """
    try:
        from models.product_model import product_model
        
        pipeline = [
            {
                "$group": {
                    "_id": {
                        "name": "$name",
                        "supermarket_key": "$supermarket_key", 
                        "price": "$price"
                    },
                    "count": {"$sum": 1}
                }
            },
            {
                "$match": {"count": {"$gt": 1}}
            }
        ]
        
        duplicates = list(product_model.products_collection.aggregate(pipeline))
        total_duplicates = sum(group["count"] - 1 for group in duplicates)
        
        return {
            'success': True,
            'duplicate_groups': len(duplicates),
            'total_duplicates': total_duplicates,
            'message': f'📊 {total_duplicates} productos duplicados en {len(duplicates)} grupos'
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }, 500

# NUEVA RUTA: Endpoint de prueba para crear alertas manuales
@app.route('/api/test/create-alert', methods=['POST'])
def test_create_alert():
    """
    Endpoint de prueba para crear alertas (útil para testing)
    """
    try:
        from models.alert_model import alert_model
        
        # Datos de prueba
        product_data = {
            "unique_id": "test_product_001",
            "name": "Producto de Prueba - Arroz Superior",
            "supermarket": "Plaza Vea",
            "supermarket_key": "plaza_vea",
            "url": "https://www.plazavea.com.pe/arroz-superior",
            "brand": "Costeño",
            "categories": ["abarrotes", "arroz"]
        }
        
        old_price = 8.50
        new_price = 12.90
        
        alert_id = alert_model.create_price_change_alert(
            product_data=product_data,
            old_price=old_price,
            new_price=new_price
        )
        
        if alert_id:
            return {
                'success': True,
                'alert_id': str(alert_id),
                'message': 'Alerta de prueba creada exitosamente',
                'product': product_data['name'],
                'price_change': f'{old_price} → {new_price}'
            }
        else:
            return {
                'success': False,
                'error': 'No se pudo crear la alerta'
            }, 400
        
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }, 500

# Registrar función de limpieza
atexit.register(cleanup)

# Ejecutar la aplicación
if __name__ == '__main__':
    # Inicializar servicios
    initialize_app()
    
    # Ejecutar Flask
    try:
        app.run(debug=True, host='0.0.0.0', port=5000)
    except KeyboardInterrupt:
        print("\n🛑 Aplicación interrumpida por el usuario")
    finally:
        cleanup()