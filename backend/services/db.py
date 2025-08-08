from pymongo  import MongoClient #conectar el phyton y mongo
from dotenv import load_dotenv #poder leer el archivo .env
import os  #nos permite leer las variables del entorno


#cargar las variables de entorno del archivo .env
load_dotenv() #leemos el archivo .env
MONGODB_URI = os.getenv('MONGODB_URI')# os leera la variable de entorno MONGODB_URI y la guardamos en MONGODB_URI

class Database:#creamos la clase para generar conexion con el Mongo db

    """
    Clase para manejar la conexión a MongoDB
    """
    #creamos las variables de la clase...El _ significa: "Esta variable es privada, no la toques desde afuera"
    _instance = None #instancia de conexion =no existe
    _client = None #cliente para llamar al mongo =no conectado
    _db = None #base de datos especifica = no seleccionada

    def __new__(cls):#definimos si __new__ creara una nueva instancia vacia para recibir la conexion o no y cls representa la clase
        """
        Patrón Singleton: asegura que solo haya una conexión a la base de datos
        """
        if cls._instance is None: #si la instancia no existe entonces...
            cls._instance = super(Database, cls).__new__(cls)#utilizamos la variable _instance para crear el objeto en una nueva instancia de la clase Database  mediante __new__ y dejarla vacia para recibir su conexion
            cls._instance._initialized = False#indica si la instancia ha sido inicializada
        return cls._instance #usamos la instancia existente para su conexion

    def __init__(self):#self = representa el objeto específico que acabamos de crear"
        """
        Inicializa la conexión a MongoDB
        """
        if not self._initialized:#¿Este objeto todavía NO está conectado?
            try:
                self._client = MongoClient(MONGODB_URI)#guardamos la llamada en el objeto =conectamos con el mongo
                self._db = self._client['priceshield']  # Nombre de tu base de datos
                # Hacer una consulta simple para verificar la conexión
                self._client.admin.command('ping')#verificamos si la conexion es exitosa
                print("✅ Conexión exitosa a MongoDB Atlas")
                self._initialized = True
            except Exception as e:
                print(f"❌ Error conectando a MongoDB: {e}")
                raise e

    def get_db(self):#get_db() = "Dame acceso a la base de datos de mi objeto"
        """
        Devuelve la instancia de la base de datos
        """
        return self._db

    def get_collection(self, collection_name):#get_collection() = "Dame acceso a su colección de la base de datos de mi objeto"
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
database = Database() #Crea LA conexión (singleton)
db = database.get_db() # Obtiene la base de datos para usar en otros