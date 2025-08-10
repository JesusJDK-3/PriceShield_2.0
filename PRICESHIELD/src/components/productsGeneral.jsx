import productoImg from '../assets/img/acite.jpg';
import productoImG from '../assets/img/gloria.jpeg';
import productoImgA from '../assets/img/arroz.jpg';
import productoImgAZ from '../assets/img/azucar.jpg';
import productoImgI from '../assets/img/ICA-KOLA1.jpg';

const productosGeneral = [
  // Aceite Primor - Metro
  {
    nombre: "Aceite Primor de 900ml",
    precio: "S/100",
    supermercado: "Metro",
    imagen: productoImg,
    preciosMensuales: {
      enero: "S/100.0", febrero: "S/98.5", marzo: "S/101.2", abril: "S/99.8",
      mayo: "S/102.0", junio: "S/103.5", julio: "S/101.7", agosto: "S/100.9",
      septiembre: "S/104.0", octubre: "S/105.2", noviembre: "S/103.9", diciembre: "S/106.5"
    }
  },
  // Aceite Primor - PlazaVea
  {
    nombre: "Aceite Primor de 900ml",
    precio: "S/92.5",
    supermercado: "PlazaVea",
    imagen: productoImg,
    preciosMensuales: {
      enero: "S/92.5", febrero: "S/93.1", marzo: "S/91.8", abril: "S/94.0",
      mayo: "S/95.5", junio: "S/94.2", julio: "S/93.0", agosto: "S/92.7",
      septiembre: "S/95.0", octubre: "S/96.4", noviembre: "S/94.9", diciembre: "S/97.0"
    }
  },
  // Aceite Primor - Tottus
  {
    nombre: "Aceite Primor de 900ml",
    precio: "S/95.0",
    supermercado: "Tottus",
    imagen: productoImg,
    preciosMensuales: {
      enero: "S/95.0", febrero: "S/94.2", marzo: "S/96.1", abril: "S/97.5",
      mayo: "S/98.3", junio: "S/97.0", julio: "S/96.8", agosto: "S/95.6",
      septiembre: "S/99.0", octubre: "S/100.5", noviembre: "S/99.3", diciembre: "S/101.2"
    }
  },
  // Aceite Primor - RealPlaza
  {
    nombre: "Aceite Primor de 900ml",
    precio: "S/97.8",
    supermercado: "RealPlaza",
    imagen: productoImg,
    preciosMensuales: {
      enero: "S/97.8", febrero: "S/98.4", marzo: "S/96.9", abril: "S/99.5",
      mayo: "S/100.8", junio: "S/101.2", julio: "S/100.0", agosto: "S/99.1",
      septiembre: "S/102.0", octubre: "S/103.5", noviembre: "S/101.8", diciembre: "S/104.0"
    }
  },

  // Leche Gloria - Tottus
  {
    nombre: "Leche Gloria 1L",
    precio: "S/4.8",
    supermercado: "Tottus",
    imagen: productoImG,
    preciosMensuales: {
      enero: "S/4.8", febrero: "S/4.9", marzo: "S/5.0", abril: "S/4.85",
      mayo: "S/4.95", junio: "S/5.05", julio: "S/4.9", agosto: "S/4.88",
      septiembre: "S/5.1", octubre: "S/5.15", noviembre: "S/5.0", diciembre: "S/5.2"
    }
  },
  // Leche Gloria - RealPlaza
  {
    nombre: "Leche Gloria 1L",
    precio: "S/5.1",
    supermercado: "RealPlaza",
    imagen: productoImG,
    preciosMensuales: {
      enero: "S/5.1", febrero: "S/5.15", marzo: "S/5.05", abril: "S/5.2",
      mayo: "S/5.3", junio: "S/5.25", julio: "S/5.18", agosto: "S/5.12",
      septiembre: "S/5.35", octubre: "S/5.4", noviembre: "S/5.28", diciembre: "S/5.45"
    }
  },
  // Leche Gloria - Metro
  {
    nombre: "Leche Gloria 1L",
    precio: "S/4.9",
    supermercado: "Metro",
    imagen: productoImG,
    preciosMensuales: {
      enero: "S/4.9", febrero: "S/4.92", marzo: "S/4.88", abril: "S/5.0",
      mayo: "S/5.05", junio: "S/5.1", julio: "S/4.95", agosto: "S/4.9",
      septiembre: "S/5.15", octubre: "S/5.2", noviembre: "S/5.05", diciembre: "S/5.25"
    }
  },
  // Leche Gloria - PlazaVea
  {
    nombre: "Leche Gloria 1L",
    precio: "S/5.3",
    supermercado: "PlazaVea",
    imagen: productoImG,
    preciosMensuales: {
      enero: "S/5.3", febrero: "S/5.35", marzo: "S/5.28", abril: "S/5.4",
      mayo: "S/5.45", junio: "S/5.5", julio: "S/5.38", agosto: "S/5.32",
      septiembre: "S/5.55", octubre: "S/5.6", noviembre: "S/5.48", diciembre: "S/5.65"
    }
  },

  // Arroz Costeño - Metro
  {
    nombre: "Arroz Costeño 5kg",
    precio: "S/24.5",
    supermercado: "Metro",
    imagen: productoImgA,
    preciosMensuales: {
      enero: "S/24.5", febrero: "S/29.8", marzo: "S/29.0", abril: "S/24.6",
      mayo: "S/25.2", junio: "S/25.5", julio: "S/25.1", agosto: "S/24.9",
      septiembre: "S/25.6", octubre: "S/25.8", noviembre: "S/25.3", diciembre: "S/26.0"
    }
  },
  // Arroz Costeño - Tottus
  {
    nombre: "Arroz Costeño 5kg",
    precio: "S/30.2",
    supermercado: "Tottus",
    imagen: productoImgA,
    preciosMensuales: {
      enero: "S/30.2", febrero: "S/30.5", marzo: "S/30.0", abril: "S/30.8",
      mayo: "S/31.0", junio: "S/31.3", julio: "S/30.9", agosto: "S/30.6",
      septiembre: "S/31.5", octubre: "S/31.8", noviembre: "S/31.2", diciembre: "S/32.0"
    }
  },
  // Arroz Costeño - PlazaVea
  {
    nombre: "Arroz Costeño 5kg",
    precio: "S/26.0",
    supermercado: "PlazaVea",
    imagen: productoImgA,
    preciosMensuales: {
      enero: "S/26.0", febrero: "S/29.2", marzo: "S/29.8", abril: "S/26.4",
      mayo: "S/26.6", junio: "S/26.8", julio: "S/26.3", agosto: "S/26.1",
      septiembre: "S/27.0", octubre: "S/27.3", noviembre: "S/26.7", diciembre: "S/27.5"
    }
  },
  // Arroz Costeño - RealPlaza
  {
    nombre: "Arroz Costeño 5kg",
    precio: "S/28.4",
    supermercado: "RealPlaza",
    imagen: productoImgA,
    preciosMensuales: {
      enero: "S/29.4", febrero: "S/29.7", marzo: "S/29.2", abril: "S/29.0",
      mayo: "S/29.3", junio: "S/29.5", julio: "S/29.0", agosto: "S/28.8",
      septiembre: "S/29.8", octubre: "S/30.0", noviembre: "S/30.4", diciembre: "S/30.2"
    }
  },

  // Azúcar Rubia - PlazaVea
  {
    nombre: "Azúcar Rubia 1kg",
    precio: "S/3.5",
    supermercado: "PlazaVea",
    imagen: productoImgAZ,
    preciosMensuales: {
      enero: "S/3.5", febrero: "S/3.6", marzo: "S/3.55", abril: "S/3.65",
      mayo: "S/3.7", junio: "S/3.75", julio: "S/3.68", agosto: "S/3.6",
      septiembre: "S/3.8", octubre: "S/3.85", noviembre: "S/3.75", diciembre: "S/3.9"
    }
  },
  // Azúcar Rubia - RealPlaza
  {
    nombre: "Azúcar Rubia 1kg",
    precio: "S/7.9",
    supermercado: "RealPlaza",
    imagen: productoImgAZ,
    preciosMensuales: {
      enero: "S/7.9", febrero: "S/8.0", marzo: "S/7.85", abril: "S/8.1",
      mayo: "S/8.2", junio: "S/8.25", julio: "S/8.15", agosto: "S/8.05",
      septiembre: "S/8.3", octubre: "S/8.4", noviembre: "S/8.25", diciembre: "S/8.5"
    }
  },
  // Azúcar Rubia - Metro
  {
    nombre: "Azúcar Rubia 1kg",
    precio: "S/4.2",
    supermercado: "Metro",
    imagen: productoImgAZ,
    preciosMensuales: {
      enero: "S/4.2", febrero: "S/4.25", marzo: "S/4.18", abril: "S/4.3",
      mayo: "S/4.35", junio: "S/4.4", julio: "S/4.28", agosto: "S/4.25",
      septiembre: "S/4.45", octubre: "S/4.5", noviembre: "S/4.4", diciembre: "S/4.55"
    }
  },
  // Azúcar Rubia - Tottus
  {
    nombre: "Azúcar Rubia 1kg",
    precio: "S/5.0",
    supermercado: "Tottus",
    imagen: productoImgAZ,
    preciosMensuales: {
      enero: "S/5.0", febrero: "S/5.05", marzo: "S/4.95", abril: "S/5.1",
      mayo: "S/5.15", junio: "S/5.2", julio: "S/5.1", agosto: "S/5.0",
      septiembre: "S/5.25", octubre: "S/5.3", noviembre: "S/5.2", diciembre: "S/5.35"
    }
  },

  // Inka Kola - Metro
  {
    nombre: "Gaseosa Inka Kola 1.5L",
    precio: "S/6.3",
    supermercado: "Metro",
    imagen: productoImgI,
    preciosMensuales: {
      enero: "S/6.3", febrero: "S/6.35", marzo: "S/6.25", abril: "S/6.4",
      mayo: "S/6.45", junio: "S/6.5", julio: "S/6.4", agosto: "S/6.35",
      septiembre: "S/6.55", octubre: "S/6.6", noviembre: "S/6.5", diciembre: "S/6.65"
    }
  },
  // Inka Kola - Tottus
  {
    nombre: "Gaseosa Inka Kola 1.5L",
    precio: "S/9.7",
    supermercado: "Tottus",
    imagen: productoImgI,
    preciosMensuales: {
      enero: "S/9.7", febrero: "S/9.8", marzo: "S/9.65", abril: "S/9.85",
      mayo: "S/9.9", junio: "S/10.0", julio: "S/9.85", agosto: "S/9.75",
      septiembre: "S/10.1", octubre: "S/10.2", noviembre: "S/10.0", diciembre: "S/10.3"
    }
  },
  // Inka Kola - PlazaVea
  {
    nombre: "Gaseosa Inka Kola 1.5L",
    precio: "S/7.2",
    supermercado: "PlazaVea",
    imagen: productoImgI,
    preciosMensuales: {
      enero: "S/7.2", febrero: "S/7.25", marzo: "S/7.15", abril: "S/7.3",
      mayo: "S/7.35", junio: "S/7.4", julio: "S/7.3", agosto: "S/7.25",
      septiembre: "S/7.45", octubre: "S/7.5", noviembre: "S/7.4", diciembre: "S/7.55"
    }
  },
  // Inka Kola - RealPlaza
  {
    nombre: "Gaseosa Inka Kola 1.5L",
    precio: "S/8.0",
    supermercado: "RealPlaza",
    imagen: productoImgI,
    preciosMensuales: {
      enero: "S/8.0", febrero: "S/8.05", marzo: "S/7.95", abril: "S/8.1",
      mayo: "S/8.15", junio: "S/8.2", julio: "S/8.1", agosto: "S/8.05",
      septiembre: "S/8.25", octubre: "S/8.3", noviembre: "S/8.2", diciembre: "S/8.35"
    }
  }
];

export default productosGeneral;
