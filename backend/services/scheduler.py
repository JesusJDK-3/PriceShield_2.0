import schedule
import time
import threading
from datetime import datetime
from services.api_scraper import supermarket_api
from models.product_model import product_model

class DatabaseScheduler:
    """
    VERSIÓN HÍBRIDA: Mantiene funcionalidad original + Agrega historial de precios
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

        # Programar actualización diaria a las 20:40 (para testing)
        schedule.every().day.at("20:40").do(self.daily_database_update_with_history)
        
        # Iniciar thread del programador
        self.is_running = True
        self.scheduler_thread = threading.Thread(target=self._run_scheduler)
        self.scheduler_thread.daemon = True
        self.scheduler_thread.start()
        
        print("✅ Programador de tareas iniciado")
        print("   - Actualización diaria: 05:00 (testing)")
    
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
        MÉTODO ORIGINAL QUE FUNCIONABA - Sin modificar
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
                        limit=100
                    )
                    
                    # Guardar en base de datos (MÉTODO ORIGINAL)
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

    def daily_database_update_with_history(self):
        """
        NUEVA VERSIÓN: Actualización diaria + creación de historial de precios
        """
        try:
            print("🌅 Iniciando actualización diaria CON HISTORIAL...")
            start_time = datetime.now()
            
            total_saved = 0
            total_updated = 0
            total_errors = 0
            total_price_changes = 0
            total_alerts_created = 0
            
            # Procesar cada término popular
            for i, term in enumerate(self.popular_terms):
                try:
                    print(f"🔍 Procesando {i+1}/{len(self.popular_terms)}: {term}")
                    
                    # 1. PASO 1: Actualización normal (que sabemos que funciona)
                    products_data = supermarket_api.search_products(query=term, limit=100)
                    
                    if not products_data:
                        print(f"   ⚠️ No se encontraron productos para '{term}'")
                        continue
                    
                    # Guardar usando el método original
                    save_result = product_model.save_products(products_data, term)
                    
                    if save_result["success"]:
                        total_saved += save_result["saved_count"]
                        total_updated += save_result["updated_count"]
                        print(f"   ✅ Guardado: {save_result['saved_count']} nuevos, {save_result['updated_count']} actualizados")
                        
                        # 2. PASO 2: Crear historial de precios DESPUÉS del guardado exitoso
                        history_result = self._create_price_history_for_term(products_data, term)
                        total_price_changes += history_result['price_changes']
                        total_alerts_created += history_result['alerts_created']
                        
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
            
            # Log de resumen AMPLIADO
            print("✅ Actualización diaria CON HISTORIAL completada:")
            print(f"   - Duración: {duration:.1f} minutos")
            print(f"   - Productos nuevos: {total_saved}")
            print(f"   - Productos actualizados: {total_updated}")
            print(f"   - Cambios de precio detectados: {total_price_changes}")
            print(f"   - Alertas creadas: {total_alerts_created}")
            print(f"   - Errores: {total_errors}")
            print(f"   - Términos procesados: {len(self.popular_terms)}")
            
            # Guardar estadísticas ampliadas
            self._save_update_stats_extended(
                duration, total_saved, total_updated, total_errors,
                total_price_changes, total_alerts_created
            )
            
        except Exception as e:
            print(f"❌ Error en actualización con historial: {e}")

    def _create_price_history_for_term(self, products_data, term):
        """
        NUEVO: Crea historial de precios para productos de un término
        Se ejecuta DESPUÉS de que save_products() haya funcionado
        """
        result = {
            'price_changes': 0,
            'alerts_created': 0
        }
        
        try:
            # Extraer productos de la estructura de respuesta
            all_products = []
            
            if isinstance(products_data, dict):
                # Si es diccionario por supermercados
                for supermarket_key, supermarket_data in products_data.items():
                    if isinstance(supermarket_data, dict) and supermarket_data.get("success"):
                        products = supermarket_data.get("products", [])
                        if products:
                            all_products.extend(products)
            elif isinstance(products_data, list):
                # Si es lista directa
                all_products = products_data
            
            if not all_products:
                return result
            
            print(f"     🔍 Verificando historial para {len(all_products)} productos")
            
            # Procesar cada producto para historial
            for product in all_products:
                try:
                    if not product or not product.get("unique_id"):
                        continue
                    
                    # Obtener producto existente de la DB
                    existing = product_model.get_product_by_unique_id(product.get("unique_id"))
                    
                    if not existing:
                        continue  # Es producto nuevo, no hay historial que crear
                    
                    # Comparar precios
                    old_price = float(existing.get("price", 0))
                    new_price = float(product.get("price", 0))
                    
                    if old_price > 0 and new_price > 0 and old_price != new_price:
                        # HAY CAMBIO DE PRECIO
                        print(f"     📊 Cambio detectado: {product.get('name')} S/{old_price:.2f} → S/{new_price:.2f}")
                        
                        # Crear entrada en historial
                        if self._save_price_history_entry(product, old_price, new_price):
                            result['price_changes'] += 1
                            
                            # Intentar crear alerta si el cambio es significativo
                            if self._try_create_alert(product, old_price, new_price):
                                result['alerts_created'] += 1
                
                except Exception as e:
                    print(f"     ⚠️ Error procesando producto para historial: {e}")
                    continue
            
            if result['price_changes'] > 0:
                print(f"     ✅ Historial: {result['price_changes']} cambios, {result['alerts_created']} alertas")
            
            return result
            
        except Exception as e:
            print(f"   ❌ Error creando historial para '{term}': {e}")
            return result

    def _save_price_history_entry(self, product, old_price, new_price):
        """Guarda entrada en historial de precios"""
        try:
            price_history_entry = {
                "product_unique_id": product["unique_id"],
                "product_name": product.get("name", "Producto desconocido"),
                "old_price": old_price,
                "new_price": new_price,
                "price_difference": round(new_price - old_price, 2),
                "percentage_change": round(((new_price - old_price) / old_price) * 100, 1),
                "supermarket": product.get("supermarket"),
                "supermarket_key": product.get("supermarket_key"),
                "timestamp": datetime.now().isoformat(),
                "source": "scheduled_update"
            }
            
            product_model.price_history_collection.insert_one(price_history_entry)
            return True
            
        except Exception as e:
            print(f"     ❌ Error guardando historial: {e}")
            return False

    def _try_create_alert(self, product, old_price, new_price):
        """Intenta crear alerta si el cambio es significativo"""
        try:
            # Calcular cambio porcentual
            percentage_change = abs((new_price - old_price) / old_price * 100)
            absolute_change = abs(new_price - old_price)
            
            # Solo crear alerta si es significativo
            if percentage_change >= 5.0 and absolute_change >= 0.50:
                from models.alert_model import alert_model
                
                alert_id = alert_model.create_price_change_alert(product, old_price, new_price)
                
                if alert_id:
                    return True
            
            return False
            
        except Exception as e:
            print(f"     ⚠️ Error creando alerta: {e}")
            return False
    
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
            
            # Limpiar alertas muy antiguas (más de 30 días)
            deleted_alerts = 0
            try:
                from models.alert_model import alert_model
                deleted_alerts = alert_model.cleanup_old_alerts(days_old=30)
            except Exception as e:
                print(f"   ⚠️ Error limpiando alertas: {e}")
            
            print("✅ Limpieza semanal completada:")
            print(f"   - Productos eliminados: {deleted_products}")
            print(f"   - Búsquedas eliminadas: {deleted_searches}")
            print(f"   - Precios eliminados: {deleted_prices}")
            print(f"   - Alertas eliminadas: {deleted_alerts}")
            
        except Exception as e:
            print(f"❌ Error en limpieza semanal: {e}")
    
    def _save_update_stats(self, duration, saved, updated, errors):
        """
        Guarda estadísticas básicas de la actualización (versión original)
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

    def _save_update_stats_extended(self, duration, saved, updated, errors, price_changes=0, alerts_created=0):
        """
        Guarda estadísticas ampliadas incluyendo historial y alertas
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
                "price_changes_detected": price_changes,
                "alerts_created": alerts_created,
                "errors": errors,
                "terms_processed": len(self.popular_terms),
                "update_type": "daily_automatic_with_history",
                "efficiency": {
                    "products_per_minute": round((saved + updated) / max(duration, 1), 1),
                    "success_rate": round((saved + updated) / max(saved + updated + errors, 1) * 100, 1),
                    "alert_creation_rate": round(alerts_created / max(price_changes, 1) * 100, 1) if price_changes > 0 else 0
                }
            }
            
            stats_collection.insert_one(stats_doc)
            print(f"   📊 Estadísticas guardadas")
            
        except Exception as e:
            print(f"Error guardando estadísticas ampliadas: {e}")
    
    def force_update_now(self):
        """
        Fuerza una actualización inmediata (para testing)
        """
        print("🔄 Forzando actualización inmediata...")
        thread = threading.Thread(target=self.daily_database_update_with_history)
        thread.daemon = True
        thread.start()
        return "Actualización con historial iniciada en segundo plano"

    def force_update_original(self):
        """
        Fuerza actualización con el método original (sin historial)
        """
        print("🔄 Forzando actualización ORIGINAL...")
        thread = threading.Thread(target=self.daily_database_update)
        thread.daemon = True
        thread.start()
        return "Actualización original iniciada"

    def test_single_term_with_history(self, term="leche"):
        """
        Prueba un término con creación de historial
        """
        try:
            print(f"🧪 Probando '{term}' con historial...")
            
            # Obtener productos
            products_data = supermarket_api.search_products(query=term, limit=10)
            
            if not products_data:
                print("❌ No se obtuvieron productos")
                return {"success": False, "message": "Sin productos"}
            
            # Guardar usando método original
            save_result = product_model.save_products(products_data, term)
            print(f"📦 Guardado: {save_result}")
            
            # Crear historial
            history_result = self._create_price_history_for_term(products_data, term)
            print(f"📊 Historial: {history_result}")
            
            return {
                "success": True,
                "save_result": save_result,
                "history_result": history_result
            }
            
        except Exception as e:
            print(f"❌ Error en prueba: {e}")
            return {"success": False, "error": str(e)}

# Crear instancia global
database_scheduler = DatabaseScheduler()