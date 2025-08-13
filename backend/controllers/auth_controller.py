from flask import request, jsonify
from models.user_model import User
from datetime import datetime

class AuthController:
    """
    Controlador que maneja toda la lógica de autenticación
    """
    
    def __init__(self):
        """Inicializa el controlador de autenticación"""
        self.user_model = User()
    
    def google_auth(self):
        """
        Función para manejar autenticación con Google OAuth
        """
        try:
            # Obtener datos del frontend
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'success': False,
                    'message': 'No se recibieron datos'
                }), 400

            correo = data.get('correo', '').strip()
            nombre = data.get('nombre', '').strip()
            google_id = data.get('google_id', '')
            foto = data.get('foto', '')
            
            print(f"📥 Datos recibidos de Google: {data}")  # Debug
            
            # Validar datos mínimos requeridos
            if not correo or not google_id:
                return jsonify({
                    'success': False,
                    'message': 'Email y Google ID son obligatorios'
                }), 400
            
            # Validar email
            if not self.user_model.validate_email(correo):
                return jsonify({
                    'success': False,
                    'message': 'Email no válido'
                }), 400
            
            # Buscar si el usuario ya existe por email
            existing_user = self.user_model.find_by_email(correo)
            
            if existing_user:
                # Usuario existe - verificar si ya tiene Google ID o agregarlo
                if existing_user.get('google_id') == google_id:
                    # Usuario ya autenticado con Google anteriormente
                    print(f"✅ Login exitoso para usuario existente: {correo}")
                    return jsonify({
                        'success': True,
                        'message': 'Login con Google exitoso',
                        'action': 'google_login',
                        'user': {
                            'id': str(existing_user['_id']),
                            'email': existing_user['correo'],
                            'nombre': existing_user.get('nombre', nombre),
                            'foto': existing_user.get('foto', foto),
                            'auth_method': 'google'
                        }
                    }), 200
                else:
                    # Usuario existe pero sin Google ID - vincular cuenta
                    self.user_model.collection.update_one(
                        {'_id': existing_user['_id']},
                        {
                            '$set': {
                                'google_id': google_id,
                                'nombre': nombre,
                                'foto': foto,
                                'updated_at': datetime.now()
                            }
                        }
                    )
                    
                    print(f"🔗 Cuenta vinculada con Google: {correo}")
                    return jsonify({
                        'success': True,
                        'message': 'Cuenta vinculada con Google exitosamente',
                        'action': 'google_link',
                        'user': {
                            'id': str(existing_user['_id']),
                            'email': correo,
                            'nombre': nombre,
                            'foto': foto,
                            'auth_method': 'google'
                        }
                    }), 200
            else:
                # Usuario no existe - crear nuevo usuario con Google
                user_document = {
                    'correo': correo.lower(),
                    'nombre': nombre,
                    'google_id': google_id,
                    'foto': foto,
                    'auth_method': 'google',
                    'created_at': datetime.now(),
                    'updated_at': datetime.now()
                }
                
                result = self.user_model.collection.insert_one(user_document)
                
                if result.inserted_id:
                    print(f"🆕 Nuevo usuario registrado con Google: {correo}")
                    return jsonify({
                        'success': True,
                        'message': 'Registro con Google exitoso. ¡Bienvenido a PriceShield!',
                        'action': 'google_register',
                        'user': {
                            'id': str(result.inserted_id),
                            'email': correo,
                            'nombre': nombre,
                            'foto': foto,
                            'auth_method': 'google'
                        }
                    }), 201
                else:
                    return jsonify({
                        'success': False,
                        'message': 'Error al registrar usuario con Google'
                    }), 400
                    
        except Exception as e:
            print(f"❌ Error en google_auth: {e}")
            return jsonify({
                'success': False,
                'message': 'Error interno del servidor'
            }), 500

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