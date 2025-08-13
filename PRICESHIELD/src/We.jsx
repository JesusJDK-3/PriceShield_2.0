import React, { useState, useEffect } from "react";
import Drop_DownM from './components/Drop_Down_Menu';
import './styles/We.css';
function We() {
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
  return (
    <div className={`contenedor_general ${!isOpenM ? 'soloContenido' : ''}`}>
            <div className="barraJex">
                <Drop_DownM isOpenM={isOpenM} closeDown={() => setIsOpenM(false)} />
            </div>
            <div className="ContenedorNosotros">
                <div className="Nosotros">
                    <div className="NosotrosYBoton">
                        <i className="bi bi-list abrirMenu" onClick={() => setIsOpenM(true)}></i>
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
                            <li>Rastreamos precios reales desde tiendas como Plaza Vea o Wong.<br/></li>
                            <li>Guardamos la información en MongoDB Atlas para un historial seguro.<br/></li>
                            <li>Aplicamos algoritmos para detectar precios fuera de lo normal.<br/></li>
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
            </div>
            </div>
            
        </div>
  );
}   
export default We;