import requests
import time
from datetime import datetime
import json
import re

class SupermarketAPI:
    #Clase para conectarse a las APIs de supermrcados peruanos
    # Y obtener informacion de produtos

    def __init__(self):
        #APIs de supermercados peruanos que usan VTEX
        self.SUPERMERCADOS_API = {
            "plazavea": {
                "url": "https://www.plazavea.com.pe/api/catalog_system/pub/products/search",
                "name":"Plaza Vea",
                "active": True
            },
            "wong": {
                "url": "https://www.wong.pe/api/catalog_system/pub/products/search",
                "name":"Wong",
                "active": True
            },
            "vivanda": {
                "url": "https://www.vivanda.com.pe/api/catalog_system/pub/products/search",
                "name":"Vivanda",
                "active": True
            },
            "metro": {
                "url": "https://www.metro.pe/api/catalog_system/pub/products/search",
                "name":"Metro",
                "active": True
            }
        }

        #Encabezados para simular un navegador real
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "es-PE,es;q=0.9,en-US;q=0.8,en;q=0.7",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive"
        }

        #Tiempo de espera entre peticiones (para no ser bloqueados)
        self.delay_between_requests = 2
    
    def search_products(self, query, supermarket=None, limit=100):
        """
        Busca productos en uno o todos los supermercados
        
        Args:
            query (str): Término de búsqueda (ej: "arroz", "leche")
            supermarket (str): Supermercado específico o None para todos
            limit (int): Límite de productos por supermercado
            
        Returns:
            dict: Diccionario con productos encontrados por supermercado
        """
        results = {}

        if supermarket and supermarket in self.SUPERMERCADOS_API:
            # Buscar en un supermercado específico
            results[supermarket] = self._fetch_from_supermarket(supermarket, query, limit)
        else:
            # Buscar en todos los supermercados
            for market_key in self.SUPERMERCADOS_API:
                if self.SUPERMERCADOS_API[market_key]["active"]:
                    print(f"🔍 Buscando en {self.SUPERMERCADOS_API[market_key]['name']}...")
                    results[market_key] = self._fetch_from_supermarket(market_key, query, limit)
                    
                    # Esperar entre peticiones para no ser bloqueados
                    time.sleep(self.delay_between_requests)
        
        return results
    
    def _fetch_from_supermarket(self, supermarket_key, query, limit):
        """
        Obtiene productos de un supermercado específico
        
        Args:
            supermarket_key (str): Clave del supermercado
            query (str): Término de búsqueda
            limit (int): Límite de productos
            
        Returns:
            dict: Información de productos o error
        """

        try:
            supermarket_info = self.SUPERMERCADOS_API[supermarket_key]
            url = supermarket_info["url"]
            
            # Usar URL simple sin parámetros de paginación para evitar error 206
            response = requests.get(
                url, 
                params={
                    'fq': f'productName:{query}',  # Filtro específico por nombre
                    'rows': limit,
                    'start': 0
                },
                headers=self.headers, 
                timeout=10
            )
            
            print(f"🔍 {supermarket_info['name']}: Status {response.status_code}")

            if response.status_code in [200, 206]:
                products_data = response.json()
                
                # Limitar productos después de obtenerlos (evitar paginación API)
                if len(products_data) > limit:
                    products_data = products_data[:limit]
                
                # Procesar y limpiar datos
                processed_products = self._process_products(
                    products_data, 
                    supermarket_key,
                    supermarket_info["name"]
                )
                
                return {
                    "success": True,
                    "supermarket": supermarket_info["name"],
                    "products_count": len(processed_products),
                    "products": processed_products,
                    "timestamp": datetime.now().isoformat()
                }
            else:
                return {
                    "success": False,
                    "supermarket": supermarket_info["name"],
                    "error": f"Error HTTP: {response.status_code}",
                    "message": f"Respuesta del servidor: {response.text[:100]}..."
                }
                
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "supermarket": self.SUPERMERCADOS_API[supermarket_key]["name"],
                "error": "Timeout",
                "message": "La petición tardó demasiado tiempo"
            }
        
        except requests.exceptions.ConnectionError:
            return {
                "success": False,
                "supermarket": self.SUPERMERCADOS_API[supermarket_key]["name"],
                "error": "Connection Error",
                "message": "No se pudo conectar con el supermercado"
            }
            
        except Exception as e:
            return {
                "success": False,
                "supermarket": self.SUPERMERCADOS_API[supermarket_key]["name"],
                "error": "Unknown Error",
                "message": str(e)
            }
    
    # Modifica temporalmente tu método _process_products para debuggear

    def _process_products(self, raw_products, supermarket_key, supermarket_name):
        """Debug version - muestra por qué se rechazan productos"""
        processed_products = []
        
        print(f"\n🔍 Procesando {len(raw_products)} productos de {supermarket_name}")
        
        rejected_no_name = 0
        rejected_no_price = 0
        rejected_zero_price = 0
        processed_count = 0

        for i, product in enumerate(raw_products):
            try:
                # Extraer información básica
                product_info = {
                    "id": product.get("productId", ""),
                    "name": self._clean_product_name(product.get("productName", "")),
                    "brand": product.get("brand", "Sin marca"),
                    "description": product.get("description", ""),
                    "supermarket": supermarket_name,
                    "supermarket_key": supermarket_key,
                }

                # Extraer precios
                prices = self._extract_prices(product)
                product_info.update(prices)
                
                # Extraer otros datos...
                images = self._extract_images(product)
                product_info["images"] = images
                categories = self._extract_categories(product)
                product_info["categories"] = categories
                product_info["url"] = self._build_product_url(product, supermarket_key)
                product_info["available"] = self._check_availability(product)
                product_info["scraped_at"] = datetime.now().isoformat()
                
                # DEBUGGING: Verificar por qué se rechaza
                name_ok = bool(product_info["name"])
                price_ok = product_info.get("price", 0) > 0
                
                if not name_ok:
                    rejected_no_name += 1
                    if i < 3:  # Solo mostrar primeros 3 ejemplos
                        print(f"   ❌ Rechazado por nombre vacío: ID {product_info['id']}")
                        
                elif not price_ok:
                    price_value = product_info.get("price", 0)
                    if price_value == 0:
                        rejected_zero_price += 1
                    else:
                        rejected_no_price += 1
                        
                    if i < 3:  # Solo mostrar primeros 3 ejemplos
                        print(f"   ❌ Rechazado por precio: '{product_info['name']}' = S/ {price_value}")
                        
                else:
                    processed_products.append(product_info)
                    processed_count += 1
                    if i < 3:  # Mostrar primeros 3 productos válidos
                        print(f"   ✅ Aceptado: '{product_info['name']}' = S/ {product_info.get('price', 0)}")
                        
            except Exception as e:
                if i < 3:
                    print(f"   💥 Error procesando producto {i}: {e}")
                continue
        
        # Resumen de lo que pasó
        print(f"\n📊 Resumen {supermarket_name}:")
        print(f"   - Recibidos: {len(raw_products)}")
        print(f"   - Procesados exitosamente: {processed_count}")
        print(f"   - Rechazados por nombre vacío: {rejected_no_name}")
        print(f"   - Rechazados por precio = 0: {rejected_zero_price}")
        print(f"   - Rechazados por precio inválido: {rejected_no_price}")
        print(f"   - Ratio de éxito: {(processed_count/len(raw_products)*100):.1f}%")
        
        return processed_products
    
    def _clean_product_name(self, name):
        """Limpia y normaliza el nombre del producto"""
        if not name:
            return ""
        
        # Remover HTML tags si los hay
        name = re.sub(r'<[^>]+>', '', name)

        # Limpiar espacios extra
        name = ' '.join(name.split())
        
        return name.strip()
    
    def _extract_prices(self, product):
        """Extrae información de precios del producto"""
        prices = {
            "price": 0,
            "original_price": 0,
            "discount_percentage": 0,
            "currency": "PEN"
        }

        try:
            # Las APIs VTEX pueden tener precios en diferentes lugares
            items = product.get("items", [])
            if items:
                sellers = items[0].get("sellers", [])
                if sellers:
                    commertial_offer = sellers[0].get("commertialOffer", {})
                    
                    # Precio actual
                    price = commertial_offer.get("Price", 0)
                    list_price = commertial_offer.get("ListPrice", 0)
                    
                    prices["price"] = price
                    prices["original_price"] = list_price if list_price > price else price
                    
                    # Calcular descuento si hay precio original mayor
                    if list_price > price and price > 0:
                        discount = ((list_price - price) / list_price) * 100
                        prices["discount_percentage"] = round(discount, 2)
            
            return prices
        
        except Exception as e:
            print(f"Error extrayendo precios: {e}")
            return prices
        
    def _extract_images(self, product):
        """Extrae URLs de imágenes del producto"""
        images = []

        try:
            items = product.get("items", [])
            if items:
                item_images = items[0].get("images", [])
                for img in item_images:
                    if img.get("imageUrl"):
                        images.append(img["imageUrl"])
            
            # Si no hay imágenes en items, buscar en el nivel principal
            if not images:
                product_images = product.get("images", [])
                for img in product_images:
                    if img.get("imageUrl"):
                        images.append(img["imageUrl"])
            
            return images[:3]  # Máximo 3 imagenes
        
        except Exception as e:
            print(f"Error extrayendo imágenes: {e}")
            return []
        
    def _extract_categories(self, product):
        """Extrae categorías del producto"""
        categories = []

        try:
            # Buscar en diferentes lugares donde pueden estar las categorías
            if "categories" in product:
                categories = product["categories"]
            elif "categoryPath" in product:
                categories = product["categoryPath"].split("/")
            
            # Limpiar categorías vacías
            categories = [cat.strip() for cat in categories if cat.strip()]
            
            return categories
            
        except Exception as e:
            print(f"Error extrayendo categorías: {e}")
            return []
    
    def _build_product_url(self, product, supermarket_key):
        """Construye la URL del producto en el sitio web"""
        try:
            link_text = product.get("linkText", "")
            if link_text:
                base_urls = {
                    "plazavea": "https://www.plazavea.com.pe",
                    "wong": "https://www.wong.pe", 
                    "vivanda": "https://www.vivanda.com.pe",
                    "metro": "https://www.metro.pe",
                    "tottus": "https://www.tottus.com.pe"
                }
                
                base_url = base_urls.get(supermarket_key, "")
                return f"{base_url}/{link_text}/p" if base_url else ""
            
            return ""
        
        except Exception as e:
            print(f"Error construyendo URL: {e}")
            return ""
    
    def _check_availability(self, product):
        """Verifica si el producto está disponible"""
        try:
            items = product.get("items", [])
            if items:
                sellers = items[0].get("sellers", [])
                if sellers:
                    commertial_offer = sellers[0].get("commertialOffer", {})
                    available_quantity = commertial_offer.get("AvailableQuantity", 0)
                    return available_quantity > 0
            
            return False
        
        except Exception as e:
            print(f"Error verificando disponibilidad: {e}")
            return False
    
    def get_available_supermarkets(self):
        """Devuelve lista de supermercados disponibles"""
        return {
            key: {
                "name": info["name"],
                "active": info["active"]
            }
            for key, info in self.SUPERMERCADOS_API.items()
            if info["active"]
        }

# Crear instancia global
supermarket_api = SupermarketAPI()




