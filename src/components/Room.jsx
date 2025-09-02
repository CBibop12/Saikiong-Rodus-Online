/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, ArrowLeft, Plus, MessageSquare, LogOut } from 'lucide-react';
import "../styles/styles.css";
import { CHAT_BASE, getChat, roomRoutes, userRoutes } from '../routes';
import { useDebounce } from 'use-debounce';
import PrivateChat from './PrivateChat';
import io from 'socket.io-client';
import { useRoomSocket } from '../hooks/useRoomSocket';
import CharacterDraft from './CharacterDraft';
import WorldMapSelection from './WorldMapSelection';
import FortuneWheel from './FortuneWheel';
import TeamFortuneWheel from './TeamFortuneWheel';
import MapConfirmation from './MapConfirmation';
import CharacterPositioning from './CharacterPositioning';
import { maps } from '../maps';
import ChatConsole from './ChatConsole';

const Room = () => {
    const { roomCode } = useParams();
    const navigate = useNavigate();

    const [room, setRoom] = useState(null);
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [createdTime, setCreatedTime] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [searchResults, setSearchResults] = useState([]);
    const [selectedFilter, setSelectedFilter] = useState('all'); // all, following, followers, friends
    const [, setIsSearching] = useState(false);
    const [debouncedQuery] = useDebounce(searchQuery, 400);
    const [showPrivateChat, setShowPrivateChat] = useState(false);
    const [chatWith, setChatWith] = useState(null);
    const [secondPlayer, setSecondPlayer] = useState(null);
    const [secondPlayerLoading, setSecondPlayerLoading] = useState(false);
    const [showCharacterInfo, setShowCharacterInfo] = useState(false);
    const [showFortuneWheel, setShowFortuneWheel] = useState(false);
    const [showTeamWheel, setShowTeamWheel] = useState(false);
    const [teamAssignmentResult, setTeamAssignmentResult] = useState(null);
    const [myTeam, setMyTeam] = useState(null); // 'red' | 'blue'
    const [mapSelectionResult, setMapSelectionResult] = useState(null);
    const [selectedMap, setSelectedMap] = useState(null);
    // Состояние для модального окна подтверждения выхода
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

    // Чат
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null); // сокет для приватного чата

    useEffect(() => {
        document.body.classList.toggle('scroll-lock', showCharacterInfo);
    }, [showCharacterInfo]);


    useEffect(() => {
        // JWT helpers
        const parseJwt = (token) => {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                return JSON.parse(jsonPayload);
            } catch {
                return null;
            }
        };

        const token = localStorage.getItem('srUserToken');
        if (!token) {
            window.location.href = 'https://saikiongrodus.com/profile';
            return;
        }

        const payload = parseJwt(token);
        const isExpired = payload?.exp ? Date.now() >= payload.exp * 1000 : false;
        if (!payload || isExpired) {
            try { localStorage.removeItem('srUserToken'); } catch { /* noop */ }
            window.location.href = 'https://saikiongrodus.com/profile';
            return;
        }

        // Устанавливаем раннего пользователя из токена, чтобы исключить гонки
        try {
            const earlyUsername = payload?.username || payload?.user?.username || payload?.name || payload?.sub || null;
            if (earlyUsername) {
                setUser((prev) => prev?.username ? prev : { username: earlyUsername });
            }
        } catch { /* noop */ }

        // Загрузка данных пользователя (валидный токен)
        userRoutes.getProfile()
            .then(setUser)
            .catch(err => {
                console.error('Ошибка загрузки профиля:', err);
                setError('Ошибка загрузки профиля');
            });
    }, []);

    // Обновление времени каждую секунду
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!roomCode) return;
        // Загрузка данных комнаты
        roomRoutes.getByCode(roomCode)
            .then(data => {
                setRoom(data);
                setCreatedTime(new Date(data.createdAt));
            })
            .catch(err => {
                console.error(err);
                setError('Не удалось получить данные комнаты');
            })
            .finally(() => setLoading(false));
    }, [roomCode]);

    // Загрузка второго игрока, когда и room, и user уже получены
    useEffect(() => {
        if (!room || !user?.username) return;

        if (room.participants?.length > 1) {
            const secondPlayerCandidate = room.participants.find(p => p.username !== user.username);
            if (secondPlayerCandidate) {
                requestSecondPlayer(secondPlayerCandidate);
            }
        } else {
            setSecondPlayer(null); // если второго игрока убрали
        }
    }, [room, user?.username]);

    // Web-socket для чата
    useEffect(() => {
        if (chat?._id) {
            loadMessages();
        }
    }, [chat?._id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Подключаемся к WebSocket один раз
        if (!socketRef.current) {
            const socket = io(CHAT_BASE, {
                auth: {
                    token: localStorage.getItem('srUserToken'),
                },
            });

            socket.on('connect_error', (err) => {
                console.error('WebSocket error:', err.message);
            });

            // Новое сообщение
            socket.on('new-message', (message) => {
                if (message.chatId === chat?._id) {
                    setMessages((prev) => [...prev, message]);
                }
            });

            socketRef.current = socket;
        }

        // При размонтировании отключаемся
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);
    //--------------------------------


    // Когда выбран другой чат, присоединяемся к комнате этого чата
    useEffect(() => {
        if (!chat?._id || !socketRef.current) return;

        const socket = socketRef.current;
        const join = () => socket.emit('join-chat', chat._id);

        if (socket.connected) {
            join();
        } else {
            // дождёмся establish
            socket.once('connect', join);
        }

        // cleanup – отписываемся от события connect, иначе их накопится
        return () => socket.off('connect', join);
    }, [chat?._id]);

    const requestSecondPlayer = async (secondPlayerCandidate) => {
        if (!secondPlayerCandidate) return;
        try {
            setSecondPlayerLoading(true);
            const secondPlayerData = await userRoutes.getUserByUsername(secondPlayerCandidate.username);
            setSecondPlayer(secondPlayerData);
        } catch (err) {
            console.error('Ошибка загрузки второго игрока:', err);
            // Можно установить сообщение об ошибке, если нужно
        } finally {
            setSecondPlayerLoading(false);
        }
    }

    // Авто-поиск при вводе
    useEffect(() => {
        if (debouncedQuery.trim()) {
            performSearch(debouncedQuery);
        } else {
            setSearchResults([]);
        }
    }, [debouncedQuery, selectedFilter]);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const chatData = await getChat(chat._id);
            const messagesArray = Array.isArray(chatData) ? chatData : (chatData?.messages || []);
            setMessages(messagesArray);
        } catch (err) {
            console.error('Ошибка загрузки сообщений:', err);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Форматирование времени с момента создания
    const getTimeFromCreation = () => {
        if (!createdTime) return '';

        const now = currentTime;
        const diff = now - createdTime;
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const copyRoomCode = () => {
        if (room?.roomCode) {
            navigator.clipboard.writeText(room.roomCode);
        }
    };

    const performSearch = async (queryStr = searchQuery) => {
        if (!queryStr.trim()) return;
        setIsSearching(true);
        try {
            const filterParam = selectedFilter === 'all' ? undefined : selectedFilter;
            const users = await userRoutes.searchUsers(queryStr.trim(), filterParam);
            setSearchResults(users);
        } catch (err) {
            console.error('Ошибка поиска пользователей:', err);
            setError('Не удалось выполнить поиск');
        } finally {
            setIsSearching(false);
        }
    };

    const inviteUser = async (username) => {
        if (!room?.roomCode) return;
        try {
            const updatedRoom = await roomRoutes.invitePlayer(room.roomCode, username);
            setRoom(updatedRoom);
            setShowSearch(false);
            setSearchQuery('');
            setSearchResults([]);
            await requestSecondPlayer(updatedRoom.participants.find(p => p._id !== user?._id));
        } catch (err) {
            console.error('Ошибка приглашения игрока:', err);
            setError('Не удалось пригласить игрока');
        }
    };

    const openChatWith = async (userToChat) => {
        try {
            const friend = await userRoutes.getUserByUsername(userToChat.username);
            const chatData = await getChat(friend._id);
            setChat(chatData);
            setChatWith(friend);
            setShowPrivateChat(true);
        } catch (err) {
            console.error('Ошибка открытия чата:', err);
            setError('Не удалось открыть чат');
        }
    };

    const closeChatWith = () => {
        setShowPrivateChat(false);
        setChatWith(null);
    };

    // ────────────────────────────────────────────────
    // WebSocket комнаты (основные игровые события)
    // ────────────────────────────────────────────────

    // Функция для применения diff к состоянию
    const applyDiffToState = (currentState, diff) => {
        const result = JSON.parse(JSON.stringify(currentState)); // Глубокая копия

        Object.keys(diff).forEach(path => {
            const keys = path.split('.');
            let current = result;

            // Проходим по пути до предпоследнего ключа
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (current[key] === undefined) {
                    current[key] = {};
                }
                current = current[key];
            }

            // Устанавливаем значение, основываясь на типе изменения
            const lastKey = keys[keys.length - 1];

            const change = diff[path]; // объект вида { type, value?, newValue? }

            switch (change?.type) {
                case 'added':
                    current[lastKey] = change.value;
                    break;
                case 'changed':
                    current[lastKey] = change.newValue;
                    break;
                case 'deleted':
                    delete current[lastKey];
                    break;
                default:
                    // На случай неожиданных форматов применяем старое поведение
                    current[lastKey] = change;
            }
        });

        return result;
    };

    // Обработчик входящих событий комнаты
    const handleRoomEvent = (event) => {
        if (!event?.type) return;

        if (event.type !== 'ROOM_UPDATED') {
            console.log('Room event received:', event.type, event);
        }

        switch (event.type) {
            case 'ROOM_UPDATED': {
                const updatedRoom = event.room || event.payload || event;
                setRoom(updatedRoom);

                if (updatedRoom.selectedMap && !selectedMap) {
                    const map = maps.find(m => m.name === updatedRoom.selectedMap);
                    if (map) {
                        setSelectedMap(map);
                    }
                }
                break;
            }
            case 'ROOM_STATE_CHANGED': {
                const newState = event.roomState || event.payload?.roomState;
                if (newState) {
                    setRoom((prev) => ({ ...prev, roomState: newState }));
                }
                break;
            }
            case 'MATCH_STATE_DIFF': {
                setRoom((prev) => {
                    if (!prev || !prev.matchState || !event.payload?.diff) {
                        return prev;
                    }

                    const updatedMatchState = applyDiffToState(prev.matchState, event.payload.diff);
                    return { ...prev, matchState: updatedMatchState };
                });
                break;
            }
            case 'PLAYER_JOINED': {
                const { user: joinedUser, username, joined } = event.payload || event;
                if (!username) break;

                // Определяем наш username из токена для диагностики
                let tokenUsername = null;
                try {
                    const token = localStorage.getItem('srUserToken');
                    if (token) {
                        const base64Url = token.split('.')[1];
                        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                        const payload = JSON.parse(jsonPayload);
                        tokenUsername = payload?.username || payload?.user?.username || payload?.name || payload?.sub || null;
                    }
                } catch { /* noop */ }

                console.log('[PLAYER_JOINED] for username=', username, 'isOurUser=', tokenUsername === username, { joined, hasJoinedUser: Boolean(joinedUser) });
                setRoom((prev) => {
                    if (!prev) return prev;
                    let participants = prev.participants || [];
                    if (joined) {
                        if (!participants.find((p) => p.username === username)) {
                            participants = [...participants, { username }];
                        }
                    } else {
                        participants = participants.filter((p) => p.username !== username);
                    }
                    return { ...prev, participants };
                });
                // Обновляем текущего пользователя только если событие относится к нам
                if (joinedUser) {
                    if (tokenUsername && joinedUser.username === tokenUsername) {
                        console.log('[PLAYER_JOINED] Updating current user from self event:', joinedUser.username);
                        setUser(joinedUser);
                    } else {
                        console.log('[PLAYER_JOINED] Skip updating current user. Event user=', joinedUser.username, 'token user=', tokenUsername);
                    }
                }
                break;
            }
            case 'CHARACTER_PICK_REJECTED': {
                const reason = event.reason || 'Персонаж уже выбран соперником';
                setError(reason);
                setTimeout(() => setError(''), 3000);
                break;
            }
            case 'MAP_SELECTED': {
                const { username, selectedMap } = event.payload || event;
                if (username && selectedMap) {
                    setRoom((prev) => {
                        if (!prev) return prev;
                        const mapSelections = { ...(prev.mapSelections || {}) };
                        mapSelections[username] = selectedMap;
                        return { ...prev, mapSelections };
                    });
                }
                break;
            }
            case 'MAP_SELECTION_RESULT': {
                const result = event;
                setMapSelectionResult(result);
                const map = maps.find(m => m.name === result.mapName);
                if (map) {
                    setSelectedMap(map);
                }
                if (result.selectionType === 'random') {
                    setShowFortuneWheel(true);
                }
                break;
            }
            case 'MAP_CONFIRMED': {
                break;
            }
            case 'TEAM_ASSIGNMENT_RESULT': {
                const result = event.payload || event;
                setTeamAssignmentResult(result);

                if (user?.username) {
                    if (result.red === user.username) setMyTeam('red');
                    else if (result.blue === user.username) setMyTeam('blue');
                }

                if (result.type === 'random') {
                    setShowTeamWheel(true);
                }

                break;
            }
            case 'CHARACTER_POSITIONED': {
                break;
            }
            case 'POSITIONING_CONFIRMED': {
                break;
            }
            case 'PLAYER_LEFT': {
                const { username } = event.payload || event;
                if (!username) break;
                setRoom((prev) => {
                    if (!prev) return prev;
                    const participants = (prev.participants || []).filter(p => p.username !== username);
                    return { ...prev, participants };
                });
                break;
            }
            case 'ROOM_DISBANDED': {
                alert('Комната была расформирована администратором');
                navigate('/');
                break;
            }
            default:
                break;
        }
    };

    const { emit: emitRoomEvent } = useRoomSocket(roomCode, handleRoomEvent);

    const startSettingUpGame = () => {
        emitRoomEvent('START_SETTING_UP_GAME');
    }

    const handleDraftFinished = () => {
    };

    const handleFortuneWheelComplete = () => {
        setShowFortuneWheel(false);
    };

    const handleTeamWheelComplete = () => {
        setShowTeamWheel(false);
    };

    useEffect(() => {
        if (user?.username && room?.teamAssignments) {
            if (room.teamAssignments.red === user.username) setMyTeam('red');
            else if (room.teamAssignments.blue === user.username) setMyTeam('blue');
        }
    }, [room?.teamAssignments, user?.username]);

    if (loading) {
        return (
            <div className="new-game-container">
                <p>Загрузка комнаты...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`new-game-container`}>
                <div className="error-message">
                    <p>{error}</p>
                    <button className="back-button" onClick={() => navigate('/')}>На главную</button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={`${room?.roomState === 'inProcess' ? 'scroll-lock' : ''}`}>
                {room?.roomState === 'inProcess' && (
                    <div className="game-layout" style={{ display: 'flex' }}>
                        <ChatConsole
                            socket={socketRef.current}
                            user={user}
                            room={room}
                            teams={room?.matchState?.teams || []}
                            selectedMap={maps.find(m => m.name === room?.matchState?.selectedMap)}
                            matchState={room?.matchState}
                            teamTurn={room?.matchState?.teamTurn}
                            firstTeamToAct={room?.matchState?.firstTeamToAct}
                            messages={room?.gameMessages || []}
                            roomCode={room?.roomCode}
                        />
                    </div>
                )}
            </div>
            <div className={`new-game-container room-background ${room?.roomState === 'characterPositioning' ? 'positioning-background' : ''} ${room?.roomState === 'open' ? 'light' : ''}`}>
                {showPrivateChat && chatWith && <PrivateChat
                    chat={chat}
                    friendId={chatWith._id}
                    friendUsername={chatWith.username}
                    friendAvatar={chatWith.avatar}
                    onClose={closeChatWith}
                    currentUserId={user?._id || user?.id} />}

                {room?.roomState !== 'inProcess' && (
                    <div className="top-bar">
                        <button className="back-button" onClick={() => navigate('/')}>
                            <ArrowLeft size={24} />
                        </button>
                        {/* Кнопка покинуть комнату */}
                        <button className="back-button" onClick={() => setShowLeaveConfirm(true)}>
                            <LogOut size={24} />
                        </button>
                        {room?.roomCode && (
                            <div className="room-code" onClick={copyRoomCode}>
                                <span>Код комнаты: {room.roomCode}</span>
                                <Copy size={20} className="copy-icon" />
                            </div>
                        )}
                        {myTeam && (
                            <div className="room-team-info">
                                Ваша база: {myTeam === 'red' ? 'красная (левая сторона)' : 'синяя (правая сторона)'}
                            </div>
                        )}
                        <div className="room-timer">
                            Время создания: {getTimeFromCreation()}
                        </div>
                    </div>
                )}
                {error && <div className="error-message">{error}</div>}

                {room?.roomState === 'open' && (
                    <div className="players-container">
                        {/* Левая сторона - создатель */}
                        <div className="player-slot creator">
                            <div className="player-avatar">
                                <img src={room?.participants?.find(p => p.role === 'admin')?.avatar || user?.avatar} alt="Аватар" />
                            </div>
                            <div className="player-info">
                                <h3>{room?.participants?.find(p => p.role === 'admin' && p.username === user?.username) ? 'Создатель' : 'Второй игрок'}</h3>
                                <p>{room?.participants?.find(p => p.username === user?.username)?.username}</p>
                            </div>
                        </div>

                        {/* Правая сторона - второй игрок или кнопка добавления */}
                        {(room?.participants?.length > 1 && !showSearch) ? (
                            <div className="player-slot second">
                                <div className="player-avatar">
                                    <img src={secondPlayer?.avatar || 'https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/images/logo.png'} alt="Аватар" />
                                </div>
                                <div className="player-info">
                                    <h3>{room?.participants?.find(p => p.role === 'admin' && p.username === secondPlayer?.username) ? 'Создатель' : 'Второй игрок'}</h3>
                                    <div className="player-name">
                                        <p>{secondPlayer?.username || 'Загрузка...'}</p>
                                        {secondPlayer && !secondPlayerLoading && (
                                            <button className="menu-button" onClick={() => openChatWith(secondPlayer)}>
                                                <MessageSquare size={24} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : !showSearch ? (
                            <div className="player-slot second">
                                <div className="player-info invite-player">
                                    <h3>Пригласите второго игрока</h3>
                                    <button className="menu-button" onClick={() => setShowSearch(true)}>
                                        <Plus size={24} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="player-slot second">
                                <h3>Поиск игрока</h3>
                                <div className="search-container filter-row">
                                    <select onChange={(e) => setSelectedFilter(e.target.value)}>
                                        <option value="all">Все</option>
                                        <option value="following">Подписки</option>
                                        <option value="followers">Подписчики</option>
                                        <option value="friends">Друзья</option>
                                    </select>
                                    <input type="text" placeholder="Поиск игрока" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                    <button className="menu-button" onClick={() => performSearch(searchQuery)}>
                                        Поиск
                                    </button>
                                </div>
                                <div className="results-list">
                                    {searchResults.map((result) => (
                                        <div key={result._id} className="result-item">
                                            <div className="result-user">
                                                <img src={result.avatar} alt="Аватар" />
                                                <p>{result.username}</p>
                                            </div>
                                            <div className="result-buttons">
                                                <button className="invite-button" onClick={() => inviteUser(result.username)}>
                                                    <Plus size={24} className="invite-icon" />
                                                    <p>Пригласить</p>
                                                </button>
                                                <button className="chat-button" onClick={() => openChatWith(result)}>
                                                    <MessageSquare size={24} className="chat-icon" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                {room?.roomState === 'characterSelect' && (
                    <CharacterDraft
                        room={room}
                        user={user}
                        emitRoomEvent={emitRoomEvent}
                        onDraftFinished={handleDraftFinished}
                        onShowInfo={() => setShowCharacterInfo(!showCharacterInfo)}
                        showCharacterInfo={showCharacterInfo}
                    />
                )}

                {room?.roomState === 'mapSelect' && (
                    <WorldMapSelection
                        room={room}
                        user={user}
                        emitRoomEvent={emitRoomEvent}
                    />
                )}

                {room?.roomState === 'mapConfirm' && (
                    <MapConfirmation
                        selectedMap={selectedMap || (room?.selectedMap ? maps.find(m => m.name === room.selectedMap) : null)}
                        user={user}
                        room={room}
                        emitRoomEvent={emitRoomEvent}
                    />
                )}

                {room?.roomState === 'characterPositioning' && (
                    <CharacterPositioning
                        teams={room?.matchState?.teams || []}
                        selectedMap={selectedMap || (room?.selectedMap ? maps.find(m => m.name === room.selectedMap) : null)}
                        room={room}
                        user={user}
                        emitRoomEvent={emitRoomEvent}
                    />
                )}

                {/* Колесо фортуны для рандомного выбора карты */}
                {showFortuneWheel && mapSelectionResult && (
                    <FortuneWheel
                        map1={maps.find(m => m.name === mapSelectionResult.selectedMaps?.[Object.keys(mapSelectionResult.selectedMaps)[0]]) ||
                            maps.find(m => m.name === Object.values(room?.mapSelections || {})[0])}
                        map2={maps.find(m => m.name === mapSelectionResult.selectedMaps?.[Object.keys(mapSelectionResult.selectedMaps)[1]]) ||
                            maps.find(m => m.name === Object.values(room?.mapSelections || {})[1])}
                        winnerMap={selectedMap?.name || mapSelectionResult.mapName}
                        onAnimationComplete={handleFortuneWheelComplete}
                    />
                )}

                {/* Колесо фортуны для назначения сторон */}
                {showTeamWheel && teamAssignmentResult && (
                    <TeamFortuneWheel
                        redPlayer={teamAssignmentResult.red}
                        bluePlayer={teamAssignmentResult.blue}
                        winnerTeam={myTeam ? myTeam : (teamAssignmentResult.red === user?.username ? 'red' : 'blue')}
                        onAnimationComplete={handleTeamWheelComplete}
                    />
                )}

                {/* Дополнительная информация о комнате */}
                {room?.viewers?.length > 0 && (
                    <div className="room-info">
                        <h3>Зрители комнаты ({room?.viewers?.length || 0}):</h3>
                        <div className="participants-list">
                            {room?.viewers?.map((viewer, idx) => (
                                <div key={idx} className="participant-item">
                                    <span className="participant-name">{viewer.username}</span>
                                    <span className="participant-role">
                                        Зритель {idx + 1}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Кнопки действий */}
                {room?.participants?.length >= 2 && room?.participants?.find(p => p.role === 'admin')?.username === user?.username && room?.roomState === 'open' && (
                    <div className="room-actions">
                        <button className="menu-button start-game-button" onClick={() => startSettingUpGame()}>
                            Начать игру
                        </button>
                    </div>
                )}

                {/* Модальное окно подтверждения выхода из комнаты */}
                {showLeaveConfirm && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <h2>Покинуть комнату?</h2>
                            <p>Вы уверены, что хотите покинуть эту комнату?</p>
                            <div className="room-actions">
                                <button className="menu-button" onClick={async () => {
                                    try {
                                        if (room?.roomCode) {
                                            await roomRoutes.leave(room.roomCode);
                                            emitRoomEvent('LEAVE_ROOM');
                                        }
                                    } catch (err) {
                                        console.error('Ошибка выхода из комнаты:', err);
                                    } finally {
                                        navigate('/');
                                    }
                                }}>
                                    Да, покинуть
                                </button>
                                <button className="menu-button" onClick={() => setShowLeaveConfirm(false)}>Отмена</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Room; 