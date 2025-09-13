import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Importar useNavigate
import log from "../assets/img/log.png";
import SearchBoxBF from './SearchBoxBF.jsx';

const Modal = ({ isOpen, closeModal, updateUser, redirectAfterAuth, onSearch, onResults }) => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const navigate = useNavigate(); // Hook para navegación
    const [showPassword, setShowPassword] = useState(false);
    const googleInitializedRef = useRef(false);

    // Estados para el formulario y la conexión con el backend
    const [formData, setFormData] = useState({
        correo: '',
        contraseña: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' o 'error'
    const [googleLoading, setGoogleLoading] = useState(false);

    // Función para manejar redirección después del login exitoso
    const handleSuccessfulAuth = (userData) => {
        // Actualizar usuario global
        if (updateUser) {
            updateUser(userData);
        }

        // Guardar en localStorage
        localStorage.setItem('user', JSON.stringify(userData));

        // Cerrar modal después de éxito y redirigir
        setTimeout(() => {
            closeModal();

            // Redirigir si hay una ruta especificada
            if (redirectAfterAuth) {
                console.log('🔀 Redirigiendo a:', redirectAfterAuth);
                navigate(redirectAfterAuth);
            }
        }, 1500);
    };

    // Inicializar Google Sign-In cuando se abra el modal
    useEffect(() => {
        if (isOpen && window.google && !googleInitializedRef.current) {
            initializeGoogleSignIn();
            // Renderizar botón inmediatamente
            setTimeout(() => {
                renderGoogleButton();
            }, 100);
        }
    }, [isOpen]);

    // Cargar el script de Google OAuth si no está cargado
    useEffect(() => {
        if (!window.google) {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => {
                if (isOpen && !googleInitializedRef.current) {
                    initializeGoogleSignIn();
                }
            };
            document.head.appendChild(script);
        }
    }, []);

    // Resetear cuando se cierre el modal
    useEffect(() => {
        if (!isOpen) {
            googleInitializedRef.current = false;
            setMessage('');
            setGoogleLoading(false);
            setFormData({ correo: '', contraseña: '' });
        }
    }, [isOpen]);

    // Inicializar Google Sign-In SIN FedCM
    const initializeGoogleSignIn = () => {
        if (window.google && !googleInitializedRef.current) {
            try {
                window.google.accounts.id.initialize({
                    client_id: "1067229120323-noi7kjog1d5g6solnr6sqenr85k4c82h.apps.googleusercontent.com",
                    callback: handleGoogleResponse,
                    auto_select: false,
                    cancel_on_tap_outside: true,
                });
                googleInitializedRef.current = true;
                console.log('✅ Google Sign-In inicializado correctamente');
            } catch (error) {
                console.error('❌ Error inicializando Google Sign-In:', error);
                setMessage('Error inicializando Google Sign-In');
                setMessageType('error');
            }
        }
    };

    // Manejar respuesta de Google OAuth
    const handleGoogleResponse = async (response) => {
        setGoogleLoading(true);
        setMessage('');

        try {
            // Decodificar el JWT token de Google para obtener la información del usuario
            const userInfo = parseJwt(response.credential);

            if (!userInfo) {
                throw new Error('No se pudo decodificar la información del usuario');
            }

            // Crear datos para enviar al backend
            const googleAuthData = {
                correo: userInfo.email,
                nombre: userInfo.name,
                google_id: userInfo.sub,
                foto: userInfo.picture,
                auth_method: 'google'
            };

            // Enviar al backend para crear/autenticar usuario con Google
            const backendResponse = await fetch(`${apiUrl}/api/auth/google-auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(googleAuthData)
            });

            const data = await backendResponse.json();

            if (data.success) {
                setMessage(data.message || 'Login con Google exitoso');
                setMessageType('success');

                // Usar la nueva función para manejar éxito
                handleSuccessfulAuth(data.user);

            } else {
                setMessage(data.message || 'Error en autenticación con Google');
                setMessageType('error');
            }

        } catch (error) {
            console.error('❌ Error procesando login de Google:', error);
            setMessage('Error procesando login de Google. Intenta nuevamente.');
            setMessageType('error');
        } finally {
            setGoogleLoading(false);
        }
    };

    // Función para decodificar JWT token de Google
    const parseJwt = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('❌ Error parsing JWT:', error);
            return null;
        }
    };

    // Renderizar botón de Google automáticamente
    const renderGoogleButton = () => {
        const buttonContainer = document.getElementById('google-signin-container');

        if (buttonContainer && window.google && googleInitializedRef.current) {
            // Limpiar contenedor previo
            buttonContainer.innerHTML = '';

            try {
                // Renderizar botón de Google
                window.google.accounts.id.renderButton(buttonContainer, {
                    theme: 'outline',
                    size: 'large',
                    text: 'signin_with',
                    shape: 'rectangular',
                    locale: 'es',
                    width: '280'
                });

            } catch (error) {
                console.error('❌ Error renderizando botón:', error);
            }
        }
    };

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

    // Función principal que envía datos al backend (formulario manual)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            // Hacer petición al backend
            const response = await fetch(`${apiUrl}/api/auth/smart-auth`, {
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

                console.log('✅ Usuario autenticado:', data.user);
                console.log('📋 Acción realizada:', data.action); // 'login' o 'register'

                // Usar la nueva función para manejar éxito
                handleSuccessfulAuth(data.user);

            } else {
                // Error - Mostrar mensaje de error
                setMessage(data.message);
                setMessageType('error');
            }

        } catch (error) {
            console.error('❌ Error conectando con el servidor:', error);
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
                    <h2>Busca un Producto</h2>

                    {/* Contenedor donde se renderizará el botón de Google real */}
                    <br />
                    <div className="Contenedorsearch-boxBF">
                        <SearchBoxBF
                            onSearch={onSearch}
                            onResults={(results, query, source) => {
                                //Pasar los resultados al callback padre
                                if (onResults) {
                                    onResults(results, query, source);
                                }

                                //Cerrar el modal
                                closeModal();

                                //Redirigir a productos con resultados
                                navigate("/products", {
                                    state: {
                                        searchResults: results,
                                        searchQuery: query,
                                        searchType: source
                                    }
                                });
                            }}
                        />
                    </div>




                </div>
            </div>
        </div>
    );
};

export default Modal;