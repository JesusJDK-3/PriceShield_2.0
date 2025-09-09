// ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './styles/products.css';
import './styles/model.css';
import './styles/productDetail.css';
import TopBarF from './components/TopBarF.jsx';
import Drop_DownM from './components/Drop_Down_Menu.jsx';

function ProductDetail({user, logout}) {
  const [isOpenM, setIsOpenM] = useState(true);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [listaProductos, setListaProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [productoMasBarato, setProductoMasBarato] = useState(null);
  
  const { state } = useLocation();
  const navigate = useNavigate();

  // 🧠 FUNCIÓN MEJORADA: Extraer información clave del nombre del producto
  const extraerInformacionClave = (nombre) => {
    const palabrasIgnorar = [
      'de', 'del', 'la', 'el', 'en', 'con', 'sin', 'para', 'por', 'y', '+', 
      'bolsa', 'paquete', 'caja', 'lata', 'botella', 'frasco', 'envase',
      'unidad', 'und', 'pack', 'x', ':', 'congelada', 'congelado', 'fresh',
      'premium', 'light', 'diet', 'zero', 'max', 'ultra', 'super', 'extra'
    ];
    
    const marcasConocidas = [
      // Lácteos y bebidas
      'gloria', 'laive', 'bonle', 'anchor', 'pura vida', 'soprole',
      'nestle', 'milo', 'sublime', 'maggi', 'carnation',
      
      // Aceites y condimentos
      'primor', 'cocinero', 'bells', 'capri', 'ideal', 'deleite', 'favorita',
      'alicorp', 'nicolini', 'don vittorio', 'oleosoya', 'chef',
      
      // Cereales y harinas
      'quaker', 'angel', 'blanca flor', 'molitalia', 'cogorno',
      'fitness', 'corn flakes', 'zucaritas', 'chocapic',
      
      // Carnes y embutidos
      'san fernando', 'redondos', 'braedt', 'otto kunz', 'pierina',
      'la preferida', 'san jorge', 'razzeto',
      
      // Limpieza y cuidado personal
      'sapolio', 'ace', 'ariel', 'bolivar', 'marsella', 'patito',
      'head shoulders', 'pantene', 'herbal essences', 'sedal',
      'nivea', 'dove', 'rexona', 'axe', 'colgate', 'oral-b',
      
      // Galletas y snacks
      'field', 'crackets', 'soda', 'salticas', 'morochas',
      'festival', 'chips', 'pringles', 'lay', 'cuates',
      
      // Conservas
      'a-1', 'florida', 'campomar', 'costeño', 'real',
      'san jose', 'yacht', 'bell', 'grated',
      
      // Bebidas
      'coca cola', 'pepsi', 'inca kola', 'sprite', 'fanta',
      'cielo', 'san luis', 'evian', 'bonafont',
      
      // Supermercados
      'wong', 'tottus', 'plaza vea', 'metro', 'vivanda', 'makro',
      
      // Otras marcas populares
      'bimbo', 'oroweat', 'bembos', 'kfc', 'mcdonald',
      'casino', 'bell', 'altomayo', 'nescafe', 'pilsen'
    ];
    
    const nombreLower = nombre.toLowerCase();
    
    // Buscar marca con coincidencia más precisa
    let marca = '';
    for (const marcaConocida of marcasConocidas) {
      if (nombreLower.includes(marcaConocida)) {
        marca = marcaConocida;
        break;
      }
    }
    
    // Buscar peso/volumen con más variaciones
    const pesoMatch = nombreLower.match(/(\d+(?:\.\d+)?)\s*(kg|kilo|gr?|gramo|ml|mililitro|lt?|litro|oz|onza|lb|libra|unid|und)/i);
    const peso = pesoMatch ? `${pesoMatch[1]}${pesoMatch[2].toLowerCase()}` : '';
    
    // Extraer palabras clave importantes (sin marca ni medidas)
    const palabrasClave = nombreLower
      .replace(/[^\w\s]/g, ' ') // Reemplazar símbolos por espacios
      .split(/\s+/)
      .filter(palabra => palabra.length > 2)
      .filter(palabra => !palabrasIgnorar.includes(palabra))
      .filter(palabra => !palabra.match(/^\d+$/)) // Eliminar solo números
      .filter(palabra => {
        // No eliminar palabras que contengan la marca, eliminar solo marca exacta
        if (!marca) return true;
        return palabra !== marca;
      })
      .sort(); // Ordenar para comparar independiente del orden
    
    return { 
      marca, 
      peso, 
      palabrasClave, 
      nombreOriginal: nombre,
      nombreNormalizado: nombreLower.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
    };
  };

  // 🎯 FUNCIÓN MEJORADA: Determinar si dos productos son el mismo
  const sonElMismoProducto = (info1, info2) => {
    // 1. Si tienen marcas diferentes conocidas, no son el mismo producto
    if (info1.marca && info2.marca && info1.marca !== info2.marca) {
      return false;
    }
    
    // 2. Si tienen pesos muy diferentes, no son el mismo producto
    if (info1.peso && info2.peso) {
      const peso1Num = parseFloat(info1.peso);
      const peso2Num = parseFloat(info2.peso);
      const diferenciaPorcentaje = Math.abs(peso1Num - peso2Num) / Math.max(peso1Num, peso2Num);
      
      // Si la diferencia es mayor al 10%, no son el mismo producto
      if (diferenciaPorcentaje > 0.1) {
        return false;
      }
    }
    
    // 3. Calcular similitud de palabras clave - CRITERIO MÁS ESTRICTO
    const palabrasComunes = info1.palabrasClave.filter(palabra1 => 
      info2.palabrasClave.some(palabra2 => palabra1 === palabra2) // Coincidencia exacta
    );
    
    const totalPalabrasUnicas = new Set([...info1.palabrasClave, ...info2.palabrasClave]).size;
    const similitudExacta = palabrasComunes.length / Math.max(info1.palabrasClave.length, info2.palabrasClave.length);
    
    // 4. CRITERIO MÁS ESTRICTO: 85% de similitud en palabras clave
    const sonIguales = similitudExacta >= 0.85;
    
    console.log('🔍 Análisis de similitud:', {
      producto1: info1.nombreOriginal,
      producto2: info2.nombreOriginal,
      palabrasClave1: info1.palabrasClave,
      palabrasClave2: info2.palabrasClave,
      palabrasComunes,
      similitudExacta: (similitudExacta * 100).toFixed(1) + '%',
      sonIguales: sonIguales ? '✅ SÍ' : '❌ NO'
    });
    
    return sonIguales;
  };

  // ✅ FUNCIÓN NUEVA: Eliminar duplicados del mismo supermercado
  const eliminarDuplicadosPorSupermercado = (productos) => {
    const productosUnicos = new Map();
    
    productos.forEach(producto => {
      const clave = `${producto.supermercado}_${producto.nombre.toLowerCase().replace(/[^\w]/g, '')}`;
      
      if (!productosUnicos.has(clave)) {
        productosUnicos.set(clave, producto);
      } else {
        // Si ya existe, mantener el que tenga mejor precio
        const productoExistente = productosUnicos.get(clave);
        const precioExistente = extraerNumericoPrecio(productoExistente.precio);
        const precioNuevo = extraerNumericoPrecio(producto.precio);
        
        if (precioNuevo < precioExistente) {
          productosUnicos.set(clave, producto);
        }
      }
    });
    
    return Array.from(productosUnicos.values());
  };

  // ✅ FUNCIÓN ADAPTATIVA: Filtrar productos similares con criterio inteligente
  const filtrarProductosSimilares = (productoSeleccionado, todosLosProductos) => {
    if (!productoSeleccionado || !todosLosProductos) return [];

    const nombreSeleccionado = productoSeleccionado.nombre.toLowerCase().trim();
    const infoSeleccionada = extraerInformacionClave(nombreSeleccionado);
    
    console.log('🎯 Filtrando para producto:', {
      nombre: productoSeleccionado.nombre,
      info: infoSeleccionada
    });
    
    // PASO 1: Primera pasada con criterio ESTRICTO
    let productosFiltrados = todosLosProductos.filter(producto => {
      const nombreProducto = producto.nombre.toLowerCase().trim();
      
      // Incluir el producto seleccionado siempre
      if (nombreProducto === nombreSeleccionado) return true;
      
      const infoProducto = extraerInformacionClave(nombreProducto);
      return sonElMismoProducto(infoSeleccionada, infoProducto, true); // Criterio ESTRICTO
    });

    // Eliminar duplicados del mismo supermercado
    productosFiltrados = eliminarDuplicadosPorSupermercado(productosFiltrados);
    
    console.log('📊 Resultados con criterio ESTRICTO:', {
      totalEncontrados: productosFiltrados.length,
      productos: productosFiltrados.map(p => ({ nombre: p.nombre, supermercado: p.supermercado }))
    });
    
    // PASO 2: Si tenemos menos de 4 productos, aplicar criterio FLEXIBLE
    if (productosFiltrados.length < 4) {
      console.log('🔄 Pocos productos encontrados, aplicando criterio FLEXIBLE...');
      
      productosFiltrados = todosLosProductos.filter(producto => {
        const nombreProducto = producto.nombre.toLowerCase().trim();
        
        // Incluir el producto seleccionado siempre
        if (nombreProducto === nombreSeleccionado) return true;
        
        const infoProducto = extraerInformacionClave(nombreProducto);
        return sonElMismoProducto(infoSeleccionada, infoProducto, false); // Criterio FLEXIBLE
      });

      // Eliminar duplicados del mismo supermercado
      productosFiltrados = eliminarDuplicadosPorSupermercado(productosFiltrados);
      
      console.log('📊 Resultados con criterio FLEXIBLE:', {
        totalEncontrados: productosFiltrados.length,
        productos: productosFiltrados.map(p => ({ nombre: p.nombre, supermercado: p.supermercado }))
      });
    }
    
    // PASO 3: Limitar a máximo 4 supermercados diferentes
    const supermercadosUnicos = new Map();
    const resultadoFinal = [];
    
    productosFiltrados.forEach(producto => {
      if (supermercadosUnicos.size < 4 && !supermercadosUnicos.has(producto.supermercado)) {
        supermercadosUnicos.set(producto.supermercado, true);
        resultadoFinal.push(producto);
      }
    });

    console.log('🏪 RESULTADO FINAL:', {
      productoOriginal: productoSeleccionado.nombre,
      totalEncontrados: resultadoFinal.length,
      criterioAplicado: productosFiltrados.length >= 5 ? 'ESTRICTO' : 'FLEXIBLE',
      supermercados: resultadoFinal.map(p => p.supermercado),
      productos: resultadoFinal.map(p => ({
        nombre: p.nombre,
        supermercado: p.supermercado,
        precio: p.precio
      }))
    });

    return resultadoFinal;
  };

  useEffect(() => {
    if (state) {
      const { producto, listaProductos: lista } = state;
      
      setProductoSeleccionado(producto);
      setListaProductos(lista || []);
      
      if (producto && lista && lista.length > 0) {
        // Solo usar la función filtrarProductosSimilares mejorada
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

    // Filtrar productos con precios válidos
    const productosConPrecio = productos.filter(producto => {
      const precio = extraerNumericoPrecio(producto.precio);
      return precio !== Infinity && precio > 0;
    });

    if (productosConPrecio.length === 0) return null;

    // Debug: Mostrar todos los precios
    console.log('🏪 Comparando precios:', productosConPrecio.map(p => ({
      supermercado: p.supermercado,
      precioOriginal: p.precio,
      precioNumerico: extraerNumericoPrecio(p.precio)
    })));

    const masBarato = productosConPrecio.reduce((masBarato, productoActual) => {
      const precioActual = extraerNumericoPrecio(productoActual.precio);
      const precioMasBarato = extraerNumericoPrecio(masBarato.precio);
      
      return precioActual < precioMasBarato ? productoActual : masBarato;
    });

    console.log('🎯 Producto más barato encontrado:', {
      supermercado: masBarato.supermercado,
      precio: masBarato.precio,
      precioNumerico: extraerNumericoPrecio(masBarato.precio)
    });

    return masBarato;
  };

  const extraerNumericoPrecio = (precio) => {
    if (!precio) return Infinity;
    
    // Convertir a string y limpiar
    let numeroLimpio = precio.toString()
      .replace(/S\/?\s*/g, '') // Remover S/ y espacios
      .replace(/PEN\s*/g, '')  // Remover PEN y espacios
      .trim();
    
    // 🔧 CAMBIO CRÍTICO: Manejar comas como separadores de miles
    // Si tiene coma Y punto, la coma son miles: "1,234.50"
    if (numeroLimpio.includes(',') && numeroLimpio.includes('.')) {
      numeroLimpio = numeroLimpio.replace(/,/g, ''); // Eliminar comas de miles
    }
    // Si solo tiene coma, podría ser decimal: "12,50" 
    else if (numeroLimpio.includes(',') && !numeroLimpio.includes('.')) {
      // En Perú se usa punto para decimales, pero por si acaso
      const parts = numeroLimpio.split(',');
      if (parts.length === 2 && parts[1].length <= 2) {
        numeroLimpio = numeroLimpio.replace(',', '.'); // Convertir coma decimal
      } else {
        numeroLimpio = numeroLimpio.replace(/,/g, ''); // Eliminar comas de miles
      }
    }
    
    // Limpiar cualquier carácter no numérico excepto el punto decimal
    numeroLimpio = numeroLimpio.replace(/[^\d.]/g, '');
    
    const resultado = parseFloat(numeroLimpio);
    
    // Debug para ver qué está pasando
    console.log('💰 Conversión precio:', {
      precioOriginal: precio,
      numeroLimpio,
      resultado: isNaN(resultado) ? 'ERROR - No es número' : resultado
    });
    
    return isNaN(resultado) ? Infinity : resultado;
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
        
        <div className="buProductos">
          <div>
            <TopBarF onSearch={handleSearch} openMenu={() => setIsOpenM(true)} user={user} logout={logout}/>
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
      <div className="buProductos">
        <div className='TopBarFDP'>
          <TopBarF 
            onSearch={handleSearch} 
            openMenu={() => setIsOpenM(true)} 
            user={user} 
            logout={logout}
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
              
            </div>
            <div className="PrecioBajoYPanel">
              <h3 className='PrecioMasBajoT'>
              Encuentra el precio más bajo en: 
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
            <div className="BotonDashboardContainer">
                <button className="BotonDashboard" onClick={handleClickD}>
                  Panel
                </button>
              </div>
            </div>
            
            
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
            <div style={{
                    textAlign: 'center',
                    marginBottom: '20px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '5px',
                    color: '#495057'
                  }}>
                    Disponible en {productosFiltrados.length} supermercado{productosFiltrados.length !== 1 ? 's' : ''}
                  </div>
            <div className="footerMercados">
              {productosFiltrados.length > 0 ? (
                <>
                  
                  
                  {productosFiltrados.map((producto, index) => (
                    <div className="PrecioBajoACMJ"
                    key={`${producto.supermercado}-${index}`}>
                    <button
                      className="PrecioMasBajo"
                      
                      onClick={() => handleClick(producto)}
                      style={{
                        opacity: producto.id === productoSeleccionado.id ? 0.7 : 1,
                        border: producto.id === productoSeleccionado.id ? '2px solid #007bff' : 'none',
                        
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
                        
                        
                      </div>
                    </button>
                          <div className="ACYMJ">
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
                    </div>
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