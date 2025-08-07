import bcrypt
from services.db import db
from datetime import datetime
import re

class User:
    """
    Modelo de usuario para manejar operaciones en MongoDB
    """
    
    def __init__(self):
        # Obtener la colección 'users' de MongoDB
        self.collection = db['users']
    
    def validate_email(self, email):
        """
        Validar el formato del correo electrónico.
        """
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(email_pattern, email) is not None
    
    def validate_password(self, password):
        """
        Valida que la contraseña tenga al menos 6 caracteres.
        """
        return len(password) >= 6
    
    def  hash_password(self, password):
        """
        Encripta la contraseña usando bcrypt.
        """
        #Generar un salt y hashear la contraseña
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed_password
    
    def verify_password(self, password, hashed_password):
        """
        Verifica que la contraseña proporcionada coincida con la almacenada encriptada.
        """
        return bcrypt.checkpw(password.encode('utf-8'), hashed_password)

    def find_by_email(self, email):
        """
        Busca un usuario por su correo electrónico en la base de datos.
        """
        try:
            user = self.collection.find_one({'correo': email.lower()})
            return user
        except Exception as e:
            print(f"Error al buscar usuario por correo: {e}")
            return None
        
    def create_user(self, email, password):
        """
        Crea un nuevo usuario en la base de datos.
        """
        try:
            #validar el email y la contraseña
            if not self.validate_email(email):
                return {'success': False, 'message': 'Email no válido'}
            
            if not self.validate_password(password):
                return {'success': False, 'message': 'La contraseña debe tener al menos 6 caracteres'}
            
            
            #verificar si el usuario ya existe
            if self.find_by_email(email):
                return {'success': False, 'message': 'El usuario ya esta registrado'}
            
            #crear el documento del usuario
            user_document = {
                'correo': email.lower(),
                'contraseña': self.hash_password(password),
                'created_at': datetime.now()
            }

            #Insertarlo el usuario en el MongoDB
            result = self.collection.insert_one(user_document)

            if result.inserted_id:
                return {
                    'success': True,
                    'message': 'Usuario registrado exitosamente',
                    'user_id': str(result.inserted_id)
                }
            else:
                return {'success': False, 'message': 'Error al registrar el usuario'}
            
        except Exception as e:
            print(f"Error al crear usuario: {e}")
            return {'success': False, 'message': 'Error interno del servidor'}
    
    def authenticate_user(self, email, password):
        """
        Autentica a un usuario verificando su email y contraseña.
        """
        try:

            #buscar el usuario por su email
            user = self.find_by_email(email)

            if not user:
                return {'success': False, 'message': 'Usuario no encontrado'}
            
            #verificar la contraseña
            if self.verify_password(password, user['contraseña']):
                return {
                    'success': True,
                    'message': 'Autenticación exitosa',
                    'user_id': str(user['_id']),
                    'email': user['correo']
                }
            else:
                return {'success': False, 'message': 'Contraseña incorrecta'}
        
        except Exception as e:
            print(f"Error al autenticar usuario: {e}")
            return {'success': False, 'message': 'Error interno del servidor'}
        