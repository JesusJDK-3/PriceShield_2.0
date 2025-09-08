import React, { useEffect, useRef, useState } from "react";
import SearchBoxBF from './SearchBoxBF.jsx';
import '../styles/TopBarF.css';
import { Link } from 'react-router-dom';
import IconSelect from "./IconSelect.jsx";
import ModalWe from "./ModalWe.jsx";
import logo from '../assets/img/logF.png';
const TopBarF = ({ onSearch, onResults, user, logout }) => {
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
    const [isModelOpen, setIsModalOpen] = useState(false);
    const [redirectAfterAuth, setRedirectAfterAuth] = useState(null); // Nueva variable
    // Función para abrir modal con redirección específica
    const openModal = () => {
        setIsModalOpen(true);
    };

    // Función cuando se cierra el modal
    const closeModal = () => {
        setIsModalOpen(false);
    };
    return (
        <>
            <div className="BarraSuperior">
                <span className="LogoPriceShield" title="Pagina Principal">
                    <a href="/" className="logoPD">
                        <span className="logIcon">
                            <img src={logo} alt="PreciShield" />
                        </span>
                    </a>
                </span>
                <div className="BuscarModal">
                    <i className="bi bi-search" onClick={() => setIsModalOpen(true)} ></i>
                </div>
                <div className="BuscadorFiltro">
                    <SearchBoxBF
                        onSearch={onSearch}
                        onResults={onResults}
                    />

                </div>
                <div className="IconSelect">
                    <IconSelect />
                    <i
                        className={`bi bi-escape ${getUserDisplayName() !== "Invitado" ? "salirUsuario" : ""}`}
                        onClick={logout}
                        title="Cerrar sesión"
                    ></i>
                </div>

                <div className="IconosPestañas">
                    <Link to="/products">
                        <i className="bi bi-bag-check-fill productoBF" title="Producto"></i>
                    </Link>
                    <Link to="/dashboard">
                        <i className="bi bi-bar-chart-line-fill dashBF" title="Panel"></i>
                    </Link>
                    <Link to="/alert">
                        <i className="bi bi-exclamation-triangle alertaBF" title="Alerta"></i>
                    </Link>
                    <Link to="/we">
                        <i className="bi bi-person-badge nosotrosBF" title="Nosotros"></i>
                    </Link>
                    <i
                        className={`bi bi-escape ${getUserDisplayName() !== "Invitado" ? "salirUsuario" : ""}`}
                        onClick={logout}
                        title="Cerrar sesión"
                    ></i>

                </div>
                <div className="UsuarioBF" >
                    <span className={`${getUserDisplayName() !== "Invitado" ? "nombreUsuario" : ""}`}>
                        {getUserDisplayName()}
                    </span>
                    <span className="avatarUsuario">
                        {getUserAvatar()}
                    </span>
                </div>

            </div>
            <ModalWe
                isOpen={isModelOpen}
                closeModal={closeModal} // Nueva prop
            />
        </>

    );

};

export default TopBarF;