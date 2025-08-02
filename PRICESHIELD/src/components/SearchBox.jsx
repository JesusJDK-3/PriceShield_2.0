
// SearchBox.jsx
import React from 'react';

const SearchBox = ({ onSearch }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    const searchValue = e.target.elements['search-input'].value;
    if (onSearch) {
      onSearch(searchValue);
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
        />
        <input className="search-button" type="submit" value="Buscar" />
      </form>
    </div>
  );
};

export default SearchBox;
