from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os
import atexit

# Importar las rutas
from routes.auth_routes import auth_bp
from routes.product_routes import product_routes

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
            'products': '/api/products/*'
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