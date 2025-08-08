import React from 'react';
import productsGeneral from './productsGeneral.jsx';
import ProductCard from './ProductCard.jsx';

const ProductosX = () => {
  return (
    <>
      {productsGeneral.map((productsGeneral, index) => (
        <ProductCard key={index} producto={productsGeneral} />
      ))}
    </>
  );
};

export default ProductosX;
