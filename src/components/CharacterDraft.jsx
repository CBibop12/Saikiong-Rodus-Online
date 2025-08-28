/* eslint-disable react/prop-types */
import { useMemo, useState, useEffect } from 'react';
import { characters as allCharacters } from '../data';
import '../styles/characterInfoPanel.css';
import { X } from 'lucide-react';
import { abilities } from '../abilities.js';

// Цвета по типу как и в CharacterSelection
const typeColors = {
    Рыцарь: '#1f1f1f',
    Маг: '#214052',
    Некромант: '#312152',
    Стрелок: '#263d1c',
    Танк: '#423021',
    Меха: '#0e1929',
    Наёмник: '#4f5201',
    Иной: '#3d1111',
};

/**
 * Компонент экранного драфта персонажей.
 * Показывает всех героев, выделяет выбранных, разрешает клик для выбора/отмены и кнопку «Готово».
 * Все взаимодействия отправляются через emitRoomEvent (WebSocket комнаты).
 */
const CharacterDraft = ({ room, user, emitRoomEvent, onDraftFinished, onShowInfo, showCharacterInfo }) => {
    const username = user?.username;
    const draft = room?.characterDraft || [];
    const lockedUsers = room?.lockedUsers || [];

    // Списки ID выбранных персонажей
    const myPicks = draft.filter((d) => d.username === username).map((d) => d.characterId);
    const opponentPicks = draft.filter((d) => d.username !== username).map((d) => d.characterId);

    const isLocked = lockedUsers.includes(username);

    // Подсчитываем осталось ли слотов
    const canPickMore = myPicks.length < 5;

    // Поиск, сортировка, фильтр
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState('name');
    const [filterType, setFilterType] = useState('all');
    const [selectedCharacter, setSelectedCharacter] = useState(null);
    const types = ['Рыцарь', 'Маг', 'Стрелок', 'Танк', 'Некромант', 'Меха', 'Наёмник', 'Иной'];

    // Выбор/снятие выбора персонажа
    const onCardClick = (char) => {
        if (!username || isLocked) return;
        const charId = char.id || char.name; // Fallback, сервер должен поддержать

        if (myPicks.includes(charId)) {
            // снимаем выбор
            emitRoomEvent('CHARACTER_UNSELECTED', { characterId: charId });
        } else if (canPickMore && !opponentPicks.includes(charId)) {
            emitRoomEvent('CHARACTER_SELECTED', { characterId: charId });
        }
    };

    const onLockClick = () => {
        if (myPicks.length === 5 && !isLocked) {
            emitRoomEvent('CHARACTERS_LOCKED');
        }
    };

    // Список всех персонажей (мемоизирован один раз на весь жизненный цикл компонента)
    const characters = useMemo(() => allCharacters.map((c) => ({ ...c, id: c.id || c.name })), []);

    const charById = useMemo(() => {
        const map = {};
        characters.forEach((c) => { map[c.id] = c; });
        return map;
    }, [characters]);

    const filteredCharacters = useMemo(() => {
        return characters
            .filter((char) => {
                const matchesSearch = char.name.toLowerCase().includes(search.toLowerCase());
                const matchesType = filterType === 'all' || char.type === filterType;
                return matchesSearch && matchesType;
            })
            .sort((a, b) => {
                if (sortKey === 'name') return a.name.localeCompare(b.name);
                if (sortKey === 'type') return a.type.localeCompare(b.type);
                const valA = a.stats[sortKey] || 0;
                const valB = b.stats[sortKey] || 0;
                if (typeof valA === 'number' && typeof valB === 'number') return valB - valA;
                return String(valA).localeCompare(String(valB));
            });
    }, [characters, search, filterType, sortKey]);

    const handleCharacterInfo = (character) => {
        setSelectedCharacter(character);
        onShowInfo();
    };

    // Блокируем скролл страницы при открытом модальном окне

    const CharacterInfoModal = () => {
        if (!showCharacterInfo || !selectedCharacter) return null;

        return (
            <div className="character-info-modal-overlay">
                <div className="character-info-modal">
                    <button
                        className="close-button-modal"
                        onClick={() => {
                            onShowInfo();
                        }}
                    >
                        <X size={24} />
                    </button>
                    <div className="character-info-header">
                        <img
                            src={`https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/characters/${selectedCharacter.image}`}
                            alt={selectedCharacter.name}
                            className="character-info-image"
                            style={{
                                backgroundColor: typeColors[selectedCharacter.type] || '#444',
                            }}
                        />
                        <div className="character-info-title">
                            <h2>{selectedCharacter.name}</h2>
                            <span className="modal-type">{selectedCharacter.type}</span>
                        </div>
                    </div>
                    <div className="character-info-stats">
                        {selectedCharacter.stats && Object.entries(selectedCharacter.stats).map(([key, value]) => (
                            <div key={key} className="stat-row">
                                <span className="stat-name">{key}:</span>
                                <span className="stat-value">{value}</span>
                            </div>
                        ))}
                    </div>
                    {selectedCharacter.abilities && (
                        <div className="character-info-abilities">
                            <h3>Способности:</h3>
                            {selectedCharacter.abilities.map((ability, index) => (
                                <div key={index} className="ability">
                                    <div className="character-info-ability-image">
                                        {ability.image && (
                                            <img src={`https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/abilities/${ability.image}`} alt={abilities[ability.key].name} />
                                        )}
                                    </div>
                                    <div className="character-info-ability-info">
                                        <h4>{abilities[ability.key].name}</h4>
                                        <p>{ability.description}</p>
                                        <span className="cooldown">Перезарядка: {ability.coolDown} ходов</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Если драфт закончен – вызываем callback
    if (room?.roomState !== 'characterSelect') {
        onDraftFinished && onDraftFinished();
        return null;
    }

    return (
        <div className="character-draft-container">
            <h2>Выбор персонажей</h2>
            <p>
                Ваши выбранные: {myPicks.length}/5 {isLocked && '(выбор подтверждён)'}
            </p>

            <div className="draft-slots-container">
                {/* Мои слоты слева */}
                <div className="slots-column my-slots">
                    {[0, 1, 2, 3, 4].map((idx) => {
                        const charId = myPicks[idx];
                        const char = charById[charId];
                        return (
                            <div
                                key={`my-${idx}`}
                                className="slot"
                                onClick={() => {
                                    if (charId) emitRoomEvent('CHARACTER_UNSELECTED', { characterId: charId });
                                }}
                            >
                                {char ? <img src={`https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/characters/${char.image}`} alt={char.name} style={{
                                    backgroundColor: typeColors[char.type] || '#444',
                                }} /> : null}
                            </div>
                        );
                    })}
                </div>

                {/* Грид персонажей в центре */}
                <div className="draft-center">
                    <div className="controls">
                        <input
                            type="text"
                            className="search-bar"
                            placeholder="Поиск персонажей..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <select
                            className="dropdown"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="all">Все типы</option>
                            {types.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <select
                            className="dropdown"
                            value={sortKey}
                            onChange={(e) => setSortKey(e.target.value)}
                        >
                            <option value="name">По имени</option>
                            <option value="type">По типу</option>
                            <option value="HP">По здоровью</option>
                            <option value="Урон">По урону</option>
                            <option value="Ловкость">По скорости</option>
                            <option value="Дальность">По дальности</option>
                            <option value="Броня">По броне</option>
                            <option value="Мана">По мане</option>
                        </select>
                    </div>

                    <div className="character-grid">
                        {filteredCharacters.map((char) => {
                            const charId = char.id;
                            const pickedByMe = myPicks.includes(charId);
                            const pickedByOpp = opponentPicks.includes(charId);

                            return (
                                <div
                                    key={charId}
                                    className="character-card-draft"
                                    style={{
                                        background: pickedByMe ? 'linear-gradient(to bottom, #D4AF37,rgb(67, 52, 5))' : pickedByOpp ? 'linear-gradient(to bottom, #912323,rgb(67, 5, 5))' : 'var(--brown-gradient)',
                                        opacity: pickedByOpp && !pickedByMe ? 0.3 : 1,
                                        border: pickedByMe ? '1px solid #D4AF37' : pickedByOpp ? '1px solid #912323' : '1px solid #D4AF37',
                                        cursor: isLocked || (pickedByOpp && !pickedByMe) ? 'not-allowed' : 'pointer',
                                    }}
                                    onClick={() => onCardClick(char)}
                                >
                                    <div className="character-card-image" style={{
                                        backgroundColor: typeColors[char.type] || '#444',
                                    }}>
                                        <img
                                            src={`https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/characters/${char.image}`}
                                            alt={char.name}
                                            onError={(e) => {
                                                console.log('Ошибка загрузки изображения:', char.image);
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                    <div className="character-card-info">
                                        <h4>{char.name}</h4>
                                        <p className="character-card-type-p">{char.type}</p>
                                        <button
                                            className="info-button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCharacterInfo(char);
                                            }}
                                        >
                                            i
                                        </button>
                                    </div>
                                    <div className="character-card-stats">
                                        {char.stats && Object.entries(char.stats).slice(0, 6).map(([key, value]) => (
                                            <div key={key} className="stat">
                                                <strong>{key}: </strong> {value}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Слоты оппонента справа */}
                <div className="slots-column opp-slots">
                    {[0, 1, 2, 3, 4].map((idx) => {
                        const charId = opponentPicks[idx];
                        const char = charById[charId];
                        return (
                            <div key={`opp-${idx}`} className="slot opp-slot">
                                {char ? <img src={`https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/characters/${char.image}`} alt={char.name} style={{
                                    backgroundColor: typeColors[char.type] || '#444',
                                    transform: 'scaleX(-1)',
                                }} /> : null}
                            </div>
                        );
                    })}
                </div>
            </div>

            <button
                className="menu-button start-game-button character-draft-button"
                disabled={isLocked || myPicks.length !== 5}
                onClick={onLockClick}
            >
                Готово
            </button>
            <CharacterInfoModal />
        </div>
    );
};

export default CharacterDraft; 