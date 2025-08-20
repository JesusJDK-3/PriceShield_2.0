// ProductosX.jsx - VERSIÓN MEJORADA CON DEDUPLICACIÓN INTELIGENTE
import React from 'react';
import ProductCard from './ProductCard.jsx';

const ProductosX = ({ productos = [], isLoading = false, searchQuery = "" }) => {
  
  if (isLoading) {
    return (
      <div className="productos-loading">
        <p>🔍 Buscando productos en supermercados...</p>
      </div>
    );
  }

  if (!productos || productos.length === 0) {
    return (
      <div className="productos-empty">
        {searchQuery ? (
          <p>No se encontraron productos para "{searchQuery}"</p>
        ) : (
          <p>Realiza una búsqueda para ver productos</p>
        )}
      </div>
    );
  }

  // 🧠 FUNCIÓN: Normalizar nombre de producto para comparación
  const normalizarNombre = (nombre) => {
    if (!nombre) return '';
    
    return nombre
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Reemplazar símbolos por espacios
      .replace(/\s+/g, ' ') // Múltiples espacios a uno
      .trim()
      // Remover palabras comunes que no aportan al producto
      .split(' ')
      .filter(palabra => !['de', 'del', 'la', 'el', 'en', 'con', 'sin', 'para', 'por', 'y', 'bolsa', 'paquete', 'caja', 'lata', 'botella', 'frasco', 'envase', 'unidad', 'und', 'pack'].includes(palabra))
      .join(' ');
  };

  // 💰 FUNCIÓN: Extraer precio numérico
  const extraerPrecioNumerico = (precio) => {
    if (!precio) return 0;
    
    // Convertir a string y limpiar
    let numeroLimpio = precio.toString()
      .replace(/S\/?\s*/g, '')
      .replace(/PEN\s*/g, '')
      .replace(/[^\d.,]/g, '')
      .trim();
    
    // Manejar comas y puntos
    if (numeroLimpio.includes(',') && numeroLimpio.includes('.')) {
      numeroLimpio = numeroLimpio.replace(/,/g, '');
    } else if (numeroLimpio.includes(',') && !numeroLimpio.includes('.')) {
      const parts = numeroLimpio.split(',');
      if (parts.length === 2 && parts[1].length <= 2) {
        numeroLimpio = numeroLimpio.replace(',', '.');
      } else {
        numeroLimpio = numeroLimpio.replace(/,/g, '');
      }
    }
    
    const resultado = parseFloat(numeroLimpio);
    return isNaN(resultado) ? 0 : resultado;
  };

  // 🔧 FUNCIÓN DE DEDUPLICACIÓN INTELIGENTE
  const deduplicarProductosInteligente = (productos) => {
    console.log('🧹 INICIANDO deduplicación inteligente...');
    console.log('📦 Productos originales:', productos.length);
    
    const gruposProductos = new Map();
    
    // PASO 1: Agrupar productos por supermercado + nombre normalizado
    productos.forEach((producto, index) => {
      const nombreNormalizado = normalizarNombre(producto.name || '');
      const supermercado = producto.supermarket_key || producto.supermarket || 'unknown';
      const precioNumerico = extraerPrecioNumerico(producto.price);
      
      // Clave SIN precio - solo supermercado + producto
      const claveGrupo = `${supermercado}::${nombreNormalizado}`;
      
      if (!gruposProductos.has(claveGrupo)) {
        gruposProductos.set(claveGrupo, []);
      }
      
      gruposProductos.get(claveGrupo).push({
        ...producto,
        originalIndex: index,
        nombreNormalizado,
        precioNumerico,
        claveGrupo
      });
    });
    
    console.log('📊 Grupos formados:', gruposProductos.size);
    
    const productosFinales = [];
    
    // PASO 2: Procesar cada grupo
    gruposProductos.forEach((grupoProductos, claveGrupo) => {
      console.log(`\n🔍 Analizando grupo: "${claveGrupo}"`);
      console.log('📦 Productos en el grupo:', grupoProductos.length);
      
      if (grupoProductos.length === 1) {
        // Un solo producto, mantenerlo
        console.log('✅ Producto único, manteniendo');
        productosFinales.push(grupoProductos[0]);
        return;
      }
      
      // PASO 3: Analizar múltiples productos del mismo grupo
      console.log('🔍 Múltiples productos detectados:', grupoProductos.map(p => ({
        nombre: p.name,
        precio: p.price,
        precioNumerico: p.precioNumerico
      })));
      
      // Ordenar por precio (menor a mayor)
      grupoProductos.sort((a, b) => a.precioNumerico - b.precioNumerico);
      
      const precioMenor = grupoProductos[0].precioNumerico;
      const precioMayor = grupoProductos[grupoProductos.length - 1].precioNumerico;
      
      // Calcular diferencia porcentual
      const diferenciaPorcentaje = precioMayor > 0 
        ? ((precioMayor - precioMenor) / precioMayor) * 100 
        : 0;
      
      console.log('💰 Análisis de precios:', {
        precioMenor,
        precioMayor,
        diferenciaPorcentaje: `${diferenciaPorcentaje.toFixed(1)}%`
      });
      
      if (diferenciaPorcentaje > 10) {
        // Gran diferencia = Posible oferta legítima
        console.log('🏷️ OFERTA detectada - manteniendo precio más bajo');
        
        // Mantener solo el más barato, pero enriquecido con info de ofertas
        const productoMasBarato = { 
          ...grupoProductos[0],
          // Agregar información de la oferta
          esOferta: true,
          precioOriginal: precioMayor,
          descuento: diferenciaPorcentaje.toFixed(1) + '%',
          productosAlternativos: grupoProductos.slice(1) // Otros precios disponibles
        };
        
        productosFinales.push(productoMasBarato);
        
      } else if (diferenciaPorcentaje > 2) {
        // Diferencia moderada = Precios similares, mantener el mejor
        console.log(`💡 Precios similares (${diferenciaPorcentaje.toFixed(1)}%) - manteniendo más barato`);
        productosFinales.push(grupoProductos[0]);
        
      } else {
        // Muy poca diferencia = Probable duplicado exacto
        console.log(`🔍 DUPLICADO exacto detectado (${diferenciaPorcentaje.toFixed(1)}%) - manteniendo uno solo`);
        
        // Priorizar por calidad de datos (URL, imágenes, etc.)
        const mejorProducto = grupoProductos.reduce((mejor, actual) => {
          let puntuacionMejor = 0;
          let puntuacionActual = 0;
          
          // Bonus por tener URL
          if (mejor.url && mejor.url.length > 0) puntuacionMejor += 3;
          if (actual.url && actual.url.length > 0) puntuacionActual += 3;
          
          // Bonus por tener imágenes
          if (mejor.images && mejor.images.length > 0) puntuacionMejor += 2;
          if (actual.images && actual.images.length > 0) puntuacionActual += 2;
          
          // Bonus por tener ID único (BD)
          if (mejor.unique_id) puntuacionMejor += 1;
          if (actual.unique_id) puntuacionActual += 1;
          
          return puntuacionActual > puntuacionMejor ? actual : mejor;
        });
        
        productosFinales.push(mejorProducto);
      }
    });
    
    console.log(`✅ Deduplicación completada: ${productos.length} → ${productosFinales.length} productos`);
    
    // Log detallado de lo que se eliminó
    const eliminados = productos.length - productosFinales.length;
    if (eliminados > 0) {
      console.log(`🗑️ Productos eliminados: ${eliminados}`);
      console.log('📊 Resumen por tipo:', {
        duplicadosExactos: Array.from(gruposProductos.values()).filter(g => g.length > 1 && extraerPrecioNumerico(g[g.length-1].price) - extraerPrecioNumerico(g[0].price) <= 2).length,
        ofertasDetectadas: Array.from(gruposProductos.values()).filter(g => g.length > 1 && ((extraerPrecioNumerico(g[g.length-1].price) - extraerPrecioNumerico(g[0].price)) / extraerPrecioNumerico(g[g.length-1].price)) * 100 > 10).length
      });
    }
    
    return productosFinales;
  };

  // ✅ APLICAR DEDUPLICACIÓN INTELIGENTE
  const productosSinDuplicados = deduplicarProductosInteligente(productos);

  // Normalizar productos después de deduplicar
  const productosNormalizados = productosSinDuplicados.map((producto, index) => ({
    nombre: producto.name,
    precio: `S/${producto.price}`,
    supermercado: producto.supermarket,
    imagen: producto.images && producto.images.length > 0 
      ? producto.images[0] 
      : '/placeholder-image.jpg',
    // Datos adicionales
    id: producto.id || producto.unique_id || `temp-${index}`,
    brand: producto.brand,
    description: producto.description,
    url: producto.url,
    available: producto.available,
    original_price: producto.original_price,
    discount_percentage: producto.discount_percentage,
    supermarket_key: producto.supermarket_key,
    // 🔧 AÑADIR: Campo para identificar origen y ofertas
    source: producto.unique_id ? 'database' : 'api',
    esOferta: producto.esOferta || false,
    precioOriginal: producto.precioOriginal,
    descuento: producto.descuento,
    productosAlternativos: producto.productosAlternativos || []
  }));

  // 🔗 FUNCIÓN: Obtener productos relacionados (mejorada)
  const obtenerProductosRelacionados = (productoSeleccionado) => {
    const nombreSeleccionado = normalizarNombre(productoSeleccionado.nombre);
    
    return productosNormalizados.filter(producto => {
      const nombreProducto = normalizarNombre(producto.nombre);
      
      // Dividir en palabras clave
      const palabrasSeleccionado = nombreSeleccionado.split(' ').filter(p => p.length > 2);
      const palabrasProducto = nombreProducto.split(' ').filter(p => p.length > 2);
      
      // Calcular similitud
      const palabrasComunes = palabrasSeleccionado.filter(palabra =>
        palabrasProducto.some(palabraProducto =>
          palabraProducto.includes(palabra) || palabra.includes(palabraProducto)
        )
      );
      
      const similitud = palabrasComunes.length / Math.max(palabrasSeleccionado.length, palabrasProducto.length);
      
      // Considerar relacionados si tienen al menos 50% de similitud
      return similitud >= 0.5;
    });
  };

  return (
    <>
      
      
      {productosNormalizados.map((producto, index) => {
        const productosRelacionados = obtenerProductosRelacionados(producto);
        
        return (
          <ProductCard 
            key={`${producto.supermarket_key || 'unknown'}-${producto.id || index}-${index}`}
            producto={producto}
            listaProductos={productosRelacionados}
          />
        );
      })}
    </>
  );
};

export default ProductosX;