// ProductosX.jsx - VERSIÓN MEJORADA
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

  // 🔧 FUNCIÓN DE DEDUPLICACIÓN MEJORADA
  const deduplicarProductos = (productos) => {
    const productosUnicos = new Map();
    
    productos.forEach((producto, index) => {
      // Crear clave única normalizada
      const nombreNormalizado = producto.name
        ?.toLowerCase()
        ?.replace(/[^a-z0-9\s]/g, '')
        ?.replace(/\s+/g, '_') || '';
      
      const supermarket = producto.supermarket_key || producto.supermarket || '';
      const precio = producto.price || 0;
      
      // Clave única: supermercado + nombre normalizado + precio
      // El precio ayuda a distinguir diferentes presentaciones del mismo producto
      const claveUnica = `${supermarket}_${nombreNormalizado}_${precio}`;
      
      // Solo agregar si no existe o si este tiene más información
      if (!productosUnicos.has(claveUnica)) {
        productosUnicos.set(claveUnica, {
          ...producto,
          originalIndex: index
        });
      } else {
        // Si ya existe, mantener el que tenga más información
        const existente = productosUnicos.get(claveUnica);
        const tieneURL = producto.url && producto.url.length > 0;
        const existenteURL = existente.url && existente.url.length > 0;
        
        // Priorizar productos con URL (generalmente de BD) sobre API tiempo real
        if (tieneURL && !existenteURL) {
          productosUnicos.set(claveUnica, {
            ...producto,
            originalIndex: index
          });
        }
      }
    });
    
    return Array.from(productosUnicos.values());
  };

  // ✅ APLICAR DEDUPLICACIÓN
  const productosSinDuplicados = deduplicarProductos(productos);
  
  // Log para debugging
  if (productos.length !== productosSinDuplicados.length) {
    console.log(`🧹 Deduplicación: ${productos.length} → ${productosSinDuplicados.length} productos`);
  }

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
    // 🔧 AÑADIR: Campo para identificar origen
    source: producto.unique_id ? 'database' : 'api'
  }));

  const obtenerProductosRelacionados = (productoSeleccionado) => {
    const nombreSeleccionado = productoSeleccionado.nombre.toLowerCase();
    
    return productosNormalizados.filter(producto => {
      const nombreProducto = producto.nombre.toLowerCase();
      
      const palabrasSeleccionado = nombreSeleccionado
        .split(' ')
        .filter(palabra => palabra.length > 2)
        .filter(palabra => !['con', 'sin', 'de', 'del', 'la', 'el', 'en', 'para', 'por'].includes(palabra));
      
      const palabrasProducto = nombreProducto
        .split(' ')
        .filter(palabra => palabra.length > 2)
        .filter(palabra => !['con', 'sin', 'de', 'del', 'la', 'el', 'en', 'para', 'por'].includes(palabra));
      
      const tienenPalabraComun = palabrasSeleccionado.some(palabra =>
        palabrasProducto.some(palabraProducto =>
          palabraProducto.includes(palabra) || palabra.includes(palabraProducto)
        )
      );
      
      return tienenPalabraComun;
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