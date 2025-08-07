import React from 'react';
import ProductCard from './ProductCard.jsx';

const ProductosX = ({ productos }) => {
  return (
    <>
      {productos.map((producto, index) => (
        <ProductCard key={index} producto={producto} />
      ))}
    </>
  );
};

export default ProductosX;
