// SearchBox.jsx
import React, { useState } from 'react';

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
    setIsLoading(true);

    try {
      // Llamar callback onSearch si existe (para componentes padre)
      if (onSearch) {
        onSearch(searchValue);
      }

      // Realizar búsqueda en el backend
      const response = await fetch('http://127.0.0.1:5000/api/products/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchValue,
          limit: 20,
          save_to_db: true
        })
      });

      const data = await response.json();

      if (data.success) {
        // Pasar los resultados al componente padre
        if (onResults) {
          onResults(data.results, searchValue);
        }
        console.log('✅ Búsqueda exitosa:', data);
      } else {
        setError(data.message || 'Error en la búsqueda');
        console.error('❌ Error en búsqueda:', data);
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
          🔍 Buscando productos en supermercados...
        </div>
      )}
    </div>
  );
};

export default SearchBox;