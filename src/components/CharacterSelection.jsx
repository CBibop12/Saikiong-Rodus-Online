// CharacterDistribution.jsx
import React, { useState, useEffect } from "react";
import { shuffle } from "lodash"; // Если предпочитаете, можно импортировать всю библиотеку: import _ from 'lodash';
import { characters } from "../data"; // Предполагается, что ваши персонажи экспортируются из файла src/data.js
import { ChevronRight, X } from 'lucide-react';
import { abilities } from "../abilities.js"; // Предполагается, что ваши способности экспортируются из файла src/data.js
import "../styles/game.css";

// Задаем цвета для типов персонажей
const typeColors = {
  Рыцарь: "#1f1f1f",
  Маг: "#214052",
  Некромант: "#312152",
  Стрелок: "#263d1c",
  Танк: "#423021",
  Меха: "#0e1929",
  Наёмник: "#4f5201",
  Иной: "#3d1111",
};

const CharacterDistribution = ({ onDistributionComplete }) => {
  // Состояния для распределения персонажей по командам
  const [team1Characters, setTeam1Characters] = useState([]);
  const [team2Characters, setTeam2Characters] = useState([]);
  const [availableCharacters, setAvailableCharacters] = useState([]);
  const [stage, setStage] = useState("initial"); // Возможные значения: 'initial', 'discard', 'manual', 'final'
  const [selectedForDiscard, setSelectedForDiscard] = useState([]);
  const [currentTeam, setCurrentTeam] = useState(1);

  // Состояния для поиска и фильтрации
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [filterType, setFilterType] = useState("all");

  const types = [
    "Рыцарь",
    "Маг",
    "Стрелок",
    "Танк",
    "Некромант",
    "Меха",
    "Наёмник",
    "Иной",
  ];

  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [showCharacterInfo, setShowCharacterInfo] = useState(false);

  // При открытии модального окна сбрасываем все состояния
  useEffect(() => {
    setAvailableCharacters(shuffle([...characters]));
    setStage("initial");
    setTeam1Characters([]);
    setTeam2Characters([]);
    setSelectedForDiscard([]);
    setCurrentTeam(1);
    setSearch("");
    setSortKey("name");
    setFilterType("all");
  }, []);

  // Фильтрация и сортировка доступных персонажей
  const filteredAvailableCharacters = availableCharacters
    .filter((char) => {
      const matchesSearch = char.name.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === "all" || char.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name);
      if (sortKey === "type") return a.type.localeCompare(b.type);

      const valueA = a.stats[sortKey] || 0;
      const valueB = b.stats[sortKey] || 0;

      // Если значения числовые, сортируем по убыванию
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return valueB - valueA;
      }

      // Если значения строковые, сортируем по алфавиту
      return String(valueA).localeCompare(String(valueB));
    });

  // Функция получения случайных персонажей из доступного пула
  const getRandomCharacters = (count) => {
    const selected = availableCharacters.slice(0, count);
    setAvailableCharacters((prev) => prev.slice(count));
    return selected;
  };

  // Обработка начального распределения: либо ручной выбор, либо случайный подбор
  const handleInitialDistribution = (mode) => {
    if (mode === "manual") {
      setStage("manual");
    } else {
      const initialChars = getRandomCharacters(5);
      if (currentTeam === 1) {
        setTeam1Characters(initialChars);
      } else {
        setTeam2Characters(initialChars);
      }
      setStage("discard");
    }
  };

  // Ручной выбор персонажа из списка доступных
  const handleManualSelection = (character) => {
    const currentTeamCharacters =
      currentTeam === 1 ? team1Characters : team2Characters;
    if (currentTeamCharacters.length < 5) {
      if (currentTeam === 1) {
        setTeam1Characters((prev) => [...prev, character]);
      } else {
        setTeam2Characters((prev) => [...prev, character]);
      }
      setAvailableCharacters((prev) =>
        prev.filter((char) => char.name !== character.name)
      );
    }

    // Если после выбора в команде получилось 5 персонажей, переходим к следующей команде или завершаем выбор
    if (currentTeamCharacters.length + 1 === 5) {
      if (currentTeam === 1) {
        setCurrentTeam(2);
        setStage("initial");
      } else {
        setStage("final");
      }
    }
  };

  // Обработка выбора персонажа для замены (на этапе discard)
  const handleCharacterDiscard = (index) => {
    if (selectedForDiscard.includes(index)) {
      setSelectedForDiscard((prev) => prev.filter((i) => i !== index));
    } else if (selectedForDiscard.length < 5) {
      setSelectedForDiscard((prev) => [...prev, index]);
    }
  };

  // Подтверждение замены выбранных персонажей
  const confirmDiscard = () => {
    if (selectedForDiscard.length === 0) {
      if (currentTeam === 1) {
        setCurrentTeam(2);
        setStage("initial");
      } else {
        setStage("final");
      }
      return;
    }

    const currentTeamCharacters =
      currentTeam === 1 ? team1Characters : team2Characters;
    const newCharacters = currentTeamCharacters.filter(
      (_, index) => !selectedForDiscard.includes(index)
    );
    const replacements = getRandomCharacters(selectedForDiscard.length);

    if (currentTeam === 1) {
      setTeam1Characters([...newCharacters, ...replacements]);
      setCurrentTeam(2);
      setStage("initial");
    } else {
      setTeam2Characters([...newCharacters, ...replacements]);
      setStage("final");
    }
    setSelectedForDiscard([]);
  };

  const handleCharacterInfo = (character) => {
    setSelectedCharacter(character);
    setShowCharacterInfo(true);
  };

  const CharacterInfoModal = () => {
    if (!showCharacterInfo || !selectedCharacter) return null;

    return (
      <div className="character-info-modal-overlay">
        <div className="character-info-modal">
          <button
            className="close-button-modal"
            onClick={() => setShowCharacterInfo(false)}
          >
            <X size={24} />
          </button>
          <div className="character-info-header">
            <img
              src={`/src/assets/characters/${selectedCharacter.image}`}
              alt={selectedCharacter.name}
              className="character-info-image"
              style={{
                backgroundColor: typeColors[selectedCharacter.type] || "#444",
              }}
            />
            <div className="character-info-title">
              <h2>{selectedCharacter.name}</h2>
              <span className="character-type modal-type">{selectedCharacter.type}</span>
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
                    {
                      ability.image && (
                        <img src={`/src/assets/abilities/${ability.image}`} alt={abilities[ability.key].name} />
                      )
                    }
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

  const renderCharacterCard = (char) => (
    <div
      key={char.name}
      className="character-card"
      style={{
        backgroundColor: typeColors[char.type] || "#444",
      }}
      onClick={() => {
        if (stage === "manual") {
          handleManualSelection(char);
        }
      }}
    >
      <div className="character-card-image">
        <img
          src={`/src/assets/characters/${char.image}`}
          alt={char.name}
        />
      </div>
      <div className="character-card-info">
        <h3>{char.name}</h3>
        <p>Тип: {char.type}</p>
        <div className="character-card-stats">
          {char.stats && Object.entries(char.stats).map(([key, value]) => (
            <div key={key} className="stat">
              <strong>{key}:</strong> {value}
            </div>
          ))}
        </div>
        <button
          className="info-button"
          onClick={(e) => {
            e.stopPropagation();
            handleCharacterInfo(char);
          }}
        >
          Подробнее
        </button>
      </div>
    </div>
  );

  const renderCharacterPreview = (char) => (
    <div className="character-card"
      style={{
        backgroundColor: typeColors[char.type] || "#444",
      }}>
      <div className="character-card-image">
        <img src={`/src/assets/characters/${char.image}`} alt={char.name} />
      </div>
      <div className="character-card-info">
        <h3>{char.name}</h3>
        <p>Тип: {char.type}</p>
      </div>
    </div>
  );

  return (
    <div className={`modal-overlay active`}>
      <div className="character-distribution-modal">
        <h2 className="modal-title">
          {stage === "initial"
            ? "Выбор персонажей"
            : stage === "discard"
              ? "Выберите персонажей для замены (0-5)"
              : stage === "manual"
                ? `Выбор персонажей для ${currentTeam === 1 ? "первой" : "второй"
                } команды`
                : "Финальный состав"}
        </h2>

        {stage === "initial" && (
          <div className="distribution-buttons">
            <button
              className="distribution-button manual"
              onClick={() => handleInitialDistribution("manual")}
            >
              <div className="button-content">
                <div className="button-icon">👤</div>
                <div className="button-text">
                  <span className="button-title">Ручной подбор</span>
                  <span className="button-description">Выберите персонажей самостоятельно</span>
                </div>
              </div>
            </button>
            <button
              className="distribution-button random"
              onClick={() => handleInitialDistribution("random")}
            >
              <div className="button-content">
                <div className="button-icon">🎲</div>
                <div className="button-text">
                  <span className="button-title">Случайный подбор</span>
                  <span className="button-description">Система выберет персонажей за вас</span>
                </div>
              </div>
            </button>
            <div className="current-team-indicator">
              Выбор персонажей для {currentTeam === 1 ? "первой" : "второй"} команды
            </div>
          </div>
        )}

        {stage === "discard" && (
          <>
            <div className="discard-characters-grid">
              {(currentTeam === 1 ? team1Characters : team2Characters).map((char, index) => (
                <div
                  key={index}
                  className={`discard-character-card ${selectedForDiscard.includes(index) ? 'selected' : ''}`}
                  onClick={() => handleCharacterDiscard(index)}
                >
                  {renderCharacterCard(char)}
                </div>
              ))}
            </div>
            <div className="discard-controls">
              <button className="neon-button" onClick={confirmDiscard}>
                {selectedForDiscard.length > 0
                  ? `Заменить выбранных (${selectedForDiscard.length})`
                  : "Продолжить без замены"}
              </button>
            </div>
          </>
        )}

        {stage === "manual" && (
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
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              className="dropdown"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
            >
              <option value="name">По имени</option>
              <option value="HP">По здоровью</option>
              <option value="Урон">По урону</option>
              <option value="Ловкость">По скорости</option>
              <option value="Дальность">По дальности</option>
              <option value="Броня">По броне</option>
              <option value="Мана">По мане</option>
            </select>
          </div>
        )}

        {stage === "manual" && (
          <div className="manual-selection">
            <div className="teams-display">
              <div className="team">
                <h3>Команда 1</h3>
                <div className="character-grid">
                  {team1Characters.map(renderCharacterPreview)}
                </div>
              </div>
              {team2Characters.length > 0 && (
                <div className="team">
                  <h3>Команда 2</h3>
                  <div className="character-grid">
                    {team2Characters.map(renderCharacterPreview)}
                  </div>
                </div>
              )}
            </div>
            <div className="available-characters-section">
              <h3>Доступные персонажи</h3>
              <div className="character-grid">
                {filteredAvailableCharacters.map(renderCharacterCard)}
              </div>
            </div>
          </div>
        )}
        {stage === "final" && (
          <div className="final-distribution">
            <div className="teams-final">
              <div className="team">
                <h3>Команда 1</h3>
                <div className="character-grid">
                  {team1Characters.map(renderCharacterCard)}
                </div>
              </div>
              <div className="team">
                <h3>Команда 2</h3>
                <div className="character-grid">
                  {team2Characters.map(renderCharacterCard)}
                </div>
              </div>
            </div>
            <button
              className="neon-button confirm"
              onClick={() => {
                // Передаём итоговое распределение родительскому компоненту
                onDistributionComplete({
                  team1: team1Characters,
                  team2: team2Characters,
                });
              }}
            >
              Подтвердить выбор
            </button>
          </div>
        )}
      </div>
      <CharacterInfoModal />
    </div>
  );
};

export default CharacterDistribution;
