/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { Map as MapIcon } from 'lucide-react';
import "../styles/mapSelection.css";
import { cellHasType, stringFromCoord } from './scripts/tools/mapStore';

const CharacterPositioning = ({ teams, selectedMap, onPositioningComplete }) => {
  // Состояния для выпадающего меню
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [showDropdown, setShowDropdown] = useState(false);
  const [availableCharacters, setAvailableCharacters] = useState([]);
  const [selectedCellCoords, setSelectedCellCoords] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  // Основные состояния компонента
  const [localTeams, setLocalTeams] = useState(() => ({
    team1: teams.team1.map(ch => ({ ...ch, position: ch.position || null })),
    team2: teams.team2.map(ch => ({ ...ch, position: ch.position || null }))
  }));
  const [selectedForPosition, setSelectedForPosition] = useState(null);

  // Выбор персонажа из списка команд
  const handleCharacterSelect = (character, team) => {
    setSelectedForPosition({ character, team });
  };

  const handleCellClickAllowance = (cellCoord) => {
    // Если персонаж уже выбран для перемещения/установки – разрешаем клик без дополнительных проверок
    if (selectedForPosition) {
      return true;
    }

    // Приводим координаты к нулевой индексации
    const [colOneBased, rowOneBased] = cellCoord.split('-').map(Number);
    const col = colOneBased - 1;
    const row = rowOneBased - 1;

    // 1. Нельзя кликать на саму базу
    if (cellHasType(["red base", "blue base"], [col, row], selectedMap)) {
      return false;
    }

    // 2. Проверяем, есть ли на клетке уже размещённый персонаж
    const isCellOccupied =
      localTeams.team1.some((ch) => ch.position === cellCoord) ||
      localTeams.team2.some((ch) => ch.position === cellCoord);

    // Если клетка уже занята персонажем – не разрешаем действие
    if (isCellOccupied) {
      return false;
    }

    // 3. Проверяем, находится ли клетка СОСЕДНИМ образом с хотя бы одной клеткой базы
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    for (const [dx, dy] of directions) {
      const newCol = col + dx;
      const newRow = row + dy;
      if (
        newCol >= 0 &&
        newCol < selectedMap.size[0] &&
        newRow >= 0 &&
        newRow < selectedMap.size[1]
      ) {
        if (cellHasType(["red base", "blue base"], [newCol, newRow], selectedMap)) {
          return true;
        }
      }
    }

    return false;
  };

  // Обработчик клика по клетке
  const handleCellClick = (rowIndex, colIndex, event) => {
    if (selectedForPosition) {
      // Если персонаж уже выбран из списка команд
      const coordinates = `${colIndex + 1}-${rowIndex + 1}`;
      const teamKey = selectedForPosition.team === 1 ? 'team1' : 'team2';
      const updatedTeam = localTeams[teamKey].map(ch => {
        if (ch.name === selectedForPosition.character.name) {
          return { ...ch, position: coordinates };
        }
        return ch;
      });
      setLocalTeams(prev => ({ ...prev, [teamKey]: updatedTeam }));
      setSelectedForPosition(null);
    } else {
      // Открываем выпадающее меню с персонажами
      if (!handleCellClickAllowance(`${colIndex + 1}-${rowIndex + 1}`)) {
        return;
      }
      const colNumber = colIndex + 1;
      const isLeftSide = colNumber <= 20;
      const teamKey = isLeftSide ? 'team1' : 'team2';

      const unpositionedCharacters = localTeams[teamKey].filter(ch => !ch.position);

      if (unpositionedCharacters.length > 0) {
        setDropdownPosition({
          x: event.clientX,
          y: event.clientY
        });
        setSelectedCellCoords({ row: rowIndex, col: colIndex });
        setAvailableCharacters(unpositionedCharacters.map(char => ({
          ...char,
          team: isLeftSide ? 1 : 2
        })));
        setShowDropdown(true);
      }
    }
  };

  // Обработчик выбора персонажа из выпадающего меню
  const handleDropdownSelect = (character, team) => {
    if (!selectedCellCoords) return;

    const coordinates = `${selectedCellCoords.col + 1}-${selectedCellCoords.row + 1}`;
    const teamKey = team === 1 ? 'team1' : 'team2';

    const updatedTeam = localTeams[teamKey].map(ch => {
      if (ch.name === character.name) {
        return { ...ch, position: coordinates };
      }
      return ch;
    });

    setLocalTeams(prev => ({ ...prev, [teamKey]: updatedTeam }));
    setShowDropdown(false);
    setSelectedCellCoords(null);
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
    const character = localTeams.team1.find(ch => ch.position === cellCoord) || localTeams.team2.find(ch => ch.position === cellCoord);

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
        console.log("red base");
        buildingPart = getBuildingPart("red base");
        if (buildingPart) {
          largeBuildingImage = `/assets/cells/red-base-${buildingPart}.png`;
        }
        break;
      case "blue base":
        console.log("blue base");
        buildingPart = getBuildingPart("blue base");
        if (buildingPart) {
          largeBuildingImage = `/assets/cells/blue-base-${buildingPart}.png`;
        }
        break;
      case "laboratory":
        console.log("laboratory");
        buildingPart = getBuildingPart("laboratory");
        if (buildingPart) {
          largeBuildingImage = `/assets/cells/lab-${buildingPart}.png`;
        }
        break;
      case "magic shop":
        console.log("magic shop");
        buildingPart = getBuildingPart("magic shop");
        if (buildingPart) {
          largeBuildingImage = `/assets/cells/magic-store-${buildingPart}.png`;
        }
        break;
      case "armory":
        console.log("armory");
        buildingPart = getBuildingPart("armory");
        if (buildingPart) {
          largeBuildingImage = `/assets/cells/armory-${buildingPart}.png`;
        }
        break;
    }

    return (
      <div className={`${getCellClassName(cell)}`}>
        {character && (
          <div className="positioned-character">
            <img
              src={`/assets/characters/${character.image}`}
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

  // Рендер карты
  const renderMap = () => (
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
                  }`}
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
  );

  // Рендер списка команд
  const renderTeamsList = () => (
    <div className="positioning-teams">
      <h2>Выберите персонажа для установки позиции</h2>
      <div className="teams-container">
        <div className="team team1">
          <h3>Команда 1</h3>
          {localTeams.team1.map((ch, index) => (
            <div
              key={index}
              className={`positioning-character ${selectedForPosition?.character.name === ch.name ? 'selected' : ''
                }`}
              onClick={() => handleCharacterSelect(ch, 1)}
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
          {localTeams.team2.map((ch, index) => (
            <div
              key={index}
              className={`positioning-character ${selectedForPosition?.character.name === ch.name ? 'selected' : ''
                }`}
              onClick={() => handleCharacterSelect(ch, 2)}
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
        <img src="/assets/images/characterPosition.png" alt="map" />
      </div>
      <div className="positioning-overlay">
        {renderMap()}
        {renderTeamsList()}
      </div>
      <button
        className="confirm-positions-button"
        onClick={() => onPositioningComplete(localTeams)}
        disabled={localTeams.team1.some(ch => !ch.position) || localTeams.team2.some(ch => !ch.position)}
      >
        {localTeams.team1.some(ch => !ch.position) || localTeams.team2.some(ch => !ch.position)
          ? 'Разместите всех персонажей'
          : 'Начать игру!'
        }
      </button>
    </div>
  );
};

export default CharacterPositioning;