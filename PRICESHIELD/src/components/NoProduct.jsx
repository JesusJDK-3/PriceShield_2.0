import React from "react";
import '../styles/NoProduct.css';
import '../styles/Drop_Down_Menu.css';
import TopBar from './TopBar.jsx';
import Drop_DownM from './Drop_Down_Menu.jsx';
import { useState, useEffect } from 'react';
const SinProducto = ( handleSearch,navigate) => {
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
    return (
        <div className={`contenedor_general ${!isOpenM ? 'soloContenido' : ''}`}>
                <div className="barraJex">
                    <Drop_DownM isOpenM={isOpenM} closeDown={() => setIsOpenM(false)} />
                </div>
                <div className="buProductos">
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
                            <div className="NotificacionSinProducto">
                                <h1 className="TextoSinProducto">Busca un Producto</h1>
                            </div>
                            {/* FIN  Producto Seleccionado*/}

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
export default SinProducto;