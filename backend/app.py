from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Importar las rutas
from routes.auth_routes import auth_bp

#Cargar variables de entorno del archivo.env
load_dotenv()

#Crear la aplicacion Flask
app = Flask(__name__)

#configurar CORS  para permitir peticiones desde react  (puerto 5173 de vite)
CORS(app, origins=['http://localhost:5173'])

#configurar la clave secreta para sesiones
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

#registrar las rutas de autenticacion con el prefijo /api/auth
app.register_blueprint(auth_bp, url_prefix='/api/auth')

#ruta de prueba para verificar que el servidor funciona
@app.route('/')
def home():
    return {'message': 'PriceShield Backend funcionandocorrectamente!'}


#Ejecutar la aplicacion
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0',port=5000 )
