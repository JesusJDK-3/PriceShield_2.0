# alert_model.py - VERSIÓN COMPLETA CORREGIDA
from services.db import db
from datetime import datetime, timedelta
from bson import ObjectId

class Alert:
    def __init__(self):
        self.alerts_collection = db["alerts"]

    def create_price_change_alert(self, product_data, old_price, new_price):
        """
        CORREGIDA: Crea alerta SOLO para cambios de precio del MISMO producto
        No compara con otros productos, solo con el precio anterior del mismo producto
        """
        try:
            # Validar datos básicos
            old_price = float(old_price)
            new_price = float(new_price)
            product_unique_id = product_data.get("unique_id")
            
            if not product_unique_id:
                print("❌ No se puede crear alerta: falta unique_id del producto")
                return None
            
            if old_price <= 0 or new_price <= 0:
                print(f"❌ Precios inválidos: old={old_price}, new={new_price}")
                return None
            
            # VALIDACIÓN CRÍTICA: Verificar que NO haya alertas muy recientes para evitar spam
            if self._has_recent_alert_for_same_product(product_unique_id, hours_back=6):
                print(f"🔄 Alerta reciente ya existe para {product_data.get('name')} - evitando spam")
                return None
            
            # Calcular cambio de precio CORRECTO
            price_difference = round(new_price - old_price, 2)
            percentage_change = round(((new_price - old_price) / old_price) * 100, 1)
            
            # Validar que el cambio sea significativo
            if not self._is_significant_price_change_same_product(old_price, new_price, percentage_change):
                print(f"📊 Cambio no significativo para {product_data.get('name')}: S/{old_price} -> S/{new_price} ({percentage_change}%)")
                return None
            
            # Determinar tipo de cambio
            is_price_increase = new_price > old_price
            
            if is_price_increase:
                change_type = "subida"
                alert_text = f"↑{abs(percentage_change):.1f}%"
                alert_color = "red"
            else:
                change_type = "bajada"
                alert_text = f"↓{abs(percentage_change):.1f}%"
                alert_color = "green"
            
            # Crear documento de alerta
            alert_doc = {
                # Identificación del producto
                "product_name": product_data.get("name"),
                "product_id": product_unique_id,  # Este es el MISMO producto
                "supermarket": product_data.get("supermarket"),
                "supermarket_key": product_data.get("supermarket_key"),
                "product_url": product_data.get("url"),
                "categories": product_data.get("categories", []),
                
                # Datos del cambio de precio
                "old_price": old_price,
                "new_price": new_price,
                "price_difference": price_difference,
                "percentage_change": percentage_change,
                "is_price_increase": is_price_increase,
                "change_type": change_type,
                "alert_text": alert_text,
                "alert_color": alert_color,
                
                # Metadatos de la alerta
                "active": True,
                "is_read": False,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "alert_type": "same_product_price_change",  # Especificar tipo
                "source": "product_update"
            }
            
            # Insertar alerta en la base de datos
            result = self.alerts_collection.insert_one(alert_doc)
            
            print(f"✅ Alerta del MISMO producto creada: {product_data.get('name')}")
            print(f"   📊 Cambio: S/{old_price:.2f} → S/{new_price:.2f} ({alert_text})")
            print(f"   🆔 Producto ID: {product_unique_id}")
            
            return result.inserted_id
            
        except Exception as e:
            print(f"❌ Error creando alerta del mismo producto: {e}")
            return None

    def _has_recent_alert_for_same_product(self, product_unique_id, hours_back=6):
        """
        Verifica si ya existe una alerta reciente para el MISMO producto específico
        """
        try:
            time_limit = datetime.now() - timedelta(hours=hours_back)
            
            recent_alert = self.alerts_collection.find_one({
                "product_id": product_unique_id,  # MISMO unique_id
                "active": True,
                "created_at": {"$gte": time_limit.isoformat()}
            })
            
            return recent_alert is not None
            
        except Exception as e:
            print(f"❌ Error verificando alertas recientes: {e}")
            return False

    def _is_significant_price_change_same_product(self, old_price, new_price, percentage_change):
        """
        CORREGIDA: Determina si un cambio de precio del MISMO producto es significativo
        Criterios específicos para un solo producto
        """
        try:
            absolute_difference = abs(new_price - old_price)
            absolute_percentage = abs(percentage_change)
            
            # Criterios base para cambios significativos
            min_absolute_change = 0.30  # 30 centavos mínimo
            min_percentage_change = 3.0  # 3% mínimo
            
            # Ajustar según el precio del producto
            if old_price >= 100:
                # Productos caros (≥S/100): cambios más pequeños son significativos
                min_percentage_change = 2.0  # 2%
                min_absolute_change = 1.0    # S/1.00
            elif old_price >= 50:
                # Productos medianos (S/50-99): criterios normales
                min_percentage_change = 3.0  # 3%
                min_absolute_change = 0.75   # 75 centavos
            elif old_price >= 20:
                # Productos medianos-baratos (S/20-49): criterios normales
                min_percentage_change = 4.0  # 4%
                min_absolute_change = 0.50   # 50 centavos
            elif old_price >= 5:
                # Productos baratos (S/5-19): ser más estricto
                min_percentage_change = 6.0  # 6%
                min_absolute_change = 0.30   # 30 centavos
            else:
                # Productos muy baratos (<S/5): muy estricto
                min_percentage_change = 10.0  # 10%
                min_absolute_change = 0.20    # 20 centavos
            
            # Validar ambos criterios
            meets_absolute = absolute_difference >= min_absolute_change
            meets_percentage = absolute_percentage >= min_percentage_change
            
            # Evitar cambios extremos (probables errores)
            max_reasonable_change = 300.0  # 300% máximo
            is_reasonable = absolute_percentage <= max_reasonable_change
            
            # Debe cumplir AMBOS criterios y ser razonable
            is_significant = meets_absolute and meets_percentage and is_reasonable
            
            if not is_significant:
                reason = []
                if not meets_absolute:
                    reason.append(f"diferencia pequeña (S/{absolute_difference:.2f} < S/{min_absolute_change:.2f})")
                if not meets_percentage:
                    reason.append(f"porcentaje bajo ({absolute_percentage:.1f}% < {min_percentage_change:.1f}%)")
                if not is_reasonable:
                    reason.append(f"cambio extremo ({absolute_percentage:.1f}%)")
                
                print(f"   🔍 Cambio no significativo: {', '.join(reason)}")
            
            return is_significant
            
        except Exception as e:
            print(f"❌ Error validando significancia: {e}")
            return False

    def get_active_alerts(self, limit=50):
        """
        Obtiene alertas activas con validación
        """
        try:
            alerts = list(self.alerts_collection.find(
                {"active": True}
            ).sort([("created_at", -1)]).limit(limit))
            
            formatted_alerts = []
            for alert in alerts:
                # Convertir ObjectId a string
                alert["_id"] = str(alert["_id"])
                
                # Formatear fecha
                created_at = alert.get("created_at")
                if created_at:
                    try:
                        dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                        alert["formatted_date"] = dt.strftime("%d %b, %H:%M")
                    except:
                        alert["formatted_date"] = "Fecha inválida"
                
                # Validar datos básicos
                if alert.get("old_price", 0) > 0 and alert.get("new_price", 0) > 0:
                    formatted_alerts.append(alert)
                else:
                    # Marcar alerta inválida como inactiva
                    self.alerts_collection.update_one(
                        {"_id": ObjectId(alert["_id"])},
                        {"$set": {"active": False, "invalid_data": True}}
                    )
                    print(f"🗑️ Alerta con datos inválidos desactivada: {alert.get('product_name')}")
            
            return formatted_alerts
            
        except Exception as e:
            print(f"❌ Error obteniendo alertas: {e}")
            return []

    def get_active_alerts_count(self):
        """Obtiene el conteo de alertas activas no leídas"""
        return self.alerts_collection.count_documents({
            "active": True, 
            "is_read": False
        })

    def mark_as_read(self, alert_id):
        """Marca una alerta como leída"""
        try:
            result = self.alerts_collection.update_one(
                {"_id": ObjectId(alert_id)},
                {
                    "$set": {
                        "is_read": True,
                        "read_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat()
                    }
                }
            )
            
            if result.modified_count > 0:
                print(f"✅ Alerta {alert_id} marcada como leída")
            
            return result
            
        except Exception as e:
            print(f"❌ Error marcando alerta como leída: {e}")
            raise e

    def ignore_alert(self, alert_id):
        """Ignora/desactiva una alerta"""
        try:
            result = self.alerts_collection.update_one(
                {"_id": ObjectId(alert_id)},
                {
                    "$set": {
                        "active": False,
                        "ignored_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat()
                    }
                }
            )
            
            if result.modified_count > 0:
                print(f"✅ Alerta {alert_id} ignorada")
            
            return result
            
        except Exception as e:
            print(f"❌ Error ignorando alerta: {e}")
            raise e

    def mark_as_read_by_product(self, product_id):
        """
        Marca como leídas todas las alertas activas de un producto específico
        """
        try:
            if not product_id:
                return None
                
            result = self.alerts_collection.update_many(
                {
                    "product_id": product_id,
                    "active": True,
                    "is_read": False
                },
                {
                    "$set": {
                        "is_read": True,
                        "read_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat(),
                        "read_via": "dashboard_view"
                    }
                }
            )
            
            if result.modified_count > 0:
                print(f"✅ {result.modified_count} alertas del producto {product_id} marcadas como leídas")
            
            return result
            
        except Exception as e:
            print(f"❌ Error marcando alertas del producto: {e}")
            return None

    def get_user_alert_summary(self, user_id=None):
        """Obtiene resumen de alertas"""
        try:
            pipeline = [
                {"$match": {"active": True}},
                {
                    "$group": {
                        "_id": None,
                        "total_alerts": {"$sum": 1},
                        "unread_alerts": {
                            "$sum": {"$cond": [{"$eq": ["$is_read", False]}, 1, 0]}
                        },
                        "price_increases": {
                            "$sum": {"$cond": [
                                {"$and": [
                                    {"$eq": ["$is_price_increase", True]},
                                    {"$eq": ["$is_read", False]}
                                ]}, 1, 0
                            ]}
                        },
                        "price_decreases": {
                            "$sum": {"$cond": [
                                {"$and": [
                                    {"$eq": ["$is_price_increase", False]},
                                    {"$eq": ["$is_read", False]}
                                ]}, 1, 0
                            ]}
                        }
                    }
                }
            ]
            
            result = list(self.alerts_collection.aggregate(pipeline))
            
            if result:
                summary = result[0]
                return {
                    "total_alerts": summary.get("total_alerts", 0),
                    "unread_alerts": summary.get("unread_alerts", 0),
                    "price_increases": summary.get("price_increases", 0),
                    "price_decreases": summary.get("price_decreases", 0),
                    "read_alerts": summary.get("total_alerts", 0) - summary.get("unread_alerts", 0)
                }
            else:
                return {
                    "total_alerts": 0,
                    "unread_alerts": 0,
                    "price_increases": 0,
                    "price_decreases": 0,
                    "read_alerts": 0
                }
                
        except Exception as e:
            print(f"❌ Error obteniendo resumen: {e}")
            return {
                "total_alerts": 0,
                "unread_alerts": 0,
                "price_increases": 0,
                "price_decreases": 0,
                "read_alerts": 0
            }

    def cleanup_old_alerts(self, days_old=30):
        """
        Limpia alertas muy antiguas
        """
        try:
            cutoff_date = datetime.now() - timedelta(days=days_old)
            
            result = self.alerts_collection.delete_many({
                "created_at": {"$lt": cutoff_date.isoformat()}
            })
            
            if result.deleted_count > 0:
                print(f"🧹 Limpieza: {result.deleted_count} alertas antiguas eliminadas")
            
            return result.deleted_count
            
        except Exception as e:
            print(f"❌ Error limpiando alertas antiguas: {e}")
            return 0

    def get_alerts_by_supermarket(self, supermarket_key, limit=50):
        """
        Obtiene alertas filtradas por supermercado
        """
        try:
            alerts = list(self.alerts_collection.find({
                "active": True,
                "supermarket_key": supermarket_key
            }).sort([("created_at", -1)]).limit(limit))
            
            for alert in alerts:
                alert["_id"] = str(alert["_id"])
                
                # Formatear fecha si existe
                created_at = alert.get("created_at")
                if created_at:
                    try:
                        dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                        alert["formatted_date"] = dt.strftime("%d %b, %H:%M")
                    except:
                        alert["formatted_date"] = "Fecha inválida"
            
            return alerts
            
        except Exception as e:
            print(f"❌ Error obteniendo alertas por supermercado: {e}")
            return []

    def fix_existing_invalid_alerts(self):
        """
        EJECUTAR UNA VEZ: Corrige alertas existentes con datos incorrectos
        """
        try:
            print("🔧 Iniciando corrección de alertas inválidas...")
            
            # Buscar alertas con porcentajes imposibles o precios inválidos
            invalid_alerts = list(self.alerts_collection.find({
                "$or": [
                    {"percentage_change": {"$gt": 200}},   # Cambios > 200%
                    {"percentage_change": {"$lt": -200}},  # Cambios < -200%
                    {"old_price": {"$lte": 0}},            # Precios inválidos
                    {"new_price": {"$lte": 0}},            # Precios inválidos
                ]
            }))
            
            print(f"❌ Encontradas {len(invalid_alerts)} alertas con datos incorrectos")
            
            fixed_count = 0
            deleted_count = 0
            
            for alert in invalid_alerts:
                old_price = alert.get("old_price", 0)
                new_price = alert.get("new_price", 0)
                
                # Si los precios son válidos, intentar corregir
                if old_price > 0 and new_price > 0:
                    correct_percentage = ((new_price - old_price) / old_price) * 100
                    correct_percentage = round(correct_percentage, 1)
                    
                    # Si el cambio corregido es razonable, actualizar
                    if abs(correct_percentage) <= 200:
                        
                        # Determinar tipo correcto
                        if new_price > old_price:
                            is_increase = True
                            change_type = "subida"
                            alert_text = f"↑{abs(correct_percentage):.1f}%"
                            alert_color = "red"
                        else:
                            is_increase = False
                            change_type = "bajada"
                            alert_text = f"↓{abs(correct_percentage):.1f}%"
                            alert_color = "green"
                        
                        # Actualizar alerta
                        self.alerts_collection.update_one(
                            {"_id": alert["_id"]},
                            {"$set": {
                                "percentage_change": correct_percentage,
                                "price_difference": round(new_price - old_price, 2),
                                "is_price_increase": is_increase,
                                "change_type": change_type,
                                "alert_text": alert_text,
                                "alert_color": alert_color,
                                "fixed_at": datetime.now().isoformat()
                            }}
                        )
                        
                        fixed_count += 1
                        print(f"✅ Alerta corregida: {alert.get('product_name')} - {correct_percentage:.1f}%")
                    else:
                        # Eliminar alertas con cambios imposibles
                        self.alerts_collection.delete_one({"_id": alert["_id"]})
                        deleted_count += 1
                        print(f"🗑️ Alerta eliminada (cambio imposible): {alert.get('product_name')}")
                else:
                    # Eliminar alertas con precios inválidos
                    self.alerts_collection.delete_one({"_id": alert["_id"]})
                    deleted_count += 1
                    print(f"🗑️ Alerta eliminada (precios inválidos): {alert.get('product_name')}")
            
            print(f"✅ Corrección de alertas completada:")
            print(f"   - Alertas corregidas: {fixed_count}")
            print(f"   - Alertas eliminadas: {deleted_count}")
            
            return {
                "fixed": fixed_count,
                "deleted": deleted_count,
                "total_processed": len(invalid_alerts)
            }
            
        except Exception as e:
            print(f"❌ Error corrigiendo alertas: {e}")
            return {"fixed": 0, "deleted": 0, "total_processed": 0}

    def validate_and_fix_alert(self, alert):
        """
        Valida y corrige datos de alerta inconsistentes
        """
        try:
            old_price = float(alert.get("old_price", 0))
            new_price = float(alert.get("new_price", 0))
            
            # Si los precios son válidos, recalcular porcentaje
            if old_price > 0 and new_price > 0:
                # Fórmula CORRECTA: ((nuevo - viejo) / viejo) * 100
                correct_percentage = ((new_price - old_price) / old_price) * 100
                correct_percentage = round(correct_percentage, 1)
                
                # Verificar si el porcentaje actual está mal
                current_percentage = alert.get("percentage_change", 0)
                
                if abs(current_percentage - correct_percentage) > 0.1:  # Si hay diferencia significativa
                    print(f"🔧 Corrigiendo porcentaje: {current_percentage}% -> {correct_percentage}%")
                    
                    # Actualizar con cálculos correctos
                    alert["percentage_change"] = correct_percentage
                    alert["price_difference"] = round(new_price - old_price, 2)
                    
                    # Determinar tipo de cambio correcto
                    if new_price > old_price:
                        alert["is_price_increase"] = True
                        alert["change_type"] = "subida" 
                        alert["alert_text"] = f"↑{abs(correct_percentage):.1f}%"
                        alert["alert_color"] = "red"
                    else:
                        alert["is_price_increase"] = False
                        alert["change_type"] = "bajada"
                        alert["alert_text"] = f"↓{abs(correct_percentage):.1f}%"
                        alert["alert_color"] = "green"
                    
                    # Actualizar en la base de datos
                    self.alerts_collection.update_one(
                        {"_id": ObjectId(alert["_id"]) if isinstance(alert["_id"], str) else alert["_id"]},
                        {"$set": {
                            "percentage_change": alert["percentage_change"],
                            "price_difference": alert["price_difference"],
                            "is_price_increase": alert["is_price_increase"],
                            "change_type": alert["change_type"],
                            "alert_text": alert.get("alert_text", ""),
                            "alert_color": alert.get("alert_color", ""),
                            "corrected_at": datetime.now().isoformat()
                        }}
                    )
            
            return alert
            
        except Exception as e:
            print(f"❌ Error validando alerta: {e}")
            return alert

    def get_alerts_by_category(self, category, limit=50):
        """
        Obtiene alertas por categoría de producto
        """
        try:
            alerts = list(self.alerts_collection.find({
                "active": True,
                "categories": {"$in": [category]}
            }).sort([("created_at", -1)]).limit(limit))
            
            for alert in alerts:
                alert["_id"] = str(alert["_id"])
            
            return alerts
            
        except Exception as e:
            print(f"❌ Error obteniendo alertas por categoría: {e}")
            return []

    def bulk_mark_as_read(self, alert_ids):
        """
        Marca múltiples alertas como leídas
        """
        try:
            if not alert_ids:
                return {"modified_count": 0}
            
            object_ids = [ObjectId(aid) for aid in alert_ids if aid]
            
            result = self.alerts_collection.update_many(
                {"_id": {"$in": object_ids}},
                {
                    "$set": {
                        "is_read": True,
                        "read_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat(),
                        "bulk_read": True
                    }
                }
            )
            
            print(f"✅ {result.modified_count} alertas marcadas como leídas en lote")
            return result
            
        except Exception as e:
            print(f"❌ Error en marcado masivo: {e}")
            return {"modified_count": 0}

        # AGREGAR ESTE MÉTODO A TU alert_model.py
    # (Dentro de la clase Alert)

    def mark_as_read_by_product(self, product_id):
        """
        MÉTODO FALTANTE: Marca como leídas todas las alertas activas de un producto específico
        """
        try:
            if not product_id:
                return None
                
            result = self.alerts_collection.update_many(
                {
                    "product_id": product_id,
                    "active": True,
                    "is_read": False
                },
                {
                    "$set": {
                        "is_read": True,
                        "read_at": datetime.now().isoformat(),
                        "updated_at": datetime.now().isoformat(),
                        "read_via": "dashboard_view"
                    }
                }
            )
            
            if result.modified_count > 0:
                print(f"✅ {result.modified_count} alertas del producto {product_id} marcadas como leídas")
            
            return result
            
        except Exception as e:
            print(f"❌ Error marcando alertas del producto: {e}")
            return None

    # TAMBIÉN AGREGA LA IMPORTACIÓN DE datetime SI NO LA TIENES:
    from datetime import datetime, timedelta

# Crear instancia global
alert_model = Alert()