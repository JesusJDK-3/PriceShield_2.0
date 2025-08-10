from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Importar las rutas
from routes.auth_routes import auth_bp
from routes.product_routes import product_routes

#Cargar variables de entorno del archivo.env
load_dotenv()

#Crear la aplicacion Flask
app = Flask(__name__)

#configurar CORS  para permitir peticiones desde react  (puerto 5173 de vite)
CORS(app, origins=['http://localhost:5173'])

#configurar la clave secreta para sesiones....NO LVIDARME COMVERTIRLO EN RAMDOM....
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

#registrar las rutas de autenticacion con el prefijo /api/auth
app.register_blueprint(auth_bp, url_prefix='/api/auth')

#registrar las rutas de productos con el prefijo /api/products
app.register_blueprint(product_routes, url_prefix='/api/products')

#ruta de prueba para verificar que el servidor funciona
@app.route('/')
def home():
    return {'message': 'PriceShield Backend funcionando correctamente!'}

#ruta de verificacion de estado de la API
@app.route('/api/health')
def api_health():
    """
    Endpoint para verificar el estado general de la API
    """
    return {
        'status': 'healthy',
        'service': 'PriceShield Backend',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth/*',
            'products': '/api/products/*'
        }
    }

#Ejecutar la aplicacion
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0',port=5000 )