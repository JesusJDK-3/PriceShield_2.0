import './styles/all.css';
import './styles/model.css';
import logo from './assets/img/log.png';
import SearchBox from './components/SearchBox.jsx';
import Modal from "./components/Modal.jsx";
import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';


function Main({ user, updateUser }) {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  // Estados para el modal
  const [isModelOpen, setIsModalOpen] = useState(false);
  const [redirectAfterAuth, setRedirectAfterAuth] = useState(null);

  // Estados para las estadísticas del footer
  const [footerStats, setFooterStats] = useState({
    totalProducts: null,
    totalSupermarkets: null,
    activeAlerts: null,
    totalUpdates: null,
    loading: true,
    error: false
  });

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    loadFooterStats();
  }, []);

  const loadFooterStats = async () => {
    setFooterStats(prev => ({ ...prev, loading: true, error: false }));
    try {
      
      const response = await fetch(`${apiUrl}/api/dashboard/stats`);
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      setFooterStats({
        totalProducts: formatNumber(data.stats.products.total),
        totalSupermarkets: data.stats.products.supermarkets,
        activeAlerts: data.stats.alerts.total_alerts,
        totalUpdates: formatNumber(data.stats.activity.price_changes),
        loading: false,
        error: false
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setFooterStats({
        totalProducts: null,
        totalSupermarkets: null,
        activeAlerts: null,
        totalUpdates: null,
        loading: false,
        error: true
      });
    }
  };

  // Función para formatear números grandes
  const formatNumber = (number) => {
    if (typeof number === 'number' && number >= 1000) {
      return number.toLocaleString('es-PE');
    }
    return number?.toString() ?? '';
  };

  // Función para abrir modal con redirección específica
  const openModalWithRedirect = (redirectTo) => {
    setRedirectAfterAuth(redirectTo);
    setIsModalOpen(true);
  };

  // Función cuando se cierra el modal
  const closeModal = () => {
    setIsModalOpen(false);
    setRedirectAfterAuth(null);
  };

  // Función para manejar búsqueda desde SearchBox
  const handleSearch = (searchTerm) => {
    navigate('/products', { 
      state: { 
        searchQuery: searchTerm,
        autoSearch: true 
      } 
    });
  };

  // Función para manejar resultados de búsqueda
  const handleSearchResults = (results, query, type) => {
    navigate('/products', { 
      state: { 
        searchResults: results,
        searchQuery: query,
        searchType: type 
      } 
    });
  };

  return (
    <div className="todo">
      <div className="Registrate">
        <div className="BotonEfirst">
          <div className="BotonRegistrar">
            <button onClick={() => setIsModalOpen(true)} className="Regis">
              Registrate
            </button>
          </div>
          <div className="container">
            <div className="detalles">
              <span className="log">
                <img src={logo} alt="PreciShield Logo" />
                <h2>
                  P<span className="danger">riceShield</span>
                </h2>
              </span>
              <p>
                Monitorea variaciones anómalas en precios de supermercados peruanos.
                Detecta manipulaciones, compara tendencias y mantente informado sobre los precios reales.
              </p>

              <SearchBox 
                onSearch={handleSearch}
                onResults={handleSearchResults}
              />
            </div>
            
            <nav className="herramientas">
              <button 
                onClick={() => {
                  if (user) {
                    navigate('/alert');
                  } else {
                    openModalWithRedirect('/alert');
                  }
                }} 
                className="alerta"
              >
                <div className="iconos">
                  <i className="bi bi-bell-fill icono-alerta"></i>
                </div>
                <br />
                <b>Alerta</b>
                <p>Notificaciones de cambios sospechosos</p>
              </button>

              <div className="subherramientas">
                <button 
                  onClick={() => {
                    if (user) {
                      navigate('/dashboard');
                    } else {
                      openModalWithRedirect('/dashboard');
                    }
                  }} 
                  className="dashboard"
                >
                  <div className="iconos">
                    <i className="bi bi-bar-chart-line-fill icono-dash"></i>
                  </div>
                  <br />
                  <b>Dashboard</b>
                  <p>Control para monitorear la transparencia de precios de cada producto</p>
                </button>

                <button onClick={() => navigate('/products')} className="productos">
                  <div className="iconos">
                    <i className="bi bi-bag-check-fill icono-pro"></i>
                  </div>
                  <br />
                  <b>Productos</b>
                  <p>Información general de productos y precios</p>
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Footer con estadísticas dinámicas */}
      <div className="footer">
        <div className="dato">
          <b>
            {footerStats.loading
              ? '...'
              : footerStats.error
                ? 'Error'
                : footerStats.totalProducts}
          </b>
          <br />
          <p>Productos Monitoreados</p>
        </div>
        <div className="dato">
          <b>
            {footerStats.loading
              ? '...'
              : footerStats.error
                ? 'Error'
                : footerStats.totalSupermarkets}
          </b>
          <br />
          <p>Supermercados</p>
        </div>
        <div className="dato">
          <b>
            {footerStats.loading
              ? '...'
              : footerStats.error
                ? 'Error'
                : footerStats.activeAlerts}
          </b>
          <br />
          <p>Alertas Activas</p>
        </div>
        <div className="dato">
          <b>
            {footerStats.loading
              ? '...'
              : footerStats.error
                ? 'Error'
                : footerStats.totalUpdates}
          </b>
          <br />
          <p>Actualizaciones</p>
        </div>
      </div>
      
      <Modal 
        isOpen={isModelOpen}
        closeModal={closeModal}
        updateUser={updateUser}
        redirectAfterAuth={redirectAfterAuth}
      />
    </div>
  );
}

export default Main;