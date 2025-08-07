/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, ArrowRight } from 'lucide-react';
import "../styles/styles.css";
import advices from '../advices.json';
import { roomRoutes } from '../routes';

const MainMenu = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState('');
  const [adviceElement, setAdviceElement] = useState(Math.floor(Math.random() * advices.length));
  const [adviceIntervalId, setAdviceIntervalId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('srUserToken');
    if (!token) {
      setUserError('Токен не найден. Пожалуйста, войдите в систему.');
      setLoadingUser(false);
      return;
    }

    const apiBase = import.meta.env.VITE_API_BASE || 'https://sr-game-backend-32667b36f309.herokuapp.com';
    fetch(`${apiBase}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || 'Ошибка получения пользователя');
        }
        return res.json();
      })
      .then((data) => setUser(data))
      .catch((err) => {
        console.error(err);
        setUserError('Не удалось получить данные пользователя');
      })
      .finally(() => setLoadingUser(false));
  }, []);

  useEffect(() => {
    const intervalId = setInterval(changeAdvice, 15000);
    setAdviceIntervalId(intervalId);
    return () => clearInterval(intervalId);
  }, [])

  const changeAdvice = () => {
    if (adviceIntervalId) {
      clearInterval(adviceIntervalId);
    }
    setAdviceElement(Math.floor(Math.random() * advices.length));
    const newIntervalId = setInterval(changeAdvice, 15000);
    setAdviceIntervalId(newIntervalId);
  };

  const handleJoinRoom = (roomData) => {
    const target = roomData?.roomCode || roomData?.id || roomData;
    navigate(`/room/${target}`);
  };

  const handleCreateRoom = async () => {
    try {
      const newRoom = await roomRoutes.create();
      if (newRoom && newRoom.roomCode) {
        navigate(`/room/${newRoom.roomCode}`);
      }
    } catch (err) {
      console.error('Ошибка создания комнаты:', err);
      setUserError('Не удалось создать комнату');
    }
  };

  const safeUsername = (u) => (u && typeof u.username === 'string' ? u.username : '');
  const safeEmail = (u) => (u && typeof u.email === 'string' ? u.email : '');

  return (
    <div className="landing-container">
      <div className="left-section">
        <div className="user-info">
          {loadingUser ? (
            <div className="loading-user">Загрузка данных пользователя...</div>
          ) : userError ? (
            <div className="error-user">{userError}</div>
          ) : user ? (
            <div className="user-profile-card">
              <div className="user-avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={`${safeUsername(user)} avatar`} />
                ) : (
                  String(safeUsername(user)).charAt(0).toUpperCase()
                )}
              </div>
              <div className="user-details">
                <div className="user-name">{String(safeUsername(user))}</div>
                {safeEmail(user) && (
                  <div className="user-email">{safeEmail(user)}</div>
                )}
              </div>
              <a
                href="https://www.saikiongrodus.com/profile"
                target="_blank"
                rel="noopener noreferrer"
                className="profile-button"
              >
                Профиль
              </a>
            </div>
          ) : null}
        </div>
        <div className="logo-container">
          <img src="/assets/images/logo.png" alt="Logo" className="logo" />
          <div className="advice-carousel" onClick={() => changeAdvice()}>
            <h1>Добро пожаловать в игру</h1>
            <div id="advice-text" className="advice-text">{advices[adviceElement]}</div>
          </div>
        </div>
        {user && user.rooms.length > 0 && (
          <div className="rooms-container">
            <h2>Комнаты в которых вы участвуете:</h2>
            <ul className="rooms-list">
              {user?.rooms?.map((room) => (
                <div key={room.roomCode} className="room-card">
                  <div className="room-card-header">
                    <h3>{room.roomCode}</h3>
                    <h4>{room.roleInRoom}</h4>
                  </div>
                  <button className="menu-button join-button" onClick={() => handleJoinRoom(room)}>
                    <ArrowRight size={24} />
                  </button>
                </div>
              ))}
              {user?.rooms?.length === 0 && (
                <div className="room-card">
                  <h3>Пример комнаты</h3>
                  <p>Описание комнаты</p>
                  <button className="menu-button join-button" onClick={() => handleJoinRoom('123')}>
                    <ArrowRight size={24} />
                    Перейти в комнату
                  </button>
                </div>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="right-section">
        <button className="menu-button create-button" onClick={handleCreateRoom}>
          Создать комнату
        </button>

        <button className="menu-button rules-button" onClick={() => navigate('/rules')}>
          Ознакомиться с правилами
        </button>

        {user && (
          <button className="menu-button stats-button" onClick={() => navigate('/statistics')}>
            <BarChart2 size={24} />
            Статистика
          </button>
        )}
      </div>
    </div>
  );
};

export default MainMenu;