import React, { useState, useEffect } from 'react';
import './styles/products.css';
import './styles/model.css';
import TopBar from './components/TopBar.jsx';
import ProductosX from './components/ProductosX.jsx';
import Drop_DownM from './components/Drop_Down_Menu.jsx';

function Products() {
  const [isOpenM, setIsOpenM] = useState(true);
  
  // Estados para productos
  const [productos, setProductos] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingType, setLoadingType] = useState("initial");
  
  // Estados para paginación
  const [pagination, setPagination] = useState(null);

  // Cargar todos los productos al iniciar el componente
  useEffect(() => {
    loadAllProducts();
  }, []);

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

  // Función para cargar todos los productos desde la base de datos
  const loadAllProducts = async (page = 1) => {
    try {
      setIsLoadingProducts(true);
      setLoadingType(page === 1 ? "initial" : "pagination");
      console.log(`📦 Cargando productos desde la base de datos (página ${page})...`);
      
      const response = await fetch(
        `http://127.0.0.1:5000/api/products/all?page=${page}&limit=100&sort_by=updated_at`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        setProductos(data.products || []);
        setPagination(data.pagination || null);
        setSearchQuery(""); // Limpiar query de búsqueda
        console.log(`✅ Productos cargados: ${data.products?.length || 0}`);
        
        if (data.products?.length === 0 && page === 1) {
          // Si no hay productos en la primera carga, intentar forzar actualización
          console.log("🔄 No hay productos, considerando forzar actualización de BD...");
        }
      } else {
        console.error('❌ Error cargando productos:', data.message);
        setProductos([]);
        setPagination(null);
      }

    } catch (error) {
      console.error('❌ Error conectando con la API:', error);
      setProductos([]);
      setPagination(null);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Callback para cuando se inicia una búsqueda
  const handleSearch = (query) => {
    console.log('🔍 Iniciando búsqueda:', query);
    setSearchQuery(query);
    setIsLoadingProducts(true);
    setLoadingType("search");
    setProductos([]); // Limpiar productos anteriores
    setPagination(null); // Limpiar paginación durante búsqueda
  };

  // Callback para cuando se reciben resultados del backend
  const handleResults = (results, query, type = "search") => {
    setIsLoadingProducts(false);
    setSearchQuery(query);
    
    if (type === "search_api") {
      // Resultados de búsqueda en APIs en tiempo real
      const allProducts = [];
      
      if (results && typeof results === 'object') {
        Object.keys(results).forEach(supermarketKey => {
          if (supermarketKey !== 'summary') {
            const supermarketData = results[supermarketKey];
            if (supermarketData.success && supermarketData.products) {
              allProducts.push(...supermarketData.products);
            }
          }
        });
      }
      
      console.log(`📦 Total productos de APIs: ${allProducts.length}`);
      setProductos(allProducts);
      setPagination(null); // No hay paginación en búsquedas de API
    } else if (type === "search_saved" || type === "filtered") {
      // Resultados de búsqueda en productos guardados
      console.log(`📦 Productos filtrados: ${results?.length || 0}`);
      setProductos(results || []);
      setPagination(null); // No hay paginación en búsquedas filtradas
    }
  };

  // Manejar cambio de página
  const handleLoadMore = (page) => {
    if (!searchQuery) {
      // Solo permitir paginación cuando no hay búsqueda activa
      loadAllProducts(page);
    }
  };

  return (
    <div className={`contenedor_general ${!isOpenM ? 'soloContenido' : ''}`}>
      <div className="barraJex">
        <Drop_DownM isOpenM={isOpenM} closeDown={() => setIsOpenM(false)} />
      </div>
      <div className="buProductos">
        <div className='abrirDown'>
          <TopBar 
            onSearch={handleSearch}
            onResults={handleResults}
            openMenu={() => setIsOpenM(true)} 
          />
        </div>
        <div className="productosX">
          <ProductosX
            productos={productos}
            isLoading={isLoadingProducts}
            searchQuery={searchQuery}
            pagination={pagination}
            onLoadMore={handleLoadMore}
            loadingType={loadingType}
          />
        </div>
      </div>
    </div>
  );
}

export default Products;