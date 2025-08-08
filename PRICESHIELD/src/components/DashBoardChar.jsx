// Importa React y los módulos necesarios de chart.js
import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
// Importa el componente Chart de react-chartjs-2
import { Chart } from 'react-chartjs-2';

// Registra los componentes de ChartJS que se van a utilizar
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

// Componente funcional DashboardChart
const DashboardChart = () => {
  // Datos para el gráfico
  const data = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'], // Etiquetas del eje X
    datasets: [
      {
        type: 'bar', // Tipo de gráfico: barra
        label: 'Precio mensual (S/)', // Etiqueta de la serie
        data: [25, 27, 24, 26, 28, 29, 27], // Datos de la serie
        backgroundColor: 'rgba(54, 162, 235, 0.6)', // Color de fondo de las barras
        borderRadius: 5 // Bordes redondeados para las barras
      },   
      {
        type: 'line', // Tipo de gráfico: línea
        label: 'Tendencia', // Etiqueta de la serie
        data: [24, 25, 25, 26, 27, 28, 27], // Datos de la serie
        borderColor: 'rgba(255, 99, 132, 1)', // Color de la línea
        backgroundColor: 'rgba(255, 99, 132, 0.3)', // Color de fondo (relleno bajo la línea)
        fill: false, // No rellenar bajo la línea
        tension: 0.3, // Curvatura de la línea
        pointRadius: 4 // Radio de los puntos en la línea
      }
    ]
  };

  // Opciones de configuración del gráfico
  const options = {
    responsive: true, // El gráfico es responsivo
    plugins: {
      legend: { position: 'top' }, // Posición de la leyenda
      title: { display: true, text: 'Evolución de precios y tendencia' } // Título del gráfico
    },
    scales: {
      y: { beginAtZero: true } // El eje Y comienza en cero
    }
  };

  // Renderiza el componente Chart con los datos y opciones
  return <Chart type='bar' data={data} options={options} />;
};

// Exporta el componente DashboardChart
export default DashboardChart;