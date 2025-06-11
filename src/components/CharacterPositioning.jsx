import React, { useState, useEffect } from 'react';
import { Map as MapIcon } from 'lucide-react';
import "../styles/mapSelection.css";

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
    if (selectedForPosition) {
      return true;
    }

    const [col, row] = cellCoord.split('-').map(Number);
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],          [0, 1],
      [1, -1],  [1, 0], [1, 1]
    ];

    for (const [dx, dy] of directions) {
      const newCol = col + dx - 1;
      const newRow = row + dy - 1;
      if (newCol >= 0 && newCol < selectedMap.size[0] && 
          newRow >= 0 && newRow < selectedMap.size[1]) {
        const neighborCell = selectedMap.map[newRow][newCol];
        if (neighborCell.initial === 'red base' || neighborCell.initial === 'blue base') {
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
    const cellCoord = `${colIndex + 1}-${rowIndex + 1}`;
    const redChar = localTeams.team1.find(ch => ch.position === cellCoord);
    const blueChar = localTeams.team2.find(ch => ch.position === cellCoord);
    const character = redChar || blueChar;

    return (
      <div className={getCellClassName(cell)}>
        {character && (
          <div className="positioned-character">
            <img 
              src={`/src/assets/characters/${character.image}`}
              alt={character.name}
              className={`character-image ${redChar ? 'red-team' : 'blue-team'}`}
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
            const cellCoord = `${colIndex + 1}-${rowIndex + 1}`;
            const redChar = localTeams.team1.find(ch => ch.position === cellCoord);
            const blueChar = localTeams.team2.find(ch => ch.position === cellCoord);
            
            return (
              <div 
                key={index} 
                className={`cell-wrapper ${
                  hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex ? 'hovered' : ''
                } ${
                  selectedCellCoords?.row === rowIndex && selectedCellCoords?.col === colIndex ? 'selected' : ''
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
              className={`positioning-character ${
                selectedForPosition?.character.name === ch.name ? 'selected' : ''
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
              className={`positioning-character ${
                selectedForPosition?.character.name === ch.name ? 'selected' : ''
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
        <img src="/src/assets/images/characterPosition.png" alt="map" />
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