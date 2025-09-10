# run_database_fixes.py
"""
SCRIPT DE CORRECCIÓN ÚNICA - EJECUTAR UNA SOLA VEZ
Corrige problemas de alertas y productos duplicados
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.db import db
from models.product_model import product_model
from models.alert_model import alert_model
from datetime import datetime

def main():
    """
    Función principal para ejecutar todas las correcciones
    """
    print("🔧 INICIANDO CORRECCIÓN ÚNICA DE BASE DE DATOS")
    print("=" * 60)
    
    # Advertencia
    print("⚠️  ADVERTENCIA: Este script modificará la base de datos")
    print("   Asegúrate de tener un respaldo antes de continuar")
    
    response = input("\n¿Continuar con la corrección? (escribe 'SI' para continuar): ")
    
    if response.upper() != 'SI':
        print("❌ Corrección cancelada por el usuario")
        return
    
    try:
        # 1. Corregir alertas inválidas existentes
        print("\n1️⃣ Corrigiendo alertas con datos incorrectos...")
        alert_stats = alert_model.fix_existing_invalid_alerts()
        print(f"   ✅ Alertas corregidas: {alert_stats['fixed']}")
        print(f"   🗑️ Alertas eliminadas: {alert_stats['deleted']}")
        
        # 2. Corregir conflictos de productos
        print("\n2️⃣ Corrigiendo conflictos de productos...")
        product_fixes = product_model.fix_existing_product_conflicts()
        print(f"   ✅ Productos re-indexados: {product_fixes}")
        
        # 3. Limpiar duplicados obvios
        print("\n3️⃣ Limpiando productos duplicados...")
        duplicates_removed = product_model.clean_duplicate_products()
        print(f"   🗑️ Duplicados eliminados: {duplicates_removed}")
        
        # 4. Estadísticas finales
        print("\n" + "=" * 60)
        print("📊 ESTADO FINAL DE LA BASE DE DATOS:")
        total_products = db['products'].count_documents({})
        total_alerts = db['alerts'].count_documents({"active": True})
        total_history = db['price_history'].count_documents({})
        
        print(f"   - Productos activos: {total_products}")
        print(f"   - Alertas activas: {total_alerts}")
        print(f"   - Entradas de historial: {total_history}")
        
        print(f"\n✅ CORRECCIÓN COMPLETADA - {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
        print("   La base de datos ha sido limpiada y optimizada")
        
    except Exception as e:
        print(f"\n❌ ERROR DURANTE LA CORRECCIÓN: {e}")
        print("   Revisa los logs para más detalles")

if __name__ == "__main__":
    main()