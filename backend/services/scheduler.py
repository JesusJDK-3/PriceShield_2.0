import schedule
import time
import threading
from datetime import datetime
from services.api_scraper import supermarket_api
from models.product_model import product_model

class DatabaseScheduler:
    """
    Servicio para programar actualizaciones automáticas de la base de datos
    """
    
    def __init__(self):
        self.is_running = False
        self.scheduler_thread = None
        
        # Términos populares para actualizar automáticamente
        self.popular_terms = [
            # ALIMENTOS BÁSICOS
            "leche", "arroz", "aceite", "azúcar", "sal", "pan", "huevos",
            "pollo", "carne", "pescado", "tomate", "cebolla", "papa",
            "yogurt", "queso", "mantequilla", "atún", "pasta", "fideos",
            
            # LIMPIEZA Y HOGAR
            "detergente", "jabón", "shampoo", "papel higiénico", "suavizante",
            "desinfectante", "cloro", "esponja", "bolsas basura", "servilletas",
            
            # SNACKS Y DULCES
            "galletas", "cereales", "chocolate", "caramelos", "papas fritas",
            "helados", "tortas", "pasteles", "chicles",
            
            # BEBIDAS
            "agua", "gaseosa", "cerveza", "vino", "jugo", "café", "té",
            "energizante", "isotónico",
            
            # FRUTAS Y VERDURAS
            "limón", "plátano", "manzana", "naranja", "zanahoria", "lechuga",
            "brócoli", "apio", "palta", "fresa", "uva", "piña",
            
            # CUIDADO PERSONAL
            "crema", "perfume", "desodorante", "pasta dental", "cepillo",
            "protector solar", "vitaminas", "medicamentos",
            
            # HOGAR Y DECORACIÓN
            "vela", "plantas", "macetas", "cuadros", "almohadas", "toallas",
            
            # TECNOLOGÍA Y ELECTRÓNICOS
            "cable", "cargador", "audífono", "batería", "bombilla",
            
            # MASCOTAS
            "comida perro", "comida gato", "arena gato", "juguete mascota",
            
            # ROPA Y ACCESORIOS
            "medias", "ropa interior", "pijama", "zapatos", "cartera"
        ]
    
    def start_scheduler(self):
        """
        Inicia el programador de tareas
        """
        if self.is_running:
            print("⚠️ El programador ya está ejecutándose")
            return
        
        # Programar actualización diaria a las 2:00 AM
        schedule.every().day.at("02:00").do(self.daily_database_update)
        
        # Programar limpieza semanal los domingos a las 3:00 AM
        schedule.every().sunday.at("03:00").do(self.weekly_cleanup)
        
        # Iniciar thread del programador
        self.is_running = True
        self.scheduler_thread = threading.Thread(target=self._run_scheduler)
        self.scheduler_thread.daemon = True
        self.scheduler_thread.start()
        
        print("✅ Programador de tareas iniciado")
        print("   - Actualización diaria: 02:00 AM")
        print("   - Limpieza semanal: Domingos 03:00 AM")
    
    def stop_scheduler(self):
        """
        Detiene el programador de tareas
        """
        self.is_running = False
        schedule.clear()
        print("🛑 Programador de tareas detenido")
    
    def _run_scheduler(self):
        """
        Ejecuta el loop del programador
        """
        while self.is_running:
            schedule.run_pending()
            time.sleep(60)  # Verificar cada minuto
    
    def daily_database_update(self):
        """
        Actualización diaria de la base de datos
        """
        try:
            print("🌅 Iniciando actualización diaria de la base de datos...")
            start_time = datetime.now()
            
            total_saved = 0
            total_updated = 0
            total_errors = 0
            
            # Procesar cada término popular
            for i, term in enumerate(self.popular_terms):
                try:
                    print(f"🔍 Procesando {i+1}/{len(self.popular_terms)}: {term}")
                    
                    # Buscar productos
                    products_data = supermarket_api.search_products(
                        query=term,
                        limit=20
                    )
                    
                    # Guardar en base de datos
                    save_result = product_model.save_products(products_data, term)
                    
                    if save_result["success"]:
                        total_saved += save_result["saved_count"]
                        total_updated += save_result["updated_count"]
                        print(f"   ✅ {save_result['saved_count']} nuevos, {save_result['updated_count']} actualizados")
                    else:
                        total_errors += 1
                        print(f"   ❌ Error guardando productos para '{term}'")
                    
                    # Pausa entre términos
                    time.sleep(3)
                    
                except Exception as e:
                    total_errors += 1
                    print(f"   ❌ Error procesando '{term}': {e}")
                    continue
            
            # Actualizar timestamp
            product_model.update_last_database_update()
            
            # Calcular tiempo total
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds() / 60
            
            # Log de resumen
            print("✅ Actualización diaria completada:")
            print(f"   - Duración: {duration:.1f} minutos")
            print(f"   - Productos nuevos: {total_saved}")
            print(f"   - Productos actualizados: {total_updated}")
            print(f"   - Errores: {total_errors}")
            print(f"   - Términos procesados: {len(self.popular_terms)}")
            
            # Guardar estadísticas de la actualización
            self._save_update_stats(
                duration, total_saved, total_updated, total_errors
            )
            
        except Exception as e:
            print(f"❌ Error en actualización diaria: {e}")
    
    def weekly_cleanup(self):
        """
        Limpieza semanal de datos antiguos
        """
        try:
            print("🧹 Iniciando limpieza semanal...")
            
            # Limpiar productos muy antiguos (más de 15 días)
            deleted_products = product_model.clean_old_products(days_old=15)
            
            # Limpiar historial de búsquedas muy antiguo (más de 30 días)
            from datetime import timedelta
            cutoff_date = datetime.now() - timedelta(days=30)
            
            deleted_searches = product_model.search_history_collection.delete_many({
                "timestamp": {"$lt": cutoff_date.isoformat()}
            }).deleted_count
            
            # Limpiar historial de precios muy antiguo (más de 45 días)
            deleted_prices = product_model.price_history_collection.delete_many({
                "timestamp": {"$lt": (datetime.now() - timedelta(days=45)).isoformat()}
            }).deleted_count
            
            print("✅ Limpieza semanal completada:")
            print(f"   - Productos eliminados: {deleted_products}")
            print(f"   - Búsquedas eliminadas: {deleted_searches}")
            print(f"   - Precios eliminados: {deleted_prices}")
            
        except Exception as e:
            print(f"❌ Error en limpieza semanal: {e}")
    
    def _save_update_stats(self, duration, saved, updated, errors):
        """
        Guarda estadísticas de la actualización
        """
        try:
            from services.db import db
            stats_collection = db['update_statistics']
            
            stats_doc = {
                "timestamp": datetime.now().isoformat(),
                "date": datetime.now().date().isoformat(),
                "duration_minutes": round(duration, 1),
                "products_saved": saved,
                "products_updated": updated,
                "errors": errors,
                "terms_processed": len(self.popular_terms),
                "update_type": "daily_automatic"
            }
            
            stats_collection.insert_one(stats_doc)
            
        except Exception as e:
            print(f"Error guardando estadísticas: {e}")
    
    def force_update_now(self):
        """
        Fuerza una actualización inmediata (para testing)
        """
        print("🔄 Forzando actualización inmediata...")
        thread = threading.Thread(target=self.daily_database_update)
        thread.daemon = True
        thread.start()
        return "Actualización iniciada en segundo plano"

# Crear instancia global
database_scheduler = DatabaseScheduler()