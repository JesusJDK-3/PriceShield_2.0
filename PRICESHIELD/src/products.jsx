import React from 'react';
import './styles/products.css';
import './styles/model.css'
import logo from './assets/img/log.png';
import productoImg from './assets/img/acite.jpg'; // Cambia la ruta según tu estructura
import SearchBox from './components/SearchBox.jsx';
function Products() {
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
    <div className="contenedor_general">
      <div className="barra">
        <a href="/" className="logoPD">
          <span className="logIcon">
            <img src={logo} alt="PreciShield" />
            <h2>PriceShield</h2>
          </span>
        </a>
        <a href="#" className="active">
          <i className="bi bi-bag-check-fill productoI"></i>
          <p>Productos</p>
        </a>
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
            <i className="bi bi-person-badge"></i>
            <p>Nosotros</p>
          </a>
        </div>
      </div>

      <div className="buProductos">
        <div className="buscar">
          <div className="buscador">
            <SearchBox onSearch={handleSearch} />
          </div>

          <div className="usuario">
            <span>Dany</span>
            <i className="bi bi-person-circle caraU"></i>
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

