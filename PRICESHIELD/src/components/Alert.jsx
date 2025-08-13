import React from "react";

function Alert(/*{ producto }*/) {
    return (
        <div className="Alerta">
            <div className="DetallesAlerta">
                <div className="AlertaDetallitos">
                    <i className="bi bi-patch-exclamation-fill"></i>
                    <div className="nombreYmas">
                        <h3>Leche Gloria 1L</h3>
                        <p>Metro</p>
                    </div>
                </div>
                <div className="AlertaOpciones">
                    <button className="DashAlerta">Ver en Panel</button>
                    <button className="IgnorarAlerta">Ignorar</button>
                    <button className="LeidoAlerta">Marcar como leído</button>
                </div>
            </div>
            <div className="PrecioAlerta">
                <h1 className="PrecioAlertaH1">S/ 4.50</h1>
                <small className="mensaVPA">↑1.5%</small>
            </div>
        </div>

    )

}

export default Alert;