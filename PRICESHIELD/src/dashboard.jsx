import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TopBarF from './components/TopBarF.jsx';
import Drop_DownM from './components/Drop_Down_Menu.jsx';
import DashboardChart from './components/DashBoardChar.jsx';
import './styles/DashBoardPP.css';

// Componente StatCard mejorado
function StatCard({ title, value, color, bgColor, textColor }) {
  return (
    <div
      className="stat-card"
      style={{
        borderColor: color,
        background: bgColor || '#fff',
      }}
    >
      <div
        className="stat-value"
        style={{
          color: textColor || color,
        }}
      >
        S/ {value}
      </div>
      <div className="stat-title">
        {title}
      </div>
    </div>
  );
}

function Dashboard({ user, logout }) {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [isOpenM, setIsOpenM] = useState(true);
  const [productoActual, setProductoActual] = useState(null);
  const [historialPrecios, setHistorialPrecios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [estadisticas, setEstadisticas] = useState({
    precioActual: 0,
    precioPromedio: 0,
    precioMinimo: 0,
    precioMaximo: 0
  });

  const { state } = useLocation();
  const navigate = useNavigate();

  // Función para extraer precio numérico
  const extraerNumericoPrecio = (precio) => {
    if (!precio) return 0;
    return parseFloat(precio.toString().replace(/[^\d.]/g, '')) || 0;
  };

  // Función CORREGIDA para obtener historial del MISMO producto
  const obtenerHistorialProducto = async (productoData) => {
    try {
      console.log('📊 Obteniendo historial para producto específico...');
      console.log('Producto:', productoData);

      let url = '';
      let params = new URLSearchParams();
      params.append('days_back', '30');

      // Priorizar búsqueda por unique_id si está disponible
      if (productoData.unique_id) {
        params.append('unique_id', productoData.unique_id);
        console.log('🔍 Buscando por unique_id:', productoData.unique_id);
      } else if (productoData.nombre || productoData.name) {
        const nombreProducto = productoData.nombre || productoData.name;
        params.append('product_name', nombreProducto);
        console.log('🔍 Buscando por nombre:', nombreProducto);
      } else {
        throw new Error('No se encontró identificador válido para el producto');
      }

      url = `${apiUrl}/api/dashboard/product-history-unified?${params.toString()}`;
      console.log('🌐 URL de consulta:', url);

      const response = await fetch(url);
      const data = await response.json();

      console.log('📡 Respuesta del servidor:', data);

      if (data.success && data.products) {
        console.log(`✅ Historial encontrado: ${data.products.length} entradas`);
        return {
        products: data.products,
        current_product: data.current_product
      };
      } else {
        console.warn('⚠️ No se encontró historial:', data.message);
        return [];
      }
    } catch (error) {
      console.error('❌ Error obteniendo historial:', error);
      return [];
    }
  };

  // Función CORREGIDA para generar datos del historial para el gráfico
  const procesarHistorialParaGrafico = (productos) => {
    if (!productos || productos.length === 0) {
      console.log('📊 No hay productos para procesar');
      return { 
        labels: ['Sin datos'], 
        precios: [0],
        totalEntradas: 0
      };
    }

    console.log(`📊 Procesando ${productos.length} entradas de historial`);

    // Filtrar y ordenar por fecha
    const productosValidos = productos
      .filter(p => p.scraped_at && p.price > 0)
      .sort((a, b) => new Date(a.scraped_at) - new Date(b.scraped_at));

    if (productosValidos.length === 0) {
      return { 
        labels: ['Sin datos válidos'], 
        precios: [0],
        totalEntradas: 0
      };
    }

    // Limitar a las últimas 15 entradas para mejor visualización
    const productosRecientes = productosValidos.slice(-15);

    const labels = productosRecientes.map((producto, index) => {
      try {
        const fecha = new Date(producto.scraped_at);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        });
        return `${fechaFormateada} (#${index + 1})`;
      } catch (e) {
        return `Entrada #${index + 1}`;
      }
    });

    const precios = productosRecientes.map(producto => 
      parseFloat(extraerNumericoPrecio(producto.price))
    );

    console.log('📊 Datos procesados para gráfico:');
    console.log('   - Entradas totales:', productos.length);
    console.log('   - Entradas válidas:', productosValidos.length);
    console.log('   - Entradas mostradas:', productosRecientes.length);
    console.log('   - Rango de precios:', Math.min(...precios), '-', Math.max(...precios));

    return { 
      labels, 
      precios,
      totalEntradas: productos.length,
      entradasMostradas: productosRecientes.length
    };
  };

  // Función para calcular estadísticas
  const calcularEstadisticas = (precios, productoActual) => {
    if (!precios || precios.length === 0) {
      const precioActual = extraerNumericoPrecio(productoActual?.precio || productoActual?.price);
      return {
        precioActual,
        precioPromedio: precioActual,
        precioMinimo: precioActual,
        precioMaximo: precioActual
      };
    }

    const preciosValidos = precios.filter(p => p > 0);
    
    if (preciosValidos.length === 0) {
      const precioActual = extraerNumericoPrecio(productoActual?.precio || productoActual?.price);
      return {
        precioActual,
        precioPromedio: precioActual,
        precioMinimo: precioActual,
        precioMaximo: precioActual
      };
    }
    
    console.log('📦 Producto recibido:', state.producto);
    console.log('🖼️ ¿Tiene imágenes?', state.producto.images);
    console.log('🖼️ ¿Tiene imagen?', state.producto.imagen);
    
    const precioActual = preciosValidos[preciosValidos.length - 1]; // Último precio
    const precioPromedio = preciosValidos.reduce((a, b) => a + b, 0) / preciosValidos.length;
    const precioMinimo = Math.min(...preciosValidos);
    const precioMaximo = Math.max(...preciosValidos);

    return {
      precioActual,
      precioPromedio,
      precioMinimo,
      precioMaximo
    };
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      if (!state?.producto) {
        setError('No se recibió información del producto');
        setLoading(false);
        return;
      }

      console.log('🚀 Iniciando carga de datos del dashboard');
      console.log('📦 Producto recibido:', state.producto);

      // Si viene de alerta con current_product, usar esos datos
      if (state.producto.current_product) {
        setProductoActual({
          ...state.producto,
          ...state.producto.current_product,
          images: state.producto.current_product.images
        });
      } else {
        setProductoActual(state.producto);
      }
      setLoading(true);
      setError(null);

      try {
        // Obtener historial del MISMO producto
        const historialData = await obtenerHistorialProducto(state.producto);
        
        // Procesar para gráfico
        const datosHistorial = procesarHistorialParaGrafico(historialData.products);
        // Completar datos del producto con información del servidor
        // Completar imagen
        if (historialData.current_product && historialData.current_product.images) {
          setProductoActual(prev => ({
            ...prev,
            images: historialData.current_product.images,
            imagen: historialData.current_product.images[0]
          }));
        }
        setHistorialPrecios(datosHistorial);

        // Calcular estadísticas
        const stats = calcularEstadisticas(datosHistorial.precios, state.producto);
        setEstadisticas(stats);

        console.log('✅ Datos cargados exitosamente');
        console.log('📊 Estadísticas calculadas:', stats);

      } catch (error) {
        console.error('❌ Error cargando datos:', error);
        setError(`Error cargando datos: ${error.message}`);
      }

      setLoading(false);
    };

    cargarDatos();
  }, [state]);

  // Responsive
  useEffect(() => {
    const handleResize = () => {
      setIsOpenM(window.innerWidth > 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSearch = (query) => {
    console.log('🔍 Buscando en dashboard:', query);
  };

  // Si no hay producto, mostrar error
  if (!state?.producto) {
    return (
      <div className={`contenedor_general ${!isOpenM ? 'soloContenido' : ''}`}>
        <div className="buProductos">
          <div className="TopBarFDNPR">
            <TopBarF onSearch={handleSearch} openMenu={() => setIsOpenM(true)} user={user} logout={logout}/>
          </div>
          <div className="no-product-state">
            <h2>No hay producto seleccionado</h2>
            <p>No se encontró información del producto para mostrar en el dashboard.</p>
            <button
              onClick={() => navigate('/products')}
              className="back-button"
            >
              Volver a Productos
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Datos del producto organizados
  const productData = {
    nombre: productoActual?.nombre || productoActual?.name || 'Producto sin nombre',
    imagen: productoActual?.imagen || productoActual?.images?.[0] || productoActual?.current_product?.images?.[0],
    supermercado: productoActual?.supermercado || productoActual?.supermarket || 'Desconocido'
  };

  return (
    <div className={`contenedor_general ${!isOpenM ? 'soloContenido' : ''}`}>
      <div className="buProductos">
        <div className="TopBarFDNPR">
          <TopBarF onSearch={handleSearch} openMenu={() => setIsOpenM(true)} user={user} logout={logout} />
        </div>

        {loading && (
          <div className="loading-state">
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div>Cargando historial del producto...</div>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                Obteniendo datos históricos de precios
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-state">
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              color: '#e74c3c',
              backgroundColor: '#fdf2f2',
              borderRadius: '8px',
              margin: '20px',
              border: '1px solid #fadbd8'
            }}>
              <h3>Error cargando datos</h3>
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="dashboard-content">
            {/* Header del producto */}
            <div className="product-header">
              <div className="product-header-content">

                <img
                  src={productData.imagen}
                  alt={productData.nombre}
                  className="product-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="product-info">
                  <h1 className="product-name">
                    {productData.nombre}
                  </h1>

                  <div className="product-details">
                    <div>
                      <span>Precio actual: </span>
                      <span style={{ color: '#059669', fontWeight: 'bold', fontSize: '18px' }}>
                        S/ {estadisticas.precioActual.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span>Supermercado: </span>
                      <span style={{ fontWeight: '600' }}>
                        {productData.supermercado}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Controles de gráfico */}
                <div className="chart-controls">
                  {[
                    { type: 'bar', icon: '📊', label: 'Barras' },
                    { type: 'line', icon: '📈', label: 'Línea' }
                  ].map(({ type, icon, label }) => (
                    <button
                      key={type}
                      onClick={() => setChartType(type)}
                      className={chartType === type ? 'chart-button active' : 'chart-button inactive'}
                    >
                      <span>{icon}</span>
                      {label}
                    </button>
                  ))}
                  <div className="BotRPD">
                    <button className='BotonRegresar' onClick={() => navigate(-1)}>
                      <span className='flechita'>←</span> Volver
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-grid">
              {/* Panel principal del gráfico */}
              <div className="chart-panel">
                <div className="chart-header">
                  <h2 className="chart-title">
                    Historial de Precios - {productData.nombre}
                  </h2>
                  <div className="update-badge">
                    {historialPrecios.totalEntradas > 0 
                      ? `${historialPrecios.entradasMostradas || historialPrecios.labels?.length || 0} de ${historialPrecios.totalEntradas} actualizaciones`
                      : 'Sin historial disponible'
                    }
                  </div>
                </div>

                {historialPrecios.labels && historialPrecios.labels.length > 0 ? (
                  <DashboardChart
                    chartType={chartType}
                    historialPrecios={historialPrecios}
                  />
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '60px', 
                    color: '#666',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                    <h3>Sin historial de precios</h3>
                    <p>Este producto aún no tiene suficientes datos históricos para mostrar un gráfico.</p>
                    <p>Los datos aparecerán aquí conforme el sistema actualice los precios.</p>
                  </div>
                )}
              </div>

              {/* Panel de estadísticas */}
              <div className="stats-panel">
                <StatCard
                  title="Precio Actual"
                  value={estadisticas.precioActual.toFixed(2)}
                  color="#059669"
                  bgColor="rgba(240, 253, 250, 0.8)"
                  textColor="#059669"
                />

                <StatCard
                  title="Precio Promedio"
                  value={estadisticas.precioPromedio.toFixed(2)}
                  color="#3b82f6"
                  bgColor="rgba(239, 246, 255, 0.8)"
                  textColor="#3b82f6"
                />

                <StatCard
                  title="Precio Mínimo"
                  value={estadisticas.precioMinimo.toFixed(2)}
                  color="#f59e0b"
                  bgColor="rgba(255, 251, 235, 0.8)"
                  textColor="#f59e0b"
                />

                <StatCard
                  title="Precio Máximo"
                  value={estadisticas.precioMaximo.toFixed(2)}
                  color="#ef4444"
                  bgColor="rgba(254, 242, 242, 0.8)"
                  textColor="#ef4444"
                />
              </div>
            </div>

            {/* Información adicional */}
            {historialPrecios.totalEntradas > 0 && (
              <div style={{ 
                marginTop: '20px', 
                padding: '16px', 
                backgroundColor: '#f0f9ff', 
                borderRadius: '8px',
                border: '1px solid #bfdbfe'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#1e40af' }}>
                  📈 Información del Historial
                </h4>
                <div style={{ fontSize: '14px', color: '#374151' }}>
                  <p style={{ margin: '4px 0' }}>
                    • Total de actualizaciones registradas: <strong>{historialPrecios.totalEntradas}</strong>
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    • Actualizaciones mostradas en el gráfico: <strong>{historialPrecios.entradasMostradas || historialPrecios.labels?.length || 0}</strong>
                  </p>
                  <p style={{ margin: '4px 0' }}>
                    • Rango de variación: <strong>S/ {(estadisticas.precioMaximo - estadisticas.precioMinimo).toFixed(2)}</strong>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;