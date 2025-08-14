// ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './styles/products.css';
import './styles/model.css';
import './styles/productDetail.css';
import TopBar from './components/TopBar.jsx';
import Drop_DownM from './components/Drop_Down_Menu.jsx';

function ProductDetail() {
  const [isOpenM, setIsOpenM] = useState(true);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [listaProductos, setListaProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [productoMasBarato, setProductoMasBarato] = useState(null);
  
  const { state } = useLocation();
  const navigate = useNavigate();

  // 🧠 FUNCIÓN: Extraer información clave del nombre del producto
  const extraerInformacionClave = (nombre) => {
    const palabrasIgnorar = [
      'de', 'del', 'la', 'el', 'en', 'con', 'sin', 'para', 'por', 'y', '+', 
      'bolsa', 'paquete', 'caja', 'lata', 'botella', 'frasco', 'envase',
      'unidad', 'und', 'pack', 'x', ':', 'congelada', 'congelado'
    ];
    
    const marcasConocidas = [
      'gloria', 'nestle', 'laive', 'bonle', 'el frutero', 'wong', 'tottus',
      'plaza vea', 'metro', 'vivanda', 'makro', 'sodimac', 'ripley', 'nike',
      'adidas', 'puma', 'reebok', 'converse'
    ];
    
    // Buscar marca
    let marca = '';
    for (const marcaConocida of marcasConocidas) {
      if (nombre.includes(marcaConocida)) {
        marca = marcaConocida;
        break;
      }
    }
    
    // Buscar peso
    const pesoMatch = nombre.match(/(\d+(?:\.\d+)?)\s*(kg|gr?|ml|lt?|oz|lb)/i);
    const peso = pesoMatch ? `${pesoMatch[1]}${pesoMatch[2].toLowerCase()}` : '';
    
    // ✅ ARREGLO: Mejor filtrado de palabras clave
    const palabrasClave = nombre
      .replace(/[^\w\s]/g, ' ') // Reemplazar símbolos por espacios
      .split(/\s+/)
      .map(palabra => palabra.toLowerCase())
      .filter(palabra => palabra.length > 2)
      .filter(palabra => !palabrasIgnorar.includes(palabra))
      // ✅ CAMBIO: Solo eliminar palabras EXACTAS de la marca, no parciales
      .filter(palabra => {
        if (!marca) return true;
        const palabrasMarca = marca.split(' ');
        return !palabrasMarca.includes(palabra);
      })
      // ✅ CAMBIO: Solo eliminar números exactos del peso
      .filter(palabra => {
        if (!peso) return true;
        const numeroPeso = peso.match(/\d+/);
        return numeroPeso ? palabra !== numeroPeso[0] : true;
      })
      .sort(); // Ordenar para comparar independiente del orden
    
    console.log('🧠 Extracción de información:', {
      nombreOriginal: nombre,
      marca,
      peso,
      palabrasClave,
      palabrasOriginales: nombre.split(/\s+/).map(p => p.toLowerCase())
    });
    
    return { marca, peso, palabrasClave, nombreOriginal: nombre };
  };

  // 🎯 FUNCIÓN: Determinar si dos productos son el mismo
  const sonElMismoProducto = (info1, info2) => {
    console.log('🔎 Comparando productos:', {
      producto1: info1,
      producto2: info2
    });

    // 1. Si tienen marcas diferentes, no son el mismo producto
    if (info1.marca && info2.marca && info1.marca !== info2.marca) {
      console.log('❌ Marcas diferentes:', info1.marca, 'vs', info2.marca);
      return false;
    }
    
    // 2. Si tienen pesos muy diferentes, no son el mismo producto
    if (info1.peso && info2.peso && info1.peso !== info2.peso) {
      const peso1Num = parseFloat(info1.peso);
      const peso2Num = parseFloat(info2.peso);
      if (Math.abs(peso1Num - peso2Num) > 0.1 && 
          Math.abs(peso1Num - peso2Num * 1000) > 100 && 
          Math.abs(peso1Num * 1000 - peso2Num) > 100) {
        console.log('❌ Pesos diferentes:', info1.peso, 'vs', info2.peso);
        return false;
      }
    }
    
    // 3. Calcular similitud de palabras clave
    const palabrasComunes = info1.palabrasClave.filter(palabra1 => 
      info2.palabrasClave.some(palabra2 => 
        palabra1.includes(palabra2) || palabra2.includes(palabra1) || palabra1 === palabra2
      )
    );
    
    const totalPalabras = Math.max(info1.palabrasClave.length, info2.palabrasClave.length);
    const similitud = palabrasComunes.length / totalPalabras;
    
    console.log('🎯 Análisis de similitud:', {
      palabrasClave1: info1.palabrasClave,
      palabrasClave2: info2.palabrasClave,
      palabrasComunes,
      totalPalabras,
      similitud,
      umbral: 0.7,
      resultado: similitud >= 0.7 ? '✅ SON EL MISMO' : '❌ NO SON EL MISMO'
    });
    
    // 4. Son el mismo producto si tienen alta similitud (70% o más)
    return similitud >= 0.7;
  };

  // ✅ FUNCIÓN INTELIGENTE: Filtrar productos similares
  const filtrarProductosSimilares = (productoSeleccionado, todosLosProductos) => {
    if (!productoSeleccionado || !todosLosProductos) return [];

    const nombreSeleccionado = productoSeleccionado.nombre.toLowerCase().trim();
    const infoSeleccionada = extraerInformacionClave(nombreSeleccionado);
    
    const productosFiltrados = todosLosProductos.filter(producto => {
      const nombreProducto = producto.nombre.toLowerCase().trim();
      
      if (nombreProducto === nombreSeleccionado) return true;
      
      const infoProducto = extraerInformacionClave(nombreProducto);
      return sonElMismoProducto(infoSeleccionada, infoProducto);
    });

    console.log('🔍 DEBUGGING - Filtrado inteligente:', {
      nombreSeleccionado,
      infoSeleccionada,
      totalProductos: todosLosProductos.length,
      productosFiltrados: productosFiltrados.length,
      todosLosProductosConInfo: todosLosProductos.map(p => ({
        nombre: p.nombre,
        supermercado: p.supermercado,
        info: extraerInformacionClave(p.nombre.toLowerCase()),
        esMismoProducto: sonElMismoProducto(infoSeleccionada, extraerInformacionClave(p.nombre.toLowerCase()))
      })),
      productos: productosFiltrados.map(p => ({ 
        nombre: p.nombre, 
        supermercado: p.supermercado,
        info: extraerInformacionClave(p.nombre.toLowerCase())
      }))
    });

    return productosFiltrados;
  };

  useEffect(() => {
    if (state) {
      const { producto, listaProductos: lista } = state;
      
      console.log('📦 Datos recibidos:', { producto, lista });
      
      setProductoSeleccionado(producto);
      setListaProductos(lista || []);
      
      if (producto && lista && lista.length > 0) {
        const productosFiltradosNuevos = filtrarProductosSimilares(producto, lista);
        setProductosFiltrados(productosFiltradosNuevos);
        
        if (productosFiltradosNuevos.length > 0) {
          const masBarato = encontrarProductoMasBarato(productosFiltradosNuevos);
          setProductoMasBarato(masBarato);
        }
      } else {
        setProductosFiltrados([]);
        setProductoMasBarato(null);
      }
    }
  }, [state]);

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

  const encontrarProductoMasBarato = (productos) => {
    if (!productos || productos.length === 0) return null;

    return productos.reduce((masBarato, productoActual) => {
      const precioActual = extraerNumericoPrecio(productoActual.precio);
      const precioMasBarato = extraerNumericoPrecio(masBarato.precio);
      
      return precioActual < precioMasBarato ? productoActual : masBarato;
    });
  };

  const extraerNumericoPrecio = (precio) => {
    if (!precio) return Infinity;
    
    const numeroLimpio = precio.toString()
      .replace(/[S\/.,$]/g, '')
      .replace(/,/g, '')
      .replace(/[^\d.]/g, '');
    
    return parseFloat(numeroLimpio) || Infinity;
  };

  const handleSearch = (searchTerm) => {
    console.log('Buscando:', searchTerm);
  };

  const handleClickD = () => {
    navigate('/dashboard', { 
      state: {
        producto: productoSeleccionado,
        listaProductos: productosFiltrados
      }
    });
  };

  const handleClick = (nuevoProducto) => {
    navigate('/detalle', { 
      state: {
        producto: nuevoProducto,
        listaProductos: listaProductos
      }
    });
  };

  if (!productoSeleccionado) {
    return (
      <div className={`contenedor_general ${!isOpenM ? 'soloContenido' : ''}`}>
        <div className="barraJex">
          <Drop_DownM isOpenM={isOpenM} closeDown={() => setIsOpenM(false)} />
        </div>
        <div className="buProductos">
          <div className='abrirDown'>
            <TopBar onSearch={handleSearch} openMenu={() => setIsOpenM(true)} />
          </div>
          <div className="detalleProducto">
            <div className="error-message" style={{
              textAlign: 'center',
              padding: '50px',
              fontSize: '18px',
              color: '#666'
            }}>
              <p>No se encontró información del producto.</p>
              <button 
                onClick={() => navigate('/products')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginTop: '20px'
                }}
              >
                Volver a Productos
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`contenedor_general ${!isOpenM ? 'soloContenido' : ''}`}>
      <div className="barraJex">
        <Drop_DownM 
          isOpenM={isOpenM} 
          closeDown={() => setIsOpenM(false)} 
          producto={productoSeleccionado} 
        />
      </div>
      
      <div className="buProductos">
        <div className='abrirDown'>
          <TopBar 
            onSearch={handleSearch} 
            openMenu={() => setIsOpenM(true)} 
          />
        </div>
        
        <div className="detalleProducto">
          <div className="DPExtendido">
            <div className="BotRP">
              <button className='BotonRegresar' onClick={() => navigate(-1)}>
                <span className='flechita'>←</span> Volver
              </button>
            </div>
            
            <div className="DetallesProducto">
              <img 
                src={productoSeleccionado.imagen} 
                alt={productoSeleccionado.nombre}
                onError={(e) => {
                  e.target.src = '/placeholder-product.png';
                }}
              />
              <div className="DetallesMenoresP">
                <h2>{productoSeleccionado.nombre}</h2>
                <p><strong>Precio:</strong> {productoSeleccionado.precio}</p>
                <p><strong>Supermercado:</strong> {productoSeleccionado.supermercado}</p>
              </div>
              <div className="BotonDashboardContainer">
                <button className="BotonDashboard" onClick={handleClickD}>
                  📊 Panel
                </button>
              </div>
            </div>
            
            <h3 className='PrecioMasBajoT'>
              Encuentra el precio más bajo para: <em>"{productoSeleccionado.nombre}"</em>
            </h3>
            
            {productoMasBarato && (
              <button 
                className="PrecioMasBajoP" 
                onClick={() => handleClick(productoMasBarato)}
              >
                <div className="PaProVer">
                  <div className="MercadoDelP">
                    <span className='LugarPrecioB'>{productoMasBarato.supermercado}</span>
                  </div>
                  <div className="PrecioDLP">
                    <span className='PrecioB'>PEN {productoMasBarato.precio}</span>
                  </div>
                </div>
              </button>
            )}
            
            {!productoMasBarato && productosFiltrados.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px', 
                color: '#666',
                fontStyle: 'italic'
              }}>
                No se encontraron otros supermercados que vendan exactamente: 
                <br />
                <strong>"{productoSeleccionado.nombre}"</strong>
              </div>
            )}
          </div>
          
          <div className="mercadosYprecios">
            <div className="footerMercados">
              {productosFiltrados.length > 0 ? (
                <>
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '20px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '5px',
                    color: '#495057'
                  }}>
                    <strong>"{productoSeleccionado.nombre}"</strong> disponible en {productosFiltrados.length} supermercado{productosFiltrados.length !== 1 ? 's' : ''}
                  </div>
                  
                  {productosFiltrados.map((producto, index) => (
                    <button
                      className="PrecioMasBajo"
                      key={`${producto.supermercado}-${index}`}
                      onClick={() => handleClick(producto)}
                      style={{
                        opacity: producto.id === productoSeleccionado.id ? 0.7 : 1,
                        border: producto.id === productoSeleccionado.id ? '2px solid #007bff' : 'none'
                      }}
                    >
                      <div className="datoPPT">
                        <div className="MercadoLogo">
                          <svg className='LogoDelMerca' xmlns="http://www.w3.org/2000/svg">
                            <circle cx="10" cy="10" r="10" fill="#3498db" />
                            <text
                              x="10"
                              y="10"
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="white"
                              fontSize="12"
                            >
                              {producto.supermercado.charAt(0)}
                            </text>
                          </svg>
                          <b className='NombreDelMercado'>{producto.supermercado}</b>
                        </div>
                        <br />
                        <p>{producto.precio}</p>
                        
                        {producto.id === productoSeleccionado.id && (
                          <span style={{
                            fontSize: '12px',
                            color: '#007bff',
                            fontWeight: 'bold',
                            marginTop: '5px',
                            display: 'block'
                          }}>
                            ACTUAL
                          </span>
                        )}
                        
                        {productoMasBarato && producto.id === productoMasBarato.id && (
                          <span style={{
                            fontSize: '12px',
                            color: '#28a745',
                            fontWeight: 'bold',
                            marginTop: '5px',
                            display: 'block'
                          }}>
                            MEJOR PRECIO
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  <p>Este producto solo está disponible en <strong>{productoSeleccionado.supermercado}</strong></p>
                  <p style={{ fontSize: '14px', marginTop: '10px' }}>
                    No se encontraron otros supermercados que vendan exactamente: <br />
                    <strong>"{productoSeleccionado.nombre}"</strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;