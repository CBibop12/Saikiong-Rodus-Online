import { Pause } from "lucide-react";
//eslint-disable-next-line
const ControlButton = ({ round, isItMyTurn, handleEndRound, handlePause, countdownProgress = 0 }) => {
  // Рассчитываем угол заливки для круговой диаграммы (0-360°)
  const angle = Math.min(countdownProgress * 360, 360);

  return (
    <div className="end-round-section">
      <div className="upper-section">
        {/* Круговой таймер автозавершения - слева от кнопки */}
      {countdownProgress > 0 && countdownProgress < 1 && isItMyTurn && (
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: `conic-gradient(#D4AF37 ${angle}deg, rgba(255,255,255,0.3) 0deg)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            fontWeight: "bold",
            color: "#fff",
            border: "2px solid rgba(255,255,255,0.2)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            marginRight: "8px",
          }}
        >
          {Math.ceil(5 - countdownProgress * 5)}
        </div>
        )}
      <h3>Ход {round} ({isItMyTurn ? "Ваш ход" : "Ход противника"})</h3>
      </div>
      <div className="control-buttons">
        <div className="control-button" onClick={handlePause}>
          <Pause />
        </div>
        {isItMyTurn && (
          <div className="end-round-button" onClick={handleEndRound}>
            Завершить ход
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlButton;