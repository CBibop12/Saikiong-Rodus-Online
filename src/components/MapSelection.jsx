import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Map as MapIcon } from 'lucide-react';
import "../styles/mapSelection.css"

const MapSelection = ({ maps, onMapSelect }) => {
  const navigate = useNavigate();
  const [selectedMapIndex, setSelectedMapIndex] = useState(0);
  const currentMap = maps[selectedMapIndex];

  const handlePrevMap = () => {
    setSelectedMapIndex((prev) => (prev > 0 ? prev - 1 : maps.length - 1));
  };

  const handleNextMap = () => {
    setSelectedMapIndex((prev) => (prev < maps.length - 1 ? prev + 1 : 0));
  };

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

  return (
    <div className="map-selection-container">
      <div className="map-overlay">
      <div className="map-header">
        <h1><MapIcon className="map-icon" color="#D4AF37"/> Выбор карты</h1>
        <h2>{currentMap.userName}</h2>
        <div className="map-info">
          <span>Размер: {currentMap.size[0]}x{currentMap.size[1]}</span>
          <span>Крипы: {currentMap.creeps ? 'Да' : 'Нет'}</span>
        </div>
      </div>
      <div className="map-navigation">
        <button className="nav-button" onClick={handlePrevMap}>
          <ChevronLeft size={24} color="#D4AF37"/>
        </button>
        <div className="map-image">
          <img src={`/src/assets/images/${currentMap.image}`}/>
        </div>
        <button className="nav-button" onClick={handleNextMap}>
          <ChevronRight size={24} color="#D4AF37"/>
        </button>
      </div>
      <div className="map-actions">
        <button 
          className="select-button"
          onClick={() => {
            onMapSelect(currentMap)
          }}
        >
          Выбрать карту
        </button>
      </div>
      </div>
    </div>
  );
};

export default MapSelection;