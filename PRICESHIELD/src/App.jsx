import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import First from './first';        
import Products from './products'; 
import ProductDetail from './productDetail'; 
import ProductDashboard from './dashboard'; 
import Alerts from './alerts';
import We from './We';
import './styles/App.css'

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

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
    <Routes>
      <Route path="/" element={<First user={user} updateUser={updateUser} />} />
      <Route path="/products" element={<Products user={user} logout={logout} />} />
      <Route path="/detalle" element={<ProductDetail user={user} logout={logout}/>} />
      <Route path="/dashboard" element={<ProductDashboard user={user} logout={logout} />} />
      <Route path="/alert" element={<Alerts user={user} logout={logout} />} />
      <Route path="/we" element={<We user={user} logout={logout} />} />
    </Routes>
  );
}

export default App;
