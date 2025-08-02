// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import First from './first';        // Importa correctamente con mayúscula
import Products from './products'; // Importa correctamente con mayúscula
import './styles/App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<First />} />
        <Route path="/products" element={<Products />} />
      </Routes>
    </Router>
  );
}

export default App;
