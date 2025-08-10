// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import First from './first';        // Importa correctamente con mayúscula
import Products from './products'; // Importa correctamente con mayúscula
import ProductDetail from './productDetail'; 
import ProductDashboard from './dashboard'; 
import './styles/App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<First />} />
        <Route path="/products" element={<Products />} />
        <Route path="/detalle" element={<ProductDetail />} />
        <Route path="/dashboard" element={<ProductDashboard />} />
        
      </Routes>
    </Router>
  );
}

export default App;
