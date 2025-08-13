import React from 'react';
import SearchBox from './SearchBox.jsx';

const TopBar = ({ onSearch, onResults, openMenu, user }) => {
  // Función para obtener el nombre a mostrar
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

  return (
    <>
      <i className="bi bi-list abrirMenu" onClick={openMenu}></i>
      <div className="buscar">
        <div className="buscador">
          <SearchBox 
            onSearch={onSearch}
            onResults={onResults}
          />
        </div>
        <div className="usuario">
          <span title={user?.email || user?.correo || 'No autenticado'}>
            {getUserDisplayName()}
          </span>
          {getUserAvatar()}
        </div>
      </div>
    </>
  );
};

export default TopBar;