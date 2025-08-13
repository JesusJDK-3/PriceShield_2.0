// ProductosX.jsx
import React from 'react';
import ProductCard from './ProductCard.jsx';

const ProductosX = ({ productos = [], isLoading = false, searchQuery = "" }) => {
  
  // Si está cargando, mostrar mensaje
  if (isLoading) {
    return (
      <div className="productos-loading">
        <p>🔍 Buscando productos en supermercados...</p>
      </div>
    );
  }
  
  // Si no hay productos, mostrar mensaje
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

  // Normalizar todos los productos para que tengan el mismo formato
  const productosNormalizados = productos.map((producto, index) => ({
    nombre: producto.name,
    precio: `S/${producto.price}`,
    supermercado: producto.supermarket,
    imagen: producto.images && producto.images.length > 0 
      ? producto.images[0] 
      : '/placeholder-image.jpg',
    // Datos adicionales para el detalle
    id: producto.id || `temp-${index}`, // Asegurar que siempre tenga ID
    brand: producto.brand,
    description: producto.description,
    url: producto.url,
    available: producto.available,
    original_price: producto.original_price,
    discount_percentage: producto.discount_percentage,
    // Datos originales por si los necesitas
    supermarket_key: producto.supermarket_key
  }));

  return (
    <>
      {productosNormalizados.map((producto, index) => (
        <ProductCard 
          key={`${producto.supermarket_key || 'unknown'}-${producto.id || index}`} 
          producto={producto}
          listaProductos={productosNormalizados} // ✅ SOLUCIÓN: Pasar la lista completa normalizada
        />
      ))}
    </>
  );
};

export default ProductosX;