import React from 'react';
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

function DashboardChart({ chartType, historialPrecios, isCompact }) {
  // Calcular estadísticas para el gráfico
  const precios = historialPrecios.precios || [];
  const minPrice = precios.length > 0 ? Math.min(...precios) : 0;
  const maxPrice = precios.length > 0 ? Math.max(...precios) : 0;

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
    <>
      <div style={{
        height: isCompact ? '200px' : '250px',
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
    </>
  );
}

export default DashboardChart;