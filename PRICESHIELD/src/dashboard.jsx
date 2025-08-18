// ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import DashboardChart from './components/DashBoardChar.jsx';
import productsDetailG from './components/productsDetailG.jsx';
import { useLocation, useNavigate } from 'react-router-dom';
import './styles/products.css';
import './styles/model.css';
import './styles/productDetail.css';
import './styles/dash.css';
import TopBarF from './components/TopBarF.jsx';
import Drop_DownM from './components/Drop_Down_Menu.jsx';
import SinProducto from './components/NoProduct.jsx';

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
    const handleSearch = (searchTerm) => {  // Maneja la búsqueda de productos
        console.log('Buscando:', searchTerm);
    };
    const { state: producto } = useLocation();// Obtiene el producto seleccionado desde el estado de la ubicación
    const detalle = productsDetailG(producto);
    const navigate = useNavigate(); // Navegación para regresar a la lista de productos
    if (!producto) {
        
        return <SinProducto isOpenM={isOpenM} setIsOpenM={setIsOpenM} handleSearch={handleSearch} navigate={navigate} />;
    
    }
    return (
        <div className={`contenedor_general ${!isOpenM ? 'soloContenido' : ''}`}>
            
            {/* Fin Barra lateral de menú */}
            <div className="buProductos">
                {/* Barra de busqueda superior */}
                <div className='TopBarFDSH'>
                    <TopBarF onSearch={handleSearch} openMenu={() => setIsOpenM(true)} />
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
                            <img src={producto.imagen} alt={producto.nombre} className='imgDasProD'/>
                            <div className="DetallesMenoresP">
                                <h2>{producto.nombre}</h2>
                                <p><strong>Supermercado:</strong> {producto.supermercado}</p>
                            </div>
                        </div>
                        {/* FIN  Producto Seleccionado*/}
                        <div className="Dash">
                            <div className="CuadrosInformati">
                                <div className="precioActual">
                                    <h1 className="PACT">{producto.precio}</h1>
                                    <h5>Precio Actual</h5>
                                    <small className='mensaVPA'>↑1.5%</small>
                                </div>
                                <div className="precioPromedio">
                                    <h1 className="PPROM">
                                        {detalle.precioPromedio}
                                    </h1>
                                    <h5>Precio Promedio</h5>
                                    <small className="mensaVPPO"></small>
                                </div>
                                <div className="precioMinimo">
                                    <h1 className="PMIN">
                                        {detalle.productoConPrecioMinimoSuperMercado.precio}
                                    </h1>
                                    <h5>Precio Mínimo</h5>
                                    <small className="mensaVPMI">En el mes {detalle.mesproductoConPrecioMinimoSuperMercado}</small>
                                </div>
                                <div className="precioMaximo">
                                    <h1 className="PMAX">
                                        {detalle.precioMaximo}
                                    </h1>
                                    <h5>Precio Máximo</h5>
                                    <small className="mensaVPMX">En el mes {detalle.mesDelPrecioMaximo} </small>
                                </div>
                            </div>
                            
                        </div>
                        {/* Div dashboard*/}
                        <div className="DashboardContainer">
                            <DashboardChart />
                            
                            </div>
                            {/* FIN Div dashboard*/}
                    </div>
                    <div className="mercadosYprecios">
                        {/* Div de Supermercados y precios segùn el producto Seleccionado*/}
                        <div className="footerMercados">
                            <button className="PrecioMasBajo">
                                <div className="datoPPT">
                                    <div className="MercadoLogo">
                                        <svg className='LogoDelMerca' xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="10" cy="10" r="10" fill="#3498db" />
                                            <text x="10" y="10" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="12">
                                                A
                                            </text>
                                        </svg>
                                        <b>Alerta</b>
                                    </div>
                                    <br />
                                    <p>S/15</p>
                                </div>
                            </button>
                            <button className="PrecioMasBajo">
                                <div className="datoPPT">
                                    <div className="MercadoLogo">
                                        <svg className='LogoDelMerca' xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="10" cy="10" r="10" fill="#3498db" />
                                            <text x="10" y="10" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="12">
                                                A
                                            </text>
                                        </svg>
                                        <b>Alerta</b>
                                    </div>
                                    <br />
                                    <p>S/15</p>
                                </div>
                            </button>
                            <button className="PrecioMasBajo">
                                <div className="datoPPT">
                                    <div className="MercadoLogo">
                                        <svg className='LogoDelMerca' xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="10" cy="10" r="10" fill="#3498db" />
                                            <text x="10" y="10" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="12">
                                                A
                                            </text>
                                        </svg>
                                        <b>Alerta</b>
                                    </div>
                                    <br />
                                    <p>S/15</p>
                                </div>
                            </button>
                            <button className="PrecioMasBajo">
                                <div className="datoPPT">
                                    <div className="MercadoLogo">
                                        <svg className='LogoDelMerca' xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="10" cy="10" r="10" fill="#3498db" />
                                            <text x="10" y="10" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="12">
                                                A
                                            </text>
                                        </svg>
                                        <b>Alerta</b>
                                    </div>
                                    <br />
                                    <p>S/15</p>
                                </div>
                            </button>
                            <button className="PrecioMasBajo">
                                <div className="datoPPT">
                                    <div className="MercadoLogo">
                                        <svg className='LogoDelMerca' xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="10" cy="10" r="10" fill="#3498db" />
                                            <text x="10" y="10" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="12">
                                                A
                                            </text>
                                        </svg>
                                        <b>Alerta</b>
                                    </div>
                                    <br />
                                    <p>S/15</p>
                                </div>
                            </button>
                            {/* ALERTAS*/}
                        </div>
                    </div>
                    {/* FIN Div de Supermercados y precios segùn el producto Seleccionado*/}
                </div>
            </div>
        </div>
    );
}
export default ProductDetail;
