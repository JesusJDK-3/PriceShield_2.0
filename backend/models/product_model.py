from services.db import db
from datetime import datetime, timedelta
import re

class Product:
    """
    Modelo para manejar productos en la base de datos
    """
    
    def __init__(self):
        # Colecciones de MongoDB
        self.products_collection = db['products']  # Productos actuales
        self.search_history_collection = db['search_history']  # Historial de búsquedas
        self.price_history_collection = db['price_history']  # Historial de precios
    
    def save_products(self, products_data, search_query):
        """
        Guarda productos obtenidos de las APIs en la base de datos
        
        Args:
            products_data (dict): Datos de productos por supermercado
            search_query (str): Término de búsqueda utilizado
            
        Returns:
            dict: Resultado de la operación
        """
        try:
            saved_count = 0
            updated_count = 0
            
            # Recorrer productos de cada supermercado
            for supermarket_key, supermarket_data in products_data.items():
                if supermarket_data.get("success") and supermarket_data.get("products"):
                    
                    for product in supermarket_data["products"]:
                        # Crear identificador único del producto
                        unique_id = self._generate_product_id(product)
                        
                        # Buscar si el producto ya existe
                        existing_product = self.products_collection.find_one({
                            "unique_id": unique_id
                        })
                        
                        if existing_product:
                            # Actualizar producto existente
                            updated_product = self._update_existing_product(existing_product, product)
                            if updated_product:
                                updated_count += 1
                        else:
                            # Guardar nuevo producto
                            new_product = self._create_new_product(product, unique_id, search_query)
                            if new_product:
                                saved_count += 1
            
            # Guardar en historial de búsquedas
            self._save_search_history(search_query, saved_count + updated_count)
            
            return {
                "success": True,
                "saved_count": saved_count,
                "updated_count": updated_count,
                "total_processed": saved_count + updated_count
            }
            
        except Exception as e:
            print(f"Error guardando productos: {e}")
            return {
                "success": False,
                "error": str(e),
                "saved_count": 0,
                "updated_count": 0
            }
    
    def search_saved_products(self, query, supermarket=None, limit=50, sort_by="price"):
        """
        Busca productos guardados en la base de datos con búsqueda mejorada
        
        Args:
            query (str): Término de búsqueda
            supermarket (str): Filtrar por supermercado específico
            limit (int): Límite de resultados
            sort_by (str): Campo para ordenar (price, name, scraped_at)
            
        Returns:
            list: Lista de productos encontrados
        """
        try:
            # 🔧 BÚSQUEDA MEJORADA: Múltiples niveles de coincidencia
            query_clean = query.strip().lower()
            
            # NIVEL 1: Coincidencia exacta (prioridad más alta)
            exact_filter = {
                "name": {"$regex": f"^{re.escape(query_clean)}$", "$options": "i"}
            }
            
            # NIVEL 2: Coincidencia al inicio del nombre
            starts_with_filter = {
                "name": {"$regex": f"^{re.escape(query_clean)}", "$options": "i"}
            }
            
            # NIVEL 3: Coincidencia de palabra completa
            word_boundary_filter = {
                "$or": [
                    {"name": {"$regex": f"\\b{re.escape(query_clean)}\\b", "$options": "i"}},
                    {"brand": {"$regex": f"\\b{re.escape(query_clean)}\\b", "$options": "i"}}
                ]
            }
            
            # NIVEL 4: Coincidencia con todas las palabras del query
            query_words = [word for word in query_clean.split() if len(word) >= 2]
            if len(query_words) > 1:
                all_words_filter = {
                    "$and": [
                        {"name": {"$regex": f"\\b{re.escape(word)}", "$options": "i"}}
                        for word in query_words
                    ]
                }
            else:
                all_words_filter = None
            
            # NIVEL 5: Coincidencia flexible (solo si query > 3 caracteres)
            flexible_filter = None
            if len(query_clean) > 3:
                flexible_filter = {
                    "$or": [
                        {"name": {"$regex": query_clean, "$options": "i"}},
                        {"brand": {"$regex": query_clean, "$options": "i"}},
                        {"description": {"$regex": query_clean, "$options": "i"}}
                    ]
                }
            
            # Aplicar filtro de supermercado si se especifica
            def add_supermarket_filter(base_filter):
                if supermarket:
                    return {"$and": [base_filter, {"supermarket_key": supermarket}]}
                return base_filter
            
            # Definir orden
            sort_options = {
                "price": [("price", 1)],  # Precio ascendente
                "price_desc": [("price", -1)],  # Precio descendente
                "name": [("name", 1)],  # Nombre A-Z
                "scraped_at": [("scraped_at", -1)]  # Más recientes primero
            }
            
            sort_order = sort_options.get(sort_by, [("price", 1)])
            
            # 🎯 BÚSQUEDA POR NIVELES CON PUNTUACIÓN
            all_products = []
            seen_ids = set()
            
            # NIVEL 1: Coincidencia exacta (score: 100)
            exact_products = list(self.products_collection.find(
                add_supermarket_filter(exact_filter)
            ).sort(sort_order))
            
            for product in exact_products:
                if str(product["_id"]) not in seen_ids:
                    product["_id"] = str(product["_id"])
                    product["search_score"] = 100
                    all_products.append(product)
                    seen_ids.add(str(product["_id"]))
            
            # NIVEL 2: Coincidencia al inicio (score: 90)
            if len(all_products) < limit:
                starts_products = list(self.products_collection.find(
                    add_supermarket_filter(starts_with_filter)
                ).sort(sort_order))
                
                for product in starts_products:
                    if str(product["_id"]) not in seen_ids:
                        product["_id"] = str(product["_id"])
                        product["search_score"] = 90
                        all_products.append(product)
                        seen_ids.add(str(product["_id"]))
            
            # NIVEL 3: Palabra completa (score: 80)
            if len(all_products) < limit:
                word_products = list(self.products_collection.find(
                    add_supermarket_filter(word_boundary_filter)
                ).sort(sort_order))
                
                for product in word_products:
                    if str(product["_id"]) not in seen_ids:
                        product["_id"] = str(product["_id"])
                        product["search_score"] = 80
                        all_products.append(product)
                        seen_ids.add(str(product["_id"]))
            
            # NIVEL 4: Todas las palabras (score: 70)
            if len(all_products) < limit and all_words_filter:
                all_words_products = list(self.products_collection.find(
                    add_supermarket_filter(all_words_filter)
                ).sort(sort_order))
                
                for product in all_words_products:
                    if str(product["_id"]) not in seen_ids:
                        product["_id"] = str(product["_id"])
                        product["search_score"] = 70
                        all_products.append(product)
                        seen_ids.add(str(product["_id"]))
            
            # NIVEL 5: Coincidencia flexible solo si no hay suficientes resultados (score: 50)
            if len(all_products) < limit // 2 and flexible_filter:
                flexible_products = list(self.products_collection.find(
                    add_supermarket_filter(flexible_filter)
                ).sort(sort_order))
                
                for product in flexible_products:
                    if str(product["_id"]) not in seen_ids:
                        product["_id"] = str(product["_id"])
                        product["search_score"] = 50
                        all_products.append(product)
                        seen_ids.add(str(product["_id"]))
            
            # 🔧 FILTRADO ADICIONAL: Eliminar falsos positivos
            filtered_products = []
            for product in all_products:
                product_name = product.get("name", "").lower()
                
                # Verificar que el query esté realmente relacionado
                if self._is_relevant_match(query_clean, product_name):
                    filtered_products.append(product)
            
            # Ordenar por score y luego por criterio seleccionado
            filtered_products.sort(key=lambda x: (-x.get("search_score", 0), x.get("price", 0)))
            
            # Limitar resultados
            return filtered_products[:limit]
            
        except Exception as e:
            print(f"Error buscando productos: {e}")
            return []
    
    def _is_relevant_match(self, query, product_name):
        """
        Verifica si el producto es realmente relevante para la búsqueda
        Previene falsos positivos como "papa" al buscar "papaya"
        """
        try:
            query = query.lower().strip()
            product_name = product_name.lower().strip()
            
            # Si el query está al inicio del nombre del producto, es relevante
            if product_name.startswith(query):
                return True
            
            # Si el query es una palabra completa dentro del nombre
            if f" {query} " in f" {product_name} " or f" {query}" in f" {product_name}":
                return True
            
            # Para queries multi-palabra, verificar que al menos el 60% de las palabras coincidan
            query_words = [w for w in query.split() if len(w) >= 2]
            if len(query_words) > 1:
                matching_words = 0
                for word in query_words:
                    if f" {word}" in f" {product_name}" or f"{word} " in f"{product_name} ":
                        matching_words += 1
                
                relevance_ratio = matching_words / len(query_words)
                return relevance_ratio >= 0.6
            
            # Para queries cortos (< 4 caracteres), ser más estricto
            if len(query) < 4:
                # Solo permitir si está al inicio o es palabra completa
                return (product_name.startswith(query) or 
                       f" {query} " in f" {product_name} " or
                       f" {query}" in f" {product_name}")
            
            # Para queries largos, permitir coincidencias parciales más flexibles
            if len(query) >= 4:
                # Verificar que al menos el 80% del query esté presente
                common_chars = sum(1 for c in query if c in product_name)
                return (common_chars / len(query)) >= 0.8
            
            return False
            
        except Exception as e:
            print(f"Error verificando relevancia: {e}")
            return True  # En caso de error, permitir la coincidencia
    
    def get_price_comparison(self, product_name, days_back=7):
        """
        Obtiene comparación de precios de un producto entre supermercados
        
        Args:
            product_name (str): Nombre del producto a comparar
            days_back (int): Días hacia atrás para buscar
            
        Returns:
            dict: Comparación de precios por supermercado
        """
        try:
            # Fecha límite
            date_limit = datetime.now() - timedelta(days=days_back)
            
            # Buscar productos similares
            products = list(self.products_collection.find({
                "name": {"$regex": product_name, "$options": "i"},
                "scraped_at": {"$gte": date_limit.isoformat()}
            }))
            
            # Agrupar por supermercado
            comparison = {}
            for product in products:
                supermarket = product.get("supermarket_key", "unknown")
                
                if supermarket not in comparison:
                    comparison[supermarket] = {
                        "supermarket_name": product.get("supermarket", "Desconocido"),
                        "products": [],
                        "min_price": float('inf'),
                        "max_price": 0,
                        "avg_price": 0
                    }
                
                price = product.get("price", 0)
                if price > 0:
                    comparison[supermarket]["products"].append({
                        "name": product.get("name"),
                        "price": price,
                        "url": product.get("url"),
                        "scraped_at": product.get("scraped_at")
                    })
                    
                    # Actualizar estadísticas
                    if price < comparison[supermarket]["min_price"]:
                        comparison[supermarket]["min_price"] = price
                    if price > comparison[supermarket]["max_price"]:
                        comparison[supermarket]["max_price"] = price
            
            # Calcular promedios
            for supermarket in comparison:
                products_list = comparison[supermarket]["products"]
                if products_list:
                    total_price = sum(p["price"] for p in products_list)
                    comparison[supermarket]["avg_price"] = round(total_price / len(products_list), 2)
                    
                    # Corregir infinito en min_price
                    if comparison[supermarket]["min_price"] == float('inf'):
                        comparison[supermarket]["min_price"] = 0
            
            return comparison
            
        except Exception as e:
            print(f"Error en comparación de precios: {e}")
            return {}
    
    def get_popular_searches(self, limit=10):
        """
        Obtiene las búsquedas más populares
        
        Args:
            limit (int): Número de búsquedas a devolver
            
        Returns:
            list: Lista de búsquedas populares
        """
        try:
            pipeline = [
                {
                    "$group": {
                        "_id": "$search_query",
                        "search_count": {"$sum": "$search_count"},
                        "last_search": {"$max": "$timestamp"},
                        "total_results": {"$sum": "$results_count"}
                    }
                },
                {
                    "$sort": {"search_count": -1}
                },
                {
                    "$limit": limit
                }
            ]
            
            popular_searches = list(self.search_history_collection.aggregate(pipeline))
            
            # Formatear resultados
            formatted_searches = []
            for search in popular_searches:
                formatted_searches.append({
                    "query": search["_id"],
                    "search_count": search["search_count"],
                    "last_search": search["last_search"],
                    "total_results": search["total_results"]
                })
            
            return formatted_searches
            
        except Exception as e:
            print(f"Error obteniendo búsquedas populares: {e}")
            return []
    
    def _generate_product_id(self, product):
        """
        Genera un ID único MÁS ESTABLE basado solo en nombre y supermercado
        Ignora el product_id de la API que puede cambiar
        """
        name = product.get("name", "").lower()
        supermarket = product.get("supermarket_key", "")
        
        # Limpiar nombre más agresivamente para evitar variaciones
        clean_name = re.sub(r'[^a-z0-9\s]', '', name)
        clean_name = re.sub(r'\s+', '_', clean_name.strip())
        
        # 🔧 CAMBIO: No usar product_id, solo nombre + supermercado
        # Esto hace el ID más estable entre diferentes scraping
        return f"{supermarket}_{clean_name}"

    def _is_duplicate_product(self, product1, product2):
        """
        Verifica si dos productos son realmente el mismo
        Útil para detectar duplicados antes de guardar
        """
        # Normalizar nombres para comparación
        name1 = re.sub(r'[^a-z0-9\s]', '', product1.get("name", "").lower())
        name2 = re.sub(r'[^a-z0-9\s]', '', product2.get("name", "").lower())
        
        # Son duplicados si:
        # 1. Mismo supermercado Y mismo nombre normalizado
        same_supermarket = product1.get("supermarket_key") == product2.get("supermarket_key")
        same_name = name1 == name2
        
        # 2. O si los nombres son 95% similares (para variaciones menores)
        similarity_ratio = len(set(name1.split()) & set(name2.split())) / max(len(name1.split()), len(name2.split()))
        very_similar = similarity_ratio >= 0.95
        
        return same_supermarket and (same_name or very_similar)
    
    # Ejecutar ESTE código para limpiar duplicados existentes:
    def clean_duplicate_products(self):
        pipeline = [
            {
                "$group": {
                    "_id": {
                        "name": "$name",
                        "supermarket_key": "$supermarket_key", 
                        "price": "$price"
                    },
                    "duplicates": {"$push": "$_id"},
                    "count": {"$sum": 1}
                }
            },
            {
                "$match": {"count": {"$gt": 1}}
            }
        ]
        
        duplicates = list(self.products_collection.aggregate(pipeline))
        deleted_count = 0
        
        for group in duplicates:
            # Mantener el más reciente, eliminar los demás
            ids_to_delete = group["duplicates"][:-1]  
            result = self.products_collection.delete_many({
                "_id": {"$in": ids_to_delete}
            })
            deleted_count += result.deleted_count
        
        print(f"🧹 Eliminados {deleted_count} productos duplicados")
        return deleted_count

    def _create_new_product(self, product, unique_id, search_query):
        """
        Crea un nuevo producto en la base de datos
        """
        try:
            product_doc = {
                "unique_id": unique_id,
                "name": product.get("name"),
                "brand": product.get("brand"),
                "description": product.get("description"),
                "supermarket": product.get("supermarket"),
                "supermarket_key": product.get("supermarket_key"),
                "price": product.get("price", 0),
                "original_price": product.get("original_price", 0),
                "discount_percentage": product.get("discount_percentage", 0),
                "currency": product.get("currency", "PEN"),
                "images": product.get("images", []),
                "categories": product.get("categories", []),
                "url": product.get("url"),
                "available": product.get("available", False),
                "scraped_at": product.get("scraped_at"),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "search_queries": [search_query]  # Términos que lo encontraron
            }
            
            result = self.products_collection.insert_one(product_doc)
            
            # Guardar historial de precios
            self._save_price_history(unique_id, product.get("price", 0))
            
            return result.inserted_id
            
        except Exception as e:
            print(f"Error creando producto: {e}")
            return None
    
    def _update_existing_product(self, existing_product, new_product):
        """
        Actualiza un producto existente con nueva información
        """
        try:
            unique_id = existing_product["unique_id"]
            old_price = existing_product.get("price", 0)
            new_price = new_product.get("price", 0)
            
            # Actualizar campos
            update_doc = {
                "$set": {
                    "price": new_price,
                    "original_price": new_product.get("original_price", 0),
                    "discount_percentage": new_product.get("discount_percentage", 0),
                    "available": new_product.get("available", False),
                    "scraped_at": new_product.get("scraped_at"),
                    "updated_at": datetime.now().isoformat()
                },
                "$addToSet": {
                    "search_queries": {"$each": []}  # Se puede agregar query específico
                }
            }
            
            result = self.products_collection.update_one(
                {"unique_id": unique_id},
                update_doc
            )
            
            # Si el precio cambió, guardar en historial
            if old_price != new_price and new_price > 0:
                self._save_price_history(unique_id, new_price)
            
            return result.modified_count > 0
            
        except Exception as e:
            print(f"Error actualizando producto: {e}")
            return False
    
    def _save_search_history(self, search_query, results_count):
        """
        Guarda el historial de búsquedas
        """
        try:
            search_doc = {
                "search_query": search_query.lower(),
                "timestamp": datetime.now().isoformat(),
                "results_count": results_count,
                "search_count": 1
            }
            
            # Verificar si ya existe una búsqueda similar hoy
            today = datetime.now().date()
            existing_search = self.search_history_collection.find_one({
                "search_query": search_query.lower(),
                "timestamp": {
                    "$gte": today.isoformat(),
                    "$lt": (today + timedelta(days=1)).isoformat()
                }
            })
            
            if existing_search:
                # Incrementar contador
                self.search_history_collection.update_one(
                    {"_id": existing_search["_id"]},
                    {
                        "$inc": {"search_count": 1},
                        "$set": {"timestamp": datetime.now().isoformat()}
                    }
                )
            else:
                # Crear nueva entrada
                self.search_history_collection.insert_one(search_doc)
                
        except Exception as e:
            print(f"Error guardando historial de búsqueda: {e}")
    
    def _save_price_history(self, product_unique_id, price):
        """
        Guarda el historial de precios de un producto
        """
        try:
            price_doc = {
                "product_unique_id": product_unique_id,
                "price": price,
                "timestamp": datetime.now().isoformat(),
                "date": datetime.now().date().isoformat()
            }
            
            self.price_history_collection.insert_one(price_doc)
            
        except Exception as e:
            print(f"Error guardando historial de precios: {e}")

    # Agregar estos métodos a la clase Product

    def get_all_products(self, page=1, limit=50, sort_by="scraped_at", supermarket=None):
        """
        Obtiene todos los productos guardados con paginación
        """
        try:
            # Construir filtro
            filter_query = {}
            if supermarket:
                filter_query["supermarket_key"] = supermarket
            
            # Definir orden
            sort_options = {
                "price": [("price", 1)],
                "price_desc": [("price", -1)],
                "name": [("name", 1)],
                "scraped_at": [("scraped_at", -1)],
                "updated_at": [("updated_at", -1)]
            }
            
            sort_order = sort_options.get(sort_by, [("scraped_at", -1)])
            
            # Calcular skip para paginación
            skip = (page - 1) * limit
            
            # Realizar consulta
            products = list(self.products_collection.find(
                filter_query
            ).sort(sort_order).skip(skip).limit(limit))
            
            # Limpiar el campo _id para JSON
            for product in products:
                product["_id"] = str(product["_id"])
            
            return products
            
        except Exception as e:
            print(f"Error obteniendo todos los productos: {e}")
            return []

    def get_total_products_count(self, supermarket=None):
        """
        Obtiene el total de productos en la base de datos
        """
        try:
            filter_query = {}
            if supermarket:
                filter_query["supermarket_key"] = supermarket
                
            return self.products_collection.count_documents(filter_query)
            
        except Exception as e:
            print(f"Error contando productos: {e}")
            return 0

    def get_last_database_update(self):
        """
        Obtiene la fecha de la última actualización de la base de datos
        """
        try:
            # Buscar en una colección de metadatos o usar el producto más reciente
            latest_product = self.products_collection.find_one(
                {},
                sort=[("updated_at", -1)]
            )
            
            if latest_product and latest_product.get("updated_at"):
                return datetime.fromisoformat(latest_product["updated_at"])
            
            return None
            
        except Exception as e:
            print(f"Error obteniendo última actualización: {e}")
            return None

    def update_last_database_update(self):
        """
        Actualiza el timestamp de la última actualización
        """
        try:
            # Crear o actualizar documento de metadatos
            metadata_collection = db['app_metadata']
            
            metadata_collection.update_one(
                {"key": "last_database_update"},
                {
                    "$set": {
                        "key": "last_database_update",
                        "timestamp": datetime.now().isoformat(),
                        "date": datetime.now().date().isoformat()
                    }
                },
                upsert=True
            )
            
            return True
            
        except Exception as e:
            print(f"Error actualizando timestamp: {e}")
            return False

    def get_products_by_category(self, category, limit=20):
        """
        Obtiene productos por categoría
        """
        try:
            products = list(self.products_collection.find({
                "categories": {"$regex": category, "$options": "i"}
            }).sort([("price", 1)]).limit(limit))
            
            for product in products:
                product["_id"] = str(product["_id"])
            
            return products
            
        except Exception as e:
            print(f"Error obteniendo productos por categoría: {e}")
            return []

    def get_recent_products(self, days_back=7, limit=50):
        """
        Obtiene productos agregados/actualizados recientemente
        """
        try:
            date_limit = datetime.now() - timedelta(days=days_back)
            
            products = list(self.products_collection.find({
                "updated_at": {"$gte": date_limit.isoformat()}
            }).sort([("updated_at", -1)]).limit(limit))
            
            for product in products:
                product["_id"] = str(product["_id"])
            
            return products
            
        except Exception as e:
            print(f"Error obteniendo productos recientes: {e}")
            return []

    def clean_old_products(self, days_old=30):
        """
        Limpia productos muy antiguos de la base de datos
        """
        try:
            cutoff_date = datetime.now() - timedelta(days=days_old)
            
            result = self.products_collection.delete_many({
                "scraped_at": {"$lt": cutoff_date.isoformat()}
            })
            
            print(f"🧹 Limpieza: {result.deleted_count} productos antiguos eliminados")
            return result.deleted_count
            
        except Exception as e:
            print(f"Error limpiando productos antiguos: {e}")
            return 0

# Crear instancia global
product_model = Product()