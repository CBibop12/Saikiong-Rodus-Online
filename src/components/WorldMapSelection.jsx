/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { maps } from '../maps';

// Конфигурация точек на карте мира - легко настраиваемые координаты
const MAP_POINTS = [
    { id: 'pixie-fields', x: 88, y: 83, mapName: 'pixie-fields' },
    { id: 'hochgak-village', x: 31, y: 81, mapName: 'hochgak-village' },
    { id: 'ilmarin-fortress', x: 65, y: 39, mapName: 'ilmarin-fortress' },
];

const WorldMapSelection = ({ room, user, emitRoomEvent }) => {
    const [showMapPreview, setShowMapPreview] = useState(false);
    const [selectedMap, setSelectedMap] = useState(null);
    const [myMapChoice, setMyMapChoice] = useState(null);
    const [opponentMapChoice, setOpponentMapChoice] = useState(null);

    useEffect(() => {
        // Получаем выборы игроков из состояния комнаты
        if (room?.mapSelections) {
            const myChoice = room.mapSelections[user?.username];
            const opponentChoice = Object.entries(room.mapSelections).find(
                ([username]) => username !== user?.username
            )?.[1];

            setMyMapChoice(myChoice);
            setOpponentMapChoice(opponentChoice);
        }
    }, [room, user]);

    const handlePointClick = (point) => {
        const map = maps.find(m => m.name === point.mapName);
        if (map) {
            setSelectedMap(map);
            setShowMapPreview(true);
        }
    };

    const handleMapSelect = () => {
        if (selectedMap) {
            // Отправляем событие выбора карты
            console.log('selectedMap', selectedMap);
            emitRoomEvent('MAP_SELECTED', { selectedMap: selectedMap.name });
            setShowMapPreview(false);
            setSelectedMap(null);
        }
    };

    const closePreview = () => {
        setShowMapPreview(false);
        setSelectedMap(null);
    };

    return (
        <div className="world-map-container">
            <div className="world-map-header">
                <h2>Выбор карты</h2>
                <p>Выберите карту для игры, нажав на точку на карте мира</p>
            </div>

            <div className="world-map-wrapper">
                <div className="world-map-background">
                    <div className="world-map-image-container">
                        <img src="/assets/images/worldmap.jpg" alt="Карта мира" />

                        {/* Точки на карте */}
                        {MAP_POINTS.map((point) => {
                            const map = maps.find(m => m.name === point.mapName);
                            if (!map) return null;

                            return (
                                <div
                                    key={point.id}
                                    className={`map-point ${myMapChoice === point.mapName ? 'selected-by-me' : ''} ${opponentMapChoice === point.mapName ? 'selected-by-opponent' : ''}`}
                                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                                    onClick={() => handlePointClick(point)}
                                >
                                    <div className="map-point-icon"></div>
                                    <div className="map-point-label">{map.userName}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Информация о выборе игроков */}
                <div className="selection-info">
                    <div className="player-choice">
                        <h4>Ваш выбор:</h4>
                        <p>{myMapChoice ? maps.find(m => m.name === myMapChoice)?.userName : 'Не выбрано'}</p>
                    </div>
                    <div className="player-choice">
                        <h4>Выбор соперника:</h4>
                        <p>{opponentMapChoice ? maps.find(m => m.name === opponentMapChoice)?.userName : 'Не выбрано'}</p>
                    </div>
                </div>
            </div>

            {/* Модальное окно превью карты */}
            {showMapPreview && selectedMap && (
                <div className="map-preview-overlay">
                    <div className="map-preview-modal">
                        <button className="close-preview-button" onClick={closePreview}>
                            <X size={24} />
                        </button>

                        <div className="map-preview-header">
                            <h3>{selectedMap.userName}</h3>
                            <div className="map-preview-info">
                                <span>Размер: {selectedMap.size[0]}x{selectedMap.size[1]}</span>
                                <span>Крипы: {selectedMap.creeps ? 'Да' : 'Нет'}</span>
                            </div>
                        </div>

                        <div className="map-preview-image">
                            <img src={`/assets/images/${selectedMap.image}`} alt={selectedMap.userName} />
                        </div>

                        <div className="map-preview-actions">
                            <button className="select-map-button" onClick={handleMapSelect}>
                                Выбрать эту карту
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorldMapSelection; 