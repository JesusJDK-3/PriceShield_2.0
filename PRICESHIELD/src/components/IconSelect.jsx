import React, { useState } from "react";
import { Link } from "react-router-dom";
import '../styles/IconSelect.css';
function IconSelect() {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleSelect = (option) => {
    setSelected(option);
    setIsOpen(false);
  };

  return (
    <div className="icon-select">
      {/* "Botón" que abre/cierra el menú (muestra lo seleccionado o un ícono por defecto) */}
      <div className="icon-select-btn" onClick={toggleMenu}>
        {isOpen ? (
          <i className="bi bi-list-nested desplegadoBF"></i>
        ) : (
          <i className="bi bi-list listaBF"></i>
        )}
      </div>

      {/* Opciones desplegables */}
      {isOpen && (
        <div className="icon-options">
          <Link to="/products" onClick={() => handleSelect("bi-bag-check-fill")}>
            <i className="bi bi-bag-check-fill"></i>
          </Link>
          <Link to="/dashboard">
            <i className="bi bi-bar-chart-line-fill dashBF"></i>
          </Link>
          <Link to="/alert" onClick={() => handleSelect("bi-exclamation-triangle")}>
            <i className="bi bi-exclamation-triangle"></i>
          </Link>
          <Link to="/we" onClick={() => handleSelect("bi-person-badge")}>
            <i className="bi bi-person-badge"></i>
          </Link>
        </div>
      )}
    </div>
  );
}

export default IconSelect;
