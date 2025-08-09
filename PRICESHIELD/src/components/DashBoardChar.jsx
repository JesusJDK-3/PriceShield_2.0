// Importa React y hooks useState, useEffect
import React, { useState, useEffect } from 'react';
// Importa los módulos necesarios de Chart.js para gráficos de barras y líneas
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
// Importa el componente Chart de react-chartjs-2
import { Chart } from 'react-chartjs-2';

// Registra los componentes de Chart.js que se van a usar
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

// Componente principal del gráfico del dashboard
const DashboardChart = () => {
  // Estado para saber si la vista es compacta (pantallas pequeñas)
  const [isCompact, setIsCompact] = useState(false);

  // Efecto para escuchar el cambio de tamaño de la ventana y ajustar el modo compacto
  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth <= 768); // Activa modo compacto si el ancho es menor o igual a 768px
    };
    handleResize(); // Llama una vez al montar el componente
    window.addEventListener('resize', handleResize); // Escucha cambios de tamaño
    return () => window.removeEventListener('resize', handleResize); // Limpia el listener al desmontar
  }, []);

  // Datos del gráfico, cambian según si está en modo compacto o no
  const data = {
    labels: isCompact
      ? ['Ene', 'Feb', 'Mar', 'Abr'] // Menos etiquetas en modo compacto
      : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'], // Todas las etiquetas en modo normal
    datasets: [
      {
        type: 'bar', // Tipo barra
        label: 'Precio mensual (S/)', // Etiqueta de la barra
        data: isCompact ? [25, 27, 24, 26] : [25, 27, 24, 26, 28, 29, 27], // Datos según modo
        backgroundColor: 'rgba(54, 162, 235, 0.6)', // Color de las barras
        borderRadius: 5 // Bordes redondeados
      },
      {
        type: 'line', // Tipo línea
        label: 'Tendencia', // Etiqueta de la línea
        data: isCompact ? [24, 25, 25, 26] : [24, 25, 25, 26, 27, 28, 27], // Datos según modo
        borderColor: 'rgba(255, 99, 132, 1)', // Color de la línea
        backgroundColor: 'rgba(255, 99, 132, 0.3)', // Color de fondo de la línea
        fill: false, // No rellenar bajo la línea
        tension: 0.3, // Curvatura de la línea
        pointRadius: 4 // Tamaño de los puntos
      }
    ]
  };

  // Opciones de configuración del gráfico
  const options = {
    responsive: true, // Se adapta al tamaño del contenedor
    maintainAspectRatio: false, // Permite definir la altura manualmente
    plugins: {
      legend: { position: isCompact ? 'bottom' : 'top' }, // Posición de la leyenda según modo
      title: { display: true, text: 'Evolución de precios y tendencia' } // Título del gráfico
    },
    scales: {
      x: {
        ticks: { maxRotation: isCompact ? 0 : 45, minRotation: 0 } // Rotación de etiquetas en eje X
      },
      y: { beginAtZero: true } // El eje Y empieza en cero
    }
  };

  // Renderiza el gráfico dentro de un div con altura variable según modo
  return (
    <div style={{ height: isCompact ? '250px' : '300px', width: '100%' }}>
      <Chart type='bar' data={data} options={options} />
    </div>
  );
};

// Exporta el componente para usarlo en otras partes de la app
export default DashboardChart;
