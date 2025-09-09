import React, { useState, useEffect } from "react";
import './styles/alerts.css';
import TopBar from './components/TopBar.jsx';
import Drop_DownM from './components/Drop_Down_Menu.jsx';
import Alert from "./components/Alert.jsx";

function alerts() {
    
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
<<<<<<< Updated upstream
      }, []);
    const handleSearch = (searchTerm) => {  // Maneja la búsqueda de productos
=======
    }, []);

    useEffect(() => {
        loadAlerts();
    }, []);

    const loadAlerts = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch('http://127.0.0.1:5000/api/alerts/active');
            const data = await response.json();

            setAlerts(data); // data es el array de alertas
            setSummary({
                unread_alerts: data.filter(a => !a.leido).length,
                total_alerts: data.length,
                price_increases: data.filter(a => a.change_type === 'subida' && !a.leido).length
            });
        } catch (error) {
            console.error('Error cargando alertas:', error);
            setError('Error de conexión al cargar alertas');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (alertId) => {
        try {
            const response = await fetch(`/api/alerts/${alertId}/read`, {
                method: 'PUT'
            });
            const data = await response.json();
            
            if (data.success) {
                loadAlerts(); // Recargar alertas
            } else {
                console.error('Error marcando como leída');
            }
        } catch (error) {
            console.error('Error marcando como leída:', error);
        }
    };

    const ignoreAlert = async (alertId) => {
        try {
            const response = await fetch(`/api/alerts/${alertId}/ignore`, {
                method: 'PUT'
            });
            const data = await response.json();
            
            if (data.success) {
                loadAlerts(); // Recargar alertas
            } else {
                console.error('Error ignorando alerta');
            }
        } catch (error) {
            console.error('Error ignorando alerta:', error);
        }
    };

    const goToDashboard = (alert) => {
        // Navegar al dashboard con los datos del producto
        const productData = {
            nombre: alert.product_name,
            name: alert.product_name,
            precio: alert.new_price,
            price: alert.new_price,
            supermercado: alert.supermarket,
            supermarket: alert.supermarket,
            unique_id: alert.product_id,
            url: alert.product_url,
            imagen: alert.image || alert.imagen || alert.images?.[0] || '/placeholder-product.png' 
        };
        
        navigate('/dashboard', { state: { producto: productData } });
    };

    const handleSearch = (searchTerm) => {
>>>>>>> Stashed changes
        console.log('Buscando:', searchTerm);
    };

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
                <div className="AlertaDProducto">
                    <div className="AlertaDPExtendido">
                        {/* Botón regresar superior */}
                        <div className="BotRP">
                            <button className='BotonRegresar' onClick={() => navigate(-1)}> <span className='flechita'>←</span> Volver</button>
                        </div>
                        {/* Fin Botón regresar superior */}
                        {/* Cuadritos de informacion de alertas*/}
                        <div className="DivDAlerta">
                            <div className="CuadrosInformatiAlerta">
                                <div className="Alerta1">
                                    <h1 className="PACT">45</h1>
                                    <h5>Precio Actual</h5>
                                    <small className='mensaVPA'>↑1.5%</small>
                                </div>
                                <div className="Alerta2">
                                    <h1 className="PPROM">
                                        50
                                    </h1>
                                    <h5>Precio Promedio</h5>
                                    <small className="mensaVPPO"></small>
                                </div>
                                <div className="Alerta3">
                                    <h1 className="PMIN">
                                        45
                                    </h1>
                                    <h5>Precio Mínimo</h5>
                                    <small className="mensaVPMI">En el mes gaa</small>
                                </div>
                                <div className="Alerta4">
                                    <h1 className="PMAX">
                                        100
                                    </h1>
                                    <h5>Precio Máximo</h5>
                                    <small className="mensaVPMX">En el mes ma </small>
                                </div>
                            </div>
                        </div>
                        {/* FIN Cuadritos de informacion de alertas*/}
                        <div className="NotificacionSinProductoAlerta">
                            <div className="AlertasPs">
                                 <Alert/>
                                {/* BORRARRRRRRRRRRRRRRR*/}

                                <div className="Alerta">
                                    <div className="DetallesAlerta">
                                        <div className="AlertaDetallitos">
                                            <i className="bi bi-patch-exclamation-fill"></i>
                                            <div className="nombreYmas">
                                                <h3>Leche Gloria 1L</h3>
                                               <p>Metro</p>
                                            </div>
                                        </div>
                                        <div className="AlertaOpciones">
                                            <button className="DashAlerta">Ver en Panel</button>
                                            <button className="IgnorarAlerta">Ignorar</button>
                                            <button className="LeidoAlerta">Marcar como leído</button>
                                        </div>
                                    </div>
                                    <div className="PrecioAlerta">
                                        <h1 className="PrecioAlertaH1">S/ 4.50</h1>
                                        <small className="mensaVPA">↑1.5%</small>
                                    </div>
                                </div>
                                <div className="Alerta">
                                    <div className="DetallesAlerta">
                                        <div className="AlertaDetallitos">
                                            <i className="bi bi-patch-exclamation-fill"></i>
                                            <div className="nombreYmas">
                                                <h3>Leche Gloria 1L</h3>
                                               <p>Metro</p>
                                            </div>
                                        </div>
                                        <div className="AlertaOpciones">
                                            <button className="DashAlerta">Ver en Panel</button>
                                            <button className="IgnorarAlerta">Ignorar</button>
                                            <button className="LeidoAlerta">Marcar como leído</button>
                                        </div>
                                    </div>
                                    <div className="PrecioAlerta">
                                        <h1 className="PrecioAlertaH1">S/ 4.50</h1>
                                        <small className="mensaVPA">↑1.5%</small>
                                    </div>
                                </div><div className="Alerta">
                                    <div className="DetallesAlerta">
                                        <div className="AlertaDetallitos">
                                            <i className="bi bi-patch-exclamation-fill"></i>
                                            <div className="nombreYmas">
                                                <h3>Leche Gloria 1L</h3>
                                               <p>Metro</p>
                                            </div>
                                        </div>
                                        <div className="AlertaOpciones">
                                            <button className="DashAlerta">Ver en Panel</button>
                                            <button className="IgnorarAlerta">Ignorar</button>
                                            <button className="LeidoAlerta">Marcar como leído</button>
                                        </div>
                                    </div>
                                    <div className="PrecioAlerta">
                                        <h1 className="PrecioAlertaH1">S/ 4.50</h1>
                                        <small className="mensaVPA">↑1.5%</small>
                                    </div>
                                </div>
                                <div className="Alerta">
                                    <div className="DetallesAlerta">
                                        <div className="AlertaDetallitos">
                                            <i className="bi bi-patch-exclamation-fill"></i>
                                            <div className="nombreYmas">
                                                <h3>Leche Gloria 1L</h3>
                                               <p>Metro</p>
                                            </div>
                                        </div>
                                        <div className="AlertaOpciones">
                                            <button className="DashAlerta">Ver en Panel</button>
                                            <button className="IgnorarAlerta">Ignorar</button>
                                            <button className="LeidoAlerta">Marcar como leído</button>
                                        </div>
                                    </div>
                                    <div className="PrecioAlerta">
                                        <h1 className="PrecioAlertaH1">S/ 4.50</h1>
                                        <small className="mensaVPA">↑1.5%</small>
                                    </div>
                                </div><div className="Alerta">
                                    <div className="DetallesAlerta">
                                        <div className="AlertaDetallitos">
                                            <i className="bi bi-patch-exclamation-fill"></i>
                                            <div className="nombreYmas">
                                                <h3>Leche Gloria 1L</h3>
                                               <p>Metro</p>
                                            </div>
                                        </div>
                                        <div className="AlertaOpciones">
                                            <button className="DashAlerta">Ver en Panel</button>
                                            <button className="IgnorarAlerta">Ignorar</button>
                                            <button className="LeidoAlerta">Marcar como leído</button>
                                        </div>
                                    </div>
                                    <div className="PrecioAlerta">
                                        <h1 className="PrecioAlertaH1">S/ 4.50</h1>
                                        <small className="mensaVPA">↑1.5%</small>
                                    </div>
                                </div>
                                <div className="Alerta">
                                    <div className="DetallesAlerta">
                                        <div className="AlertaDetallitos">
                                            <i className="bi bi-patch-exclamation-fill"></i>
                                            <div className="nombreYmas">
                                                <h3>Leche Gloria 1L</h3>
                                               <p>Metro</p>
                                            </div>
                                        </div>
                                        <div className="AlertaOpciones">
                                            <button className="DashAlerta">Ver en Panel</button>
                                            <button className="IgnorarAlerta">Ignorar</button>
                                            <button className="LeidoAlerta">Marcar como leído</button>
                                        </div>
                                    </div>
                                    <div className="PrecioAlerta">
                                        <h1 className="PrecioAlertaH1">S/ 4.50</h1>
                                        <small className="mensaVPA">↑1.5%</small>
                                    </div>
                                </div>

                                <div className="Alerta">
                                    <div className="DetallesAlerta">
                                        <div className="AlertaDetallitos">
                                            <i className="bi bi-patch-exclamation-fill"></i>
                                            <div className="nombreYmas">
                                                <h3>Leche Gloria 1L</h3>
                                               <p>Metro</p>
                                            </div>
                                        </div>
                                        <div className="AlertaOpciones">
                                            <button className="DashAlerta">Ver en Panel</button>
                                            <button className="IgnorarAlerta">Ignorar</button>
                                            <button className="LeidoAlerta">Marcar como leído</button>
                                        </div>
                                    </div>
                                    <div className="PrecioAlerta">
                                        <h1 className="PrecioAlertaH1">S/ 4.50</h1>
                                        <small className="mensaVPA">↑1.5%</small>
                                    </div>
                                </div>
                                <div className="Alerta">
                                    <div className="DetallesAlerta">
                                        <div className="AlertaDetallitos">
                                            <i className="bi bi-patch-exclamation-fill"></i>
                                            <div className="nombreYmas">
                                                <h3>Leche Gloria 1L</h3>
                                               <p>Metro</p>
                                            </div>
                                        </div>
                                        <div className="AlertaOpciones">
                                            <button className="DashAlerta">Ver en Panel</button>
                                            <button className="IgnorarAlerta">Ignorar</button>
                                            <button className="LeidoAlerta">Marcar como leído</button>
                                        </div>
                                    </div>
                                    <div className="PrecioAlerta">
                                        <h1 className="PrecioAlertaH1">S/ 4.50</h1>
                                        <small className="mensaVPA">↑1.5%</small>
                                    </div>
                                </div>
                               
                                    
                                
                                
                                
                                {/* BORRARRRRRRRRRRRRRRR*/}
                            </div>
                        </div>
                        {/* FIN  Producto Seleccionado*/}
                    </div>
                </div>
            </div>
        </div>
    );
}
export default alerts;