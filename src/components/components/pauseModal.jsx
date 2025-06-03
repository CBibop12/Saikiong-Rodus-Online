// import React from "react";
// const PauseModal = ({ matchState, onResume, handleDownloadCurrentMatch, handleDownloadAllMatches }) => {
//     if (!isPaused) return null;
    
//     const redTeamStats = {
//       totalGold: matchState.teams.red.gold,
//       totalKills: matchState.actions.filter(
//         a =>
//           a.type === 'attack' &&
//           matchState.teams.blue.characters.some(ch => ch.name === a.target) &&
//           a.damage >= matchState.teams.blue.characters.find(ch => ch.name === a.target).currentHP
//       ).length,
//       baseHP: matchState.teams.red.baseHP,
//       aliveHeroes: matchState.teams.red.characters.filter(ch => ch.currentHP > 0).length,
//     };
//     const blueTeamStats = {
//       totalGold: matchState.teams.blue.gold,
//       totalKills: matchState.actions.filter(
//         a =>
//           a.type === 'attack' &&
//           matchState.teams.red.characters.some(ch => ch.name === a.target) &&
//           a.damage >= matchState.teams.red.characters.find(ch => ch.name === a.target).currentHP
//       ).length,
//       baseHP: matchState.teams.blue.baseHP,
//       aliveHeroes: matchState.teams.blue.characters.filter(ch => ch.currentHP > 0).length,
//     };
//     return (
//       <div className="pause-modal-overlay">
//         <div className="pause-modal">
//           <h2>Игра на паузе</h2>
//           <div className="game-stats">
//             <div className="pause-team-stats red">
//               <h3>Красная команда</h3>
//               <div className="stats-grid">
//                 <div className="stat-item">
//                   <span className="stat-label">Золото</span>
//                   <span className="stat-value gold">{redTeamStats.totalGold}</span>
//                 </div>
//                 <div className="stat-item">
//                   <span className="stat-label">Убийства</span>
//                   <span className="stat-value kills">{redTeamStats.totalKills}</span>
//                 </div>
//                 <div className="stat-item">
//                   <span className="stat-label">HP базы</span>
//                   <span className="stat-value hp">{redTeamStats.baseHP}</span>
//                 </div>
//                 <div className="stat-item">
//                   <span className="stat-label">Живые герои</span>
//                   <span className="stat-value heroes">{redTeamStats.aliveHeroes}/5</span>
//                 </div>
//               </div>
//             </div>
//             <div className="pause-team-stats blue">
//               <h3>Синяя команда</h3>
//               <div className="stats-grid">
//                 <div className="stat-item">
//                   <span className="stat-label">Золото</span>
//                   <span className="stat-value gold">{blueTeamStats.totalGold}</span>
//                 </div>
//                 <div className="stat-item">
//                   <span className="stat-label">Убийства</span>
//                   <span className="stat-value kills">{blueTeamStats.totalKills}</span>
//                 </div>
//                 <div className="stat-item">
//                   <span className="stat-label">HP базы</span>
//                   <span className="stat-value hp">{blueTeamStats.baseHP}</span>
//                 </div>
//                 <div className="stat-item">
//                   <span className="stat-label">Живые герои</span>
//                   <span className="stat-value heroes">{blueTeamStats.aliveHeroes}/5</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//           <div className="pause-actions">
//             <button className="action-button download-current" onClick={handleDownloadCurrentMatch}>
//               Скачать JSON текущей игры
//             </button>
//             <button className="action-button download-all" onClick={handleDownloadAllMatches}>
//               Скачать JSON всех игр
//             </button>
//             <button className="action-button resume" onClick={handleResume}>
//               Вернуться к игре
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const handlePause = () => {
//     setIsPaused(true);
//     setPauseStartTime(Date.now());
//   };

//   const handleResume = () => {
//     if (pauseStartTime) {
//       setTotalPausedTime(prev => prev + (Date.now() - pauseStartTime));
//     }
//     setPauseStartTime(null);
//     setIsPaused(false);
//   };

//   const handleDownloadCurrentMatch = () => {
//     const blob = new Blob([JSON.stringify(matchState, null, 2)], { type: "application/json" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `match_${Date.now()}.json`;
//     a.click();
//   };

//   const handleDownloadAllMatches = () => {
//     let bigJSON = localStorage.getItem('bigMatchHistory');
//     let history = [];
//     if (bigJSON) {
//       history = JSON.parse(bigJSON);
//     }
//     history.push(matchState);
//     localStorage.setItem('bigMatchHistory', JSON.stringify(history));
//     const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `match_history_${Date.now()}.json`;
//     a.click();
//   };

//   export default PauseModal

import React from 'react';

const PauseModal = ({ isPaused, matchState, onResume, handleDownloadCurrentMatch, handleDownloadAllMatches }) => {
  if (!isPaused) return null;
  const redTeamStats = {
    gold: matchState.teams.red.gold,
    baseHP: matchState.teams.red.baseHP,
  };
  const blueTeamStats = {
    gold: matchState.teams.blue.gold,
    baseHP: matchState.teams.blue.baseHP,
  };

  return (
    <div className="pause-modal-overlay">
      <div className="pause-modal">
        <h2>Игра на паузе</h2>
        <div className="game-stats">
          <div className="pause-team-stats red">
            <h3>Красная команда</h3>
            <p>Золото: {redTeamStats.gold}</p>
            <p>HP базы: {redTeamStats.baseHP}</p>
          </div>
          <div className="pause-team-stats blue">
            <h3>Синяя команда</h3>
            <p>Золото: {blueTeamStats.gold}</p>
            <p>HP базы: {blueTeamStats.baseHP}</p>
          </div>
        </div>
        <div className="pause-actions">
            <button className="action-button download-current" onClick={handleDownloadCurrentMatch}>
              Скачать JSON текущей игры
            </button>
             <button className="action-button download-all" onClick={handleDownloadAllMatches}>
              Скачать JSON всех игр
            </button>
            <button className="action-button resume" onClick={onResume}>
              Вернуться к игре
            </button>
          </div>
      </div>
    </div>
  );
};

export default PauseModal;
