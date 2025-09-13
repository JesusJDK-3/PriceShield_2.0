import React, { useState, useEffect, useRef } from "react";
import { Bar, Line } from "react-chartjs-2";
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
} from "chart.js";

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
  const chartContainerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Detectar tamaño real del contenedor
  useEffect(() => {
    const updateWidth = () => {
      if (chartContainerRef.current) {
        setContainerWidth(chartContainerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const precios = historialPrecios.precios || [];
  const minPrice = precios.length > 0 ? Math.min(...precios) : 0;
  const maxPrice = precios.length > 0 ? Math.max(...precios) : 0;

  // 🔥 Ajuste dinámico del grosor de barras
  const dynamicBarThickness = precios.length
    ? Math.max(10, Math.min(containerWidth / (precios.length * 2), 50)) // Entre 10 y 50 px
    : 20;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(0,0,0,0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context) => `Precio: S/ ${context.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        ticks: {
          font: { size: containerWidth < 500 ? 10 : 12, weight: "500" },
          color: "#6b7280",
          maxRotation: containerWidth < 500 ? 45 : 0
        },
        grid: { display: false },
        border: { display: false }
      },
      y: {
        ticks: {
          font: { size: 12, weight: "500" },
          color: "#6b7280",
          callback: (value) => `S/ ${value.toFixed(2)}`
        },
        beginAtZero: false,
        min: precios.length > 0 ? minPrice * 0.98 : undefined,
        max: precios.length > 0 ? maxPrice * 1.02 : undefined,
        grid: { color: "rgba(0,0,0,0.05)", borderDash: [2, 2] },
        border: { display: false }
      }
    }
  };

  const barData = {
    labels: historialPrecios.labels || ["Sin datos"],
    datasets: [
      {
        data: precios.length > 0 ? precios : [0],
        backgroundColor: precios.map((precio) =>
          precio === minPrice
            ? "rgba(34,197,94,0.8)"
            : precio === maxPrice
            ? "rgba(239,68,68,0.8)"
            : "rgba(59,130,246,0.6)"
        ),
        borderColor: precios.map((precio) =>
          precio === minPrice
            ? "rgba(34,197,94,1)"
            : precio === maxPrice
            ? "rgba(239,68,68,1)"
            : "rgba(59,130,246,1)"
        ),
        borderWidth: 2,
        barThickness: dynamicBarThickness,
        maxBarThickness: dynamicBarThickness + 10
      }
    ]
  };

  const lineData = {
    labels: historialPrecios.labels || ["Sin datos"],
    datasets: [
      {
        data: precios.length > 0 ? precios : [0],
        borderColor: "rgba(99,102,241,1)",
        backgroundColor: "rgba(99,102,241,0.1)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: precios.map((precio) =>
          precio === minPrice
            ? "rgba(34,197,94,1)"
            : precio === maxPrice
            ? "rgba(239,68,68,1)"
            : "rgba(99,102,241,1)"
        ),
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: containerWidth < 500 ? 3 : 5, // 🔥 puntos más pequeños en móviles
        pointHoverRadius: containerWidth < 500 ? 5 : 7
      }
    ]
  };

  return (
    <div
      ref={chartContainerRef}
      style={{ height: isCompact ? "200px" : "250px", position: "relative" }}
    >
      {chartType === "bar" && <Bar data={barData} options={chartOptions} />}
      {chartType === "line" && <Line data={lineData} options={chartOptions} />}
    </div>
  
  );
}

export default DashboardChart;
