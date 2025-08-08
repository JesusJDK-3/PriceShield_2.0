
import React, { useState, useEffect } from 'react';
import './styles/products.css';
import './styles/model.css';
import productoImg from './assets/img/acite.jpg';
import productoImG from './assets/img/gloria.jpeg';
import productoImgA from './assets/img/arroz.jpg';
import productoImgAZ from './assets/img/azucar.jpg';
import productoImgI from './assets/img/ICA-KOLA1.jpg';
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
  const productos = [
  // Aceite
  {
    nombre: "Aceite Primor de 900ml",
    precio: "S/100",
    supermercado: "Metro",
    imagen: productoImg,
  },
  {
    nombre: "Aceite Primor de 900ml",
    precio: "S/92.5",
    supermercado: "PlazaVea",
    imagen: productoImg,
  },
  {
    nombre: "Aceite Primor de 900ml",
    precio: "S/95.0",
    supermercado: "Tottus",
    imagen: productoImg,
  },
  {
    nombre: "Aceite Primor de 900ml",
    precio: "S/97.8",
    supermercado: "RealPlaza",
    imagen: productoImg,
  },

  // Leche
  {
    nombre: "Leche Gloria 1L",
    precio: "S/4.8",
    supermercado: "Tottus",
    imagen: productoImG,
  },
  {
    nombre: "Leche Gloria 1L",
    precio: "S/5.1",
    supermercado: "RealPlaza",
    imagen: productoImG,
  },
  {
    nombre: "Leche Gloria 1L",
    precio: "S/4.9",
    supermercado: "Metro",
    imagen: productoImG,
  },
  {
    nombre: "Leche Gloria 1L",
    precio: "S/5.3",
    supermercado: "PlazaVea",
    imagen: productoImG,
  },

  // Arroz
  {
    nombre: "Arroz Costeño 5kg",
    precio: "S/24.5",
    supermercado: "Metro",
    imagen: productoImgA,
  },
  {
    nombre: "Arroz Costeño 5kg",
    precio: "S/30.2",
    supermercado: "Tottus",
    imagen: productoImgA,
  },
  {
    nombre: "Arroz Costeño 5kg",
    precio: "S/26.0",
    supermercado: "PlazaVea",
    imagen: productoImgA,
  },
  {
    nombre: "Arroz Costeño 5kg",
    precio: "S/28.4",
    supermercado: "RealPlaza",
    imagen: productoImgA,
  },

  // Azúcar
  {
    nombre: "Azúcar Rubia 1kg",
    precio: "S/3.5",
    supermercado: "PlazaVea",
    imagen: productoImgAZ,
  },
  {
    nombre: "Azúcar Rubia 1kg",
    precio: "S/7.9",
    supermercado: "RealPlaza",
    imagen: productoImgAZ,
  },
  {
    nombre: "Azúcar Rubia 1kg",
    precio: "S/4.2",
    supermercado: "Metro",
    imagen: productoImgAZ,
  },
  {
    nombre: "Azúcar Rubia 1kg",
    precio: "S/5.0",
    supermercado: "Tottus",
    imagen: productoImgAZ,
  },

  // Gaseosa
  {
    nombre: "Gaseosa Inka Kola 1.5L",
    precio: "S/6.3",
    supermercado: "Metro",
    imagen: productoImgI,
  },
  {
    nombre: "Gaseosa Inka Kola 1.5L",
    precio: "S/9.7",
    supermercado: "Tottus",
    imagen: productoImgI,
  },
  {
    nombre: "Gaseosa Inka Kola 1.5L",
    precio: "S/7.2",
    supermercado: "PlazaVea",
    imagen: productoImgI,
  },
  {
    nombre: "Gaseosa Inka Kola 1.5L",
    precio: "S/8.0",
    supermercado: "RealPlaza",
    imagen: productoImgI,
  }
];
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
