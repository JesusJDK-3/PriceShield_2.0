import React, { useState } from 'react';
import './styles/products.css';
import './styles/model.css';
import productoImg from './assets/img/acite.jpg';
import SearchBox from './components/SearchBox.jsx';
import Drop_DownM from './components/Drop_Down_Menu.jsx';

function Products() {
  const [isOpenM, setIsOpenM] = useState(true); // estado de la barra lateral

  const productos = Array(10).fill({
    nombre: "Aceite Primor de 900ml",
    precio: "S/100",
    supermercado: "Metro",
    imagen: productoImg,
  });

  const handleSearch = (searchTerm) => {
    console.log('Buscando:', searchTerm);
  };

  return (
    <div className={`contenedor_general ${!isOpenM ? 'soloContenido' : ''}`}>
      {/* Mostrar el menú solo si está abierto */}
      <Drop_DownM isOpenM={isOpenM} closeDown={() => setIsOpenM(false)} />

      <div className="buProductos">
        <div className={`abrirDown ${isOpenM ? 'mostrarContenido' : ''}`}>
          {!isOpenM && (<i className="bi bi-list abrirMenu" onClick={() => setIsOpenM(true)}></i>)}
          <div className="buscar">
          
          <div className="buscador">
            <SearchBox onSearch={handleSearch} />
          </div>

          <div className="usuario">
            <span>Dany</span>
            <i className="bi bi-person-circle caraU"></i>
          </div>
        </div>
        </div>
        

        <div className="productosX">
          {productos.map((producto, index) => (
            <div className="producto" key={index}>
              <div className="imagenP">
                <img src={producto.imagen} alt={producto.nombre} />
              </div>
              <div className="detallesPro">
                <p>{producto.nombre}</p>
                <p>{producto.precio}</p>
                <p>{producto.supermercado}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Products;
