
import React, { useState, useEffect } from 'react';
import './styles/products.css';
import './styles/model.css';
import productoImg from './assets/img/acite.jpg';
import TopBar from './components/TopBar.jsx';
import ProductosX from './components/ProductosX.jsx';
import Drop_DownM from './components/Drop_Down_Menu.jsx';

function Products() {
  const [isOpenM, setIsOpenM] = useState(true);
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsOpenM(false);
      } else {
        setIsOpenM(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const productos = Array(30).fill({
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
      <div className="barraJex">
        <Drop_DownM isOpenM={isOpenM} closeDown={() => setIsOpenM(false)} />
      </div>
      <div className="buProductos">
        <div className='abrirDown'>
          <TopBar onSearch={handleSearch} openMenu={() => setIsOpenM(true)} />
        </div>
        <div className="productosX">
    <ProductosX productos={productos} />
  </div>
      </div>
    </div>
  );
}
export default Products;
