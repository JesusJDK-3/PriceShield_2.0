import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TopBarF from './components/TopBarF.jsx';
import Drop_DownM from './components/Drop_Down_Menu.jsx';
import DashboardChart from './components/DashBoardChar.jsx';
import './styles/DashBoardPP.css'; // Importar el archivo CSS

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

function Dashboard({ user }) {
  const [isOpenM, setIsOpenM] = useState(true);
  const [productoActual, setProductoActual] = useState(null);
  const [datosComparacion, setDatosComparacion] = useState(null);
  const [historialPrecios, setHistorialPrecios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('bar');

  const { state } = useLocation();
  const navigate = useNavigate();

  // Función para extraer precio numérico
  const extraerNumericoPrecio = (precio) => {
    if (!precio) return 0;
    return parseFloat(precio.toString().replace(/[^\d.]/g, '')) || 0;
  };

  // Función para obtener comparación de precios
  const obtenerComparacionPrecios = async (nombreProducto) => {
    try {
      const response = await fetch(`/api/products/compare?product_name=${encodeURIComponent(nombreProducto)}&days_back=30`);
      const data = await response.json();

      if (data.success) {
        return data.comparison;
      }
      throw new Error(data.message || 'Error obteniendo comparación');
    } catch (error) {
      console.error('Error en comparación:', error);
      return null;
    }
  };

  // Función para buscar productos similares (para historial)
  const buscarProductosSimilares = async (nombreProducto) => {
    try {
      console.log('Buscando historial unificado para:', nombreProducto);

      // USAR LA NUEVA RUTA
      const response = await fetch(`/api/products/product-history-unified?product_name=${encodeURIComponent(nombreProducto)}&days_back=30`);

      const data = await response.json();

      if (data.success) {
        console.log('Productos históricos encontrados:', data.products?.length || 0);
        return data.products || [];
      }
      throw new Error(data.message || 'Error buscando productos');
    } catch (error) {
      console.error('Error en búsqueda:', error);
      return [];
    }
  };

  // Función para generar datos del historial
  const generarDatosHistorial = (productos) => {
    if (!productos || productos.length === 0) {
      return { labels: ['Sin datos'], precios: [0] };
    }

    // Filtrar y ordenar TODAS las actualizaciones por fecha
    const productosOrdenados = productos
      .filter(p => p.scraped_at && p.price > 0)
      .sort((a, b) => new Date(a.scraped_at) - new Date(b.scraped_at));

    if (productosOrdenados.length === 0) {
      return { labels: ['Sin datos'], precios: [0] };
    }

    // Mostrar TODAS las actualizaciones (sin límite de 10)
    const labels = productosOrdenados.map((producto, index) => {
      const fecha = new Date(producto.scraped_at);
      return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }) + ` (#${index + 1})`;  // Agregar número de actualización
    });

    const precios = productosOrdenados.map(producto =>
      parseFloat(extraerNumericoPrecio(producto.price))
    );

    console.log(`📊 Mostrando ${precios.length} actualizaciones de precio para: ${productosOrdenados[0]?.name}`);

    return { labels, precios };
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      if (!state?.producto) {
        setError('No se recibió información del producto');
        setLoading(false);
        return;
      }

      setProductoActual(state.producto);
      setLoading(true);

      try {
        const comparacion = await obtenerComparacionPrecios(state.producto.nombre || state.producto.name);
        setDatosComparacion(comparacion);

        const productosSimilares = await buscarProductosSimilares(state.producto.nombre || state.producto.name);

        if (productosSimilares.length > 0) {
          const datosHistorial = generarDatosHistorial(productosSimilares);
          setHistorialPrecios(datosHistorial);
        } else {
          // Si no hay datos, mostrar solo el precio actual
          console.warn('No se encontraron productos similares en la base de datos');
          setHistorialPrecios({
            labels: ['Sin historial'],
            precios: [extraerNumericoPrecio(state.producto.precio || state.producto.price)]
          });
        }

      } catch (error) {
        console.error('Error cargando datos:', error);
        setError(error.message);
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
    console.log('Buscando en dashboard:', query);
  };

  // Si no hay producto, mostrar error
  if (!state?.producto) {
    return (
      <div className={`contenedor_general ${!isOpenM ? 'soloContenido' : ''}`}>
        <div className="buProductos">
          <div className="TopBarFDNPR">
            <TopBarF onSearch={handleSearch} openMenu={() => setIsOpenM(true)} user={user} />
          </div>
          <div className="no-product-state">
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

  // Calcular estadísticas y datos para los gráficos
  const precios = historialPrecios.precios || [];
  const precioActual = precios[precios.length - 1] || extraerNumericoPrecio(productoActual?.precio || productoActual?.price);
  const precioPromedio = precios.length > 0 ? (precios.reduce((a, b) => a + b, 0) / precios.length) : precioActual;
  const precioMinimo = precios.length > 0 ? Math.min(...precios) : precioActual;
  const precioMaximo = precios.length > 0 ? Math.max(...precios) : precioActual;

  // Datos del producto organizados
  const productData = {
    nombre: productoActual?.nombre || productoActual?.name,
    imagen: productoActual?.imagen || productoActual?.images?.[0] || '/placeholder-product.png',
    precioActual: precioActual,
    supermercado: productoActual?.supermercado || productoActual?.supermarket
  };

  return (
    <div className={`contenedor_general ${!isOpenM ? 'soloContenido' : ''}`}>
      <div className="buProductos">
        <div className="TopBarFDNPR">
          <TopBarF onSearch={handleSearch} openMenu={() => setIsOpenM(true)} user={user} />
        </div>

        {loading && (
          <div className="loading-state">
            Cargando datos del producto...
          </div>
        )}

        {error && (
          <div className="error-state">
            Error: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="dashboard-content">
            {/* Header del producto */}
            <div className="product-header">
              <div className="product-header-content">
                <div className="BotRP">
                  <button className='BotonRegresar' onClick={() => navigate(-1)}>
                    <span className='flechita'>←</span> Volver
                  </button>
                </div>
                <img
                  src={productData.imagen}
                  alt={productData.nombre}
                  className="product-image"
                  onError={(e) => {
                    e.target.src = '/placeholder-product.png';
                  }}
                />
                <div className="product-info">
                  <h1 className="product-name">
                    {productData.nombre}
                  </h1>

                  <div className="product-details">
                    <div>
                      <span>Precio actual: </span>
                      <span style={{color: '#059669'}}>
                        S/ {productData.precioActual}
                      </span>
                    </div>
                    <div>
                      <span>Supermercado: </span>
                      <span style={{fontWeight: '600'}}>
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
                </div>
              </div>
            </div>

            <div className="dashboard-grid">
              {/* Panel principal del gráfico */}
              <div className="chart-panel">
                <div className="chart-header">
                  <h2 className="chart-title">
                    Historial Completo de Actualizaciones (Últimas {precios.length} actualizaciones)
                  </h2>
                  <div className="update-badge">
                    Actualizado hoy
                  </div>
                </div>

                <DashboardChart 
                  chartType={chartType} 
                  historialPrecios={historialPrecios} 
                />
              </div>

              {/* Panel de estadísticas */}
              <div className="stats-panel">
                <StatCard
                  title="Precio Actual"
                  value={productData.precioActual.toFixed(2)}
                  color="#059669"
                  bgColor="rgba(240, 253, 250, 0.8)"
                  textColor="#059669"
                />

                <StatCard
                  title="Precio Promedio"
                  value={precioPromedio.toFixed(2)}
                  color="#3b82f6"
                  bgColor="rgba(239, 246, 255, 0.8)"
                  textColor="#3b82f6"
                />

                <StatCard
                  title="Precio Mínimo"
                  value={precioMinimo.toFixed(2)}
                  color="#f59e0b"
                  bgColor="rgba(255, 251, 235, 0.8)"
                  textColor="#f59e0b"
                />

                <StatCard
                  title="Precio Máximo"
                  value={precioMaximo.toFixed(2)}
                  color="#ef4444"
                  bgColor="rgba(254, 242, 242, 0.8)"
                  textColor="#ef4444"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;