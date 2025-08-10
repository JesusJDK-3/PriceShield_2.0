// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import First from './first';        
import Products from './products'; 
import ProductDetail from './productDetail'; 
import ProductDashboard from './dashboard'; 
import './styles/App.css'

function App() {
  // Estado global para manejar autenticación
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar si hay usuario logueado al cargar la app
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  // Función para actualizar usuario (cuando se loguea/registra)
  const updateUser = (userData) => {
    setUser(userData);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Cargando...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={<First user={user} updateUser={updateUser} />} 
        />
        <Route 
          path="/products" 
          element={<Products user={user} logout={logout} />} 
        />
        <Route 
          path="/detalle" 
          element={<ProductDetail user={user} />} 
        />
        <Route 
          path="/dashboard" 
          element={<ProductDashboard user={user} logout={logout} />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
