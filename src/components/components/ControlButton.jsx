import { Pause } from "lucide-react";
//eslint-disable-next-line
const ControlButton = ({ round, handleEndRound, handlePause }) => {
  return (
    <div className="end-round-section">
      <h3>Ход {round}</h3>
      <div className="control-buttons">
      <div className="control-button" onClick={handlePause}>
          <Pause />
        </div>
        <div className="end-round-button" onClick={handleEndRound}>
          Завершить ход
        </div>
      </div>
    </div>
  );
};

export default ControlButton;