# dashboard_routes.py - VERSIÓN COMPLETA CORREGIDA
from flask import Blueprint, request, jsonify
from models.product_model import product_model
from datetime import datetime, timedelta
import re

# Crear blueprint
dashboard_routes = Blueprint('dashboard_routes', __name__, url_prefix='/api/dashboard')

@dashboard_routes.route('/stats', methods=['GET'])
def get_dashboard_stats():
    """
    GET /api/dashboard/stats
    RUTA FALTANTE: Estadísticas principales del dashboard
    """
    try:
        from services.db import db
        
        # Estadísticas básicas
        total_products = product_model.get_total_products()
        total_supermarkets = product_model.get_total_supermarkets()
        
        # Estadísticas de alertas
        try:
            from models.alert_model import alert_model
            alert_summary = alert_model.get_user_alert_summary()
        except:
            alert_summary = {
                "total_alerts": 0,
                "unread_alerts": 0,
                "price_increases": 0,
                "price_decreases": 0
            }
        
        # Estadísticas de historial de precios (últimos 7 días)
        date_limit = datetime.now() - timedelta(days=7)
        
        price_changes_count = product_model.price_history_collection.count_documents({
            "timestamp": {"$gte": date_limit.isoformat()}
        })
        
        # Búsquedas recientes
        recent_searches = product_model.search_history_collection.count_documents({
            "timestamp": {"$gte": date_limit.isoformat()}
        })
        
        # Productos agregados recientemente
        recent_products = db.products.count_documents({
            "created_at": {"$gte": date_limit.isoformat()}
        })
        
        return jsonify({
            "success": True,
            "stats": {
                "products": {
                    "total": total_products,
                    "recent": recent_products,
                    "supermarkets": total_supermarkets
                },
                "alerts": alert_summary,
                "activity": {
                    "price_changes": price_changes_count,
                    "recent_searches": recent_searches,
                    "last_update": product_model.get_last_database_update()
                }
            }
        })
        
    except Exception as e:
        print(f"❌ Error obteniendo estadísticas: {e}")
        return jsonify({
            "success": False,
            "message": f"Error interno: {str(e)}",
            "stats": {
                "products": {"total": 0, "recent": 0, "supermarkets": 0},
                "alerts": {"total_alerts": 0, "unread_alerts": 0, "price_increases": 0, "price_decreases": 0},
                "activity": {"price_changes": 0, "recent_searches": 0, "last_update": None}
            }
        }), 500

