// ProductCard.jsx - CON DETECCIÓN DE OFERTAS
import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ producto, listaProductos }) => {
  const navigate = useNavigate();

  // 🔍 FUNCIÓN: Detectar si el producto está en oferta
  const detectarOferta = () => {
    // Verificar si el producto tiene descuento directo
    if (producto.discount_percentage && producto.discount_percentage > 0) {
      return {
        esOferta: true,
        tipo: 'descuento',
        valor: `${producto.discount_percentage}% OFF`
      };
    }

    // Verificar si el precio original es mayor al actual
    if (producto.original_price && producto.precio) {
      const precioActual = parseFloat(producto.precio.replace(/[S\/PEN\s]/g, ''));
      const precioOriginal = parseFloat(producto.original_price);
      
      if (precioOriginal > precioActual && precioOriginal > 0) {
        const descuento = ((precioOriginal - precioActual) / precioOriginal * 100).toFixed(0);
        return {
          esOferta: true,
          tipo: 'precio_reducido',
          valor: `${descuento}% OFF`
        };
      }
    }

    // Verificar si en la lista de productos similares, este es el más barato
    if (listaProductos && listaProductos.length > 1) {
      const precioActual = parseFloat(producto.precio.replace(/[S\/PEN\s]/g, ''));
      const preciosOtros = listaProductos
        .filter(p => p.supermercado !== producto.supermercado) // Excluir mismo supermercado
        .map(p => parseFloat(p.precio.replace(/[S\/PEN\s]/g, '')))
        .filter(precio => !isNaN(precio));

      if (preciosOtros.length > 0) {
        const precioMenorOtros = Math.min(...preciosOtros);
        const diferencia = ((precioMenorOtros - precioActual) / precioMenorOtros * 100);
        
        // Si es al menos 5% más barato que otros supermercados
        if (diferencia >= 5) {
          return {
            esOferta: true,
            tipo: 'mejor_precio',
            valor: 'MEJOR PRECIO'
          };
        }
      }
    }

    // Verificar por palabras clave en el nombre
    const nombreLower = producto.nombre.toLowerCase();
    const palabrasOferta = ['oferta', 'promocion', 'descuento', 'rebaja', 'especial', '2x1', 'pack'];
    
    for (const palabra of palabrasOferta) {
      if (nombreLower.includes(palabra)) {
        return {
          esOferta: true,
          tipo: 'promocional',
          valor: 'OFERTA'
        };
      }
    }

    return { esOferta: false };
  };

  const handleClick = () => {
    navigate('/detalle', {
      state: {
        producto,
        listaProductos, 
      },
    });
  };

  const infoOferta = detectarOferta();

  return (
    <div className="producto" onClick={handleClick}>
      {/* 🏷️ ETIQUETA DE OFERTA */}
      {infoOferta.esOferta && (
        <div className="etiqueta-oferta" style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          backgroundColor: infoOferta.tipo === 'mejor_precio' ? '#28a745' : '#ff4757',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '10px',
          fontWeight: 'bold',
          zIndex: 10,
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          {infoOferta.valor}
        </div>
      )}

      <div className="imagenP">
        <img src={producto.imagen} alt={producto.nombre} />
      </div>
      
      <div className="detallesPro">
        <p>{producto.nombre}</p>
        
        {/* 💰 MOSTRAR PRECIO CON OFERTA */}
        <div className="precio-container">
          {infoOferta.esOferta && infoOferta.tipo === 'precio_reducido' && producto.original_price && (
            <p style={{
              textDecoration: 'line-through',
              color: '#999',
              fontSize: '12px',
              margin: '0'
            }}>
              S/{producto.original_price}
            </p>
          )}
          <p style={{
            color: infoOferta.esOferta ? '#e74c3c' : 'inherit',
            fontWeight: infoOferta.esOferta ? 'bold' : 'normal',
            margin: '2px 0'
          }}>
            {producto.precio}
          </p>
        </div>
        
        <p>{producto.supermercado}</p>
        
        {/* 🏪 INDICADOR ADICIONAL DE MEJOR PRECIO */}
        {infoOferta.esOferta && infoOferta.tipo === 'mejor_precio' && (
          <p style={{
            fontSize: '11px',
            color: '#28a745',
            fontWeight: 'bold',
            margin: '4px 0 0 0'
          }}>
            ⭐ Más barato que otros
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;