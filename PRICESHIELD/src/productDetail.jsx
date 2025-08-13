// ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './styles/products.css';
import './styles/model.css';
import './styles/productDetail.css';
import TopBar from './components/TopBar.jsx';
import Drop_DownM from './components/Drop_Down_Menu.jsx';

function ProductDetail() {
  const [isOpenM, setIsOpenM] = useState(true);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [listaProductos, setListaProductos] = useState([]);
  const [productoMasBarato, setProductoMasBarato] = useState(null);
  
  const { state } = useLocation(); // Obtiene los datos pasados desde ProductCard
  const navigate = useNavigate();

  useEffect(() => {
    // Manejo de datos recibidos
    if (state) {
      const { producto, listaProductos: lista } = state;
      
      console.log('📦 Datos recibidos:', { producto, lista });
      
      setProductoSeleccionado(producto);
      setListaProductos(lista || []);
      
      // Encontrar el producto más barato de la lista
      if (lista && lista.length > 0) {
        const masBarato = encontrarProductoMasBarato(lista);
        setProductoMasBarato(masBarato);
      }
    }
  }, [state]);

  useEffect(() => { 
    // Responsivo
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsOpenM(false);
      } else {
        setIsOpenM(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Función para encontrar el producto más barato
  const encontrarProductoMasBarato = (productos) => {
    if (!productos || productos.length === 0) return null;

    return productos.reduce((masBarato, productoActual) => {
      const precioActual = extraerNumericoPrecio(productoActual.precio);
      const precioMasBarato = extraerNumericoPrecio(masBarato.precio);
      
      return precioActual < precioMasBarato ? productoActual : masBarato;
    });
  };

  // Función para extraer valor numérico del precio
  const extraerNumericoPrecio = (precio) => {
    if (!precio) return Infinity;
    
    const numeroLimpio = precio.toString()
      .replace(/[S\/.,$]/g, '') // Remover símbolos de moneda
      .replace(/,/g, '') // Remover comas
      .replace(/[^\d.]/g, ''); // Mantener solo dígitos y puntos
    
    return parseFloat(numeroLimpio) || Infinity;
  };

  // Función para manejar búsqueda (si se necesita)
  const handleSearch = (searchTerm) => {
    console.log('Buscando:', searchTerm);
    // Aquí podrías implementar nueva búsqueda si es necesario
  };

  // Función para ir al dashboard
  const handleClickD = () => {
    navigate('/dashboard', { 
      state: {
        producto: productoSeleccionado,
        listaProductos
      }
    });
  };

  // Función para cambiar de producto seleccionado
  const handleClick = (nuevoProducto) => {
    navigate('/detalle', { 
      state: {
        producto: nuevoProducto,
        listaProductos // Mantener la lista original
      }
    });
  };

  // Verificar si hay datos
  if (!productoSeleccionado) {
    return (
      <div className={`contenedor_general ${!isOpenM ? 'soloContenido' : ''}`}>
        <div className="barraJex">
          <Drop_DownM isOpenM={isOpenM} closeDown={() => setIsOpenM(false)} />
        </div>
        <div className="buProductos">
          <div className='abrirDown'>
            <TopBar onSearch={handleSearch} openMenu={() => setIsOpenM(true)} />
          </div>
          <div className="detalleProducto">
            <div className="error-message" style={{
              textAlign: 'center',
              padding: '50px',
              fontSize: '18px',
              color: '#666'
            }}>
              <p>No se encontró información del producto.</p>
              <button 
                onClick={() => navigate('/products')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginTop: '20px'
                }}
              >
                Volver a Productos
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`contenedor_general ${!isOpenM ? 'soloContenido' : ''}`}>
      {/* Barra lateral de menú */}
      <div className="barraJex">
        <Drop_DownM 
          isOpenM={isOpenM} 
          closeDown={() => setIsOpenM(false)} 
          producto={productoSeleccionado} 
        />
      </div>
      {/* Fin Barra lateral de menú */}
      
      <div className="buProductos">
        {/* Barra de búsqueda superior */}
        <div className='abrirDown'>
          <TopBar 
            onSearch={handleSearch} 
            openMenu={() => setIsOpenM(true)} 
          />
        </div>
        {/* Fin Barra de búsqueda superior */}
        
        <div className="detalleProducto">
          <div className="DPExtendido">
            {/* Botón regresar superior */}
            <div className="BotRP">
              <button className='BotonRegresar' onClick={() => navigate(-1)}>
                <span className='flechita'>←</span> Volver
              </button>
            </div>
            {/* Fin Botón regresar superior */}
            
            {/* Producto Seleccionado */}
            <div className="DetallesProducto">
              <img 
                src={productoSeleccionado.imagen} 
                alt={productoSeleccionado.nombre}
                onError={(e) => {
                  e.target.src = '/placeholder-product.png'; // Imagen por defecto
                }}
              />
              <div className="DetallesMenoresP">
                <h2>{productoSeleccionado.nombre}</h2>
                <p><strong>Precio:</strong> {productoSeleccionado.precio}</p>
                <p><strong>Supermercado:</strong> {productoSeleccionado.supermercado}</p>
              </div>
              <div className="BotonDashboardContainer">
                <button className="BotonDashboard" onClick={handleClickD}>
                  📊 Panel
                </button>
              </div>
            </div>
            {/* FIN Producto Seleccionado */}
            
            {/* Mostrar Precio más bajo */}
            <h3 className='PrecioMasBajoT'>Encuentra el precio más bajo en:</h3>
            
            {productoMasBarato && (
              <button 
                className="PrecioMasBajoP" 
                onClick={() => handleClick(productoMasBarato)}
              >
                <div className="PaProVer">
                  <div className="MercadoDelP">
                    <span className='LugarPrecioB'>{productoMasBarato.supermercado}</span>
                  </div>
                  <div className="PrecioDLP">
                    <span className='PrecioB'>PEN {productoMasBarato.precio}</span>
                  </div>
                </div>
              </button>
            )}
            
            {!productoMasBarato && listaProductos.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px', 
                color: '#666',
                fontStyle: 'italic'
              }}>
                No hay otros productos para comparar precios
              </div>
            )}
            {/* FIN Precio más bajo */}
          </div>
          
          <div className="mercadosYprecios">
            {/* Div de Supermercados y precios según el producto Seleccionado */}
            <div className="footerMercados">
              {/* Mostrar todos los productos de la lista de búsqueda */}
              {listaProductos.length > 0 ? (
                listaProductos.map((producto, index) => (
                  <button
                    className="PrecioMasBajo"
                    key={`${producto.supermercado}-${index}`}
                    onClick={() => handleClick(producto)}
                    style={{
                      opacity: producto.id === productoSeleccionado.id ? 0.7 : 1,
                      border: producto.id === productoSeleccionado.id ? '2px solid #007bff' : 'none'
                    }}
                  >
                    <div className="datoPPT">
                      <div className="MercadoLogo">
                        <svg className='LogoDelMerca' xmlns="http://www.w3.org/2000/svg">
                          <circle cx="10" cy="10" r="10" fill="#3498db" />
                          <text
                            x="10"
                            y="10"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="white"
                            fontSize="12"
                          >
                            {producto.supermercado.charAt(0)}
                          </text>
                        </svg>
                        <b className='NombreDelMercado'>{producto.supermercado}</b>
                      </div>
                      <br />
                      <p>{producto.precio}</p>
                      
                      {/* Indicador si es el producto actual */}
                      {producto.id === productoSeleccionado.id && (
                        <span style={{
                          fontSize: '12px',
                          color: '#007bff',
                          fontWeight: 'bold',
                          marginTop: '5px',
                          display: 'block'
                        }}>
                          ACTUAL
                        </span>
                      )}
                      
                      {/* Indicador si es el más barato */}
                      {productoMasBarato && producto.id === productoMasBarato.id && (
                        <span style={{
                          fontSize: '12px',
                          color: '#28a745',
                          fontWeight: 'bold',
                          marginTop: '5px',
                          display: 'block'
                        }}>
                          MEJOR PRECIO
                        </span>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  <p>No se encontraron productos para comparar</p>
                  <p style={{ fontSize: '14px', marginTop: '10px' }}>
                    Intenta realizar una nueva búsqueda para ver más opciones
                  </p>
                </div>
              )}
              {/* Fin productos de la búsqueda */}
            </div>
          </div>
          {/* FIN Div de Supermercados y precios según el producto Seleccionado */}
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;