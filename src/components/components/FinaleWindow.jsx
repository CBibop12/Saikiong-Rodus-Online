import React, { useState, useEffect } from "react";

const Finale = ({ status, duration, turns, handleCloseFinale, handleDownloadStats }) => {
    const [elapsed, setElapsed] = useState("0:00:00");

    useEffect(() => {
        const ms = duration;
        const h  = Math.floor(ms / 3_600_000);
        const m  = Math.floor(ms / 60_000) % 60;
        const s  = Math.floor(ms / 1_000) % 60;
        setElapsed(`${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
    }, [duration]);
    
    const handleStatusName = () => {
        let resultName = "";
        if (status === "red_base_destroyed") {
            resultName = "Красная база разрушена! Победа синих!"
        } 
        else if (status === "blue_base_destroyed") {
            resultName = "Синяя база разрушена! Победа красных!"
        }
        else if (status === "red_team_won") {
            resultName = "Синих персонажей не осталось! Победа красных!"
        }
        else if (status === "blue_team_won") {
            resultName = "Красных персонажей не осталось! Победа синих!"
        }
        return resultName;
    }

    return (
        <div className="modal-overlay">
            <div className="finale">
                    <h2>{handleStatusName()}</h2>
            <div className="finalInfoContainer">
                <div className="modal-dark-block flex">
                    <span className="modal-dark-block__label">Длительность:</span>
                    <span className="modal-dark-block__value">{elapsed}</span>
                </div>
                <div className="modal-dark-block flex">
                    <span className="modal-dark-block__label">Ходов:</span>
                    <span className="modal-dark-block__value">{turns}</span>
                    </div>
                </div>
                <button className="mainmodalButton" onClick={() => handleCloseFinale()}>
                На главную
                </button>
                <button className="mainmodalButton" onClick={() => handleDownloadStats()}>
                Скачать статистику
                </button>
            </div>
        </div>
    )
}

export default Finale;