/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { CheckCircle, Clock } from 'lucide-react';

const MapConfirmation = ({ selectedMap, user, room, emitRoomEvent }) => {
    const [myConfirmed, setMyConfirmed] = useState(false);
    const [opponentConfirmed, setOpponentConfirmed] = useState(false);
    const [timeLeft, setTimeLeft] = useState(30); // 30 секунд на подтверждение

    useEffect(() => {
        // Получаем статус подтверждения из состояния комнаты
        if (room?.mapConfirmations) {
            const myConfirmation = room.mapConfirmations[user?.username];
            const opponentConfirmation = Object.entries(room.mapConfirmations).find(
                ([username]) => username !== user?.username
            )?.[1];

            setMyConfirmed(!!myConfirmation);
            setOpponentConfirmed(!!opponentConfirmation);
        }
    }, [room, user]);

    useEffect(() => {
        // Таймер для автоматического подтверждения
        if (timeLeft > 0 && !myConfirmed) {
            const timer = setTimeout(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !myConfirmed) {
            // Автоматическое подтверждение по истечении времени
            handleConfirm();
        }
    }, [timeLeft, myConfirmed]);

    const handleConfirm = () => {
        if (!myConfirmed) {
            emitRoomEvent('MAP_CONFIRMED', { confirmed: true });
            setMyConfirmed(true);
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Если карта не передана, показываем состояние загрузки
    if (!selectedMap) {
        return (
            <div className="map-confirmation-container">
                <div className="map-confirmation-header">
                    <h2>Загрузка карты...</h2>
                    <p>Ожидание данных о выбранной карте</p>
                </div>
            </div>
        );
    }

    return (
        <div className="map-confirmation-container">
            <div className="map-confirmation-header">
                <h2>Выбранная карта</h2>
                <p>Карта для сражения была определена. Подтвердите свою готовность к бою!</p>
            </div>

            <div className="map-confirmation-content">
                <div className="selected-map-display">
                    <div className="map-image-large">
                        <img
                            src={`https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/images/${selectedMap.image}`}
                            alt={selectedMap.userName}
                        />
                    </div>

                    <div className="map-details">
                        <h3>{selectedMap.userName}</h3>
                        <div className="map-stats">
                            <div className="stat-item">
                                <span className="stat-label">Размер карты:</span>
                                <span className="stat-value">{selectedMap.size[0]}x{selectedMap.size[1]}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Крипы на карте:</span>
                                <span className="stat-value">{selectedMap.creeps ? 'Присутствуют' : 'Отсутствуют'}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Тип местности:</span>
                                <span className="stat-value">{getMapTypeFromName(selectedMap.name)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="confirmation-status">
                    <div className="players-confirmation">
                        <div className={`player-confirmation ${myConfirmed ? 'confirmed' : ''}`}>
                            <div className="player-info">
                                <h4>Вы</h4>
                                <p>{user?.username}</p>
                            </div>
                            <div className="confirmation-icon">
                                {myConfirmed ? (
                                    <CheckCircle size={32} className="confirmed-icon" />
                                ) : (
                                    <Clock size={32} className="waiting-icon" />
                                )}
                            </div>
                            <div className="confirmation-status-text">
                                {myConfirmed ? 'Подтверждено' : 'Ожидание подтверждения'}
                            </div>
                        </div>

                        <div className={`player-confirmation ${opponentConfirmed ? 'confirmed' : ''}`}>
                            <div className="player-info">
                                <h4>Соперник</h4>
                                <p>{room?.participants?.find(p => p.username !== user?.username)?.username || 'Неизвестно'}</p>
                            </div>
                            <div className="confirmation-icon">
                                {opponentConfirmed ? (
                                    <CheckCircle size={32} className="confirmed-icon" />
                                ) : (
                                    <Clock size={32} className="waiting-icon" />
                                )}
                            </div>
                            <div className="confirmation-status-text">
                                {opponentConfirmed ? 'Подтверждено' : 'Ожидание подтверждения'}
                            </div>
                        </div>
                    </div>

                    {!myConfirmed && (
                        <div className="confirmation-timer">
                            <p>Время на подтверждение: {formatTime(timeLeft)}</p>
                            <small>Если время истечет, карта будет подтверждена автоматически</small>
                        </div>
                    )}
                </div>

                <div className="confirmation-actions">
                    {!myConfirmed ? (
                        <button
                            className="confirm-button"
                            onClick={handleConfirm}
                        >
                            Подтвердить карту
                        </button>
                    ) : (
                        <div className="waiting-message">
                            <p>Ожидание подтверждения от соперника...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Вспомогательная функция для определения типа местности по названию карты
const getMapTypeFromName = (mapName) => {
    const types = {
        'pixie-fields': 'Поля',
        'forest-valley': 'Лес',
        'desert-oasis': 'Пустыня',
        'mountain-peak': 'Горы',
        'coastal-bay': 'Побережье',
        'frozen-lands': 'Ледяные земли'
    };
    return types[mapName] || 'Неизвестно';
};

export default MapConfirmation; 