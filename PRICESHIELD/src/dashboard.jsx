import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import TopBarF from './components/TopBarF.jsx';
import Drop_DownM from './components/Drop_Down_Menu.jsx';
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Componente StatCard mejorado
function StatCard({ title, value, color, bgColor, textColor }) {
  return (
    <div style={{
      background: bgColor || '#fff',
      border: `2px solid ${color}`,
      borderRadius: '12px',
      padding: '20px',
      textAlign: 'center',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      transition: 'transform 0.2s ease',
      cursor: 'pointer'
    }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{
        fontSize: window.innerWidth <= 768 ? '24px' : '28px',
        fontWeight: 'bold',
        color: textColor || color,
        marginBottom: '8px'
      }}>
        S/ {value}
      </div>
      <div style={{
        fontSize: '14px',
        color: '#6b7280',
        fontWeight: '500'
      }}>
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
          <div style={{
            padding: '50px',
            textAlign: 'center',
            fontSize: '18px',
            color: '#666'
          }}>
            <p>No se encontró información del producto para mostrar en el dashboard.</p>
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
    );
  }

  // Calcular estadísticas y datos para los gráficos
  const precios = historialPrecios.precios || [];
  const minPrice = precios.length > 0 ? Math.min(...precios) : 0;
  const maxPrice = precios.length > 0 ? Math.max(...precios) : 0;
  const precioActual = precios[precios.length - 1] || extraerNumericoPrecio(productoActual?.precio || productoActual?.price);
  const precioPromedio = precios.length > 0 ? (precios.reduce((a, b) => a + b, 0) / precios.length) : precioActual;
  const precioMinimo = precios.length > 0 ? Math.min(...precios) : precioActual;
  const precioMaximo = precios.length > 0 ? Math.max(...precios) : precioActual;

  // Obtener mejores precios por supermercado
  const mejoresPrecios = datosComparacion ?
    Object.entries(datosComparacion)
      .map(([key, data]) => ({
        supermercado: data.supermarket_name || key,
        precio: data.min_price || 0,
        productos: data.products?.length || 0
      }))
      .filter(item => item.precio > 0)
      .sort((a, b) => a.precio - b.precio)
      .slice(0, 3)
    : [];

  // Datos del producto organizados
  const productData = {
    nombre: productoActual?.nombre || productoActual?.name,
    imagen: productoActual?.imagen || productoActual?.images?.[0] || '/placeholder-product.png',
    precioActual: precioActual,
    supermercado: productoActual?.supermercado || productoActual?.supermarket
  };

  // Estadísticas organizadas
  const stats = {
    precioPromedio,
    precioMinimo,
    precioMaximo,
    mejoresPrecios
  };

  // Check responsive
  const isCompact = window.innerWidth < 768;

  // Configuración del gráfico mejorada
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false // Ocultamos la leyenda para un diseño más limpio
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function (context) {
            return `Precio: S/ ${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
            weight: '500'
          },
          color: '#6b7280',
          maxRotation: window.innerWidth <= 768 ? 45 : 0
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          borderDash: [2, 2],
        },
        border: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
            weight: '500'
          },
          color: '#6b7280',
          callback: function (value) {
            return 'S/ ' + value.toFixed(2);
          }
        },
        beginAtZero: false,
        min: precios.length > 0 ? Math.min(...precios) * 0.98 : undefined,
        max: precios.length > 0 ? Math.max(...precios) * 1.02 : undefined
      }
    },
    elements: {
      bar: {
        borderRadius: {
          topLeft: 6,
          topRight: 6,
          bottomLeft: 0,
          bottomRight: 0
        }
      },
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2,
        backgroundColor: '#fff'
      }
    }
  };

  // Datos para gráfico de barras
  const barData = {
    labels: historialPrecios.labels || ['Sin datos'],
    datasets: [
      {
        data: precios.length > 0 ? precios : [0],
        backgroundColor: precios.map((precio, index) => {
          if (precio === minPrice) return 'rgba(34, 197, 94, 0.8)'; // Verde para precio mínimo
          if (precio === maxPrice) return 'rgba(239, 68, 68, 0.8)'; // Rojo para precio máximo
          return 'rgba(59, 130, 246, 0.6)'; // Azul para precios normales
        }),
        borderColor: precios.map((precio, index) => {
          if (precio === minPrice) return 'rgba(34, 197, 94, 1)';
          if (precio === maxPrice) return 'rgba(239, 68, 68, 1)';
          return 'rgba(59, 130, 246, 1)';
        }),
        borderWidth: 2,
        barThickness: window.innerWidth <= 768 ? 20 : 35,
        maxBarThickness: 40
      }
    ]
  };

  // Datos para gráfico de líneas
  const lineData = {
    labels: historialPrecios.labels || ['Sin datos'],
    datasets: [
      {
        data: precios.length > 0 ? precios : [0],
        borderColor: 'rgba(99, 102, 241, 1)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: precios.map((precio) => {
          if (precio === minPrice) return 'rgba(34, 197, 94, 1)';
          if (precio === maxPrice) return 'rgba(239, 68, 68, 1)';
          return 'rgba(99, 102, 241, 1)';
        }),
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };

  return (
    <div className={`contenedor_general ${!isOpenM ? 'soloContenido' : ''}`}>


      <div className="buProductos">
        <div className="TopBarFDNPR">
          <TopBarF onSearch={handleSearch} openMenu={() => setIsOpenM(true)} user={user} />
        </div>

        {loading && (
          <div style={{
            padding: '50px',
            textAlign: 'center',
            fontSize: '18px'
          }}>
            Cargando datos del producto...
          </div>
        )}

        {error && (
          <div style={{
            padding: '30px',
            textAlign: 'center',
            color: '#e74c3c',
            backgroundColor: '#fdf2f2',
            margin: '20px',
            borderRadius: '8px',
            border: '1px solid #fadbd8'
          }}>
            Error: {error}
          </div>
        )}

        {!loading && !error && (
          <div style={{
            padding: isCompact ? '15px' : '20px',
            maxWidth: '1400px',
            margin: '0 auto',
            minHeight: '100vh',
          }}>
            {/* Header del producto */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: isCompact ? '20px' : '25px',
              marginBottom: '25px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                display: 'flex',
                gap: '20px',
                alignItems: 'flex-start',
                flexWrap: 'wrap'
              }}>
                <div className="BotRP">
                  <button className='BotonRegresar' onClick={() => navigate(-1)}>
                    <span className='flechita'>←</span> Volver
                  </button>
                </div>
                <img
                  src={productData.imagen}
                  alt={productData.nombre}
                  style={{
                    width: isCompact ? '100px' : '120px',
                    height: isCompact ? '100px' : '120px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                  }}
                  onError={(e) => {
                    e.target.src = '/placeholder-product.png';
                  }}
                />
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h1 style={{
                    fontSize: isCompact ? '18px' : '20px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    marginBottom: '15px',
                    lineHeight: '1.3',
                    margin: '0 0 15px 0'
                  }}>
                    {productData.nombre}
                  </h1>

                  <div style={{
                    display: 'flex',
                    gap: '20px',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '14px' }}>Precio actual: </span>
                      <span style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#059669'
                      }}>
                        S/ {productData.precioActual}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#6b7280', fontSize: '14px' }}>Supermercado: </span>
                      <span style={{ fontWeight: '600', color: '#374151' }}>
                        {productData.supermercado}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Controles de gráfico */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  background: '#f3f4f6',
                  padding: '4px',
                  borderRadius: '8px'
                }}>
                  {[
                    { type: 'bar', icon: '📊', label: 'Barras' },
                    { type: 'line', icon: '📈', label: 'Línea' }
                  ].map(({ type, icon, label }) => (
                    <button
                      key={type}
                      onClick={() => setChartType(type)}
                      style={{
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '6px',
                        background: chartType === type ? '#3b82f6' : 'transparent',
                        color: chartType === type ? '#fff' : '#374151',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>{icon}</span>
                      {!isCompact && label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isCompact ? '1fr' : '2fr 1fr',
              gap: '25px'
            }}>
              {/* Panel principal del gráfico */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: isCompact ? '20px' : '30px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h2 style={{
                    fontSize: isCompact ? '16px' : '18px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    margin: 0
                  }}>
                    Historial Completo de Actualizaciones (Últimas {precios.length} actualizaciones)
                  </h2>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    background: '#f3f4f6',
                    padding: '4px 8px',
                    borderRadius: '6px'
                  }}>
                    Actualizado hoy
                  </div>
                </div>

                <div style={{
                  height: isCompact ? '280px' : '350px',
                  position: 'relative'
                }}>
                  {chartType === 'bar' && <Bar data={barData} options={chartOptions} />}
                  {chartType === 'line' && <Line data={lineData} options={chartOptions} />}
                </div>

                {/* Leyenda personalizada */}
                <div style={{
                  marginTop: '15px',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '20px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      background: 'rgba(34, 197, 94, 0.8)',
                      borderRadius: '2px'
                    }}></div>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Precio mínimo</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      background: 'rgba(239, 68, 68, 0.8)',
                      borderRadius: '2px'
                    }}></div>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Precio máximo</span>
                  </div>
                </div>
              </div>

              {/* Panel de estadísticas */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                <StatCard
                  title="Precio Actual"
                  value={productData.precioActual.toFixed(2)}
                  color="#059669"
                  bgColor="rgba(240, 253, 250, 0.8)"
                  textColor="#059669"
                />

                <StatCard
                  title="Precio Promedio"
                  value={stats.precioPromedio.toFixed(2)}
                  color="#3b82f6"
                  bgColor="rgba(239, 246, 255, 0.8)"
                  textColor="#3b82f6"
                />

                <StatCard
                  title="Precio Mínimo"
                  value={stats.precioMinimo.toFixed(2)}
                  color="#f59e0b"
                  bgColor="rgba(255, 251, 235, 0.8)"
                  textColor="#f59e0b"
                />

                <StatCard
                  title="Precio Máximo"
                  value={stats.precioMaximo.toFixed(2)}
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