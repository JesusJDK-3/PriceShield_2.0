import React, { useState, useEffect } from "react";
import TopBarF from './components/TopBarF.jsx';
import './styles/We.css';
function We({ user }) {
  const [isOpenM, setIsOpenM] = useState(true);
  useEffect(() => { // Responsivo
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
  const handleSearch = (query) => {
    console.log('🔍 Iniciando búsqueda:', query);
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
  return (
    <div className="WeContainer">
      <div>
        <TopBarF
          onSearch={handleSearch}
          onResults={handleResults}
          openMenu={() => setIsOpenM(true)}
          user={user} // ✅ CAMBIO 2: Pasar user al TopBar
        />
      </div>
      <div className="ContenedorNosotros">
        <div className="Nosotros">
          <div className="NosotrosYBoton">
            <h1 className="tituloNosotros">PriceShield</h1>
          </div>

          <p className="descripcionNosotros">
            PriceShield nació para ayudar a los consumidores a
            encontrar los mejores precios de sus productos
            favoritos en diferentes supermercados.
          </p>

          <div className="misionVision">
            <div className="cardInfo">
              <h2>Misión</h2>
              <p>
                Ayudar a los consumidores a encontrar
                siempre los mejores precios de sus productos
                favoritos, facilitando la comparación entre
                diferentes supermercados de manera rápida, sencilla
                y confiable.
              </p>
            </div>
            <div className="cardInfo">
              <h2>Visión</h2>
              <p>Convertirnos en la página líder en análisis y
                transparencia de precios de supermercados, siendo
                la referencia principal para consumidores, negocios
                y reguladores en la toma de decisiones inteligentes.
              </p>
            </div>
          </div>

          <div className="valores">
            <h2>Valores</h2>
            <ul>
              <li>Transparencia: información clara y confiable.</li>
              <li>Compromiso: proteger el bolsillo de los consumidores.</li>
              <li>Confianza: datos precisos y seguros.</li>
              </ul>
          </div>
          <footer className="Creadores">
            <div className="CreadoresP" onClick={() => window.open("https://wa.me/51955768525?text=Hola%20quiero%20más%20información", "_blank")}>
              <i className="bi bi-person-vcard-fill"></i>
              <div className="DatosPersonales">
                <h3>Jesús</h3>
                <small>Desarrollador Backend</small>
              </div>
            </div>
            <div className="CreadoresP" onClick={() => window.open("https://wa.me/51941498813?text=Hola%20quiero%20más%20información", "_blank")}>
              <i className="bi bi-person-vcard-fill"></i>
              <div className="DatosPersonales">
                <h3>Dany</h3>
                <small>Desarrollador Frontend</small>
              </div>
            </div>
          </footer>

        </div>
      </div>

    </div>
  );
}
export default We;