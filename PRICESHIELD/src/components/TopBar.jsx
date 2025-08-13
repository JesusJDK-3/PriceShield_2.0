import React from 'react';
import SearchBox from './SearchBox.jsx';

const TopBar = ({ onSearch, onResults, openMenu }) => {
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
          <span>Dany</span>
          <i className="bi bi-person-circle caraU"></i>
        </div>
      </div>
    </>
  );
};

export default TopBar;