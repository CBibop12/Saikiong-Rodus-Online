/* eslint-disable react/prop-types */
import { useState, useEffect, useMemo } from 'react';
import { Map as MapIcon } from 'lucide-react';
import "../styles/mapSelection.css";
import { cellHasType, stringFromCoord } from './scripts/tools/mapStore';
import { characters } from '../data';

const CharacterPositioning = ({ teams, selectedMap, room, user, emitRoomEvent }) => {
  // Состояния для выпадающего меню
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [showDropdown, setShowDropdown] = useState(false);
  const [availableCharacters, setAvailableCharacters] = useState([]);
  const [selectedCellCoords, setSelectedCellCoords] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  // Состояния для команд
  const [myTeam, setMyTeam] = useState(null);

  // Функция для получения полной информации о персонаже по имени
  const getCharacterByName = (name) => {
    return characters.find(char => char.name === name);
  };

  // Основные состояния компонента
  const [localTeams, setLocalTeams] = useState(() => ({
    red: (teams?.find(t => t.side === 'red')?.characters || []).map(characterName => {
      const fullCharacter = getCharacterByName(characterName);
      return fullCharacter ? { ...fullCharacter, team: 'red', position: null } : null;
    }).filter(Boolean),
    blue: (teams?.find(t => t.side === 'blue')?.characters || []).map(characterName => {
      const fullCharacter = getCharacterByName(characterName);
      return fullCharacter ? { ...fullCharacter, team: 'blue', position: null } : null;
    }).filter(Boolean)
  }));
  const [selectedForPosition, setSelectedForPosition] = useState(null);

  // ────────────────────────────────────────────────
  // Предварительно рассчитываем все допустимые клетки для размещения
  // ────────────────────────────────────────────────
  const allowedCells = useMemo(() => {
    if (!selectedMap || !myTeam) return new Set();

    const set = new Set();

    const isMySide = (col) => {
      const colNumber = col + 1;
      return myTeam === 'red' ? colNumber <= 20 : colNumber > 20;
    };

    for (let row = 0; row < selectedMap.size[1]; row++) {
      for (let col = 0; col < selectedMap.size[0]; col++) {
        if (!isMySide(col)) continue; // не моя половина

        // нельзя ставить прямо на базу
        if (cellHasType([`${myTeam} base`], [col, row], selectedMap)) continue;

        // нужно быть соседним к базе
        const dirs = [
          [-1, -1], [-1, 0], [-1, 1],
          [0, -1], [0, 1],
          [1, -1], [1, 0], [1, 1],
        ];
        let adjacent = false;
        for (const [dx, dy] of dirs) {
          const nx = col + dx;
          const ny = row + dy;
          if (nx < 0 || ny < 0 || nx >= selectedMap.size[0] || ny >= selectedMap.size[1]) continue;
          if (cellHasType([`${myTeam} base`], [nx, ny], selectedMap)) {
            adjacent = true;
            break;
          }
        }
        if (!adjacent) continue;

        set.add(`${col + 1}-${row + 1}`); // координаты в формате 1-based "col-row"
      }
    }

    console.log('[allowedCells] calculated', set.size);
    return set;
  }, [selectedMap, myTeam]);

  // Обновляем команды при получении назначений
  useEffect(() => {
    if (room?.teamAssignments) {
      if (room.teamAssignments.red === user?.username) {
        setMyTeam('red');
      } else if (room.teamAssignments.blue === user?.username) {
        setMyTeam('blue');
      }
    }
  }, [room?.teamAssignments, user?.username]);

  // Обновляем локальные команды при изменении teams
  useEffect(() => {
    if (teams && Array.isArray(teams)) {
      setLocalTeams({
        red: (teams.find(t => t.side === 'red')?.characters || []).map(characterName => {
          const fullCharacter = getCharacterByName(characterName);
          return fullCharacter ? { ...fullCharacter, team: 'red', position: null } : null;
        }).filter(Boolean),
        blue: (teams.find(t => t.side === 'blue')?.characters || []).map(characterName => {
          const fullCharacter = getCharacterByName(characterName);
          return fullCharacter ? { ...fullCharacter, team: 'blue', position: null } : null;
        }).filter(Boolean)
      });
    }
  }, [teams]);

  // Обновляем локальные команды при изменении room.characterPositions
  useEffect(() => {
    if (room?.characterPositions) {
      setLocalTeams(prev => {
        const newTeams = { ...prev };

        // Обновляем позиции персонажей из состояния комнаты
        // characterPositions теперь имеет структуру: { username: [{ name, position }] }
        Object.values(room.characterPositions).forEach((charactersArray) => {
          if (Array.isArray(charactersArray)) {
            charactersArray.forEach(({ name: characterName, position }) => {
              // Ищем персонажа в командах и обновляем его позицию
              ['red', 'blue'].forEach(teamKey => {
                const characterIndex = newTeams[teamKey].findIndex(ch => ch.name === characterName);
                if (characterIndex !== -1) {
                  newTeams[teamKey][characterIndex] = {
                    ...newTeams[teamKey][characterIndex],
                    position: position
                  };
                }
              });
            });
          }
        });

        return newTeams;
      });
    }
  }, [room?.characterPositions]);

  // Проверяем, может ли игрок размещать персонажей на данной стороне карты
  const canPlaceOnSide = (colIndex) => {
    // Если сторона ещё не определена – считаем, что можно кликать (для визуального предварительного просмотра)
    if (!myTeam) return true;

    const colNumber = colIndex + 1;
    const isLeftSide = colNumber <= 20;

    // Команда 1 (красная) может размещать только на левой стороне (колонки 1-20)
    // Команда 2 (синяя) может размещать только на правой стороне (колонки 21-40)
    if (myTeam === 'red' && !isLeftSide) return false;
    if (myTeam === 'blue' && isLeftSide) return false;

    return true;
  };

  // Выбор персонажа из списка команд
  const handleCharacterSelect = (character, team) => {
    setSelectedForPosition({ character, team });
  };

  const handleCellClickAllowance = (cellCoord) => {
    console.log('[allowance] check for', cellCoord);

    if (selectedForPosition) return true;

    // если нет моей стороны ещё → не разрешаем (чтобы не ставили раньше времени)
    if (!myTeam) return false;

    // на чужой стороне? already excluded by allowedCells set

    if (!allowedCells.has(cellCoord)) {
      console.log('[allowance] cell not in allowed set');
      return false;
    }

    // занято?
    const occupied = localTeams.red.some(ch => ch.position === cellCoord) || localTeams.blue.some(ch => ch.position === cellCoord);
    if (occupied) {
      console.log('[allowance] cell occupied');
      return false;
    }

    return true;
  };

  // Обработчик клика по клетке
  const handleCellClick = (rowIndex, colIndex, event) => {
    console.log('[click] cell', rowIndex, colIndex);
    if (selectedForPosition) {
      console.log('[click] placing character', selectedForPosition.character?.name);
      // Если персонаж уже выбран из списка команд
      const coordinates = `${colIndex + 1}-${rowIndex + 1}`;
      const teamKey = selectedForPosition.team;
      const updatedTeam = localTeams[teamKey].map(ch => {
        if (ch.name === selectedForPosition.character.name) {
          return { ...ch, position: coordinates };
        }
        return ch;
      });
      setLocalTeams(prev => ({ ...prev, [teamKey]: updatedTeam }));

      // Отправляем событие размещения персонажа
      emitRoomEvent('CHARACTER_POSITIONED', {
        characterName: selectedForPosition.character.name,
        position: coordinates
      });

      setSelectedForPosition(null);
    } else {
      // Открываем выпадающее меню с персонажами
      if (!handleCellClickAllowance(`${colIndex + 1}-${rowIndex + 1}`)) {
        console.log('[click] allowance denied');
        return;
      }
      console.log('[click] allowance granted');
      const colNumber = colIndex + 1;
      const isLeftSide = colNumber <= 20;

      // Проверяем, что игрок может размещать персонажей на этой стороне
      if (!canPlaceOnSide(colIndex)) {
        console.log('[click] side check failed');
        return;
      }

      // Показываем только персонажей из команды игрока
      const myTeamKey = myTeam || (isLeftSide ? 'red' : 'blue');
      console.log('[click] myTeamKey', myTeamKey);
      console.log('[click] myTeam', localTeams[myTeamKey]);
      const unpositionedCharacters = localTeams[myTeamKey].filter(ch => !ch.position);

      console.log('[click] unpositioned', unpositionedCharacters.length);
      if (unpositionedCharacters.length > 0) {
        setDropdownPosition({
          x: event.clientX,
          y: event.clientY
        });
        setSelectedCellCoords({ row: rowIndex, col: colIndex });
        setAvailableCharacters(unpositionedCharacters.map(char => ({
          ...char,
          team: myTeamKey
        })));
        setShowDropdown(true);
        console.log('[click] dropdown opened');
      }
    }
  };

  // Обработчик выбора персонажа из выпадающего меню
  const handleDropdownSelect = (character, team) => {
    if (!selectedCellCoords) return;

    const coordinates = `${selectedCellCoords.col + 1}-${selectedCellCoords.row + 1}`;
    const teamKey = team;

    const updatedTeam = localTeams[teamKey].map(ch => {
      if (ch.name === character.name) {
        return { ...ch, position: coordinates };
      }
      return ch;
    });

    setLocalTeams(prev => ({ ...prev, [teamKey]: updatedTeam }));

    // Отправляем событие размещения персонажа
    emitRoomEvent('CHARACTER_POSITIONED', {
      characterName: character.name,
      position: coordinates
    });

    setShowDropdown(false);
    setSelectedCellCoords(null);
  };

  // Обработчик подтверждения позиций
  const handleConfirmPositions = () => {
    // Проверяем, что все персонажи размещены
    const allPositioned = localTeams.red.every(ch => ch.position) &&
      localTeams.blue.every(ch => ch.position);

    if (allPositioned) {
      emitRoomEvent('POSITIONING_CONFIRMED');
    }
  };

  // Компонент выпадающего списка
  const CharacterDropdown = () => {
    if (!showDropdown || availableCharacters.length === 0) return null;

    return (
      <div
        className="character-dropdown"
        style={{
          position: 'fixed',
          left: dropdownPosition.x,
          top: dropdownPosition.y,
          transform: 'translate(-50%, 20px)'
        }}
      >
        {availableCharacters.map((char, index) => (
          <div
            key={index}
            className="dropdown-item"
            onClick={() => handleDropdownSelect(char, char.team)}
          >
            <span className="char-name">{char.name}</span>
            <span className="char-type">{char.type}</span>
          </div>
        ))}
      </div>
    );
  };

  // Закрытие дропдауна при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.character-dropdown')) {
        setShowDropdown(false);
        setSelectedCellCoords(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  // Стили для ячеек карты
  const getCellClassName = (cell) => {
    const baseClass = 'grid-cell';
    switch (cell.initial) {
      case 'empty': return `${baseClass} empty`;
      case 'wall': return `${baseClass} wall`;
      case 'red base': return `${baseClass} red-base`;
      case 'blue base': return `${baseClass} blue-base`;
      case 'magic shop': return `${baseClass} magic-shop`;
      case 'armory': return `${baseClass} armory`;
      case 'laboratory': return `${baseClass} laboratory`;
      case 'bush': return `${baseClass} bush`;
      case 'healing zone': return `${baseClass} healing-zone`;
      case 'red portal': return `${baseClass} red-portal-cover`;
      case 'blue portal': return `${baseClass} blue-portal-cover`;
      case 'red church': return `${baseClass} red-church-cover`;
      case 'blue church': return `${baseClass} blue-church-cover`;
      case 'redChurch powerpoint': return `${baseClass} red-church-powerpoint`;
      case 'blueChurch powerpoint': return `${baseClass} blue-church-powerpoint`;
      case 'mob spawnpoint': return `${baseClass} mob-spawnpoint`;
      default: return baseClass;
    }
  };

  // Рендер отдельной ячейки
  const renderCell = (cell, rowIndex, colIndex) => {
    const cellCoord = stringFromCoord([colIndex, rowIndex]);
    const character = localTeams.red.find(ch => ch.position === cellCoord) || localTeams.blue.find(ch => ch.position === cellCoord);

    // Функция для определения части большого здания
    const getBuildingPart = (buildingType) => {
      // Ищем первую клетку этого типа здания
      if (selectedMap.map[rowIndex - 1]?.[colIndex - 1]?.initial === buildingType) return 4; // Верхний левый угол
      if (selectedMap.map[rowIndex - 1]?.[colIndex + 1]?.initial === buildingType) return 3; // Верхний правый угол
      if (selectedMap.map[rowIndex + 1]?.[colIndex - 1]?.initial === buildingType) return 2; // Нижний левый угол
      if (selectedMap.map[rowIndex + 1]?.[colIndex + 1]?.initial === buildingType) return 1; // Нижний правый угол
      return null;
    };

    // Определяем, какое большое здание должно отображаться в этой клетке
    let largeBuildingImage = null;
    let buildingPart = null;

    switch (cell.initial) {
      case "red base":
        buildingPart = getBuildingPart("red base");
        if (buildingPart) {
          largeBuildingImage = `https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/cells/red-base-${buildingPart}.png`;
        }
        break;
      case "blue base":
        buildingPart = getBuildingPart("blue base");
        if (buildingPart) {
          largeBuildingImage = `https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/cells/blue-base-${buildingPart}.png`;
        }
        break;
      case "laboratory":
        buildingPart = getBuildingPart("laboratory");
        if (buildingPart) {
          largeBuildingImage = `https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/cells/lab-${buildingPart}.png`;
        }
        break;
      case "magic shop":
        buildingPart = getBuildingPart("magic shop");
        if (buildingPart) {
          largeBuildingImage = `https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/cells/magic-store-${buildingPart}.png`;
        }
        break;
      case "armory":
        buildingPart = getBuildingPart("armory");
        if (buildingPart) {
          largeBuildingImage = `https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/cells/armory-${buildingPart}.png`;
        }
        break;
    }

    return (
      <div className={`${getCellClassName(cell)}`}>
        {character && (
          <div className="positioned-character">
            <img
              src={`https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/characters/${character.image}`}
              alt={character.name}
              className={`character-image ${character.team === "red" ? 'red-team' : 'blue-team'}`}
            />
          </div>
        )}
        {largeBuildingImage && (
          <div className="positioned-object">
            <img
              src={largeBuildingImage}
              className="object-image building-image"
            />
          </div>
        )}
      </div>
    );
  };

  const handleHoveredCell = (cell) => {
    if (!showDropdown) {
      setHoveredCell(cell);
    }
  };

  const handleUnhoveredCell = () => {
    if (!showDropdown) {
      setHoveredCell(null);
    }
  };

  // Рендер карты мемоизирован для уменьшения лишних перерасчётов
  const renderMap = useMemo(() => (
    <>
      <div className="map-header">
        <MapIcon size={30} color="#D4AF37" />
        <h2>Установите начальные позиции</h2>
      </div>
      <div className="positioning-map">
        <div className="map-preview preview-advanced"
          style={{
            gridTemplateColumns: `repeat(${selectedMap.size[0]}, 1fr)`,
            gridTemplateRows: `repeat(${selectedMap.size[1]}, 1fr)`
          }}>
          {selectedMap.map.flat().map((cell, index) => {
            const rowIndex = Math.floor(index / selectedMap.size[0]);
            const colIndex = index % selectedMap.size[0];
            return (
              <div
                key={index}
                className={`cell-wrapper ${hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex ? 'hovered' : ''
                  } ${selectedCellCoords?.row === rowIndex && selectedCellCoords?.col === colIndex ? 'selected' : ''
                  } ${(myTeam && allowedCells.has(`${colIndex + 1}-${rowIndex + 1}`)) ? 'allowed' : ''}
                  ${!canPlaceOnSide(colIndex) ? 'inactive' : ''}`}
                onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
                onMouseEnter={() => handleHoveredCell({ row: rowIndex, col: colIndex })}
                onMouseLeave={() => handleUnhoveredCell()}
              >
                {renderCell(cell, rowIndex, colIndex)}
              </div>
            );
          })}
        </div>
      </div>
      <CharacterDropdown />
    </>
  ), [selectedMap, hoveredCell, selectedCellCoords, myTeam, localTeams, allowedCells]);

  // Рендер списка команд
  const renderTeamsList = () => (
    <div className="positioning-teams">
      <h2>Выберите персонажа для установки позиции</h2>
      <div className="teams-container">
        <div className="team team1">
          <h3>Команда 1</h3>
          {localTeams.red.map((ch, index) => (
            <div
              key={index}
              className={`positioning-character ${selectedForPosition?.character.name === ch.name ? 'selected' : ''
                }`}
              onClick={() => handleCharacterSelect(ch, 'red')}
            >
              <div className="char-info">
                <span className="char-name">{ch.name}</span>
                {ch.position && <span className="position-display">{ch.position}</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="team team2">
          <h3>Команда 2</h3>
          {localTeams.blue.map((ch, index) => (
            <div
              key={index}
              className={`positioning-character ${selectedForPosition?.character.name === ch.name ? 'selected' : ''
                }`}
              onClick={() => handleCharacterSelect(ch, 'blue')}
            >
              <div className="char-info">
                <span className="char-name">{ch.name}</span>
                {ch.position && <span className="position-display">{ch.position}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Основной рендер компонента
  return (
    <div className="positioning-page">
      <div className="positioning-image">
      </div>
      <div className="positioning-overlay">
        {renderMap}
        {renderTeamsList()}
      </div>
      <button
        className="confirm-positions-button"
        onClick={handleConfirmPositions}
        disabled={localTeams.red.some(ch => !ch.position) || localTeams.blue.some(ch => !ch.position)}
      >
        {localTeams.red.some(ch => !ch.position) || localTeams.blue.some(ch => !ch.position)
          ? 'Разместите всех персонажей'
          : 'Начать игру!'
        }
      </button>
    </div>
  );
};

export default CharacterPositioning;