@dashboard_routes.route('/product-history-unified', methods=['GET'])
def get_product_history_unified():
    """
    RUTA CORREGIDA: Obtiene historial REAL usando price_history collection
    """
    try:
        # VALIDACIÓN MEJORADA
        product_name = request.args.get('product_name', '').strip()
        unique_id = request.args.get('unique_id', '').strip()
        
        # Validar que al menos uno esté presente
        if not product_name and not unique_id:
            return jsonify({
                "success": False,
                "message": "Parámetro 'product_name' o 'unique_id' es requerido",
                "example": "/api/dashboard/product-history-unified?unique_id=producto_123"
            }), 400
        
        days_back = int(request.args.get('days_back', 30))
        days_back = min(days_back, 90)  # Limitar a 90 días máximo
        
        print(f"🔍 Buscando historial para: {product_name or unique_id} (últimos {days_back} días)")
        
        from services.db import db
        date_limit = datetime.now() - timedelta(days=days_back)
        
        # ESTRATEGIA 1: Buscar por unique_id exacto
        current_product = None
        target_unique_id = unique_id
        
        if unique_id:
            current_product = db.products.find_one({"unique_id": unique_id})
            if not current_product:
                return jsonify({
                    "success": False,
                    "message": f"No se encontró producto con unique_id: {unique_id}",
                    "products": [],
                    "current_product": None
                }), 404
        else:
            # ESTRATEGIA 2: Buscar por nombre
            similar_products = list(db.products.find({
                "name": {"$regex": re.escape(product_name), "$options": "i"}
            }).limit(5))
            
            if not similar_products:
                return jsonify({
                    "success": False,
                    "message": f"No se encontró producto con nombre similar a: {product_name}",
                    "products": [],
                    "current_product": None
                }), 404
            
            current_product = similar_products[0]
            target_unique_id = current_product["unique_id"]
        
        # CONSULTA PRINCIPAL: Buscar en price_history
        print(f"📊 Consultando historial para unique_id: {target_unique_id}")
        
        price_history = list(db.price_history.find({
            "product_unique_id": target_unique_id,
            "timestamp": {"$gte": date_limit.isoformat()}
        }).sort([("timestamp", 1)]))
        
        processed_history = []
        
        if price_history:
            print(f"✅ Encontrado historial dedicado: {len(price_history)} entradas")
            
            for entry in price_history:
                processed_entry = {
                    "unique_id": target_unique_id,
                    "name": current_product.get("name", "Producto desconocido"),
                    "price": entry.get("price", 0),
                    "scraped_at": entry.get("timestamp"),
                    "supermarket": current_product.get("supermarket", "Desconocido"),
                    "supermarket_key": current_product.get("supermarket_key", "unknown"),
                    "images": current_product.get("images", []),
                    "url": current_product.get("url"),
                    "source": "price_history",
                    "date": entry.get("timestamp", "").split("T")[0] if entry.get("timestamp") else ""
                }
                processed_history.append(processed_entry)
        
        else:
            # FALLBACK: Buscar en colección de productos
            print("📊 No hay historial dedicado, buscando en productos...")
            
            products_history = list(db.products.find({
                "unique_id": target_unique_id,
                "scraped_at": {"$gte": date_limit.isoformat()}
            }).sort([("scraped_at", 1)]))
            
            if products_history:
                print(f"✅ Historial en productos: {len(products_history)} entradas")
                
                for product in products_history:
                    processed_entry = {
                        "unique_id": product["unique_id"],
                        "name": product["name"],
                        "price": product.get("price", 0),
                        "scraped_at": product.get("scraped_at"),
                        "supermarket": product.get("supermarket"),
                        "supermarket_key": product.get("supermarket_key"),
                        "images": product.get("images", []),
                        "url": product.get("url"),
                        "source": "products_collection",
                        "date": product.get("scraped_at", "").split("T")[0] if product.get("scraped_at") else ""
                    }
                    processed_history.append(processed_entry)
            
            else:
                # ÚLTIMO FALLBACK: Solo producto actual
                if current_product:
                    processed_entry = {
                        "unique_id": current_product["unique_id"],
                        "name": current_product["name"],
                        "price": current_product.get("price", 0),
                        "scraped_at": current_product.get("updated_at", datetime.now().isoformat()),
                        "supermarket": current_product.get("supermarket"),
                        "supermarket_key": current_product.get("supermarket_key"),
                        "images": current_product.get("images", []),
                        "url": current_product.get("url"),
                        "source": "current_only",
                        "date": datetime.now().date().isoformat()
                    }
                    processed_history.append(processed_entry)
        
        # FORMATEAR RESPUESTA FINAL
        print(f"✅ Retornando {len(processed_history)} entradas de historial")
        
        return jsonify({
            "success": True,
            "products": processed_history,
            "current_product": {
                "_id": str(current_product["_id"]) if current_product else None,
                "unique_id": current_product.get("unique_id") if current_product else None,
                "name": current_product.get("name") if current_product else None,
                "current_price": current_product.get("price") if current_product else None,
                "supermarket": current_product.get("supermarket") if current_product else None,
                "images": current_product.get("images", []) if current_product else [],
                "url": current_product.get("url") if current_product else None
            },
            "total_entries": len(processed_history),
            "date_range": {
                "from": date_limit.isoformat(),
                "to": datetime.now().isoformat(),
                "days": days_back
            },
            "data_source": "unified_search_v2"
        })
        
    except ValueError as e:
        return jsonify({
            "success": False,
            "message": f"Parámetro inválido: {str(e)}",
            "products": []
        }), 400
        
    except Exception as e:
        print(f"❌ Error en historial unificado: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": f"Error interno: {str(e)}",
            "products": [],
            "current_product": None
        }), 500

