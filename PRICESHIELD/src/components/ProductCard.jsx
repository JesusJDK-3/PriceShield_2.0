// ProductCard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ producto, listaProductos }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/detalle', {
      state: {
        producto,
        listaProductos, 
      },
    });
  };

  return (
    <div className="producto" onClick={handleClick}>
      <div className="imagenP">
        <img src={producto.imagen} alt={producto.nombre} />
      </div>
      <div className="detallesPro">
        <p>{producto.nombre}</p>
        <p>{producto.precio}</p>
        <p>{producto.supermercado}</p>
      </div>
    </div>
  );
};

export default ProductCard;
