from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv()

# Obtener la URI de MongoDB desde las variables de entorno
MONGODB_URI = os.getenv('MONGODB_URI')

class Database:
    """
    Clase para manejar la conexión a MongoDB
    """
    _instance = None
    _client = None
    _db = None
    
    def __new__(cls):
        """
        Patrón Singleton: asegura que solo haya una conexión a la base de datos
        """
        if cls._instance is None:
            cls._instance = super(Database, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        """
        Inicializa la conexión a MongoDB
        """
        if not self._initialized:
            try:
                self._client = MongoClient(MONGODB_URI)
                self._db = self._client['priceshield']  # Nombre de tu base de datos
                # Hacer una consulta simple para verificar la conexión
                self._client.admin.command('ping')
                print("✅ Conexión exitosa a MongoDB Atlas")
                self._initialized = True
            except Exception as e:
                print(f"❌ Error conectando a MongoDB: {e}")
                raise e
    
    def get_db(self):
        """
        Devuelve la instancia de la base de datos
        """
        return self._db
    
    def get_collection(self, collection_name):
        """
        Devuelve una colección específica de la base de datos
        """
        return self._db[collection_name]
    
    def close_connection(self):
        """
        Cierra la conexión a MongoDB
        """
        if self._client:
            self._client.close()
            print("🔒 Conexión a MongoDB cerrada")

# Crear una instancia global de la base de datos
database = Database()
db = database.get_db()