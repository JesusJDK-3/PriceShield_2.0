import React, { useState } from 'react';
import '../styles/SearchBoxBF.css';
const SearchBox = ({ onSearch, onResults }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
    setIsLoading(true); // ✅ CORREGIDO: era setIsLoadingProducts(true)

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
        // Si encontramos productos guardados, mostrarlos
        if (onResults) {
          onResults(savedData.products, searchValue, 'search_saved');
        }
        console.log(`✅ Encontrados ${savedData.products.length} productos guardados`);
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
          // Pasar los resultados de las APIs al componente padre
          if (onResults) {
            onResults(apiData.results, searchValue, 'search_api');
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
      setIsLoading(false); // ✅ CORREGIDO: era setIsLoadingProducts(false)
    }
  };

  return (
    <div className="search-boxBF">
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
            <div>🔍 Buscando en productos guardados...</div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>
              Si no se encuentran resultados, buscaremos en tiempo real
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBox;