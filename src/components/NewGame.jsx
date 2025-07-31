import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Copy, ArrowLeft } from 'lucide-react';
import "../styles/styles.css";
import CharacterDistribution from "./CharacterSelection";
import MapSelection from "./MapSelection";
import CharacterPositioning from "./CharacterPositioning";
import ChatConsole from "./ChatConsole";
import ChatSidebar from './ChatSidebar';
import { maps } from "../maps";
import { userRoutes, roomRoutes } from '../routes';

const NewGame = () => {
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [createdTime, setCreatedTime] = useState(null);
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(
    () => Number(localStorage.getItem("gameStep")) || 1
  );
  const [teams, setTeams] = useState(() => {
    const savedTeams = localStorage.getItem("gameTeams");
    return savedTeams ? JSON.parse(savedTeams) : { team1: [], team2: [] };
  });
  const [selectedMap, setSelectedMap] = useState(() => {
    const savedMap = localStorage.getItem("selectedMap");
    return savedMap ? JSON.parse(savedMap) : null;
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    // Загружаем данные пользователя при монтировании
    userRoutes.getProfile()
      .then(setUser)
      .catch(err => {
        console.error('Ошибка загрузки профиля:', err);
        navigate('/');
      });
  }, [navigate]);

  useEffect(() => {
    // Создаём комнату при монтировании
    roomRoutes.create(user.username)
      .then(data => {
        setRoom(data);
        setCreatedTime(new Date(data.createdAt));
      })
      .catch(err => {
        console.error('Ошибка создания комнаты:', err);
        setError('Не удалось создать комнату');
      });
  }, []);

  // Сохраняем текущий шаг игры в localStorage
  useEffect(() => {
    localStorage.setItem("gameStep", step);
  }, [step]);

  // Сохраняем текущие команды в localStorage
  useEffect(() => {
    localStorage.setItem("gameTeams", JSON.stringify(teams));
  }, [teams]);

  // Сохраняем выбранную карту в localStorage
  useEffect(() => {
    localStorage.setItem("selectedMap", JSON.stringify(selectedMap));
  }, [selectedMap]);

  const handleDistributionComplete = (distribution) => {
    setTeams(distribution);
    setStep(2);
  };

  const handleMapSelection = (map) => {
    setSelectedMap(map);
    setStep(3);
  };

  const handlePositioningComplete = (positionedTeams) => {
    setTeams({
      team1: positionedTeams.team1,
      team2: positionedTeams.team2,
    });
    setStep(4);
  };

  // Форматирование времени с момента создания
  const getTimeFromCreation = () => {
    if (!createdTime) return '';

    const now = new Date();
    const diff = now - createdTime;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Копирование кода комнаты
  const copyRoomCode = () => {
    if (room?.roomCode) {
      navigator.clipboard.writeText(room.roomCode);
    }
  };

  // Поиск игрока
  const searchPlayer = () => {
    if (!searchQuery.trim() || !room?.roomCode) return;

    roomRoutes.invitePlayer(room.roomCode, searchQuery)
      .then(data => {
        setRoom(data);
        setShowSearch(false);
        setSearchQuery('');
        setError(null);
      })
      .catch(err => {
        console.error('Ошибка приглашения игрока:', err);
        setError('Не удалось пригласить игрока');
      });
  };

  return (
    <div className="new-game-container">
      {step === 0 && (
        <>
          <div className="top-bar">
            <button className="back-button" onClick={() => navigate('/')}>
              <ArrowLeft size={24} />
              Назад
            </button>
            {room?.roomCode && (
              <div className="room-code" onClick={copyRoomCode}>
                <span>Код комнаты: {room.roomCode}</span>
                <Copy size={20} className="copy-icon" />
              </div>
            )}
            <div className="room-timer">
              Время создания: {getTimeFromCreation()}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="players-container">
            {/* Левая сторона - создатель */}
            <div className="player-slot creator">
              <div className="player-avatar">
                {/* Здесь может быть аватар */}
              </div>
              <div className="player-info">
                <h3>Создатель комнаты</h3>
                <p>{user?.username}</p>
              </div>
            </div>

            {/* Правая сторона - второй игрок или кнопка добавления */}
            <div className="player-slot second">
              {room?.participants?.[1] ? (
                <div className="player-info">
                  <h3>Игрок 2</h3>
                  <p>{room.participants[1].username}</p>
                </div>
              ) : showSearch ? (
                <div className="search-container">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Введите никнейм игрока"
                    onKeyPress={(e) => e.key === 'Enter' && searchPlayer()}
                  />
                  <button onClick={searchPlayer}>Пригласить</button>
                </div>
              ) : (
                <button className="add-player-button" onClick={() => setShowSearch(true)}>
                  <Plus size={32} />
                  <span>Добавить игрока</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
      {step === 1 && (
        <CharacterDistribution
          onDistributionComplete={handleDistributionComplete}
        />
      )}
      {step === 2 && (
        <MapSelection onMapSelect={handleMapSelection} maps={maps} />
      )}
      {step === 3 && selectedMap && (
        <CharacterPositioning
          teams={teams}
          selectedMap={selectedMap}
          onPositioningComplete={handlePositioningComplete}
        />
      )}
      {step === 4 && selectedMap && (
        <div className="game-layout" style={{ display: 'flex' }}>
          <ChatConsole teams={teams} selectedMap={selectedMap} />
          <ChatSidebar roomCode={room?.roomCode} currentUser={user} />
        </div>
      )}
    </div>
  );
};

export default NewGame;
