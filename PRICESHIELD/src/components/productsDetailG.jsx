import productsGeneral from './productsGeneral.jsx';

const productsDetailG = (producto)  => {
    const result = [];
    for (let i = 0; i < productsGeneral.length; i++) { // Itera sobre todos los productos
    // Si el nombre del producto coincide con el seleccionado, lo agrega a SupermercadoG
    if (productsGeneral[i].nombre === producto.nombre) {
      result.push(productsGeneral[i]);
    }
  }
  result.sort((a, b) => {// Ordena los productos por precio
    // Convierte los precios a números para compararlos
    const precioA = parseFloat(a.precio.replace("S/", ""));
    const precioB = parseFloat(b.precio.replace("S/", ""));
    return precioA - precioB;
  });
  return result;   
};

export default productsDetailG;