@dashboard_routes.route('/product-complete-info', methods=['GET'])
def get_product_complete_info():
    """
    CORREGIDA: Información completa de un producto + historial
    """
    try:
        unique_id = request.args.get('unique_id')
        product_name = request.args.get('product_name')
        
        if not unique_id and not product_name:
            return jsonify({
                "success": False,
                "message": "Parámetro 'unique_id' o 'product_name' es requerido"
            }), 400
        
        from services.db import db
        
        # Buscar producto
        if unique_id:
            product = db.products.find_one({"unique_id": unique_id})
        else:
            product = db.products.find_one({
                "name": {"$regex": re.escape(product_name), "$options": "i"}
            })
        
        if not product:
            return jsonify({
                "success": False,
                "message": "Producto no encontrado"
            }), 404
        
        product["_id"] = str(product["_id"])
        target_unique_id = product["unique_id"]
        
        # Obtener historial COMPLETO de precios
        price_history = list(db.price_history.find({
            "product_unique_id": target_unique_id
        }).sort([("timestamp", -1)]).limit(100))  # Últimas 100 entradas
        
        # Formatear historial
        formatted_history = []
        for entry in price_history:
            entry["_id"] = str(entry["_id"])
            # Formatear fecha para mostrar
            if entry.get("timestamp"):
                try:
                    dt = datetime.fromisoformat(entry["timestamp"])
                    entry["formatted_date"] = dt.strftime("%d/%m/%Y %H:%M")
                    entry["date_only"] = dt.strftime("%Y-%m-%d")
                except:
                    entry["formatted_date"] = "Fecha inválida"
                    entry["date_only"] = ""
            formatted_history.append(entry)
        
        # Calcular estadísticas del historial
        prices = [h.get("price", 0) for h in formatted_history if h.get("price", 0) > 0]
        
        history_stats = {
            "total_records": len(formatted_history),
            "price_range": {
                "min": min(prices) if prices else 0,
                "max": max(prices) if prices else 0,
                "current": product.get("price", 0)
            },
            "average_price": round(sum(prices) / len(prices), 2) if prices else 0,
            "has_price_changes": len(set(prices)) > 1 if prices else False
        }
        
        return jsonify({
            "success": True,
            "product": product,
            "price_history": formatted_history,
            "history_stats": history_stats,
            "history_count": len(formatted_history)
        })
        
    except Exception as e:
        print(f"❌ Error obteniendo info completa: {e}")
        return jsonify({
            "success": False,
            "message": f"Error interno: {str(e)}"
        }), 500

