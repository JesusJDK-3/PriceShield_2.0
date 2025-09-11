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
          <Link to="/products" onClick={() => handleSelect("bi-bag-check-fill")} className="EliminarDecoracion">
            <div className="EnlacesIconSelect">
              <i className="bi bi-bag-check-fill productoBF"></i> <span >Producto</span>
              </div>
          </Link>
          <Link to="/dashboard" className="EliminarDecoracion">
          <div className="EnlacesIconSelect">
            <i className="bi bi-bar-chart-line-fill dashBF"></i> <span >Panel</span></div>
          </Link>
          <Link to="/alert" onClick={() => handleSelect("bi-exclamation-triangle")} className="EliminarDecoracion">
            <div className="EnlacesIconSelect">
            <i className="bi bi-exclamation-triangle alertaBF"></i> <span >Alertas</span></div>
          </Link>
          <Link to="/we" onClick={() => handleSelect("bi-person-badge")} className="EliminarDecoracion">
            <div className="EnlacesIconSelect">
            <i className="bi bi-person-badge nosotrosBF"></i><span >Nosotros</span></div>
          </Link>
          
        </div>
      )}
    </div>
  );
}

export default IconSelect;
