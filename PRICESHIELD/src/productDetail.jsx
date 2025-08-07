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
  useEffect(() => {
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
  const { state: producto } = useLocation();
  const navigate = useNavigate();
  if (!producto) {
    return <div>No se encontró información del producto.</div>;
  }
  const handleSearch = (searchTerm) => {
    console.log('Buscando:', searchTerm);
  };
  const SupermercadoMB = [
    {
      nombre: "Metro",
      precio: "S/40.5"
    }
  ];
  const SupermercadoG = [
    {
      nombre: "Metro",
      precio: "S/40.5"
    },
    {
      nombre: "Tottus",
      precio: "S/50.5"
    },
    {
      nombre: "PlazaVea",
      precio: "S/65.5"
    }
    ,
    {
      nombre: "RealPlaza",
      precio: "S/105.5"
    }
  ];
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
          <div className="DPExtendido">
            <div className="BotRP">
              <button className='BotonRegresar' onClick={() => navigate(-1)}> <span className='flechita'>←</span> Volver</button>

            </div>
            <div className="DetallesProducto">
              <img src={producto.imagen} alt={producto.nombre} />
              <div className="DetallesMenoresP">
                <h2>{producto.nombre}</h2>
                <p><strong>Precio:</strong> {producto.precio}</p>
                <p><strong>Supermercado:</strong> {producto.supermercado}</p>
              </div>
            </div>
            {SupermercadoMB.map((item, index) => (
              <div className="PrecioMasBajo" key={index}>
                <div className="PaProVer">
                  <div className="MercadoDelP">
                    <span className='LugarPrecioB'> {item.nombre}</span>
                  </div>
                  <div className="PrecioDLP">
                    <span className='PrecioB'> PEN {item.precio}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mercadosYprecios">
            <div className="footerMercados">
              {SupermercadoG.map((itemG, index) => (
                <div className="PrecioMasBajo" key={index}>

                  <div className="dato">
                    <b>{itemG.nombre}</b>
                    <br />
                    <p>{itemG.precio}</p>
                  </div>


                </div>))}
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}
export default ProductDetail;
