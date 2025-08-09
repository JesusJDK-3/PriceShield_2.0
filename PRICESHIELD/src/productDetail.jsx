// ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './styles/products.css';
import './styles/model.css';
import './styles/productDetail.css';
import TopBar from './components/TopBar.jsx';
import Drop_DownM from './components/Drop_Down_Menu.jsx';
import productsDetailG from './components/productsDetailG.jsx';
function ProductDetail() {
  const [isOpenM, setIsOpenM] = useState(true);
  useEffect(() => { // Responsivo
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
  const { state: producto } = useLocation();// Obtiene el producto seleccionado desde el estado de la ubicación
  const navigate = useNavigate(); // Navegación para regresar a la lista de productos
  if (!producto) {
    return <div>No se encontró información del producto.</div>;
  }
  const handleSearch = (searchTerm) => {  // Maneja la búsqueda de productos
    console.log('Buscando:', searchTerm);
  };
  const handleClickD = () => {
    navigate('/dashboard', { state: producto });
  };
  const handleClick = (item) => {
    producto.nombre = item.nombre;
    producto.precio = item.precio;
    producto.imagen = item.imagen;
    producto.supermercado = item.supermercado;
    navigate('/detalle', { state: producto });
  };
  const SupermercadoG = productsDetailG(producto); // Obtiene los detalles del producto seleccionado
  return (
    <div className={`contenedor_general ${!isOpenM ? 'soloContenido' : ''}`}>
      {/* Barra lateral de menú */}
      <div className="barraJex">
        <Drop_DownM isOpenM={isOpenM} closeDown={() => setIsOpenM(false)} producto={producto} />
      </div>
      {/* Fin Barra lateral de menú */}
      <div className="buProductos">
        {/* Barra de busqueda superior */}
        <div className='abrirDown'>
          <TopBar onSearch={handleSearch} openMenu={() => setIsOpenM(true)} />
        </div>
        {/* Fin Barra de busqueda superior */}
        <div className="detalleProducto">
          <div className="DPExtendido">
            {/* Botón regresar superior */}
            <div className="BotRP">
              <button className='BotonRegresar' onClick={() => navigate(-1)}> <span className='flechita'>←</span> Volver</button>
            </div>
            {/* Fin Botón regresar superior */}
            {/* Producto Seleccionado*/}
            <div className="DetallesProducto">
              <img src={producto.imagen} alt={producto.nombre} />
              <div className="DetallesMenoresP">
                <h2>{producto.nombre}</h2>
                <p><strong>Precio:</strong> {producto.precio}</p>
                <p><strong>Supermercado:</strong> {producto.supermercado}</p>
              </div>
              <div className="BotonDashboardContainer">
                <button className="BotonDashboard" onClick={handleClickD}>
                  📊 Mira el Dashboard
                </button>
              </div>

            </div>
            {/* FIN  Producto Seleccionado*/}
            {/* Mostrar Precio más bajo usando SupermercadoMB Etiqueta roja*/}
            <h3 className='PrecioMasBajoT'>Encuentra el precio más bajo en:</h3>
            {SupermercadoG?.result?.slice(0, 1).map((item, index) => (
              <button className="PrecioMasBajoP" key={index} onClick={() => handleClick(item)}>
                <div className="PaProVer">
                  <div className="MercadoDelP">
                    <span className='LugarPrecioB'> {item.supermercado}</span>
                  </div>
                  <div className="PrecioDLP">
                    <span className='PrecioB'> PEN {item.precio}</span>
                  </div>
                </div>
              </button>
            ))}


            {/* FIN Precio más bajo usando SupermercadoMB*/}
          </div>
          <div className="mercadosYprecios">
            {/* Div de Supermercados y precios segùn el producto Seleccionado*/}
            <div className="footerMercados">
              {/*Supermercados y precios segùn el producto Seleccionado usando SupermercadoG*/}
              {SupermercadoG.productos.map((itemG, index) => (
                <button
                  className="PrecioMasBajo"
                  key={index}
                  onClick={() => handleClick(itemG)}
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
                          {itemG.supermercado.charAt(0)}
                        </text>
                      </svg>
                      <b className='NombreDelMercado'>{itemG.supermercado}</b>
                    </div>
                    <br />
                    <p>{itemG.precio}</p>
                  </div>
                </button>
              ))}

              {/*Fin Supermercados y precios segùn el producto Seleccionado usando SupermercadoG*/}
            </div>
          </div>
          {/* FIN Div de Supermercados y precios segùn el producto Seleccionado*/}
        </div>
      </div>
    </div>
  );
}
export default ProductDetail;
