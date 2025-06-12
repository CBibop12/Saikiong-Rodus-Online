//eslint-disable-next-line
import { useState } from 'react';
import { Volume2, Music, Settings, LogOut, Play, Download, MessageCircleMore, } from 'lucide-react';

const CLEAR_KEYS = [
  'bigMatchHistory',
  'firstTeamToAct',
  'gameMessages',
  'gameStep',
  'gameTeams',
  'matchState',
  'selectedMap',
  'teamTurn',
];

const PauseModal = ({ isPaused, matchState, onResume, handleDownloadCurrentMatch, handleDownloadAllMatches }) => {
  const [showSettings, setShowSettings] = useState(false);
  if (!isPaused) return null;
  const redTeamStats = {
    gold: matchState.teams.red.gold,
    baseHP: matchState.teams.red.baseHP,
  };
  const blueTeamStats = {
    gold: matchState.teams.blue.gold,
    baseHP: matchState.teams.blue.baseHP,
  };

  const handleLeave = () => {
    CLEAR_KEYS.forEach(key => localStorage.removeItem(key));
    window.location.href = '/';
  };

  return (
    <div className="pause-modal-overlay">
      <div className="pause-modal">
        <h2>{showSettings ? "Настройки" : "Игра на паузе"}</h2>
        {!showSettings ? (
          <>
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
              <div className="pause-actions-row">
                <button className="action-button sound">
                  <Volume2 size={24} />
                  <span>Звук</span>
                </button>
                <button className="action-button music">
                  <Music size={24} />
                  <span>Музыка</span>
                </button>
              </div>
              <button className="action-button settings" onClick={() => setShowSettings(true)}>
                <Settings size={24} />
                <span>Настройки</span>
              </button>
              <div className="pause-actions-row">
                <button className="action-button" onClick={() => window.open('https://saikiongrodus.freeflarum.com', '_blank')}>
                  <MessageCircleMore size={24} />
                  <span>Форум</span>
                </button>
                <button className="action-button" onClick={() => window.open('https://t.me/+KYaTJhK3xH9jY2M6', '_blank')}>
                  <MessageCircleMore size={24} />
                  <span>Сообщество</span>
                </button>
              </div>
              <div className="pause-actions-row">
                <button className="action-button leave" onClick={handleLeave}>
                  <LogOut size={24} />
                  <span>Покинуть игру</span>
                </button>
                <button className="action-button resume" onClick={onResume}>
                  <Play size={24} />
                  <span>Продолжить</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="pause-settings">
            <button className="action-button download-all" onClick={handleDownloadAllMatches}>
              <Download size={24} />
              <span>Скачать JSON всех игр</span>
            </button>
            <button className="action-button download-current" onClick={handleDownloadCurrentMatch}>
              <Download size={24} />
              <span>Скачать JSON этой партии</span>
            </button>
            <button className="action-button" onClick={() => setShowSettings(false)}>
              Назад
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PauseModal;
