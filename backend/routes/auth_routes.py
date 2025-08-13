from flask import Blueprint# permite agrupar las rutas de autenticacion en unarchivo separado
from controllers.auth_controller import auth_controller#Desde el archivo auth_controller.py dentro de la carpeta controllers, importa el objeto auth_controller

# Crear el Blueprint para las rutas de autenticación
auth_bp = Blueprint('auth', __name__)

# Agregar esta ruta a tu auth_routes.py

@auth_bp.route('/google-auth', methods=['POST'])
def google_auth():
    """
    Endpoint para autenticación con Google OAuth
    
    POST /api/auth/google-auth
    
    Body JSON:
    {
        "correo": "usuario@gmail.com",
        "nombre": "Nombre Usuario",
        "google_id": "google_user_id",
        "foto": "url_foto_google",
        "auth_method": "google"
    }
    
    Respuesta exitosa:
    {
        "success": true,
        "message": "Login con Google exitoso",
        "action": "google_login",
        "user": {
            "id": "user_id_mongodb",
            "email": "usuario@gmail.com",
            "nombre": "Nombre Usuario",
            "foto": "url_foto",
            "auth_method": "google"
        }
    }
    """
    return auth_controller.google_auth()

@auth_bp.route('/smart-auth', methods=['POST'])
def smart_auth():
    """
    Endpoint principal: POST /api/auth/smart-auth
    
    Maneja automáticamente login y registro:
    - Recibe: { "correo": "usuario@gmail.com", "contraseña": "mipassword" }
    - Si el usuario existe y la contraseña es correcta → Login
    - Si el usuario existe pero contraseña incorrecta → Error
    - Si el usuario no existe → Registro automático
    
    Respuesta exitosa:
    {
        "success": true,
        "message": "Login exitoso" o "Registro exitoso. Bienvenido a PriceShield!",
        "action": "login" o "register",
        "user": {
            "id": "usuario_id_mongodb",
            "email": "usuario@gmail.com"
        }
    }
    
    Respuesta de error:
    {
        "success": false,
        "message": "Contraseña incorrecta",
        "action": "login_failed"
    }
    """
    return auth_controller.smart_auth()

@auth_bp.route('/user-info', methods=['POST'])
def get_user_info():
    """
    Endpoint adicional: POST /api/auth/user-info
    
    Obtiene información del usuario por email
    Útil para futuras funcionalidades
    """
    return auth_controller.get_user_info()

@auth_bp.route('/test', methods=['GET'])
def test_auth():
    """
    Endpoint de prueba: GET /api/auth/test
    
    Verifica que las rutas de autenticación funcionan
    """
    return {
        'success': True,
        'message': 'Las rutas de autenticación están funcionando correctamente! ✅',
        'endpoints': {
            'smart_auth': '/api/auth/smart-auth (POST)',
            'user_info': '/api/auth/user-info (POST)',
            'test': '/api/auth/test (GET)'
        }
    }