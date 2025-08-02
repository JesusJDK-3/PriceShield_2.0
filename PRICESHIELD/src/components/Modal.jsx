import React, { useEffect, useRef } from 'react';
import log from "../assets/img/log.png";
import { useState } from 'react';

const Modal = ({ isOpen, closeModal }) => {
    const [showPassword, setShowPassword] = useState(false);

    if (!isOpen) return null;

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
                    <form className='formModal'>
                        <span className='cor'>Correo:</span>
                        <input type="text" id='correo' name='correo' placeholder='tuCorreo@gmail.com' />
                        <span className='con'>Contraseña:</span>
                        <div className="ojo">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name='contraseña'
                                className='contraseña'
                                placeholder='Contraseña'

                            />
                            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} ojito`}
                                onClick={() => setShowPassword(!showPassword)} ></i>
                        </div>
                        <br />
                        <input type="submit" />
                    </form>
                </div>

            </div>
        </div>
    );
};

export default Modal;
