import productsGeneral from './productsGeneral.jsx';

const productsDetailG = (producto) => {
  const result = [];
  // 1️⃣ Filtrar todos los productos que tengan el mismo nombre que el que recibimos como parámetro
  const productosCoincidentes = productsGeneral.filter(productoGeneral => productoGeneral.nombre === producto.nombre);

  // 2️⃣ Ordenar la lista por precio de menor a mayor
  productosCoincidentes.sort((productoA, productoB) => {
    const precioA = parseFloat(productoA.precio.replace("S/", "").trim());
    const precioB = parseFloat(productoB.precio.replace("S/", "").trim());
    return precioA - precioB;
  });
for (let i = 0; i < productosCoincidentes.length; i++) {
    result.push(productosCoincidentes[i]);
  }
  // 3️⃣ Obtener todos los precios en formato numérico
  const listaPreciosNumericos = productosCoincidentes.map(producto =>
    parseFloat(producto.precio.replace("S/", "").trim())
  );

  // 4️⃣ Calcular precio mínimo, máximo y promedio
  const precioMinimo = Math.min(...listaPreciosNumericos);
  const precioMaximo = Math.max(...listaPreciosNumericos);
  const precioPromedio = listaPreciosNumericos.reduce((acumulador, precio) => acumulador + precio, 0) / listaPreciosNumericos.length;

  // 5️⃣ Encontrar el producto con el precio más bajo y más alto
  const productoConPrecioMinimo = productosCoincidentes.find(producto =>
    parseFloat(producto.precio.replace("S/", "").trim()) === precioMinimo
  );
  const productoConPrecioMaximo = productosCoincidentes.find(producto =>
    parseFloat(producto.precio.replace("S/", "").trim()) === precioMaximo
  );

  // 6️⃣ Variables para guardar los meses
  let mesDelPrecioMinimo = null;
  let mesDelPrecioMaximo = null;

  // 7️⃣ Buscar dentro de preciosMensuales el mes con el menor y mayor precio
  if (productoConPrecioMinimo?.preciosMensuales) {
    const listaPreciosMensualesMin = Object.entries(productoConPrecioMinimo.preciosMensuales).map(([mes, precio]) => ({
      mes,
      precioNumerico: parseFloat(precio.replace("S/", "").trim())
    }));
    const menorPrecioMensual = Math.min(...listaPreciosMensualesMin.map(dato => dato.precioNumerico));
    const mesEncontradoMin = listaPreciosMensualesMin.find(dato => dato.precioNumerico === menorPrecioMensual);
    mesDelPrecioMinimo = mesEncontradoMin?.mes || null;
  }

  if (productoConPrecioMaximo?.preciosMensuales) {
    const listaPreciosMensualesMax = Object.entries(productoConPrecioMaximo.preciosMensuales).map(([mes, precio]) => ({
      mes,
      precioNumerico: parseFloat(precio.replace("S/", "").trim())
    }));
    const mayorPrecioMensual = Math.max(...listaPreciosMensualesMax.map(dato => dato.precioNumerico));
    const mesEncontradoMax = listaPreciosMensualesMax.find(dato => dato.precioNumerico === mayorPrecioMensual);
    mesDelPrecioMaximo = mesEncontradoMax?.mes || null;
  }

  // 8️⃣ Retornar toda la información como un objeto
  return {
    result,
    productos: productosCoincidentes,
    productoConPrecioMinimo,
    mesDelPrecioMinimo,
    productoConPrecioMaximo,
    mesDelPrecioMaximo,
    precioMaximo: parseFloat(precioMaximo.toFixed(2)),
    precioPromedio: parseFloat(precioPromedio.toFixed(2))
  };
};

export default productsDetailG;
