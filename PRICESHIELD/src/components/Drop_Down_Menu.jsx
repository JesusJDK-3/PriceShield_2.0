import React from 'react';
import logo from '../assets/img/log.png';
import '../styles/Drop_Down_Menu.css';
import { Link } from 'react-router-dom';

const Drop_DownM = ({ isOpenM, closeDown }) => {
  if (!isOpenM) return null;

  return (
    <div className="barra">
      <div className='DropDown'>
        <a href="/" className="logoPD">
          <span className="logIcon">
            <img src={logo} alt="PreciShield" />
          </span>
        </a>

        <i className="bi bi-list down" onClick={closeDown}></i>

      </div>
      <Link to="/products">
  <i className="bi bi-bag-check-fill productoI"></i>
  <p>Productos</p>
</Link>
      <a href="#">
        <i className="bi bi-bar-chart-line-fill dashI"></i>
        <p>Dashboard</p>
      </a>
      <div className="ultimo">
        <a href="#">
          <i className="bi bi-exclamation-triangle alertaI"></i>
          <p>Alertas</p>
          <span className="msg_count">14</span>
        </a>
        <a href="#">
          <i className="bi bi-person-badge nosotrosI"></i>
          <p>Nosotros</p>
        </a>
      </div>
    </div>
  );
};

export default Drop_DownM;
