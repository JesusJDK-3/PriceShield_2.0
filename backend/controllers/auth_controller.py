from flask import request, jsonify
from models.user_model import User

class AuthController:
    """
    Controlador que maneja toda la lógica de autenticación
    """
    
    def __init__(self):
        self.user_model = User()
    
    def smart_auth(self):
        """
        Función inteligente que maneja tanto login como registro automáticamente
        - Si el usuario existe y la contraseña es correcta → Login exitoso
        - Si el usuario existe pero la contraseña es incorrecta → Error de contraseña
        - Si el usuario no existe → Registra automáticamente y hace login
        """
        try:
            # Obtener datos del formulario JSON
            data = request.get_json()
            
            # Validar que vengan los datos necesarios
            if not data:
                return jsonify({
                    'success': False,
                    'message': 'No se recibieron datos'
                }), 400
            
            correo = data.get('correo', '').strip()
            contraseña = data.get('contraseña', '')
            
            # Validar que no estén vacíos
            if not correo or not contraseña:
                return jsonify({
                    'success': False,
                    'message': 'Email y contraseña son obligatorios'
                }), 400
            
            # Buscar si el usuario ya existe
            existing_user = self.user_model.find_by_email(correo)
            
            if existing_user:
                # USUARIO YA EXISTE - Intentar hacer login
                result = self.user_model.authenticate_user(correo, contraseña)
                
                if result['success']:
                    # Login exitoso
                    return jsonify({
                        'success': True,
                        'message': 'Login exitoso',
                        'action': 'login',
                        'user': {
                            'id': result['user_id'],
                            'email': result['email']
                        }
                    }), 200
                else:
                    # Contraseña incorrecta
                    return jsonify({
                        'success': False,
                        'message': 'Contraseña incorrecta',
                        'action': 'login_failed'
                    }), 401
            
            else:
                # USUARIO NO EXISTE - Registrar automáticamente
                result = self.user_model.create_user(correo, contraseña)
                
                if result['success']:
                    # Registro exitoso
                    return jsonify({
                        'success': True,
                        'message': 'Registro exitoso. Bienvenido a PriceShield!',
                        'action': 'register',
                        'user': {
                            'id': result['user_id'],
                            'email': correo
                        }
                    }), 201
                else:
                    # Error en el registro
                    return jsonify({
                        'success': False,
                        'message': result['message'],
                        'action': 'register_failed'
                    }), 400
        
        except Exception as e:
            # Error interno del servidor
            print(f"Error en smart_auth: {e}")
            return jsonify({
                'success': False,
                'message': 'Error interno del servidor'
            }), 500
    
    def get_user_info(self):
        """
        Función adicional para obtener información del usuario (para futuro uso)
        """
        try:
            data = request.get_json()
            email = data.get('email')
            
            if not email:
                return jsonify({
                    'success': False,
                    'message': 'Email es obligatorio'
                }), 400
            
            user = self.user_model.find_by_email(email)
            
            if user:
                return jsonify({
                    'success': True,
                    'user': {
                        'id': str(user['_id']),
                        'email': user['correo'],
                        'fecha_registro': user.get('fecha_registro', 'No disponible')
                    }
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'message': 'Usuario no encontrado'
                }), 404
                
        except Exception as e:
            print(f"Error obteniendo info del usuario: {e}")
            return jsonify({
                'success': False,
                'message': 'Error interno del servidor'
            }), 500

# Crear una instancia del controlador
auth_controller = AuthController()