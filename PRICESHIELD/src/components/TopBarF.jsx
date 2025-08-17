import React from "react";
import SearchBox from './SearchBox.jsx';
import '../styles/TopBarF.css';
import { Link } from 'react-router-dom';
import IconSelect from "./IconSelect.jsx";
import logo from '../assets/img/logF.png';

const TopBarF = ({ onSearch, onResults, user }) => {
    const getUserDisplayName = () => {
        if (!user) return 'Invitado';

        // Si hay nombre completo (Google Auth), usar solo el primer nombre
        if (user.nombre && user.nombre.trim()) {
            return user.nombre.split(' ')[0];
        }

        // Si no hay nombre, usar la parte antes del @ del correo (Manual Auth)
        if (user.email) {
            return user.email.split('@')[0];
        }

        // Fallback con correo si existe
        if (user.correo) {
            return user.correo.split('@')[0];
        }

        return 'Usuario';
    };

    // Función para obtener la imagen de perfil
    const getUserAvatar = () => {
        // Si el usuario tiene foto (Google Auth)
        if (user?.foto) {
            return (
                <img
                    src={user.foto}
                    alt="Avatar"
                    className="caraU avatar-img"
                    style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                />
            );
        }

        // Fallback al ícono de Bootstrap (Manual Auth o sin login)
        return <i className="bi bi-person-circle caraU"></i>;
    };
    const handleDashboardClick = () => {
    navigate('/dashboard');
  };
    return (
        <>
            <div className="BarraSuperior">
                <span className="LogoPriceShield">
                    <img src={logo} alt="Logo PriceShield" className="LogoPriceBarra"/>
                </span>
                <div className="BuscadorFiltro">
                    <SearchBox
                        onSearch={onSearch}
                        onResults={onResults}
                    />
                    <i className="bi bi-filter-square Filtros"></i>
                </div>
                <div className="IconSelect">
                    <IconSelect/>
                </div>
                
                <div className="IconosPestañas">
                    <Link to="/products">
                    <i className="bi bi-bag-check-fill productoBF"></i>
                    </Link>
                    <a onClick={handleDashboardClick} style={{ cursor: 'pointer' }}>
                    <i className="bi bi-bar-chart-line-fill dashBF"></i>
                    </a>
                    <Link to="/alert">
                    <i className="bi bi-exclamation-triangle alertaBF"></i>
                    </Link>
                    <Link to="/we">
                    <i className="bi bi-person-badge nosotrosBF"></i>
                    </Link>
                </div>
                <div className="UsuarioBF">
                    <span className="nombreUsuario">
                        {getUserDisplayName()}
                    </span>
                    <span className="avatarUsuario">
                        {getUserAvatar()}
                    </span>
                </div>
            </div>
        </>

    );

};

export default TopBarF;