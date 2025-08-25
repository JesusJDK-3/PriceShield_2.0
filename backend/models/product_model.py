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

    def search_products_for_comparison(self, query, limit=100):
        """
        Búsqueda específica para comparación de precios
        Encuentra productos similares sin filtro de supermercado
        """
        try:
            pipeline = [
                {
                    "$search": {
                        "index": "products_search_index",
                        "compound": {
                            "should": [
                                {
                                    "text": {
                                        "query": query,
                                        "path": "name",
                                        "score": {"boost": {"value": 5}}
                                    }
                                },
                                {
                                    "text": {
                                        "query": query,
                                        "path": "brand",
                                        "score": {"boost": {"value": 3}}
                                    }
                                }
                            ]
                        }
                    }
                },
                {
                    "$addFields": {
                        "search_score": {"$meta": "searchScore"}
                    }
                },
                # Agrupar por supermercado para comparación
                {
                    "$sort": {"search_score": -1, "price": 1}
                },
                {"$limit": limit}
            ]
            
            products = list(self.products_collection.aggregate(pipeline))
            
            # Procesar para comparación
            comparison_data = {}
            for product in products:
                product["_id"] = str(product["_id"])
                supermarket = product.get("supermarket_key", "unknown")
                
                if supermarket not in comparison_data:
                    comparison_data[supermarket] = {
                        "supermarket_name": product.get("supermarket", "Desconocido"),
                        "products": [],
                        "min_price": float('inf'),
                        "avg_price": 0,
                        "best_match": None
                    }
                
                price = product.get("price", 0)
                if price > 0:
                    comparison_data[supermarket]["products"].append(product)
                    
                    # Actualizar precio mínimo
                    if price < comparison_data[supermarket]["min_price"]:
                        comparison_data[supermarket]["min_price"] = price
                        comparison_data[supermarket]["best_match"] = product
            
            # Calcular promedios
            for supermarket in comparison_data:
                products_list = comparison_data[supermarket]["products"]
                if products_list:
                    total_price = sum(p["price"] for p in products_list)
                    comparison_data[supermarket]["avg_price"] = round(total_price / len(products_list), 2)
                    
                    if comparison_data[supermarket]["min_price"] == float('inf'):
                        comparison_data[supermarket]["min_price"] = 0
            
            return comparison_data
            
        except Exception as e:
            print(f"Error en búsqueda para comparación: {e}")
            return {}


    def search_saved_products(self, query, supermarket=None, limit=50, sort_by="price"):
        """
        Busca productos usando Atlas Search (reemplaza la búsqueda regex anterior)
        
        Args:
            query (str): Término de búsqueda
            supermarket (str): Filtrar por supermercado específico
            limit (int): Límite de resultados
            sort_by (str): Campo para ordenar (price, name, scraped_at)
            
        Returns:
            list: Lista de productos encontrados
        """
        try:
            query_clean = query.strip()
            
            # Pipeline base con Atlas Search
            pipeline = [
                {
                    "$search": {
                        "index": "products_search_index",  # El índice que creaste
                        "compound": {
                            "should": [
                                # Búsqueda principal en nombre (mayor peso)
                                {
                                    "text": {
                                        "query": query_clean,
                                        "path": "name",
                                        "score": {"boost": {"value": 3}}
                                    }
                                },
                                # Búsqueda en marca (peso medio)
                                {
                                    "text": {
                                        "query": query_clean,
                                        "path": "brand",
                                        "score": {"boost": {"value": 2}}
                                    }
                                },
                                # Búsqueda en categorías
                                {
                                    "text": {
                                        "query": query_clean,
                                        "path": "categories",
                                        "score": {"boost": {"value": 1.5}}
                                    }
                                },
                                # Búsqueda en descripción (menor peso)
                                {
                                    "text": {
                                        "query": query_clean,
                                        "path": "description",
                                        "score": {"boost": {"value": 1}}
                                    }
                                }
                            ],
                            "minimumShouldMatch": 1
                        }
                    }
                }
            ]
            
            # Agregar filtro de supermercado si se especifica
            if supermarket:
                pipeline.append({
                    "$match": {
                        "supermarket_key": supermarket
                    }
                })
            
            # Agregar score de búsqueda
            pipeline.append({
                "$addFields": {
                    "search_score": {"$meta": "searchScore"}
                }
            })
            
            # Definir ordenamiento
            if sort_by == "relevance":
                # Ordenar solo por relevancia de búsqueda
                sort_stage = {"$sort": {"search_score": -1}}
            elif sort_by == "price":
                # Ordenar por precio, luego por relevancia
                sort_stage = {"$sort": {"price": 1, "search_score": -1}}
            elif sort_by == "price_desc":
                sort_stage = {"$sort": {"price": -1, "search_score": -1}}
            elif sort_by == "name":
                sort_stage = {"$sort": {"name": 1, "search_score": -1}}
            else:  # scraped_at o default
                sort_stage = {"$sort": {"scraped_at": -1, "search_score": -1}}
            
            pipeline.append(sort_stage)
            pipeline.append({"$limit": limit})
            
            # Ejecutar búsqueda
            products = list(self.products_collection.aggregate(pipeline))
            
            # Limpiar resultados para JSON
            for product in products:
                product["_id"] = str(product["_id"])
                # Redondear score para mejor legibilidad
                if "search_score" in product:
                    product["search_score"] = round(product["search_score"], 2)
            
            return products
            
        except Exception as e:
            print(f"Error en Atlas Search: {e}")
            # Fallback al método anterior si Atlas Search falla
            return self._search_with_regex_fallback(query, supermarket, limit, sort_by) 
   
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
        name = product.get("name", "").lower()
        supermarket = product.get("supermarket_key", "")
        
        # Normalización MÁS AGRESIVA
        clean_name = re.sub(r'[^a-z0-9]', '', name)  # Solo letras y números
        clean_name = re.sub(r'\b(kg|gr|lt|ml|und|pack|x)\b', '', clean_name)  # Quitar unidades
        clean_name = re.sub(r'\d+', '', clean_name)  # Quitar números (tamaños)
        
        return f"{supermarket}_{clean_name[:20]}"  # Limitar longitud
    
    def get_product_unified_history(self, product_name, days_back=30):
        """
        Busca historial usando similitud de nombres más flexible
        """
        try:
            from datetime import datetime, timedelta
            
            # Normalizar nombre de búsqueda
            normalized_search = re.sub(r'[^a-z0-9]', '', product_name.lower())
            normalized_search = normalized_search[:15]  # Primeros 15 caracteres
            
            date_limit = datetime.now() - timedelta(days=days_back)
            
            # Pipeline con regex más flexible
            # Pipeline mejorado para obtener TODAS las actualizaciones del mismo producto
            pipeline = [
                {
                    "$match": {
                        "name": {"$regex": f".*{re.escape(product_name)}.*", "$options": "i"},
                        "scraped_at": {"$gte": date_limit.isoformat()},
                        "price": {"$gt": 0}
                    }
                },
                {
                    "$addFields": {
                        "product_similarity": {
                            "$cond": {
                                "if": {"$regexMatch": {"input": "$name", "regex": f"^{re.escape(product_name)}", "options": "i"}},
                                "then": 3,  # Coincidencia exacta al inicio
                                "else": {
                                    "$cond": {
                                        "if": {"$regexMatch": {"input": "$name", "regex": f"{re.escape(product_name)}", "options": "i"}},
                                        "then": 2,  # Contiene el término
                                        "else": 1   # Coincidencia parcial
                                    }
                                }
                            }
                        }
                    }
                },
                # Agrupar por producto similar para obtener TODAS las actualizaciones
                {
                    "$group": {
                        "_id": {
                            "name": "$name",
                            "supermarket": "$supermarket_key"
                        },
                        "price_updates": {
                            "$push": {
                                "price": "$price",
                                "scraped_at": "$scraped_at",
                                "updated_at": "$updated_at",
                                "supermarket": "$supermarket",
                                "url": "$url"
                            }
                        },
                        "similarity": {"$first": "$product_similarity"},
                        "latest_price": {"$last": "$price"}
                    }
                },
                # Desenrollar para mostrar cada actualización como registro separado
                {
                    "$unwind": "$price_updates"
                },
                {
                    "$project": {
                        "name": "$_id.name",
                        "supermarket_key": "$_id.supermarket", 
                        "supermarket": "$price_updates.supermarket",
                        "price": "$price_updates.price",
                        "scraped_at": "$price_updates.scraped_at",
                        "updated_at": "$price_updates.updated_at",
                        "url": "$price_updates.url",
                        "similarity": 1,
                        "_id": 0
                    }
                },
                {"$sort": {"similarity": -1, "scraped_at": 1}},
                {"$limit": 200}  # Incrementar límite para ver más actualizaciones
            ]
            
            products = list(self.products_collection.aggregate(pipeline))
            
            for product in products:
                product["_id"] = str(product["_id"])
                
            return products
            
        except Exception as e:
            print(f"❌ Error en historial unificado: {e}")
            return []

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
                    "name": new_product.get("name", existing_product.get("name")),
                    "brand": new_product.get("brand", existing_product.get("brand")),
                    "description": new_product.get("description", existing_product.get("description")),
                    "price": new_price,
                    "original_price": new_product.get("original_price", 0),
                    "discount_percentage": new_product.get("discount_percentage", 0),
                    "available": new_product.get("available", False),
                    "images": new_product.get("images", existing_product.get("images", [])),
                    "categories": new_product.get("categories", existing_product.get("categories", [])),
                    "url": new_product.get("url", existing_product.get("url")),
                    "scraped_at": new_product.get("scraped_at"),
                    "updated_at": datetime.now().isoformat()
                }
            }
            
            result = self.products_collection.update_one(
                {"unique_id": unique_id},
                update_doc
            )
            
            # Si el precio cambió significativamente, procesar alerta e historial
            if old_price != new_price and new_price > 0:
                # Guardar en historial de precios
                self._save_price_history(unique_id, new_price)
                
                # Crear alerta de cambio de precio
                try:
                    # Importación tardía para evitar problemas circulares
                    from models.alert_model import alert_model
                    
                    # Preparar datos del producto para la alerta
                    product_data_for_alert = {
                        "unique_id": unique_id,
                        "name": existing_product.get("name"),
                        "brand": existing_product.get("brand"),
                        "supermarket": existing_product.get("supermarket"),
                        "supermarket_key": existing_product.get("supermarket_key"),
                        "url": existing_product.get("url"),
                        "categories": existing_product.get("categories", [])
                    }
                    
                    alert_model.create_price_change_alert(
                        product_data=product_data_for_alert,
                        old_price=old_price,
                        new_price=new_price
                    )
                    
                except ImportError as e:
                    print(f"Warning: No se pudo importar alert_model: {e}")
                except Exception as e:
                    print(f"Error creando alerta de precio: {e}")
            
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

    # Agregar este método en product_model.py

    def get_product_price_history(self, product_name, supermarket_key=None, days_back=30):
        """
        Obtiene el historial de precios de un producto específico
        Busca el MISMO producto a través del tiempo, no productos similares
        
        Args:
            product_name (str): Nombre exacto del producto
            supermarket_key (str): Filtrar por supermercado específico (opcional)
            days_back (int): Días hacia atrás para buscar
            
        Returns:
            list: Lista de precios ordenados por fecha
        """
        try:
            from datetime import datetime, timedelta
            
            # Fecha límite
            date_limit = datetime.now() - timedelta(days=days_back)
            
            # Construir query para buscar el MISMO producto
            match_query = {
                "name": {"$regex": f"^{re.escape(product_name)}", "$options": "i"},  # Nombre exacto
                "scraped_at": {"$gte": date_limit.isoformat()},
                "price": {"$gt": 0}  # Solo precios válidos
            }
            
            # Agregar filtro de supermercado si se especifica
            if supermarket_key:
                match_query["supermarket_key"] = supermarket_key
            
            # Pipeline de agregación para obtener historial
            pipeline = [
                {"$match": match_query},
                {
                    "$addFields": {
                        "scraped_date": {
                            "$dateFromString": {
                                "dateString": "$scraped_at",
                                "onError": None
                            }
                        }
                    }
                },
                {
                    "$match": {
                        "scraped_date": {"$ne": None}  # Filtrar fechas inválidas
                    }
                },
                {
                    "$group": {
                        "_id": {
                            "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$scraped_date"}},
                            "supermarket": "$supermarket_key"
                        },
                        "price": {"$avg": "$price"},  # Promedio si hay múltiples precios el mismo día
                        "supermarket_name": {"$first": "$supermarket"},
                        "product_name": {"$first": "$name"},
                        "count": {"$sum": 1}
                    }
                },
                {
                    "$sort": {
                        "_id.date": 1  # Ordenar por fecha ascendente
                    }
                },
                {
                    "$project": {
                        "date": "$_id.date",
                        "supermarket_key": "$_id.supermarket", 
                        "supermarket_name": 1,
                        "product_name": 1,
                        "price": {"$round": ["$price", 2]},
                        "count": 1,
                        "_id": 0
                    }
                }
            ]
            
            # Ejecutar agregación
            history_data = list(self.products_collection.aggregate(pipeline))
            
            print(f"📊 Historial encontrado para '{product_name}': {len(history_data)} registros")
            
            return history_data
            
        except Exception as e:
            print(f"❌ Error obteniendo historial de precios: {e}")
            return []

    def get_product_price_trend(self, product_name, days_back=30):
        """
        Obtiene la tendencia de precios agregada por fecha (todos los supermercados)
        Útil para gráficos de tendencia general
        
        Args:
            product_name (str): Nombre del producto
            days_back (int): Días hacia atrás
            
        Returns:
            dict: Datos formateados para gráficos
        """
        try:
            # Obtener historial completo
            history_data = self.get_product_price_history(product_name, days_back=days_back)
            
            if not history_data:
                return {"labels": [], "prices": [], "dates": []}
            
            # Agrupar por fecha (combinar todos los supermercados)
            grouped_by_date = {}
            for record in history_data:
                date = record["date"]
                if date not in grouped_by_date:
                    grouped_by_date[date] = []
                grouped_by_date[date].append(record["price"])
            
            # Calcular promedio por día
            dates = sorted(grouped_by_date.keys())
            prices = []
            labels = []
            
            for date in dates:
                daily_prices = grouped_by_date[date]
                avg_price = sum(daily_prices) / len(daily_prices)
                prices.append(round(avg_price, 2))
                
                # Formatear fecha para mostrar
                date_obj = datetime.strptime(date, "%Y-%m-%d")
                labels.append(date_obj.strftime("%d %b"))
            
            return {
                "labels": labels,
                "prices": prices,
                "dates": dates,
                "data_points": len(history_data)
            }
            
        except Exception as e:
            print(f"❌ Error calculando tendencia: {e}")
            return {"labels": [], "prices": [], "dates": []}

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