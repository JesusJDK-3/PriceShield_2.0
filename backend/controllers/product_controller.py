from flask import jsonify, request
from services.api_scraper import supermarket_api
from models.product_model import product_model
import threading
import time

class ProductController:
    """
    Controlador para manejar la lógica de productos
    """
    
    def __init__(self):
        self.active_searches = {}  # Para rastrear búsquedas en progreso
    
    def search_products(self):
        """
        Busca productos en tiempo real en las APIs de supermercados
        """
        try:
            # Obtener parámetros de la petición
            data = request.get_json()
            
            if not data or not data.get('query'):
                return jsonify({
                    "success": False,
                    "error": "Parámetro 'query' es requerido",
                    "message": "Debe proporcionar un término de búsqueda"
                }), 400
            
            query = data.get('query', '').strip()
            supermarket = data.get('supermarket')  # Opcional
            limit = data.get('limit', 30)  # Por defecto 30 productos
            save_to_db = data.get('save_to_db', True)  # Por defecto guardar
            
            # Validar query
            if len(query) < 2:
                return jsonify({
                    "success": False,
                    "error": "Query muy corto",
                    "message": "El término de búsqueda debe tener al menos 2 caracteres"
                }), 400
            
            # Verificar si hay una búsqueda activa para este query
            search_key = f"{query}_{supermarket}" if supermarket else query
            if search_key in self.active_searches:
                return jsonify({
                    "success": False,
                    "error": "Búsqueda en progreso",
                    "message": f"Ya hay una búsqueda activa para '{query}'"
                }), 429
            
            # Marcar búsqueda como activa
            self.active_searches[search_key] = time.time()
            
            try:
                # Realizar búsqueda en APIs
                print(f"🔍 Iniciando búsqueda para: {query}")
                products_data = supermarket_api.search_products(
                    query=query,
                    supermarket=supermarket,
                    limit=limit
                )
                
                # Guardar en base de datos si se solicita
                save_result = {"success": True, "saved_count": 0, "updated_count": 0}
                if save_to_db:
                    save_result = product_model.save_products(products_data, query)
                
                # Procesar resultados para respuesta
                processed_results = self._process_search_results(products_data)
                
                return jsonify({
                    "success": True,
                    "query": query,
                    "supermarket": supermarket,
                    "results": processed_results,
                    "database_save": save_result,
                    "timestamp": time.time()
                }), 200
                
            finally:
                # Liberar búsqueda activa
                if search_key in self.active_searches:
                    del self.active_searches[search_key]
        
        except Exception as e:
            print(f"❌ Error en búsqueda de productos: {e}")
            return jsonify({
                "success": False,
                "error": "Error interno del servidor",
                "message": str(e)
            }), 500
    
    def search_saved_products(self):
        """
        Busca productos guardados en la base de datos
        """
        try:
            # Obtener parámetros de query string
            query = request.args.get('query', '').strip()
            supermarket = request.args.get('supermarket')
            limit = int(request.args.get('limit', 100))
            sort_by = request.args.get('sort_by', 'price')
            
            if not query:
                return jsonify({
                    "success": False,
                    "error": "Parámetro 'query' es requerido",
                    "message": "Debe proporcionar un término de búsqueda"
                }), 400
            
            if len(query) < 2:
                return jsonify({
                    "success": False,
                    "error": "Query muy corto",
                    "message": "El término de búsqueda debe tener al menos 2 caracteres"
                }), 400
            
            # Buscar en base de datos
            products = product_model.search_saved_products(
                query=query,
                supermarket=supermarket,
                limit=limit,
                sort_by=sort_by
            )
            
            return jsonify({
                "success": True,
                "query": query,
                "supermarket": supermarket,
                "sort_by": sort_by,
                "products_count": len(products),
                "products": products
            }), 200
            
        except ValueError as e:
            return jsonify({
                "success": False,
                "error": "Parámetro inválido",
                "message": str(e)
            }), 400
        
        except Exception as e:
            print(f"❌ Error buscando productos guardados: {e}")
            return jsonify({
                "success": False,
                "error": "Error interno del servidor",
                "message": str(e)
            }), 500
    
    def get_price_comparison(self):
        """
        Obtiene comparación de precios entre supermercados
        """
        try:
            # Obtener parámetros
            product_name = request.args.get('product_name', '').strip()
            days_back = int(request.args.get('days_back', 7))
            
            if not product_name:
                return jsonify({
                    "success": False,
                    "error": "Parámetro 'product_name' es requerido",
                    "message": "Debe proporcionar el nombre del producto"
                }), 400
            
            if len(product_name) < 2:
                return jsonify({
                    "success": False,
                    "error": "Nombre muy corto",
                    "message": "El nombre del producto debe tener al menos 2 caracteres"
                }), 400
            
            # Obtener comparación
            comparison = product_model.get_price_comparison(product_name, days_back)
            
            if not comparison:
                return jsonify({
                    "success": True,
                    "product_name": product_name,
                    "comparison": {},
                    "message": "No se encontraron productos para comparar"
                }), 200
            
            # Procesar comparación para agregar estadísticas
            summary = self._generate_comparison_summary(comparison)
            
            return jsonify({
                "success": True,
                "product_name": product_name,
                "days_back": days_back,
                "comparison": comparison,
                "summary": summary
            }), 200
            
        except ValueError as e:
            return jsonify({
                "success": False,
                "error": "Parámetro inválido",
                "message": str(e)
            }), 400
        
        except Exception as e:
            print(f"❌ Error en comparación de precios: {e}")
            return jsonify({
                "success": False,
                "error": "Error interno del servidor",
                "message": str(e)
            }), 500
    
    def get_popular_searches(self):
        """
        Obtiene las búsquedas más populares
        """
        try:
            limit = int(request.args.get('limit', 20))
            
            if limit < 1 or limit > 100:
                return jsonify({
                    "success": False,
                    "error": "Límite inválido",
                    "message": "El límite debe estar entre 1 y 100"
                }), 400
            
            popular_searches = product_model.get_popular_searches(limit)
            
            return jsonify({
                "success": True,
                "popular_searches": popular_searches,
                "count": len(popular_searches)
            }), 200
            
        except ValueError as e:
            return jsonify({
                "success": False,
                "error": "Parámetro inválido",
                "message": str(e)
            }), 400
        
        except Exception as e:
            print(f"❌ Error obteniendo búsquedas populares: {e}")
            return jsonify({
                "success": False,
                "error": "Error interno del servidor",
                "message": str(e)
            }), 500
    
    def get_available_supermarkets(self):
        """
        Devuelve lista de supermercados disponibles
        """
        try:
            supermarkets = supermarket_api.get_available_supermarkets()
            
            return jsonify({
                "success": True,
                "supermarkets": supermarkets,
                "count": len(supermarkets)
            }), 200
            
        except Exception as e:
            print(f"❌ Error obteniendo supermercados: {e}")
            return jsonify({
                "success": False,
                "error": "Error interno del servidor",
                "message": str(e)
            }), 500
    
    def async_search_and_save(self):
        """
        Realiza búsqueda asíncrona y guarda en segundo plano
        """
        try:
            data = request.get_json()
            
            if not data or not data.get('query'):
                return jsonify({
                    "success": False,
                    "error": "Parámetro 'query' es requerido"
                }), 400
            
            query = data.get('query', '').strip()
            supermarket = data.get('supermarket')
            limit = data.get('limit', 20)
            
            # Validar query
            if len(query) < 2:
                return jsonify({
                    "success": False,
                    "error": "Query muy corto",
                    "message": "El término de búsqueda debe tener al menos 2 caracteres"
                }), 400
            
            # Generar ID único para esta búsqueda
            search_id = f"search_{int(time.time())}_{hash(query) % 1000000}"
            
            # Iniciar búsqueda en segundo plano
            thread = threading.Thread(
                target=self._background_search,
                args=(search_id, query, supermarket, limit)
            )
            thread.daemon = True
            thread.start()
            
            return jsonify({
                "success": True,
                "search_id": search_id,
                "query": query,
                "message": "Búsqueda iniciada en segundo plano",
                "status": "processing"
            }), 202  # 202 = Accepted, processing
            
        except Exception as e:
            print(f"❌ Error en búsqueda asíncrona: {e}")
            return jsonify({
                "success": False,
                "error": "Error interno del servidor",
                "message": str(e)
            }), 500
    
    def get_search_status(self, search_id):
        """
        Obtiene el estado de una búsqueda asíncrona
        """
        try:
            # En una implementación real, esto se guardaria en Redis o similar
            # Por ahora, simplemente devolvemos un estado básico
            return jsonify({
                "success": True,
                "search_id": search_id,
                "status": "completed",  # processing, completed, failed
                "message": "Para esta implementación, revisar directamente los productos guardados"
            }), 200
            
        except Exception as e:
            print(f"❌ Error obteniendo estado de búsqueda: {e}")
            return jsonify({
                "success": False,
                "error": "Error interno del servidor",
                "message": str(e)
            }), 500
    
    def _process_search_results(self, products_data):
        """
        Procesa los resultados de búsqueda para la respuesta API
        """
        processed_results = {}
        total_products = 0
        
        for supermarket_key, supermarket_data in products_data.items():
            processed_results[supermarket_key] = {
                "supermarket_name": supermarket_data.get("supermarket", "Desconocido"),
                "success": supermarket_data.get("success", False),
                "products_count": supermarket_data.get("products_count", 0),
                "timestamp": supermarket_data.get("timestamp")
            }
            
            if supermarket_data.get("success"):
                processed_results[supermarket_key]["products"] = supermarket_data.get("products", [])
                total_products += supermarket_data.get("products_count", 0)
            else:
                processed_results[supermarket_key]["error"] = supermarket_data.get("error")
                processed_results[supermarket_key]["message"] = supermarket_data.get("message")
        
        processed_results["summary"] = {
            "total_products": total_products,
            "successful_supermarkets": sum(1 for data in processed_results.values() 
                                         if isinstance(data, dict) and data.get("success")),
            "total_supermarkets": len([k for k in processed_results.keys() if k != "summary"])
        }
        
        return processed_results
    
    def _generate_comparison_summary(self, comparison):
        """
        Genera un resumen de la comparación de precios
        """
        if not comparison:
            return {}
        
        summary = {
            "supermarkets_found": len(comparison),
            "cheapest_supermarket": None,
            "most_expensive_supermarket": None,
            "price_range": {
                "min": float('inf'),
                "max": 0
            },
            "avg_prices": {}
        }
        
        # Encontrar el supermercado más barato y más caro
        min_avg_price = float('inf')
        max_avg_price = 0
        
        for supermarket_key, data in comparison.items():
            avg_price = data.get("avg_price", 0)
            min_price = data.get("min_price", 0)
            max_price = data.get("max_price", 0)
            
            summary["avg_prices"][supermarket_key] = avg_price
            
            # Actualizar rangos globales
            if min_price > 0 and min_price < summary["price_range"]["min"]:
                summary["price_range"]["min"] = min_price
            if max_price > summary["price_range"]["max"]:
                summary["price_range"]["max"] = max_price
            
            # Encontrar supermercado más barato y más caro
            if avg_price > 0:
                if avg_price < min_avg_price:
                    min_avg_price = avg_price
                    summary["cheapest_supermarket"] = {
                        "key": supermarket_key,
                        "name": data.get("supermarket_name"),
                        "avg_price": avg_price
                    }
                
                if avg_price > max_avg_price:
                    max_avg_price = avg_price
                    summary["most_expensive_supermarket"] = {
                        "key": supermarket_key,
                        "name": data.get("supermarket_name"),
                        "avg_price": avg_price
                    }
        
        # Corregir infinito en min_price
        if summary["price_range"]["min"] == float('inf'):
            summary["price_range"]["min"] = 0
        
        return summary
    
    def _background_search(self, search_id, query, supermarket, limit):
        """
        Realiza búsqueda en segundo plano (para búsquedas asíncronas)
        """
        try:
            print(f"🔄 Búsqueda en segundo plano iniciada: {search_id}")
            
            # Realizar búsqueda
            products_data = supermarket_api.search_products(
                query=query,
                supermarket=supermarket,
                limit=limit
            )
            
            # Guardar en base de datos
            save_result = product_model.save_products(products_data, query)
            
            print(f"✅ Búsqueda en segundo plano completada: {search_id}")
            print(f"   - Productos guardados: {save_result.get('saved_count', 0)}")
            print(f"   - Productos actualizados: {save_result.get('updated_count', 0)}")
            
        except Exception as e:
            print(f"❌ Error en búsqueda en segundo plano {search_id}: {e}")
    
    def get_product_statistics(self):
        """
        Obtiene estadísticas generales de productos
        """
        try:
            # Obtener estadísticas básicas de la base de datos
            total_products = product_model.products_collection.count_documents({})
            
            # Productos por supermercado
            pipeline_supermarkets = [
                {"$group": {
                    "_id": "$supermarket_key",
                    "count": {"$sum": 1},
                    "supermarket_name": {"$first": "$supermarket"}
                }},
                {"$sort": {"count": -1}}
            ]
            
            supermarket_stats = list(product_model.products_collection.aggregate(pipeline_supermarkets))
            
            # Categorías más populares
            pipeline_categories = [
                {"$unwind": "$categories"},
                {"$group": {
                    "_id": "$categories",
                    "count": {"$sum": 1}
                }},
                {"$sort": {"count": -1}},
                {"$limit": 10}
            ]
            
            category_stats = list(product_model.products_collection.aggregate(pipeline_categories))
            
            # Rangos de precios
            pipeline_prices = [
                {"$match": {"price": {"$gt": 0}}},
                {"$group": {
                    "_id": None,
                    "min_price": {"$min": "$price"},
                    "max_price": {"$max": "$price"},
                    "avg_price": {"$avg": "$price"}
                }}
            ]
            
            price_stats = list(product_model.products_collection.aggregate(pipeline_prices))
            price_summary = price_stats[0] if price_stats else {
                "min_price": 0,
                "max_price": 0,
                "avg_price": 0
            }
            
            return jsonify({
                "success": True,
                "statistics": {
                    "total_products": total_products,
                    "supermarkets": supermarket_stats,
                    "top_categories": category_stats,
                    "price_summary": {
                        "min_price": round(price_summary.get("min_price", 0), 2),
                        "max_price": round(price_summary.get("max_price", 0), 2),
                        "avg_price": round(price_summary.get("avg_price", 0), 2)
                    }
                }
            }), 200
            
        except Exception as e:
            print(f"❌ Error obteniendo estadísticas: {e}")
            return jsonify({
                "success": False,
                "error": "Error interno del servidor",
                "message": str(e)
            }), 500
    
    # Agregar estos métodos a tu clase ProductController en product_controller.py

    def get_all_saved_products(self):
        """
        Obtiene todos los productos guardados en la base de datos con paginación
        """
        try:
            # Obtener parámetros de paginación
            page = int(request.args.get('page', 1))
            limit = int(request.args.get('limit', 50))
            sort_by = request.args.get('sort_by', 'scraped_at')
            supermarket = request.args.get('supermarket')
            
            # Validar parámetros
            if page < 1:
                page = 1
            if limit < 1 or limit > 100:
                limit = 50
                
            # Obtener productos
            products = product_model.get_all_products(
                page=page,
                limit=limit,
                sort_by=sort_by,
                supermarket=supermarket
            )
            
            # Obtener total de productos para paginación
            total_products = product_model.get_total_products_count(supermarket)
            total_pages = (total_products + limit - 1) // limit
            
            return jsonify({
                "success": True,
                "products": products,
                "pagination": {
                    "current_page": page,
                    "total_pages": total_pages,
                    "total_products": total_products,
                    "products_per_page": limit,
                    "has_next": page < total_pages,
                    "has_prev": page > 1
                },
                "filters": {
                    "supermarket": supermarket,
                    "sort_by": sort_by
                }
            }), 200
            
        except ValueError as e:
            return jsonify({
                "success": False,
                "error": "Parámetro inválido",
                "message": str(e)
            }), 400
        
        except Exception as e:
            print(f"❌ Error obteniendo todos los productos: {e}")
            return jsonify({
                "success": False,
                "error": "Error interno del servidor",
                "message": str(e)
            }), 500

    def manual_database_update(self):
        """
        Actualiza manualmente la base de datos con productos populares
        """
        try:
            data = request.get_json() or {}
            force_update = data.get('force_update', False)
            
            # Lista de términos populares para actualizar
            popular_terms = [
                "leche", "arroz", "aceite", "azúcar", "sal", "pan", "huevos", 
                "pollo", "carne", "pescado", "tomate", "cebolla", "papa", 
                "yogurt", "queso", "mantequilla", "atún", "pasta", "fideos",
                "detergente", "jabón", "shampoo", "papel higiénico",
                "galletas", "cereales", "agua", "gaseosa"
            ]
            
            # Verificar si necesita actualización
            if not force_update:
                last_update = product_model.get_last_database_update()
                if last_update:
                    from datetime import datetime, timedelta
                    hours_since_update = (datetime.now() - last_update).total_seconds() / 3600
                    if hours_since_update < 23:
                        return jsonify({
                            "success": False,
                            "message": "La base de datos fue actualizada recientemente",
                            "last_update": last_update.isoformat(),
                            "next_update_in_hours": round(24 - hours_since_update, 1)
                        }), 429
            
            # Iniciar actualización en segundo plano
            thread = threading.Thread(
                target=self._update_database_background,
                args=(popular_terms,)
            )
            thread.daemon = True
            thread.start()
            
            return jsonify({
                "success": True,
                "message": "Actualización de base de datos iniciada",
                "status": "processing",
                "terms_to_process": len(popular_terms),
                "estimated_time_minutes": len(popular_terms) * 2
            }), 202
            
        except Exception as e:
            print(f"❌ Error en actualización manual: {e}")
            return jsonify({
                "success": False,
                "error": "Error interno del servidor",
                "message": str(e)
            }), 500

    def _update_database_background(self, terms_list):
        """
        Actualiza la base de datos en segundo plano
        """
        try:
            print("🔄 Iniciando actualización de base de datos...")
            total_saved = 0
            total_updated = 0
            
            for i, term in enumerate(terms_list):
                try:
                    print(f"🔍 Procesando término {i+1}/{len(terms_list)}: {term}")
                    
                    # Buscar productos para este término
                    products_data = supermarket_api.search_products(
                        query=term,
                        limit=30  # Menos productos por término para ser más eficiente
                    )
                    
                    # Guardar en base de datos
                    save_result = product_model.save_products(products_data, term)
                    
                    if save_result["success"]:
                        total_saved += save_result["saved_count"]
                        total_updated += save_result["updated_count"]
                        print(f"   ✅ {term}: {save_result['saved_count']} nuevos, {save_result['updated_count']} actualizados")
                    else:
                        print(f"   ❌ {term}: Error guardando")
                    
                    # Pausa entre términos para no sobrecargar las APIs
                    time.sleep(2)
                    
                except Exception as e:
                    print(f"   ❌ Error procesando {term}: {e}")
                    continue
            
            # Actualizar timestamp de última actualización
            product_model.update_last_database_update()
            
            print(f"✅ Actualización completada:")
            print(f"   - Productos nuevos: {total_saved}")
            print(f"   - Productos actualizados: {total_updated}")
            print(f"   - Total procesados: {total_saved + total_updated}")
            
        except Exception as e:
            print(f"❌ Error en actualización de base de datos: {e}")

# También necesitas agregar la importación del supermarket_api al inicio del archivo
# from services.api_scraper import supermarket_api

# Crear instancia global del controlador
product_controller = ProductController()