import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/img/log.png';
import '../styles/Drop_Down_Menu.css';
import { Link } from 'react-router-dom';
const Drop_DownM = ({ isOpenM, closeDown }) => {
  const { state: producto } = useLocation();// Obtiene el producto seleccionado desde el estado de la ubicación
  const navigate = useNavigate();   // Navegación para regresar a la lista de productos
  if (!isOpenM) return null;
  const handleDashboardClick = () => {
    navigate('/dashboard');
  };
  return (
    <div className="barra">
       {/*Logo y Lineas de esconder menu */}
      <div className='DropDown'>
        <a href="/" className="logoPD">
          <span className="logIcon">
            <img src={logo} alt="PreciShield" />
          </span>
        </a>
        <i className="bi bi-list down" onClick={closeDown}></i>
      </div>
      {/*FIN Logo y Lineas de esconder menu */}
      {/*Sección productos */}
      <Link to="/products">
        <i className="bi bi-bag-check-fill productoI"></i>
        <p>Productos</p>
      </Link>
      {/*Fin Sección productos */}
      {/*Sección Dasboard pasando el producto usando la fucion handleDashboardClick */}
      <a onClick={handleDashboardClick}>
        <i className="bi bi-bar-chart-line-fill dashI"></i>
        <p>Dashboard</p>
      </a>
      {/*Fin Sección Dasboard pasando el producto usando la fucion handleDashboardClick */}

      <div className="ultimo">
        {/*Sección Alertas */}
        <a href="#">
          <i className="bi bi-exclamation-triangle alertaI"></i>
          <p>Alertas</p>
          <span className="msg_count">14</span>
        </a>
        {/*Fin Sección Alertas */}
        {/*Sección Nosotros */}
        <a href="#">
          <i className="bi bi-person-badge nosotrosI"></i>
          <p>Nosotros</p>
        </a>
        {/*Fin Sección Nosotros */}
      </div>
    </div>
  );
};

export default Drop_DownM;
