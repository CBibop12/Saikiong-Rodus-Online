import React from 'react';
import '../styles/topBar.css';

const TopBar = ({ matchState, elapsedTime, turn }) => {
  return (
    <div className="top-bar">
      <div className="team-characters red-team">
        {matchState.teams.red.characters.map((char, index) => (
          <div
            key={index}
            className={`character-portrait ${char.currentHP <= 0 ? 'dead' : ''}`}
            title={char.name}
          >
            <img
              src={`/assets/characters/${char.image}`}
              alt={char.name}
            />
          </div>
        ))}
      </div>

      <div className="game-info">
        <div className="time">{elapsedTime}</div>
        <div className="turn">Ход {turn}</div>
      </div>

      <div className="team-characters blue-team">
        {matchState.teams.blue.characters.map((char, index) => (
          <div
            key={index}
            className={`character-portrait ${char.currentHP <= 0 ? 'dead' : ''}`}
            title={char.name}
          >
            <img
              src={`/assets/characters/${char.image}`}
              alt={char.name}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopBar; 