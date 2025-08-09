import './styles/all.css';
import './styles/model.css';
import logo from './assets/img/log.png';
import SearchBox from './components/SearchBox.jsx';
import Modal from "./components/Modal.jsx";
import { useState } from "react";
import { useNavigate } from 'react-router-dom';

function Main() {
  const navigate = useNavigate(); // <-- Hook para navegación

  const handleSearch = (searchTerm) => {
    console.log('Buscando:', searchTerm);
  };

  const [isModelOpen, setIsModalOpen] = useState(false);

  return (
    <div className="todo">
      <div className="Registrate">
        <div className="BotonEfirst">
          <div className="BotonRegistrar">
          <button onClick={() => setIsModalOpen(true)} className="Regis">Registrate</button>
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

            <SearchBox onSearch={handleSearch} />
          </div>
          <nav className="herramientas">
            <button onClick={() => setIsModalOpen(true)} className="alerta">
              <div className="iconos">
                <i className="bi bi-bell-fill icono-alerta"></i>
              </div>
              <br />
              <b>Alerta</b>
              <p>Notificaciones de cambios sospechosos</p>
            </button>

            <div className="subherramientas">
              <button onClick={() => setIsModalOpen(true)} className="dashboard">
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

      <div className="footer">
        <div className="dato">
          <b>1,247</b>
          <br />
          <p>Productos Monitoreados</p>
        </div>
        <div className="dato">
          <b>8</b>
          <br />
          <p>Supermercados</p>
        </div>
        <div className="dato">
          <b>23</b>
          <br />
          <p>Alertas Activas</p>
        </div>
        <div className="dato">
          <b>24</b>
          <br />
          <p>Actualización</p>
        </div>
      </div>
      <Modal isOpen={isModelOpen} closeModal={() => setIsModalOpen(false)} />
    </div>
  );
}

export default Main;
