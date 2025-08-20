import React, { useState } from 'react';
import '../styles/SearchBox.css';

const SearchBox = ({ onSearch, onResults }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función simple: Por cada supermercado, si hay oferta, mostrar SOLO la oferta (ocultar precio normal)
  const hideRegularPriceIfOfferExists = (products) => {
    const productsByStore = {};
    
    // Agrupar por supermercado
    products.forEach(product => {
      const store = (product.store || product.source || 'unknown').trim();
      if (!productsByStore[store]) {
        productsByStore[store] = [];
      }
      productsByStore[store].push(product);
    });
    
    const finalProducts = [];
    
    // Por cada supermercado, revisar si hay ofertas
    Object.entries(productsByStore).forEach(([store, storeProducts]) => {
      const productsWithOffers = storeProducts.filter(p => 
        !!(p.offer_price || p.discount_price || p.original_price)
      );
      const productsWithoutOffers = storeProducts.filter(p => 
        !(p.offer_price || p.discount_price || p.original_price)
      );
      
      if (productsWithOffers.length > 0) {
        // Este supermercado tiene ofertas
        productsWithOffers.forEach(offerProduct => {
          // Agregar la oferta
          finalProducts.push(offerProduct);
          
          // Buscar si existe el mismo producto sin oferta y NO agregarlo
          const productName = offerProduct.name.toLowerCase().trim();
          // Ya no agregamos la versión sin oferta del mismo producto
        });
        
        // Agregar productos sin oferta que NO tengan versión con oferta
        productsWithoutOffers.forEach(regularProduct => {
          const productName = regularProduct.name.toLowerCase().trim();
          const hasOfferVersion = productsWithOffers.some(offerProduct => 
            offerProduct.name.toLowerCase().trim() === productName
          );
          
          if (!hasOfferVersion) {
            finalProducts.push(regularProduct);
          }
        });
        
      } else {
        // Este supermercado NO tiene ofertas, agregar todos sus productos
        finalProducts.push(...productsWithoutOffers);
      }
    });
    
    return finalProducts;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const searchValue = e.target.elements['search-input'].value.trim();
    
    // Validación básica
    if (!searchValue) {
      setError('Por favor ingresa un término de búsqueda');
      return;
    }

    if (searchValue.length < 2) {
      setError('El término de búsqueda debe tener al menos 2 caracteres');
      return;
    }

    // Limpiar errores anteriores
    setError(null);
    setIsLoading(true);

    try {
      // Llamar callback onSearch si existe (para componentes padre)
      if (onSearch) {
        onSearch(searchValue);
      }

      // PASO 1: Buscar primero en productos guardados
      console.log('🔍 Buscando en productos guardados...');
      const savedResponse = await fetch(
        `http://127.0.0.1:5000/api/products/search/saved?query=${encodeURIComponent(searchValue)}&limit=50&sort_by=price`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      const savedData = await savedResponse.json();

      if (savedData.success && savedData.products && savedData.products.length > 0) {
        // Filtrar: ocultar precios normales si existe oferta del mismo producto en mismo supermercado
        const filteredProducts = hideRegularPriceIfOfferExists(savedData.products);
        
        if (onResults) {
          onResults(filteredProducts, searchValue, 'search_saved');
        }
        console.log(`✅ Productos originales: ${savedData.products.length} → Productos filtrados: ${filteredProducts.length}`);
      } else {
        // PASO 2: Si no hay productos guardados, buscar en APIs en tiempo real
        console.log('🌐 No hay productos guardados, buscando en APIs...');
        
        const apiResponse = await fetch('http://127.0.0.1:5000/api/products/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: searchValue,
            limit: 20,
            save_to_db: true // Guardar resultados para futuras búsquedas
          })
        });

        const apiData = await apiResponse.json();

        if (apiData.success) {
          // También filtrar resultados de APIs
          const filteredResults = hideRegularPriceIfOfferExists(apiData.results);
          
          if (onResults) {
            onResults(filteredResults, searchValue, 'search_api');
          }
          console.log('✅ Búsqueda en APIs exitosa:', apiData);
        } else {
          setError(apiData.message || 'Error en la búsqueda');
          console.error('❌ Error en búsqueda:', apiData);
        }
      }

    } catch (error) {
      console.error('❌ Error conectando con la API:', error);
      setError('Error de conexión. Verifica que el backend esté funcionando.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="search-box">
      <form className='formularioBuscar' method="get" id="search-form" onSubmit={handleSubmit}>
        <input
          type="text"
          id="search-input"
          name="search-input"
          placeholder="Buscar producto (ej: leche, arroz, aceite...)"
          disabled={isLoading}
        />
        <input 
          className="search-button" 
          type="submit" 
          value={isLoading ? "Buscando..." : "Buscar"}
          disabled={isLoading}
        />
      </form>
      
      {/* Mostrar error si existe */}
      {error && (
        <div className="search-error" style={{ 
          color: 'red', 
          fontSize: '14px', 
          marginTop: '8px',
          padding: '8px',
          backgroundColor: '#ffebee',
          borderRadius: '4px',
          border: '1px solid #ffcdd2'
        }}>
          ⚠️ {error}
        </div>
      )}
      
      {/* Indicador de carga */}
      {isLoading && (
        <div className="search-loading" style={{
          fontSize: '14px',
          marginTop: '8px',
          padding: '8px',
          backgroundColor: '#e3f2fd',
          borderRadius: '4px',
          border: '1px solid #bbdefb',
          color: '#1976d2'
        }}>
          <div className="loading-steps">
            <div>🔍 Buscando ofertas y precios regulares...</div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>
              Ocultando precios normales cuando hay ofertas
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBox;