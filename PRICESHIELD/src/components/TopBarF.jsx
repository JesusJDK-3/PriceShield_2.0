import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom'; // ⬅️ Importa useNavigate
import SearchBoxBF from './SearchBoxBF.jsx';
import '../styles/TopBarF.css';
import IconSelect from "./IconSelect.jsx";
import ModalWe from "./ModalWe.jsx";
import logo from '../assets/img/logF.png';

const TopBarF = ({ onSearch, onResults, user, logout }) => {
    const navigate = useNavigate(); // ⬅️ Inicializa navigate

    const getUserDisplayName = () => {
        if (!user) return 'Invitado';
        if (user.nombre && user.nombre.trim()) return user.nombre.split(' ')[0];
        if (user.email) return user.email.split('@')[0];
        if (user.correo) return user.correo.split('@')[0];
        return 'Usuario';
    };

    const getUserAvatar = () => {
        const avatarUrl = user?.foto || user?.image || user?.avatar || user?.profile_picture;
        if (avatarUrl) {
            return (
                <img
                    src={avatarUrl}
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
                    onError={e => { e.target.src = '/assets/img/default-user.png'; }}
                />
            );
        }
        return <i className="bi bi-person-circle caraU"></i>;
    };

    const [isModelOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

   // 🚀 Función para manejar resultados y redirigir a productos
const handleResults = (results, searchValue, source) => {
    if (onResults) {
        onResults(results, searchValue, source);
    }

    navigate("/products", {
        state: {
            searchResults: results,
            searchQuery: searchValue,
            searchType: source
        }
    });
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
                        onResults={handleResults}
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
                closeModal={closeModal}
            />
        </>
    );
};

export default TopBarF;