@dashboard_routes.route('/price-trends/<unique_id>', methods=['GET'])
def get_price_trends(unique_id):
    """
    NUEVA: Obtiene tendencias de precio para gráficos
    """
    try:
        days_back = int(request.args.get('days_back', 30))
        from services.db import db
        
        date_limit = datetime.now() - timedelta(days=days_back)
        
        # Buscar historial de precios
        price_history = list(db.price_history.find({
            "product_unique_id": unique_id,
            "timestamp": {"$gte": date_limit.isoformat()}
        }).sort([("timestamp", 1)]))
        
        if not price_history:
            return jsonify({
                "success": False,
                "message": "No hay datos de historial para este producto",
                "trends": []
            })
        
        # Agrupar por día para crear tendencia
        daily_prices = {}
        for entry in price_history:
            timestamp = entry.get("timestamp", "")
            if timestamp:
                date_key = timestamp.split("T")[0]  # Solo la fecha
                price = entry.get("price", 0)
                
                if date_key not in daily_prices:
                    daily_prices[date_key] = []
                daily_prices[date_key].append(price)
        
        # Calcular promedio diario
        trends = []
        for date_str in sorted(daily_prices.keys()):
            prices_list = daily_prices[date_str]
            avg_price = sum(prices_list) / len(prices_list)
            
            try:
                date_obj = datetime.strptime(date_str, "%Y-%m-%d")
                formatted_date = date_obj.strftime("%d %b")
            except:
                formatted_date = date_str
            
            trends.append({
                "date": date_str,
                "formatted_date": formatted_date,
                "price": round(avg_price, 2),
                "data_points": len(prices_list)
            })
        
        return jsonify({
            "success": True,
            "trends": trends,
            "total_days": len(trends),
            "date_range": {
                "from": date_limit.date().isoformat(),
                "to": datetime.now().date().isoformat()
            }
        })
        
    except Exception as e:
        print(f"❌ Error obteniendo tendencias: {e}")
        return jsonify({
            "success": False,
            "message": f"Error: {str(e)}",
            "trends": []
        }), 500

@dashboard_routes.route('/recent-changes', methods=['GET'])
def get_recent_price_changes():
    """
    NUEVA: Obtiene cambios de precio recientes
    """
    try:
        days_back = int(request.args.get('days_back', 7))
        limit = int(request.args.get('limit', 20))
        
        from services.db import db
        date_limit = datetime.now() - timedelta(days=days_back)
        
        # Consultar historial de precios reciente
        recent_changes = list(db.price_history.find({
            "timestamp": {"$gte": date_limit.isoformat()},
            "old_price": {"$exists": True},
            "new_price": {"$exists": True}
        }).sort([("timestamp", -1)]).limit(limit))
        
        formatted_changes = []
        for change in recent_changes:
            # Obtener datos del producto actual
            product = db.products.find_one({"unique_id": change.get("product_unique_id")})
            
            if product:
                formatted_change = {
                    "product_name": change.get("product_name", product.get("name")),
                    "unique_id": change.get("product_unique_id"),
                    "old_price": change.get("old_price", 0),
                    "new_price": change.get("new_price", 0),
                    "price_difference": change.get("price_difference", 0),
                    "percentage_change": change.get("percentage_change", 0),
                    "supermarket": change.get("supermarket", product.get("supermarket")),
                    "timestamp": change.get("timestamp"),
                    "product_url": product.get("url"),
                    "images": product.get("images", [])
                }
                
                # Formatear fecha
                try:
                    dt = datetime.fromisoformat(change.get("timestamp", ""))
                    formatted_change["formatted_date"] = dt.strftime("%d %b, %H:%M")
                except:
                    formatted_change["formatted_date"] = "Fecha inválida"
                
                formatted_changes.append(formatted_change)
        
        return jsonify({
            "success": True,
            "changes": formatted_changes,
            "total": len(formatted_changes),
            "period_days": days_back
        })
        
    except Exception as e:
        print(f"❌ Error obteniendo cambios recientes: {e}")
        return jsonify({
            "success": False,
            "changes": [],
            "message": f"Error: {str(e)}"
        }), 500

# RUTA DE TESTING
@dashboard_routes.route('/test', methods=['GET'])
def test_dashboard():
    """
    Ruta de prueba para verificar el dashboard
    """
    return jsonify({
        "success": True,
        "message": "Dashboard funcionando correctamente",
        "timestamp": datetime.now().isoformat(),
        "available_routes": [
            "GET /api/dashboard/stats",
            "GET /api/dashboard/product-history-unified",
            "GET /api/dashboard/product-complete-info", 
            "GET /api/dashboard/price-trends/<unique_id>",
            "GET /api/dashboard/recent-changes"
        ]
    })