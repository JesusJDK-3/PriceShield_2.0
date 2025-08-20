// ProductDetail.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  const [isProcessing, setIsProcessing] = useState(false); // ✅ Flag para evitar duplicación
  
  const { state } = useLocation();
  const navigate = useNavigate();

  // 🧠 FUNCIÓN: Extraer información clave del nombre del producto (Memoizada)
  const extraerInformacionClave = useCallback((nombre) => {
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
      .filter(palabra => {
        if (!marca) return true;
        const palabrasMarca = marca.split(' ');
        return !palabrasMarca.includes(palabra);
      })
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
  }, []);

  // 🎯 FUNCIÓN: Determinar si dos productos son el mismo (Memoizada)
  const sonElMismoProducto = useCallback((info1, info2) => {
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
  }, []);

  // ✅ FUNCIÓN INTELIGENTE: Filtrar productos similares (Memoizada)
  const filtrarProductosSimilares = useCallback((productoSeleccionado, todosLosProductos) => {
    if (!productoSeleccionado || !todosLosProductos) return [];

    console.log('🔍 INICIANDO filtrado inteligente para:', productoSeleccionado.nombre);

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

    console.log('✅ Filtrado completado:', productosFiltrados.length, 'productos encontrados');
    return productosFiltrados;
  }, [extraerInformacionClave, sonElMismoProducto]);

  // ✅ FUNCIÓN PARA DETECTAR SI ES OFERTA O DUPLICADO (Memoizada)
  const analizarProductosSimilares = useCallback((productos) => {
    if (productos.length < 2) return productos;

    console.log('🔍 Analizando ofertas vs duplicados...');
    
    const grupos = new Map();
    
    productos.forEach(producto => {
      // Crear clave base sin considerar precio
      const claveBase = `${producto.supermercado}_${producto.nombre.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      
      if (!grupos.has(claveBase)) {
        grupos.set(claveBase, []);
      }
      grupos.get(claveBase).push(producto);
    });

    const productosFinales = [];
    
    grupos.forEach((grupoProductos, clave) => {
      if (grupoProductos.length === 1) {
        // Un solo producto, mantenerlo
        productosFinales.push(grupoProductos[0]);
      } else {
        // Múltiples productos "iguales" - analizar si son ofertas
        grupoProductos.sort((a, b) => extraerNumericoPrecio(a.precio) - extraerNumericoPrecio(b.precio));
        
        const precioMenor = extraerNumericoPrecio(grupoProductos[0].precio);
        const precioMayor = extraerNumericoPrecio(grupoProductos[grupoProductos.length - 1].precio);
        const diferenciaPorcentaje = ((precioMayor - precioMenor) / precioMayor) * 100;
        
        if (diferenciaPorcentaje > 5) {
          // Gran diferencia de precio = ofertas legítimas
          console.log(`🏷️ OFERTAS detectadas para "${grupoProductos[0].nombre}":`, {
            supermercado: grupoProductos[0].supermercado,
            precioNormal: grupoProductos[grupoProductos.length - 1].precio,
            precioOferta: grupoProductos[0].precio,
            descuento: `${diferenciaPorcentaje.toFixed(1)}%`
          });
          
          // Mantener solo el más barato (la oferta)
          productosFinales.push(grupoProductos[0]);
          
        } else {
          // Poca diferencia = posible duplicado, mantener solo uno
          console.log(`🔍 DUPLICADO detectado para "${grupoProductos[0].nombre}":`, {
            productos: grupoProductos.length,
            diferencia: `${diferenciaPorcentaje.toFixed(1)}%`
          });
          
          productosFinales.push(grupoProductos[0]);
        }
      }
    });

    console.log('✅ Análisis completado:', productosFinales.length, 'productos finales');
    return productosFinales;
  }, []);

  // ✅ FUNCIÓN PARA ENCONTRAR EL MÁS BARATO (Memoizada)
  const encontrarProductoMasBarato = useCallback((productos) => {
    if (!productos || productos.length === 0) return null;

    console.log('💰 Buscando producto más barato...');

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
  }, []);

  // ✅ FUNCIÓN PARA EXTRAER PRECIO NUMÉRICO (Memoizada)
  const extraerNumericoPrecio = useCallback((precio) => {
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
  }, []);

  // ✅ EFFECT PRINCIPAL (ÚNICO) - Maneja toda la lógica de estado
  useEffect(() => {
    // ✅ Evitar ejecución simultánea
    if (isProcessing) {
      console.log('⚠️ Procesamiento en curso, omitiendo...');
      return;
    }

    if (state) {
      const { producto, listaProductos: lista } = state;
      
      console.log('📦 Datos recibidos:', { producto, lista });
      
      setIsProcessing(true);
      
      setProductoSeleccionado(producto);
      setListaProductos(lista || []);
      
      if (producto && lista && lista.length > 0) {
        console.log('🔄 Iniciando procesamiento de productos...');
        
        // Paso 1: Filtrar productos similares
        const productosFiltradosNuevos = filtrarProductosSimilares(producto, lista);
        
        // Paso 2: Analizar ofertas vs duplicados
        const productosSinDuplicados = analizarProductosSimilares(productosFiltradosNuevos);
        
        // Paso 3: Actualizar estado
        setProductosFiltrados(productosSinDuplicados);
        
        // Paso 4: Encontrar el más barato
        if (productosSinDuplicados.length > 0) {
          const masBarato = encontrarProductoMasBarato(productosSinDuplicados);
          setProductoMasBarato(masBarato);
        } else {
          setProductoMasBarato(null);
        }
        
        console.log('✅ Procesamiento completado');
      } else {
        setProductosFiltrados([]);
        setProductoMasBarato(null);
      }
      
      setIsProcessing(false);
    }
  }, [state, filtrarProductosSimilares, analizarProductosSimilares, encontrarProductoMasBarato, isProcessing]);

  // ✅ EFFECT PARA RESPONSIVE (Separado)
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

  // ✅ HANDLERS MEMOIZADOS
  const handleSearch = useCallback((searchTerm) => {
    console.log('Buscando:', searchTerm);
  }, []);

  const handleClickD = useCallback(() => {
    navigate('/dashboard', { 
      state: {
        producto: productoSeleccionado,
        listaProductos: productosFiltrados
      }
    });
  }, [navigate, productoSeleccionado, productosFiltrados]);

  const handleClick = useCallback((nuevoProducto) => {
    navigate('/detalle', { 
      state: {
        producto: nuevoProducto,
        listaProductos: listaProductos
      }
    });
  }, [navigate, listaProductos]);

  // ✅ EARLY RETURN SI NO HAY PRODUCTO
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
                    disponible en {productosFiltrados.length} supermercado{productosFiltrados.length !== 1 ? 's' : ''}
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