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
            <h1 className="tituloNosotros">Sobre PriceShield</h1>
          </div>

          <p className="descripcionNosotros">
            PriceShield nació con una misión clara: detener la manipulación de precios en supermercados
            y devolverle el control a quienes más importa: los consumidores.
            No se trata solo de detectar números raros, sino de exponer la verdad detrás de cada precio.
          </p>

          <div className="misionVision">
            <div className="cardInfo">
              <h2>El Problema</h2>
              <p>
                Todos hemos visto cómo algunos precios suben sin explicación.
                PriceShield existe para destapar esos movimientos anómalos, proteger tu bolsillo
                y fomentar una competencia justa entre supermercados.
              </p>
            </div>
            <div className="cardInfo">
              <h2>Así lo Hacemos</h2>
              <ul>
                <li>Rastreamos precios reales desde tiendas como Plaza Vea o Wong.<br /></li>
                <li>Guardamos la información en MongoDB Atlas para un historial seguro.<br /></li>
                <li>Aplicamos algoritmos para detectar precios fuera de lo normal.<br /></li>
                <li>Publicamos los resultados en una API para que cualquiera pueda acceder.</li>
              </ul>
            </div>
          </div>

          <div className="valores">
            <h2>Por Qué Importa</h2>
            <p>
              PriceShield no es solo un sistema; es una herramienta para devolver transparencia al mercado.
              Si los consumidores, negocios y autoridades cuentan con datos claros,
              podemos cambiar la forma en que se fijan y regulan los precios.
            </p>
          </div>
          <div className="Creadores">
            <div className="CreadoresP"onClick={() => window.open("https://wa.me/51955768525?text=Hola%20quiero%20más%20información", "_blank")}>
              <i class="bi bi-person-vcard-fill"></i>
              <div className="DatosPersonales">
                <h3>Jesús</h3>
                <small>Desarrollador Backend</small>
              </div>
            </div>
            <div className="CreadoresP" onClick={() => window.open("https://wa.me/51941498813?text=Hola%20quiero%20más%20información", "_blank")}>
              <i class="bi bi-person-vcard-fill"></i>
              <div className="DatosPersonales">
                <h3>Dany</h3>
                <small>Desarrollador Frontend</small>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
export default We;