import React, { useEffect, useRef, useState } from 'react';
import log from "../assets/img/log.png";

const Modal = ({ isOpen, closeModal }) => {
    const [showPassword, setShowPassword] = useState(false);
    
    // Estados para el formulario y la conexión con el backend
    const [formData, setFormData] = useState({
        correo: '',
        contraseña: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' o 'error'

    if (!isOpen) return null;

    // Manejar cambios en los inputs
    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        
        // Limpiar mensaje cuando el usuario empiece a escribir
        if (message) {
            setMessage('');
        }
    };

    // Función principal que envía datos al backend
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            // Hacer petición al backend
            const response = await fetch('http://localhost:5000/api/auth/smart-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    correo: formData.correo,
                    contraseña: formData.contraseña
                })
            });

            const data = await response.json();

            if (data.success) {
                // Éxito - Login o Registro
                setMessage(data.message);
                setMessageType('success');
                
                // Guardar información del usuario (opcional)
                localStorage.setItem('user', JSON.stringify(data.user));
                
                console.log('Usuario autenticado:', data.user);
                console.log('Acción realizada:', data.action); // 'login' o 'register'
                
                // Opcional: Cerrar el modal después de 2 segundos si es exitoso
                setTimeout(() => {
                    closeModal();
                    // Aquí puedes agregar redirección si usas React Router
                    // navigate('/dashboard');
                }, 2000);
                
            } else {
                // Error - Mostrar mensaje de error
                setMessage(data.message);
                setMessageType('error');
            }

        } catch (error) {
            console.error('Error conectando con el servidor:', error);
            setMessage('Error de conexión. Verifica que el servidor esté ejecutándose.');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mod">
            <div className='datos'>
                <div className="cerrar">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={closeModal}
                    >
                        X
                    </button>
                </div>
                <div className="FormJe">
                    <h1>Bienvenido</h1>

                    <button className='Google'>Continuar con Google</button>
                    <hr className="separador" />
                    <h2>Iniciar Sesión o Registrarse</h2>
                    
                    <form className='formModal' onSubmit={handleSubmit}>
                        <span className='cor'>Correo:</span>
                        <input 
                            type="email" 
                            id='correo' 
                            name='correo' 
                            placeholder='tuCorreo@gmail.com'
                            value={formData.correo}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                        />
                        
                        <span className='con'>Contraseña:</span>
                        <div className="ojo">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name='contraseña'
                                className='contraseña'
                                placeholder='Contraseña'
                                value={formData.contraseña}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                            />
                            <i 
                                className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} ojito`}
                                onClick={() => setShowPassword(!showPassword)}
                            ></i>
                        </div>
                        
                        <br />
                        
                        <input 
                            type="submit" 
                            value={loading ? 'Procesando...' : 'Continuar'}
                            disabled={loading}
                        />
                    </form>

                    {/* Mostrar mensajes del servidor */}
                    {message && (
                        <div className={`server-message ${messageType}`}>
                            {messageType === 'success' && <i className="bi bi-check-circle"></i>}
                            {messageType === 'error' && <i className="bi bi-exclamation-circle"></i>}
                            <span>{message}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Estilos para los mensajes del servidor - se integran con tus estilos existentes */}
            
        </div>
    );
};

export default Modal;