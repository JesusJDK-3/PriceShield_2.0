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
    const navigate = useNavigate(); // Navegación para regresar a la lista de productos
    if (!producto) {
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
                                <div>No se encontró información del producto.</div>
                            </div>
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
                <Drop_DownM isOpenM={isOpenM} closeDown={() => setIsOpenM(false)} />
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
                        </div>
                        {/* FIN  Producto Seleccionado*/}

                    </div>
                    <div className="mercadosYprecios">
                        {/* Div de Supermercados y precios segùn el producto Seleccionado*/}
                        <div className="footerMercados">
                            <button className="PrecioMasBajo">
                                <div className="dato">
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
                                <div className="dato">
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
                                <div className="dato">
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
                                <div className="dato">
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
                                <div className="dato">
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
