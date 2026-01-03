/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, ArrowRight, Trash2, Eye } from 'lucide-react';
import "../styles/styles.css";
import advices from '../advices.json';
import { roomRoutes, userRoutes } from '../routes';
import { useUserSocket } from '../hooks/useUserSocket';

const MainMenu = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState('');
  const [adviceElement, setAdviceElement] = useState(Math.floor(Math.random() * advices.length));
  const [adviceIntervalId, setAdviceIntervalId] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [targetRoomToLeave, setTargetRoomToLeave] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [roomsByCode, setRoomsByCode] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 3;
  const [nowTs, setNowTs] = useState(Date.now());

  useEffect(() => {
    const token = localStorage.getItem('srUserToken');
    if (!token) {
      setUserError('Токен не найден. Пожалуйста, войдите в систему.');
      setLoadingUser(false);
      return;
    }

    const apiBase = import.meta.env.VITE_API_BASE || 'https://saikiong-rodus-08b1dee9bafb.herokuapp.com';
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

  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // (перемещено ниже объявления paginatedRooms)

  // Периодический рефреш профиля, чтобы список комнат не отставал
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const fresh = await userRoutes.getProfile();
        if (!cancelled) setUser(fresh);
      } catch {
        // ignore errors
      }
    };
    const id = setInterval(tick, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  useUserSocket((event) => {
    if (!event || !event.type) return;
    if (event.type === 'USER_ROOMS_UPDATED') {
      // сервер присылает { type, payload: { rooms: [...] } }
      const roomsFromPayload = event?.payload?.rooms;
      const nextRooms = Array.isArray(roomsFromPayload)
        ? roomsFromPayload
        : Array.isArray(event.rooms)
          ? event.rooms
          : [];

      // Обновляем кеш подробностей по коду комнаты.
      if (nextRooms.length > 0) {
        setRoomsByCode((prev) => {
          const merged = { ...prev };
          nextRooms.forEach((r) => {
            if (r && r.roomCode) {
              merged[r.roomCode] = { ...(merged[r.roomCode] || {}), ...r };
            }
          });
          return merged;
        });
      }

      // Обновляем список комнат пользователя (минимальный срез: roomCode/roleInRoom)
      setUser((prev) => (prev ? {
        ...prev,
        rooms: nextRooms.map((r) => ({ roomCode: r.roomCode, roleInRoom: r.roleInRoom || r.roleInRoom || r.role }))
      } : prev));
    }
    if (event.type === 'USER_ROOM_UPDATED') {
      const payload = event?.payload?.room || event?.payload || event.room || event.roomData || event;
      const code = payload?.roomCode;
      if (!code) return;
      setRoomsByCode((prev) => ({ ...prev, [code]: payload }));
      setUser((prev) => {
        if (!prev) return prev;
        const has = (prev.rooms || []).some((r) => r.roomCode === code);
        if (has) return prev;
        return { ...prev, rooms: [...(prev.rooms || []), { roomCode: code, roleInRoom: payload?.roleInRoom || 'player' }] };
      });
    }
    if (event.type === 'USER_ROOM_REMOVED') {
      const code = event?.payload?.roomCode || event.roomCode;
      if (!code) return;
      setUser((prev) => (prev ? { ...prev, rooms: (prev.rooms || []).filter((r) => r.roomCode !== code) } : prev));
      setRoomsByCode((prev) => {
        const next = { ...prev };
        delete next[code];
        return next;
      });
    }
  });

  const totalRooms = user?.rooms?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalRooms / pageSize));
  const page = Math.min(currentPage, totalPages);
  const paginatedRooms = useMemo(() => {
    const start = (page - 1) * pageSize;
    return (user?.rooms || []).slice(start, start + pageSize);
  }, [user?.rooms, page, pageSize]);

  const formatElapsed = (createdAt) => {
    if (!createdAt) return '';
    const createdMs = typeof createdAt === 'number' ? createdAt : Date.parse(createdAt);
    if (!createdMs) return '';
    const diff = Math.max(0, nowTs - createdMs);
    const sec = Math.floor(diff / 1000);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}ч ${String(m).padStart(2, '0')}м ${String(s).padStart(2, '0')}с`;
    if (m > 0) return `${m}м ${String(s).padStart(2, '0')}с`;
    return `${s}с`;
  };

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

  const openConfirmLeave = (room) => {
    setTargetRoomToLeave(room);
    setModalError('');
    setConfirmModalOpen(true);
  };

  const closeConfirmLeave = () => {
    if (isLeaving) return;
    setConfirmModalOpen(false);
    setTargetRoomToLeave(null);
    setModalError('');
  };

  const handleConfirmLeave = async () => {
    if (!targetRoomToLeave) return;
    setIsLeaving(true);
    setModalError('');
    try {
      await roomRoutes.leave(targetRoomToLeave.roomCode);
      // Оптимистично убираем комнату из локального состояния пользователя
      setUser((prev) => {
        if (!prev) return prev;
        const nextRooms = (prev.rooms || []).filter((r) => r.roomCode !== targetRoomToLeave.roomCode);
        return { ...prev, rooms: nextRooms };
      });
      // Дополнительно пытаемся актуализировать профиль
      try {
        const fresh = await userRoutes.getProfile();
        setUser(fresh);
      } catch {
        // ignore refresh errors, локальный стейт уже обновлён
      }
      setConfirmModalOpen(false);
      setTargetRoomToLeave(null);
    } catch (err) {
      console.error('Ошибка выхода из комнаты:', err);
      setModalError('Не удалось выполнить операцию. Попробуйте ещё раз.');
    } finally {
      setIsLeaving(false);
    }
  };

  // Периодический опрос видимых комнат для поддержания актуальности инфоблоков
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const refreshVisibleRooms = async () => {
      const codes = paginatedRooms.map((r) => r?.roomCode).filter(Boolean);
      if (codes.length === 0) return;
      try {
        const results = await Promise.all(
          codes.map(async (code) => {
            try {
              const data = await roomRoutes.getByCode(code);
              return { code, data };
            } catch {
              return null;
            }
          })
        );
        if (cancelled) return;
        setRoomsByCode((prev) => {
          const next = { ...prev };
          results.forEach((item) => {
            if (item && item.code && item.data) {
              next[item.code] = { ...(next[item.code] || {}), ...item.data };
            }
          });
          return next;
        });
      } catch {
        // ignore
      }
    };

    // мгновенный первый опрос и далее каждые 20 сек
    refreshVisibleRooms();
    const id = setInterval(refreshVisibleRooms, 20000);
    return () => { cancelled = true; clearInterval(id); };
  }, [user, paginatedRooms]);

  const safeUsername = (u) => (u && typeof u.username === 'string' ? u.username : '');
  const safeEmail = (u) => (u && typeof u.email === 'string' ? u.email : '');

  return (
    <div className="landing-container">
      <div className="left-section">
        <div className="user-info">
          {loadingUser ? (
            <div className="loading-user">Загрузка данных пользователя...</div>
          ) : userError ? (
            <div className="error-user">
              {userError}
              {String(userError).includes("Токен не найден") && (
                <a
                  href="https://saikiongrodus.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="error-user-button"
                  style={{ marginLeft: 12, display: "inline-block" }}
                >
                  Войти на сайт
                </a>
              )}
            </div>
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
          <img src="https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/images/logo.png" alt="Logo" className="logo" />
          <div className="advice-carousel" onClick={() => changeAdvice()}>
            <h1>Добро пожаловать в игру</h1>
            <div id="advice-text" className="advice-text">{advices[adviceElement]}</div>
          </div>
        </div>
        {user && user.rooms.length > 0 && (
          <div className="rooms-container">
            <h2>Комнаты в которых вы участвуете:</h2>
            <ul className="rooms-list">
              {paginatedRooms.map((room) => {
                const info = roomsByCode[room.roomCode] || {};
                const roomState = info?.roomState || (info?.inProcess ? 'inProcess' : 'preparation');
                const spectatorsCount = info?.spectatorsCount ?? 0;
                const participants = Array.isArray(info?.participants) ? info.participants : [];
                const createdAt = info?.createdAt;
                const myUsername = user?.username;
                const p1 = participants[0]?.username || participants[0];
                const p2 = participants[1]?.username || participants[1];
                const currentTurnColor = info?.currentTurnColor; // 'red' | 'blue'
                const rem = info?.remainingCharacters || {};
                const redAlive = typeof rem?.red === 'number' ? rem.red : (typeof info?.redAliveCharacters === 'number' ? info.redAliveCharacters : undefined);
                const blueAlive = typeof rem?.blue === 'number' ? rem.blue : (typeof info?.blueAliveCharacters === 'number' ? info.blueAliveCharacters : undefined);
                const bgClass = (roomState === 'inProcess' || info?.inProcess) && currentTurnColor ? `turn-bg-${currentTurnColor}` : '';
                const statusText = (info?.inProcess || roomState === 'inProcess') ? 'Идёт матч' : roomState === 'draft' ? 'Выбор персонажей' : 'Подготовка';

                return (
                  <div key={room.roomCode} className={`room-card room-card-large ${bgClass}`}>
                    <div className="room-card-header">
                      <div className="room-title-row">
                        <h3>{room.roomCode}</h3>
                        <span className="room-role">{room.roleInRoom}</span>
                      </div>
                      <div className="room-subheader">
                        <span className="badge status-badge">{statusText}</span>
                        <span className="badge spectators-badge"><Eye size={24} /> {spectatorsCount}</span>
                      </div>
                    </div>

                    <div className="room-card-body">
                      {(info?.inProcess || roomState === 'inProcess') ? (
                        <div className="score-row">
                          <span className="match-time">{formatElapsed(createdAt)}</span>
                          <div className="vs-line">
                            <span className={`player-name ${p1 === myUsername ? 'me' : ''}`}>{p1 || 'Player 1'}</span>
                            <span className="score">
                              {typeof redAlive === 'number' ? redAlive : '-'} : {typeof blueAlive === 'number' ? blueAlive : '-'}
                            </span>
                            <span className={`player-name ${p2 === myUsername ? 'me' : ''}`}>{p2 || 'Player 2'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="vs-row">
                          <span className={`player-name ${p1 === myUsername ? 'me' : ''}`}>{p1 || 'Player 1'}</span>
                          <span className="vs">VS</span>
                          <span className={`player-name ${p2 === myUsername ? 'me' : ''}`}>{p2 || 'Player 2'}</span>
                        </div>
                      )}
                    </div>

                    <div className="room-card-footer">
                      <button className="menu-button join-button" onClick={() => handleJoinRoom(room)}>
                        <ArrowRight size={24} />
                      </button>
                      <button
                        className="delete-room-button"
                        title="Покинуть/удалить комнату"
                        onClick={() => openConfirmLeave(room)}
                      >
                        <Trash2 size={22} />
                      </button>
                    </div>
                  </div>
                );
              })}
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
            {totalPages > 1 && (
              <div className="pagination-controls">
                <button className="menu-button pagination-button" disabled={page === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Назад</button>
                <span className="pagination-info">Стр. {page} / {totalPages}</span>
                <button className="menu-button pagination-button" disabled={page === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Вперёд</button>
              </div>
            )}
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
      {confirmModalOpen && (
        <div className="modal-overlay" onClick={closeConfirmLeave}>
          <div className="modal leave-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeConfirmLeave} disabled={isLeaving}>
              ×
            </button>
            <h2>Подтверждение</h2>
            <p>Вы уверены, что хотите покинуть эту комнату?</p>
            <p>Если вы админ комнаты, она будет расформирована для всех участников.</p>
            {modalError && <div className="error-message">{modalError}</div>}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
              <button className="menu-button" onClick={closeConfirmLeave} disabled={isLeaving}>Отмена</button>
              <button className="menu-button" onClick={handleConfirmLeave} disabled={isLeaving}>
                {isLeaving ? 'Выполняется…' : 'Подтвердить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainMenu;