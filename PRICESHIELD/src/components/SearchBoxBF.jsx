import React, { useState } from 'react';
import '../styles/SearchBoxBF.css';
const SearchBox = ({ onSearch, onResults }) => {
  const apiUrl = import.meta.env.VITE_API_URL;
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
      
      const savedResponse = await fetch(
        `${apiUrl}/api/products/search/saved?query=${encodeURIComponent(searchValue)}&limit=50&sort_by=price`,
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
        
      } else {
        // No hay productos guardados - mostrar mensaje
        if (onResults) {
          onResults([], searchValue, 'no_results');
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
    </div>
  );
};

export default SearchBox;