import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import './styles/alerts.css';
import TopBarF from './components/TopBarF.jsx';
import Drop_DownM from './components/Drop_Down_Menu.jsx';
import Alert from "./components/Alert.jsx";

function Alerts({user}) {
    const [isOpenM, setIsOpenM] = useState(true);
    const [alerts, setAlerts] = useState([]);
    const [summary, setSummary] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleResize = () => {
            setIsOpenM(window.innerWidth > 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
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
            url: alert.product_url
        };
        
        navigate('/dashboard', { state: { producto: productData } });
    };

    const handleSearch = (searchTerm) => {
        console.log('Buscando:', searchTerm);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={`contenedor_general ${!isOpenM ? 'soloContenido' : ''}`}>
            
            <div className="buProductosA">
                <div className="TopBarFALR">
                    <TopBarF onSearch={handleSearch} openMenu={() => setIsOpenM(true)} user={user} />
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
                        
                        {/* Cuadritos de información de alertas */}
                        <div className="DivDAlerta">
                            <div className="CuadrosInformatiAlerta">
                                <div className="Alerta1">
                                    <h1 className="PACT">{summary.unread_alerts || 0}</h1>
                                    <h5>Alertas Pendientes</h5>
                                    <small className='mensaVPA'>Sin leer</small>
                                </div>
                                <div className="Alerta2">
                                    <h1 className="PPROM">{summary.total_alerts || 0}</h1>
                                    <h5>Total Alertas</h5>
                                    <small className="mensaVPPO">Históricas</small>
                                </div>
                                <div className="Alerta3">
                                    <h1 className="PMIN">{summary.price_increases || 0}</h1>
                                    <h5>Subidas Precio</h5>
                                    <small className="mensaVPMI">No leídas</small>
                                </div>
                                <div className="Alerta4">
                                    <h1 className="PMAX">{alerts.length}</h1>
                                    <h5>Mostradas</h5>
                                    <small className="mensaVPMX">En pantalla</small>
                                </div>
                            </div>
                        </div>
                        {/* FIN Cuadritos de información de alertas */}
                        
                        <div className="NotificacionSinProductoAlerta">
                            <div className="AlertasPs">
                                <Alert/>
                                
                                {/* Mostrar estado de carga */}
                                {loading && (
                                    <div style={{ 
                                        textAlign: 'center', 
                                        padding: '20px',
                                        color: '#666'
                                    }}>
                                        Cargando alertas...
                                    </div>
                                )}
                                
                                {/* Mostrar errores */}
                                {error && (
                                    <div style={{ 
                                        textAlign: 'center', 
                                        padding: '20px',
                                        color: '#e74c3c',
                                        backgroundColor: '#fdf2f2',
                                        borderRadius: '8px',
                                        margin: '10px',
                                        border: '1px solid #fadbd8'
                                    }}>
                                        {error}
                                        <button 
                                            onClick={loadAlerts}
                                            style={{
                                                marginLeft: '10px',
                                                padding: '5px 10px',
                                                backgroundColor: '#3498db',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Reintentar
                                        </button>
                                    </div>
                                )}
                                
                                {/* Mostrar mensaje si no hay alertas */}
                                {!loading && !error && alerts.length === 0 && (
                                    <div style={{ 
                                        textAlign: 'center', 
                                        padding: '40px',
                                        color: '#666'
                                    }}>
                                        <i className="bi bi-bell" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
                                        <h3>No hay alertas</h3>
                                        <p>Cuando haya cambios de precio en los productos, aparecerán aquí.</p>
                                    </div>
                                )}
                                
                                {/* Renderizar alertas dinámicamente */}
                                {!loading && alerts.map((alert) => (
                                    <div key={alert._id} className={`Alerta ${alert.is_read ? 'leida' : ''}`}>
                                        <div className="DetallesAlerta">
                                            <div className="AlertaDetallitos">
                                                <i className={`bi ${alert.is_price_increase ? 'bi-arrow-up-circle-fill' : 'bi-arrow-down-circle-fill'}`}
                                                   style={{ 
                                                       color: alert.is_price_increase ? '#e74c3c' : '#27ae60',
                                                       fontSize: '24px'
                                                   }}></i>
                                                <div className="nombreYmas">
                                                    <h3>{alert.product_name}</h3>
                                                    <p>{alert.supermarket}</p>
                                                    <small style={{ color: '#888' }}>
                                                        {formatDate(alert.created_at)}
                                                    </small>
                                                </div>
                                            </div>
                                            <div className="AlertaOpciones">
                                                <button 
                                                    className="DashAlerta"
                                                    onClick={() => goToDashboard(alert)}
                                                >
                                                    Ver en Panel
                                                </button>
                                                <button 
                                                    className="IgnorarAlerta" 
                                                    onClick={() => ignoreAlert(alert._id)}
                                                >
                                                    Ignorar
                                                </button>
                                                <button 
                                                    className="LeidoAlerta" 
                                                    onClick={() => markAsRead(alert._id)}
                                                    disabled={alert.is_read}
                                                >
                                                    {alert.is_read ? 'Leída' : 'Marcar como leído'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="PrecioAlerta">
                                            <h1 className="PrecioAlertaH1">S/ {alert.new_price.toFixed(2)}</h1>
                                            <small className={`mensaVPA ${alert.is_price_increase ? 'aumento' : 'descenso'}`}>
                                                {alert.is_price_increase ? '↑' : '↓'}{Math.abs(alert.percentage_change).toFixed(1)}%
                                            </small>
                                            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                                                Antes: S/ {alert.old_price.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* FIN Producto Seleccionado */}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Alerts;