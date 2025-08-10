from functools import wraps
from flask import request, jsonify

def auth_required(f):
    """
    Decorador que requiere autenticación (implementación temporal)
    TODO: Implementar validación real de JWT/tokens
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # Por ahora, permitir todas las peticiones
        # En el futuro aquí irá la validación real del token
        
        # Ejemplo de como sería la validación:
        # auth_header = request.headers.get('Authorization')
        # if not auth_header or not auth_header.startswith('Bearer '):
        #     return jsonify({
        #         "success": False,
        #         "error": "Token requerido",
        #         "message": "Debe proporcionar un token de autenticación"
        #     }), 401
        
        return f(*args, **kwargs)
    return decorated

def optional_auth(f):
    """
    Decorador para autenticación opcional
    La ruta funciona con o sin autenticación
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # Por ahora, permitir todas las peticiones
        # En el futuro aquí se validará el token si está presente
        return f(*args, **kwargs)
    return decorated