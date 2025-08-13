import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom'; // ✅ AGREGADO: Import necesario
import './styles/alerts.css';
import TopBar from './components/TopBar.jsx';
import Drop_DownM from './components/Drop_Down_Menu.jsx';

function Alerts({ user }) { // ✅ CAMBIO 1: Recibir user como prop y nombre correcto del componente
    const navigate = useNavigate(); // ✅ AGREGADO: Hook para navegación
    
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
        // TODO: Implementar lógica de búsqueda si es necesario
    };

    const handleResults = (results, query, type) => { // ✅ AGREGADO: Handler para resultados
        console.log('Resultados de búsqueda:', results);
        // TODO: Manejar resultados si es necesario
    };

    return (
        <div className={`contenedor_general ${!isOpenM ? 'soloContenido' : ''}`}>
            <div className="barraJex">
                <Drop_DownM isOpenM={isOpenM} closeDown={() => setIsOpenM(false)} />
            </div>
            <div className="buProductos">
                <div className='abrirDown'>
                    <TopBar 
                        onSearch={handleSearch} 
                        onResults={handleResults} // ✅ AGREGADO: Props que espera TopBar
                        openMenu={() => setIsOpenM(true)}
                        user={user} // ✅ CAMBIO 2: Pasar user al TopBar
                    />
                </div>
                {/* Fin Barra de busqueda superior */}
                <div className="AlertaDProducto">
                    <div className="AlertaDPExtendido">
                        {/* Botón regresar superior */}
                        <div className="BotRP">
                            <button className='BotonRegresar' onClick={() => navigate(-1)}> 
                                <span className='flechita'>←</span> Volver
                            </button>
                        </div>
                        {/* Fin Botón regresar superior */}
                        {/* Cuadritos de informacion de alertas*/}
                        <div className="Dash">
                            <div className="CuadrosInformati">
                                <div className="precioActual">
                                    <h1 className="PACT">45</h1>
                                    <h5>Precio Actual</h5>
                                    <small className='mensaVPA'>↑1.5%</small>
                                </div>
                                <div className="precioPromedio">
                                    <h1 className="PPROM">50</h1>
                                    <h5>Precio Promedio</h5>
                                    <small className="mensaVPPO"></small>
                                </div>
                                <div className="precioMinimo">
                                    <h1 className="PMIN">45</h1>
                                    <h5>Precio Mínimo</h5>
                                    <small className="mensaVPMI">En el mes</small>
                                </div>
                                <div className="precioMaximo">
                                    <h1 className="PMAX">100</h1>
                                    <h5>Precio Máximo</h5>
                                    <small className="mensaVPMX">En el mes</small>
                                </div>
                            </div>
                        </div>
                        {/* FIN Cuadritos de informacion de alertas*/}
                        <div className="NotificacionSinProducto">
                            <h1 className="TextoSinProducto">Alertas</h1>
                        </div>
                        {/* FIN  Producto Seleccionado*/}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Alerts;