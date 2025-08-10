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
        Busca productos guardados en la base de datos
        
        Args:
            query (str): Término de búsqueda
            supermarket (str): Filtrar por supermercado específico
            limit (int): Límite de resultados
            sort_by (str): Campo para ordenar (price, name, scraped_at)
            
        Returns:
            list: Lista de productos encontrados
        """
        try:
            # Construir filtros de búsqueda
            search_filter = {
                "$or": [
                    {"name": {"$regex": query, "$options": "i"}},
                    {"brand": {"$regex": query, "$options": "i"}},
                    {"description": {"$regex": query, "$options": "i"}},
                    {"categories": {"$regex": query, "$options": "i"}}
                ]
            }
            
            # Filtrar por supermercado si se especifica
            if supermarket:
                search_filter["supermarket_key"] = supermarket
            
            # Definir orden
            sort_options = {
                "price": [("price", 1)],  # Precio ascendente
                "price_desc": [("price", -1)],  # Precio descendente
                "name": [("name", 1)],  # Nombre A-Z
                "scraped_at": [("scraped_at", -1)]  # Más recientes primero
            }
            
            sort_order = sort_options.get(sort_by, [("price", 1)])
            
            # Realizar búsqueda
            products = list(self.products_collection.find(
                search_filter
            ).sort(sort_order).limit(limit))
            
            # Limpiar el campo _id para JSON
            for product in products:
                product["_id"] = str(product["_id"])
            
            return products
            
        except Exception as e:
            print(f"Error buscando productos: {e}")
            return []
    
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
        Genera un ID único para el producto basado en nombre y supermercado
        """
        name = product.get("name", "").lower()
        supermarket = product.get("supermarket_key", "")
        product_id = product.get("id", "")
        
        # Limpiar nombre para crear ID consistente
        clean_name = re.sub(r'[^a-z0-9\s]', '', name)
        clean_name = re.sub(r'\s+', '_', clean_name.strip())
        
        return f"{supermarket}_{clean_name}_{product_id}"
    
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

# Crear instancia global
product_model = Product()