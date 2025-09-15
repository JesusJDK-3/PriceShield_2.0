import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // Importar useLocation
import './styles/products.css';
import './styles/model.css';
import TopBarF from './components/TopBarF.jsx';
import ProductosX from './components/ProductosX.jsx';


function Products({ user, logout }) { // ✅ CAMBIO 1: Recibir user como prop
  const apiUrl = import.meta.env.VITE_API_URL;

  const location = useLocation(); // Hook para acceder al state pasado desde Main
  const [isOpenM, setIsOpenM] = useState(true);
  
  // Estados para productos
  const [productos, setProductos] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingType, setLoadingType] = useState("initial");
  
  // Estados para paginación
  const [pagination, setPagination] = useState(null);

  // Manejar datos pasados desde Main.jsx cuando se hace búsqueda
 useEffect(() => {
  if (location.state) {
    const { searchResults, searchQuery: query, searchType } = location.state;

    if (searchResults && query) {
      
      setProductos(searchResults);
      setSearchQuery(query);
      setPagination(null);
    } else if (query) {
      setSearchQuery(query);
      executeSearch(query);
    }
  } else {
    // Si no hay búsqueda, carga normal
    loadAllProducts();
  }
}, [location.state]);


  // Función auxiliar para ejecutar búsqueda
  const executeSearch = async (query) => {
    try {
      setIsLoadingProducts(true);
      setLoadingType("search");
      
      // PASO 1: Buscar en productos guardados
      const savedResponse = await fetch(
        `${apiUrl}/api/products/search/saved?query=${encodeURIComponent(query)}&limit=50&sort_by=price`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const savedData = await savedResponse.json();

      if (savedData.success && savedData.products && savedData.products.length > 0) {
        setProductos(savedData.products);
        
      } else {
        // PASO 2: Buscar en APIs
        const apiResponse = await fetch(`${apiUrl}/api/products/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: query,
            limit: 20,
            save_to_db: true
          })
        });

        const apiData = await apiResponse.json();
        
        if (apiData.success) {
          const allProducts = [];
          Object.keys(apiData.results).forEach(supermarketKey => {
            if (supermarketKey !== 'summary') {
              const supermarketData = apiData.results[supermarketKey];
              if (supermarketData.success && supermarketData.products) {
                allProducts.push(...supermarketData.products);
              }
            }
          });
          setProductos(allProducts);
        }
      }
      
      setPagination(null);
      
    } catch (error) {
      console.error('❌ Error en búsqueda:', error);
      setProductos([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Cargar todos los productos al iniciar el componente
  const loadAllProducts = async (page = 1) => {
    try {
      setIsLoadingProducts(true);
      setLoadingType(page === 1 ? "initial" : "pagination");
      
      const response = await fetch(
        `${apiUrl}/api/products/all?page=${page}&limit=100&sort_by=updated_at`,
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
        
        if (data.products?.length === 0 && page === 1) {
          // Si no hay productos en la primera carga, intentar forzar actualización
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

  // Callback para cuando se inicia una búsqueda desde TopBar
  const handleSearch = (query) => {
    setSearchQuery(query);
    executeSearch(query);
  };

  // Callback para cuando se reciben resultados del TopBar
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
      

      setProductos(allProducts);
      setPagination(null); // No hay paginación en búsquedas de API
    } else if (type === "search_saved" || type === "filtered") {
      // Resultados de búsqueda en productos guardados
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
      <div className="buProductos">
        <div className="TopBarFDP">
          
          <TopBarF 
            onSearch={handleSearch}
            onResults={handleResults}
            openMenu={() => setIsOpenM(true)}
            user={user} // ✅ CAMBIO 2: Pasar user al TopBar
            logout={logout} // ✅ CAMBIO 3: Pasar logout al TopBar
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