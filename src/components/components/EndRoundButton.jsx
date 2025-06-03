import React from "react";

const EndRoundButton = ({ round, handleEndRound }) => {
  return (
    <div className="end-round-section">
      <h3>Ход {round}</h3>
      <div className="end-round-button" onClick={handleEndRound}>
        Завершить ход
      </div>
    </div>
  );
};

export default EndRoundButton;