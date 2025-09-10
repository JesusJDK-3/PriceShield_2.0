from services.db import db
from datetime import datetime, timedelta
import re

class Product:
    """
    Modelo para manejar productos en la base de datos - VERSIÓN CORREGIDA
    """
    
    def __init__(self):
        # Colecciones de MongoDB
        self.products_collection = db['products']  # Productos actuales
        self.search_history_collection = db['search_history']  # Historial de búsquedas
        self.price_history_collection = db['price_history']  # Historial de precios
    
    def save_products(self, products_data, search_query):
        """
        Guarda productos obtenidos de las APIs en la base de datos
        VERSIÓN CORREGIDA que evita alertas falsas
        """
        try:
            saved_count = 0
            updated_count = 0
            
            # Recorrer productos de cada supermercado
            for supermarket_key, supermarket_data in products_data.items():
                if supermarket_data.get("success") and supermarket_data.get("products"):
                    
                    for product in supermarket_data["products"]:
                        # Crear identificador único MEJORADO
                        unique_id = self._generate_product_id_v2(product)
                        
                        # Buscar si el producto ya existe
                        existing_product = self.products_collection.find_one({
                            "unique_id": unique_id
                        })
                        
                        if existing_product:
                            # Actualizar producto existente SOLO si es el mismo producto
                            updated_product = self._update_existing_product_v2(existing_product, product)
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

    # REEMPLAZAR ESTE MÉTODO EN TU product_model.py

    def _generate_product_id_v2(self, product):
        """
        VERSIÓN CORREGIDA: Genera un ID único que diferencia por CANTIDADES/TAMAÑOS
        """
        try:
            name = product.get("name", "").lower().strip()
            supermarket = product.get("supermarket_key", "")
            
            if not name or not supermarket:
                return f"unknown_{int(datetime.now().timestamp())}"
            
            # 1. Extraer características específicas MEJORADO
            extracted_features = self._extract_product_features_enhanced(name)
            
            # 2. Limpiar nombre manteniendo palabras clave IMPORTANTES
            clean_name = self._clean_product_name_enhanced(name)
            
            # 3. Construir ID específico que incluya CANTIDADES
            id_parts = [supermarket]
            
            # Agregar nombre limpio (máximo 4 palabras más importantes)
            if clean_name:
                name_words = clean_name.split()[:4]
                id_parts.extend(name_words)
            
            # CRÍTICO: Agregar cantidad/tamaño SIEMPRE
            if extracted_features.get("quantity"):
                id_parts.append(extracted_features["quantity"])
            
            if extracted_features.get("unit"):
                id_parts.append(extracted_features["unit"])
            
            if extracted_features.get("pack_size"):
                id_parts.append(f"pack{extracted_features['pack_size']}")
            
            # Agregar otras características
            if extracted_features.get("brand"):
                id_parts.append(extracted_features["brand"][:8])
            
            # Crear ID final
            unique_id = "_".join(id_parts).lower()
            
            # Limitar longitud pero mantener especificidad
            if len(unique_id) > 120:
                unique_id = unique_id[:120]
            
            # Limpiar caracteres problemáticos
            unique_id = re.sub(r'[^\w_]', '', unique_id)
            
            print(f"   🆔 ID generado: {unique_id[:50]}{'...' if len(unique_id) > 50 else ''}")
            
            return unique_id
            
        except Exception as e:
            print(f"Error generando ID de producto: {e}")
            return f"error_{int(datetime.now().timestamp())}"

    def _extract_product_features_enhanced(self, name):
        """
        VERSIÓN MEJORADA: Extrae cantidades, unidades y tamaños con mayor precisión
        """
        features = {
            "quantity": None,
            "unit": None,
            "pack_size": None,
            "brand": None,
            "type": None
        }
        
        try:
            # Patrones MEJORADOS para cantidades/unidades
            quantity_patterns = [
                # Unidades específicas
                r'(\d+)\s*(?:un|unidades?|piezas?|pcs?)\b',
                r'paquete\s*(\d+)\s*(?:un|unidades?)',
                r'bandeja\s*(\d+)\s*(?:un|unidades?)',
                r'pack\s*(\d+)\s*(?:un|unidades?)',
                r'(\d+)\s*pack',
                
                # Volúmenes
                r'(\d+(?:\.\d+)?)\s*(?:ml|mililitros?)\b',
                r'(\d+(?:\.\d+)?)\s*(?:lt?|l|litros?)\b',
                r'caja\s*(\d+(?:\.\d+)?)\s*(?:ml|l)',
                
                # Pesos
                r'(\d+(?:\.\d+)?)\s*(?:gr?|g|gramos?)\b',
                r'(\d+(?:\.\d+)?)\s*(?:kg|kilogramos?)\b',
                r'bolsa\s*(\d+(?:\.\d+)?)\s*(?:kg|g)',
                
                # Combinaciones especiales
                r'(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*(?:ml|l|g|kg)',
                r'(\d+)\s*x\s*(\d+)\s*(?:un|unidades?)',
            ]
            
            # Buscar cantidad principal
            for pattern in quantity_patterns:
                match = re.search(pattern, name, re.IGNORECASE)
                if match:
                    if 'x' in pattern:
                        # Para patrones como "6 x 390g" o "3 x 1L"
                        features["pack_size"] = match.group(1)
                        features["quantity"] = match.group(2)
                        # Extraer unidad del patrón
                        unit_match = re.search(r'(ml|l|g|kg|un)', match.group(0), re.IGNORECASE)
                        if unit_match:
                            features["unit"] = unit_match.group(1).lower()
                    else:
                        features["quantity"] = match.group(1)
                        # Determinar unidad basada en el patrón
                        if 'ml' in pattern or 'mililitros' in pattern:
                            features["unit"] = "ml"
                        elif 'lt' in pattern or 'litros' in pattern:
                            features["unit"] = "l"
                        elif 'gr' in pattern or 'gramos' in pattern:
                            features["unit"] = "g"
                        elif 'kg' in pattern:
                            features["unit"] = "kg"
                        elif 'un' in pattern or 'unidades' in pattern or 'piezas' in pattern:
                            features["unit"] = "un"
                    break
            
            # Buscar tamaño de paquete si no se encontró en cantidad
            if not features.get("pack_size"):
                pack_patterns = [
                    r'paquete\s*(\d+)',
                    r'pack\s*(\d+)',
                    r'bandeja\s*(\d+)',
                    r'caja\s*(\d+)',
                    r'bolsa\s*(\d+)',
                    r'(\d+)pack'
                ]
                
                for pattern in pack_patterns:
                    match = re.search(pattern, name, re.IGNORECASE)
                    if match:
                        features["pack_size"] = match.group(1)
                        break
            
            # Extraer marca conocida
            brand_patterns = [
                r'\b(GLORIA|LAIVE|NESTLE|BIMBO|BELLS?|CALERA|ARTISAN|EMSAL|PALMOLIVE|AYUDIN|SAPOLIO|ARIEL|ACE|BOLIVAR|MAGGI|PRIMOR|COSTEÑO|PILSEN|COCA\s*COLA|INCA\s*KOLA)\b'
            ]
            
            for pattern in brand_patterns:
                match = re.search(pattern, name, re.IGNORECASE)
                if match:
                    features["brand"] = match.group(1).lower().replace(' ', '')
                    break
            
            return features
            
        except Exception as e:
            print(f"Error extrayendo características mejoradas: {e}")
            return features

    def _clean_product_name_enhanced(self, name):
        """
        VERSIÓN MEJORADA: Limpia el nombre manteniendo información CRÍTICA
        """
        try:
            # Remover caracteres especiales pero mantener espacios
            clean = re.sub(r'[^\w\s]', ' ', name.lower())
            
            # NO remover números de cantidades - son críticos para diferenciación
            
            # Remover palabras muy comunes que no aportan especificidad
            stopwords = [
                'de', 'del', 'la', 'el', 'los', 'las', 'en', 'con', 'para', 'y', 'o',
                'producto', 'articulo', 'item'
            ]
            
            words = clean.split()
            
            # Mantener palabras importantes incluyendo números
            meaningful_words = [
                w for w in words 
                if len(w) > 1 and w not in stopwords
            ]
            
            # Priorizar palabras con números (cantidades)
            number_words = [w for w in meaningful_words if re.search(r'\d', w)]
            text_words = [w for w in meaningful_words if not re.search(r'\d', w)]
            
            # Combinar: primero palabras de texto importantes, luego números
            final_words = text_words[:3] + number_words[:2]
            
            return " ".join(final_words[:5])  # Máximo 5 palabras
            
        except Exception as e:
            print(f"Error limpiando nombre mejorado: {e}")
            return name[:25]  # Fallback

    def _is_same_product_v3(self, product1, product2):
        """
        VERSIÓN MEJORADA: Verificación más estricta que considera cantidades
        """
        try:
            # 1. Deben ser del mismo supermercado
            if product1.get("supermarket_key") != product2.get("supermarket_key"):
                return False
            
            name1 = product1.get("name", "").lower()
            name2 = product2.get("name", "").lower()
            
            # 2. Extraer características de ambos productos
            features1 = self._extract_product_features_enhanced(name1)
            features2 = self._extract_product_features_enhanced(name2)
            
            # 3. CRÍTICO: Las cantidades DEBEN ser iguales
            quantity1 = features1.get("quantity")
            quantity2 = features2.get("quantity")
            
            if quantity1 and quantity2:
                # Normalizar para comparación
                try:
                    qty1_num = float(quantity1)
                    qty2_num = float(quantity2)
                    
                    # Si las cantidades son diferentes, NO son el mismo producto
                    if abs(qty1_num - qty2_num) > 0.01:  # Tolerancia mínima por decimales
                        print(f"Cantidades diferentes: {quantity1} vs {quantity2}")
                        return False
                except ValueError:
                    # Si no se pueden convertir a números, comparar como strings
                    if quantity1 != quantity2:
                        print(f"Cantidades diferentes (string): {quantity1} vs {quantity2}")
                        return False
            
            # 4. CRÍTICO: Las unidades DEBEN ser iguales
            unit1 = features1.get("unit")
            unit2 = features2.get("unit")
            
            if unit1 and unit2 and unit1 != unit2:
                print(f"Unidades diferentes: {unit1} vs {unit2}")
                return False
            
            # 5. CRÍTICO: Los tamaños de paquete DEBEN ser iguales
            pack1 = features1.get("pack_size")
            pack2 = features2.get("pack_size")
            
            if pack1 and pack2 and pack1 != pack2:
                print(f"Tamaños de paquete diferentes: {pack1} vs {pack2}")
                return False
            
            # 6. Verificar marca si está disponible
            brand1 = features1.get("brand")
            brand2 = features2.get("brand")
            
            if brand1 and brand2 and brand1 != brand2:
                print(f"Marcas diferentes: {brand1} vs {brand2}")
                return False
            
            # 7. Comparar similitud de nombres básicos (sin cantidades)
            clean_name1 = self._clean_product_name_enhanced(name1)
            clean_name2 = self._clean_product_name_enhanced(name2)
            
            if not clean_name1 or not clean_name2:
                return False
            
            # Remover números de los nombres para comparación de similitud básica
            name1_no_numbers = re.sub(r'\d+', '', clean_name1)
            name2_no_numbers = re.sub(r'\d+', '', clean_name2)
            
            words1 = set(name1_no_numbers.split())
            words2 = set(name2_no_numbers.split())
            
            if len(words1) == 0 or len(words2) == 0:
                return False
            
            common_words = words1.intersection(words2)
            total_words = words1.union(words2)
            
            similarity = len(common_words) / len(total_words)
            
            # Requerir alta similitud en nombres básicos
            is_similar = similarity >= 0.75
            
            if not is_similar:
                print(f"Baja similitud de nombres base ({similarity:.2f}): '{name1_no_numbers}' vs '{name2_no_numbers}'")
            
            return is_similar
            
        except Exception as e:
            print(f"Error comparando productos v3: {e}")
            return False

    def _extract_product_features(self, name):
        """
        Extrae características específicas del producto (tamaño, marca, tipo)
        """
        features = {
            "size": None,
            "brand": None,
            "type": None
        }
        
        try:
            # Patrones para extraer tamaños/cantidades
            size_patterns = [
                r'(\d+(?:\.\d+)?)\s*(?:ml|mililitros?)',
                r'(\d+(?:\.\d+)?)\s*(?:lt?|litros?)', 
                r'(\d+(?:\.\d+)?)\s*(?:gr?|gramos?)',
                r'(\d+(?:\.\d+)?)\s*(?:kg|kilogramos?)',
                r'(\d+(?:\.\d+)?)\s*(?:und?|unidades?)',
                r'(\d+)\s*(?:x\s*\d+)',
                r'(\d+(?:\.\d+)?)\s*(?:oz|onzas?)',
                r'(\d+)\s*(?:pack|pcs?|piezas?)'
            ]
            
            # Buscar tamaño
            for pattern in size_patterns:
                match = re.search(pattern, name, re.IGNORECASE)
                if match:
                    # Normalizar el tamaño encontrado
                    size_text = match.group(0).lower().replace(" ", "")
                    features["size"] = size_text
                    break
            
            # Extraer marca común (primeras palabras en mayúsculas)
            brand_patterns = [
                r'\b([A-ZÁÉÍÓÚÜ][A-ZÁÉÍÓÚÜ\s]{2,15})\b',  # Palabras en mayúsculas
                r'\b(AYUDIN|SAPOLIO|ARIEL|ACE|BOLIVAR|GLORIA|NESTLE|MAGGI)\b'  # Marcas conocidas
            ]
            
            for pattern in brand_patterns:
                match = re.search(pattern, name, re.IGNORECASE)
                if match:
                    features["brand"] = match.group(1).lower().strip()
                    break
            
        except Exception as e:
            print(f"Error extrayendo características: {e}")
        
        return features

    def _clean_product_name(self, name):
        """
        Limpia el nombre del producto manteniendo palabras clave importantes
        """
        try:
            # Remover caracteres especiales
            clean = re.sub(r'[^\w\s]', ' ', name.lower())
            
            # Remover números de tamaños que ya extraemos por separado
            clean = re.sub(r'\d+(?:\.\d+)?(?:\s*(?:ml|lt|gr|kg|und|x|oz|pack|pcs))', '', clean)
            
            # Remover palabras muy comunes que no aportan especificidad
            stopwords = [
                'de', 'del', 'la', 'el', 'los', 'las', 'en', 'con', 'para', 'y', 'o',
                'producto', 'articulo', 'item', 'unidad', 'pieza'
            ]
            
            words = clean.split()
            meaningful_words = [
                w for w in words 
                if len(w) > 2 and w not in stopwords
            ]
            
            return " ".join(meaningful_words[:4])  # Máximo 4 palabras
            
        except Exception as e:
            print(f"Error limpiando nombre: {e}")
            return name[:20]  # Fallback

    def _update_existing_product_v2(self, existing_product, new_product):
        """
        VERSIÓN CORREGIDA: Actualiza producto existente con validaciones estrictas
        """
        try:
            # VALIDACIÓN CRÍTICA: Verificar que sea realmente el mismo producto
            if not self._is_same_product_v3(existing_product, new_product):
                print(f"⚠️ PRODUCTOS DIFERENTES detectados con mismo ID:")
                print(f"   Existente: {existing_product.get('name')}")
                print(f"   Nuevo: {new_product.get('name')}")
                
                # Crear nuevo producto con ID único para evitar conflictos
                new_unique_id = self._generate_product_id_v2(new_product) + f"_alt_{int(datetime.now().timestamp())}"
                self._create_new_product(new_product, new_unique_id, "conflict_resolved")
                return False
            
            unique_id = existing_product["unique_id"]
            old_price = float(existing_product.get("price", 0))
            new_price = float(new_product.get("price", 0))
            
            # VALIDAR CAMBIOS DE PRECIO Y CREAR ALERTAS CORRECTAMENTE
            if old_price > 0 and new_price > 0 and old_price != new_price:
                
                # Calcular cambios
                price_difference = abs(new_price - old_price)
                percentage_change = abs((new_price - old_price) / old_price * 100)
                
                # FILTROS ESTRICTOS para evitar alertas falsas
                should_create_alert = self._should_create_price_alert(
                    old_price, new_price, price_difference, percentage_change
                )
                
                if should_create_alert:
                    try:
                        from models.alert_model import alert_model
                        
                        product_data_for_alert = {
                            "unique_id": unique_id,
                            "name": existing_product.get("name"),
                            "brand": existing_product.get("brand"),
                            "supermarket": existing_product.get("supermarket"),
                            "supermarket_key": existing_product.get("supermarket_key"),
                            "url": existing_product.get("url"),
                            "categories": existing_product.get("categories", [])
                        }
                        
                        alert_id = alert_model.create_price_change_alert(
                            product_data=product_data_for_alert,
                            old_price=old_price,
                            new_price=new_price
                        )
                        
                        if alert_id:
                            print(f"✅ Alerta válida creada: {existing_product.get('name')} - S/{old_price:.2f} -> S/{new_price:.2f}")
                        
                    except ImportError:
                        print("Warning: alert_model no disponible")
                    except Exception as e:
                        print(f"Error creando alerta: {e}")
                else:
                    print(f"Cambio de precio registrado pero no genera alerta: S/{old_price:.2f} -> S/{new_price:.2f} ({percentage_change:.1f}%)")
            
            # Actualizar datos del producto
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
                    "updated_at": datetime.now().isoformat(),
                    "update_count": existing_product.get("update_count", 0) + 1
                }
            }
            
            result = self.products_collection.update_one(
                {"unique_id": unique_id},
                update_doc
            )
            
            # Guardar en historial de precios (independiente de alertas)
            if new_price > 0:
                self._save_price_history(unique_id, new_price)
            
            return result.modified_count > 0
            
        except Exception as e:
            print(f"Error actualizando producto: {e}")
            return False

    def _is_same_product_v2(self, product1, product2):
        """
        VERSIÓN CORREGIDA: Verifica que dos productos sean realmente el mismo
        """
        try:
            # 1. Deben ser del mismo supermercado
            if product1.get("supermarket_key") != product2.get("supermarket_key"):
                return False
            
            name1 = product1.get("name", "").lower()
            name2 = product2.get("name", "").lower()
            
            # 2. Extraer y comparar características específicas
            features1 = self._extract_product_features(name1)
            features2 = self._extract_product_features(name2)
            
            # Si ambos tienen tamaño, DEBEN coincidir exactamente
            size1 = features1.get("size")
            size2 = features2.get("size")
            
            if size1 and size2:
                # Normalizar tamaños para comparación
                size1_normalized = re.sub(r'[^\d.]', '', size1)
                size2_normalized = re.sub(r'[^\d.]', '', size2)
                
                if size1_normalized != size2_normalized:
                    print(f"Tamaños diferentes: {size1} vs {size2}")
                    return False
            
            # 3. Comparar marcas si están disponibles
            brand1 = features1.get("brand")
            brand2 = features2.get("brand")
            
            if brand1 and brand2 and brand1 != brand2:
                print(f"Marcas diferentes: {brand1} vs {brand2}")
                return False
            
            # 4. Comparar similitud de nombres (sin tamaños ni marcas)
            clean_name1 = self._clean_product_name(name1)
            clean_name2 = self._clean_product_name(name2)
            
            if not clean_name1 or not clean_name2:
                return False
            
            # Calcular similitud de palabras clave
            words1 = set(clean_name1.split())
            words2 = set(clean_name2.split())
            
            if len(words1) == 0 or len(words2) == 0:
                return False
            
            common_words = words1.intersection(words2)
            total_words = words1.union(words2)
            
            similarity = len(common_words) / len(total_words)
            
            # Requerir al menos 85% de similitud para considerar el mismo producto
            is_similar = similarity >= 0.85
            
            if not is_similar:
                print(f"Baja similitud ({similarity:.2f}): '{clean_name1}' vs '{clean_name2}'")
            
            return is_similar
            
        except Exception as e:
            print(f"Error comparando productos: {e}")
            return False

    def _should_create_price_alert(self, old_price, new_price, price_difference, percentage_change):
        """
        Determina si un cambio de precio merece una alerta
        FILTROS ESTRICTOS para evitar spam de alertas
        """
        try:
            # Filtro 1: Cambio mínimo absoluto
            min_absolute_change = 0.50  # 50 centavos mínimo
            if price_difference < min_absolute_change:
                return False
            
            # Filtro 2: Cambio porcentual mínimo
            min_percentage_change = 5.0  # 5% mínimo
            
            # Ajustar umbrales según precio del producto
            if old_price > 50:
                min_percentage_change = 3.0  # 3% para productos caros
            elif old_price < 10:
                min_percentage_change = 8.0  # 8% para productos baratos
                min_absolute_change = 0.30   # 30 centavos para productos baratos
            
            if percentage_change < min_percentage_change:
                return False
            
            # Filtro 3: Cambio máximo razonable (evitar errores obvios)
            max_reasonable_change = 150.0  # 150% máximo
            if percentage_change > max_reasonable_change:
                print(f"Cambio demasiado extremo ({percentage_change:.1f}%), probablemente error de datos")
                return False
            
            # Filtro 4: Evitar oscilaciones (mismo precio en las últimas 24h)
            # TODO: Implementar si se necesita más adelante
            
            return True
            
        except Exception as e:
            print(f"Error validando si crear alerta: {e}")
            return False

    # Mantener métodos existentes que funcionan bien
    def search_products_for_comparison(self, query, limit=100):
        """
        Búsqueda específica para comparación de precios
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
                {"$sort": {"search_score": -1, "price": 1}},
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
        Busca productos usando Atlas Search
        """
        try:
            query_clean = query.strip()
            
            pipeline = [
                {
                    "$search": {
                        "index": "products_search_index",
                        "compound": {
                            "should": [
                                {
                                    "text": {
                                        "query": query_clean,
                                        "path": "name",
                                        "score": {"boost": {"value": 3}}
                                    }
                                },
                                {
                                    "text": {
                                        "query": query_clean,
                                        "path": "brand",
                                        "score": {"boost": {"value": 2}}
                                    }
                                },
                                {
                                    "text": {
                                        "query": query_clean,
                                        "path": "categories",
                                        "score": {"boost": {"value": 1.5}}
                                    }
                                }
                            ],
                            "minimumShouldMatch": 1
                        }
                    }
                }
            ]
            
            if supermarket:
                pipeline.append({
                    "$match": {
                        "supermarket_key": supermarket
                    }
                })
            
            pipeline.append({
                "$addFields": {
                    "search_score": {"$meta": "searchScore"}
                }
            })
            
            # Ordenamiento
            if sort_by == "relevance":
                sort_stage = {"$sort": {"search_score": -1}}
            elif sort_by == "price":
                sort_stage = {"$sort": {"price": 1, "search_score": -1}}
            elif sort_by == "price_desc":
                sort_stage = {"$sort": {"price": -1, "search_score": -1}}
            elif sort_by == "name":
                sort_stage = {"$sort": {"name": 1, "search_score": -1}}
            else:
                sort_stage = {"$sort": {"scraped_at": -1, "search_score": -1}}
            
            pipeline.append(sort_stage)
            pipeline.append({"$limit": limit})
            
            products = list(self.products_collection.aggregate(pipeline))
            
            for product in products:
                product["_id"] = str(product["_id"])
                if "search_score" in product:
                    product["search_score"] = round(product["search_score"], 2)
            
            return products
            
        except Exception as e:
            print(f"Error en Atlas Search: {e}")
            return []

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
                "search_queries": [search_query],
                "update_count": 0
            }
            
            result = self.products_collection.insert_one(product_doc)
            
            # Guardar historial de precios
            if product.get("price", 0) > 0:
                self._save_price_history(unique_id, product.get("price", 0))
            
            return result.inserted_id
            
        except Exception as e:
            print(f"Error creando producto: {e}")
            return None

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
            
            today = datetime.now().date()
            existing_search = self.search_history_collection.find_one({
                "search_query": search_query.lower(),
                "timestamp": {
                    "$gte": today.isoformat(),
                    "$lt": (today + timedelta(days=1)).isoformat()
                }
            })
            
            if existing_search:
                self.search_history_collection.update_one(
                    {"_id": existing_search["_id"]},
                    {
                        "$inc": {"search_count": 1},
                        "$set": {"timestamp": datetime.now().isoformat()}
                    }
                )
            else:
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

    # === MÉTODO DE LIMPIEZA Y CORRECCIÓN ===
    def fix_existing_product_conflicts(self):
        """
        EJECUTAR UNA VEZ: Corrige conflictos existentes en la base de datos
        """
        try:
            print("🔧 Iniciando corrección de conflictos de productos...")
            
            # 1. Encontrar productos con el mismo unique_id pero nombres muy diferentes
            pipeline = [
                {
                    "$group": {
                        "_id": "$unique_id",
                        "count": {"$sum": 1},
                        "products": {"$push": "$$ROOT"}
                    }
                },
                {
                    "$match": {"count": {"$gt": 1}}
                }
            ]
            
            conflicts = list(self.products_collection.aggregate(pipeline))
            
            print(f"📊 Encontrados {len(conflicts)} grupos con posibles conflictos")
            
            fixed_count = 0
            
            for conflict_group in conflicts:
                products = conflict_group["products"]
                
                # Verificar si realmente son productos diferentes
                for i, product1 in enumerate(products):
                    for j, product2 in enumerate(products[i+1:], i+1):
                        
                        if not self._is_same_product_v2(product1, product2):
                            # Son productos diferentes con mismo ID - corregir
                            new_id = self._generate_product_id_v2(product2) + f"_fix_{int(datetime.now().timestamp())}"
                            
                            self.products_collection.update_one(
                                {"_id": product2["_id"]},
                                {"$set": {"unique_id": new_id}}
                            )
                            
                            print(f"✅ ID corregido: {product2.get('name')} -> {new_id}")
                            fixed_count += 1
            
            print(f"✅ Corrección completada: {fixed_count} productos re-indexados")
            
            return fixed_count
            
        except Exception as e:
            print(f"❌ Error en corrección: {e}")
            return 0

    # === MANTENER MÉTODOS EXISTENTES ===
    def get_price_comparison(self, product_name, days_back=7):
        """
        Obtiene comparación de precios de un producto entre supermercados
        """
        try:
            date_limit = datetime.now() - timedelta(days=days_back)
            
            products = list(self.products_collection.find({
                "name": {"$regex": product_name, "$options": "i"},
                "scraped_at": {"$gte": date_limit.isoformat()}
            }))
            
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
                    
                    if comparison[supermarket]["min_price"] == float('inf'):
                        comparison[supermarket]["min_price"] = 0
            
            return comparison
            
        except Exception as e:
            print(f"Error en comparación de precios: {e}")
            return {}

    def get_popular_searches(self, limit=10):
        """
        Obtiene las búsquedas más populares
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

    def get_product_price_history(self, product_name, supermarket_key=None, days_back=30):
        """
        Obtiene el historial de precios de un producto específico
        """
        try:
            date_limit = datetime.now() - timedelta(days=days_back)
            
            match_query = {
                "name": {"$regex": f"^{re.escape(product_name)}", "$options": "i"},
                "scraped_at": {"$gte": date_limit.isoformat()},
                "price": {"$gt": 0}
            }
            
            if supermarket_key:
                match_query["supermarket_key"] = supermarket_key
            
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
                        "scraped_date": {"$ne": None}
                    }
                },
                {
                    "$group": {
                        "_id": {
                            "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$scraped_date"}},
                            "supermarket": "$supermarket_key"
                        },
                        "price": {"$avg": "$price"},
                        "supermarket_name": {"$first": "$supermarket"},
                        "product_name": {"$first": "$name"},
                        "count": {"$sum": 1}
                    }
                },
                {
                    "$sort": {
                        "_id.date": 1
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
            
            history_data = list(self.products_collection.aggregate(pipeline))
            print(f"Historial encontrado para '{product_name}': {len(history_data)} registros")
            
            return history_data
            
        except Exception as e:
            print(f"Error obteniendo historial de precios: {e}")
            return []

    def get_product_price_trend(self, product_name, days_back=30):
        """
        Obtiene la tendencia de precios agregada por fecha
        """
        try:
            history_data = self.get_product_price_history(product_name, days_back=days_back)
            
            if not history_data:
                return {"labels": [], "prices": [], "dates": []}
            
            grouped_by_date = {}
            for record in history_data:
                date = record["date"]
                if date not in grouped_by_date:
                    grouped_by_date[date] = []
                grouped_by_date[date].append(record["price"])
            
            dates = sorted(grouped_by_date.keys())
            prices = []
            labels = []
            
            for date in dates:
                daily_prices = grouped_by_date[date]
                avg_price = sum(daily_prices) / len(daily_prices)
                prices.append(round(avg_price, 2))
                
                date_obj = datetime.strptime(date, "%Y-%m-%d")
                labels.append(date_obj.strftime("%d %b"))
            
            return {
                "labels": labels,
                "prices": prices,
                "dates": dates,
                "data_points": len(history_data)
            }
            
        except Exception as e:
            print(f"Error calculando tendencia: {e}")
            return {"labels": [], "prices": [], "dates": []}

    def get_all_products(self, page=1, limit=50, sort_by="scraped_at", supermarket=None):
        """
        Obtiene todos los productos guardados con paginación
        """
        try:
            filter_query = {}
            if supermarket:
                filter_query["supermarket_key"] = supermarket
            
            sort_options = {
                "price": [("price", 1)],
                "price_desc": [("price", -1)],
                "name": [("name", 1)],
                "scraped_at": [("scraped_at", -1)],
                "updated_at": [("updated_at", -1)]
            }
            
            sort_order = sort_options.get(sort_by, [("scraped_at", -1)])
            skip = (page - 1) * limit
            
            products = list(self.products_collection.find(
                filter_query
            ).sort(sort_order).skip(skip).limit(limit))
            
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
            
            print(f"Limpieza: {result.deleted_count} productos antiguos eliminados")
            return result.deleted_count
            
        except Exception as e:
            print(f"Error limpiando productos antiguos: {e}")
            return 0

    def clean_duplicate_products(self):
        """
        Elimina productos duplicados
        """
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
            ids_to_delete = group["duplicates"][:-1]  
            result = self.products_collection.delete_many({
                "_id": {"$in": ids_to_delete}
            })
            deleted_count += result.deleted_count
        
        print(f"Eliminados {deleted_count} productos duplicados")
        return deleted_count

    def get_total_products(self):
        return self.products_collection.count_documents({})

    def get_total_supermarkets(self):
        return len(self.products_collection.distinct("supermarket_key"))

    def get_total_updates(self):
        return self.products_collection.count_documents({"updated_at": {"$exists": True}})


    # Métodos que necesitas AGREGAR a tu product_model.py

    def get_product_by_unique_id(self, unique_id):
        """
        Obtiene un producto por su unique_id
        """
        try:
            if not unique_id:
                return None
                
            product = self.products_collection.find_one({"unique_id": unique_id})
            
            if product:
                product["_id"] = str(product["_id"])
            
            return product
            
        except Exception as e:
            print(f"❌ Error obteniendo producto por unique_id: {e}")
            return None

    def save_single_product(self, product_data, search_term):
        """
        Guarda UN solo producto en la base de datos
        """
        try:
            if not product_data or not product_data.get("unique_id"):
                return False
            
            # Preparar documento
            product_doc = {
                **product_data,
                "search_term": search_term,
                "scraped_at": datetime.now().isoformat(),
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            # Insertar producto
            result = self.products_collection.insert_one(product_doc)
            
            if result.inserted_id:
                print(f"✅ Producto guardado: {product_data.get('name')}")
                return True
            else:
                return False
                
        except Exception as e:
            print(f"❌ Error guardando producto individual: {e}")
            return False

    def update_product(self, product_data):
        """
        Actualiza un producto existente
        """
        try:
            unique_id = product_data.get("unique_id")
            if not unique_id:
                return False
            
            # Preparar datos de actualización
            update_data = {
                **product_data,
                "updated_at": datetime.now().isoformat(),
                "last_seen": datetime.now().isoformat()
            }
            
            # Actualizar producto
            result = self.products_collection.update_one(
                {"unique_id": unique_id},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                print(f"✅ Producto actualizado: {product_data.get('name')}")
                return True
            else:
                # El producto existe pero no hubo cambios
                return True
                
        except Exception as e:
            print(f"❌ Error actualizando producto: {e}")
            return False

    def update_last_database_update(self):
        """
        Actualiza el timestamp de la última actualización de base de datos
        """
        try:
            from services.db import db
            
            # Guardar en colección de configuración
            config_collection = db["system_config"]
            
            config_collection.update_one(
                {"key": "last_database_update"},
                {
                    "$set": {
                        "key": "last_database_update",
                        "value": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat()
                    }
                },
                upsert=True
            )
            
            print("✅ Timestamp de última actualización guardado")
            return True
            
        except Exception as e:
            print(f"❌ Error actualizando timestamp: {e}")
            return False

    def get_last_database_update(self):
        """
        Obtiene la fecha de la última actualización de base de datos
        """
        try:
            from services.db import db
            
            config_collection = db["system_config"]
            config = config_collection.find_one({"key": "last_database_update"})
            
            if config:
                return config.get("value")
            else:
                return None
                
        except Exception as e:
            print(f"❌ Error obteniendo último update: {e}")
            return None

    def clean_old_products(self, days_old=15):
        """
        MEJORADA: Limpia productos muy antiguos
        """
        try:
            from datetime import timedelta
            
            cutoff_date = datetime.now() - timedelta(days=days_old)
            
            # Eliminar productos que no se han visto en X días
            result = self.products_collection.delete_many({
                "$or": [
                    {"updated_at": {"$lt": cutoff_date.isoformat()}},
                    {"last_seen": {"$lt": cutoff_date.isoformat()}},
                    # Productos sin updated_at (muy antiguos)
                    {"updated_at": {"$exists": False}}
                ]
            })
            
            deleted_count = result.deleted_count
            
            if deleted_count > 0:
                print(f"🧹 Limpieza: {deleted_count} productos antiguos eliminados")
            
            return deleted_count
            
        except Exception as e:
            print(f"❌ Error limpiando productos antiguos: {e}")
            return 0

    def get_products_needing_update(self, hours_old=24):
        """
        NUEVA: Obtiene productos que necesitan actualización
        """
        try:
            from datetime import timedelta
            
            cutoff_date = datetime.now() - timedelta(hours=hours_old)
            
            products = list(self.products_collection.find({
                "$or": [
                    {"updated_at": {"$lt": cutoff_date.isoformat()}},
                    {"updated_at": {"$exists": False}}
                ]
            }).limit(100))
            
            for product in products:
                product["_id"] = str(product["_id"])
            
            return products
            
        except Exception as e:
            print(f"❌ Error obteniendo productos para actualizar: {e}")
            return []

    def create_price_history_entry(self, product_unique_id, old_price, new_price, product_data=None):
        """
        NUEVA: Crea entrada específica en historial de precios
        """
        try:
            if not product_unique_id or old_price <= 0 or new_price <= 0:
                return None
            
            # Calcular cambio
            price_difference = round(new_price - old_price, 2)
            percentage_change = round(((new_price - old_price) / old_price) * 100, 1)
            
            # Crear documento de historial
            history_entry = {
                "product_unique_id": product_unique_id,
                "product_name": product_data.get("name") if product_data else "Producto desconocido",
                "old_price": old_price,
                "new_price": new_price,
                "price_difference": price_difference,
                "percentage_change": percentage_change,
                "supermarket": product_data.get("supermarket") if product_data else None,
                "supermarket_key": product_data.get("supermarket_key") if product_data else None,
                "timestamp": datetime.now().isoformat(),
                "source": "automatic_update",
                "created_at": datetime.now().isoformat()
            }
            
            # Insertar en colección de historial
            result = self.price_history_collection.insert_one(history_entry)
            
            if result.inserted_id:
                print(f"📊 Historial de precio creado: {product_data.get('name') if product_data else product_unique_id}")
                print(f"   Cambio: S/{old_price:.2f} → S/{new_price:.2f} ({percentage_change:+.1f}%)")
                return result.inserted_id
            
            return None
            
        except Exception as e:
            print(f"❌ Error creando entrada de historial: {e}")
            return None

    def get_price_changes_summary(self, days_back=7):
        """
        NUEVA: Obtiene resumen de cambios de precio
        """
        try:
            from datetime import timedelta
            
            cutoff_date = datetime.now() - timedelta(days=days_back)
            
            # Contar cambios por tipo
            pipeline = [
                {"$match": {"timestamp": {"$gte": cutoff_date.isoformat()}}},
                {
                    "$group": {
                        "_id": None,
                        "total_changes": {"$sum": 1},
                        "price_increases": {
                            "$sum": {"$cond": [{"$gt": ["$price_difference", 0]}, 1, 0]}
                        },
                        "price_decreases": {
                            "$sum": {"$cond": [{"$lt": ["$price_difference", 0]}, 1, 0]}
                        },
                        "avg_percentage_change": {"$avg": "$percentage_change"},
                        "max_increase": {"$max": "$percentage_change"},
                        "max_decrease": {"$min": "$percentage_change"}
                    }
                }
            ]
            
            result = list(self.price_history_collection.aggregate(pipeline))
            
            if result:
                summary = result[0]
                return {
                    "period_days": days_back,
                    "total_changes": summary.get("total_changes", 0),
                    "price_increases": summary.get("price_increases", 0),
                    "price_decreases": summary.get("price_decreases", 0),
                    "avg_percentage_change": round(summary.get("avg_percentage_change", 0), 1),
                    "max_increase": round(summary.get("max_increase", 0), 1),
                    "max_decrease": round(summary.get("max_decrease", 0), 1)
                }
            else:
                return {
                    "period_days": days_back,
                    "total_changes": 0,
                    "price_increases": 0,
                    "price_decreases": 0,
                    "avg_percentage_change": 0,
                    "max_increase": 0,
                    "max_decrease": 0
                }
                
        except Exception as e:
            print(f"❌ Error obteniendo resumen de cambios: {e}")
            return None
# Crear instancia global
product_model = Product()