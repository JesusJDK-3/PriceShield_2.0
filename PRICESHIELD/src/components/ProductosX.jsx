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

  return (
    <>
      {productos.map((producto, index) => (
        <ProductCard 
          key={`${producto.supermarket_key || 'unknown'}-${producto.id || index}`} 
          producto={{
            nombre: producto.name,
            precio: `S/${producto.price}`,
            supermercado: producto.supermarket,
            imagen: producto.images && producto.images.length > 0 
              ? producto.images[0] 
              : '/placeholder-image.jpg', // Imagen por defecto
            // Pasar datos adicionales para el detalle
            id: producto.id,
            brand: producto.brand,
            description: producto.description,
            url: producto.url,
            available: producto.available,
            original_price: producto.original_price,
            discount_percentage: producto.discount_percentage
          }} 
        />
      ))}
    </>
  );
};

export default ProductosX;