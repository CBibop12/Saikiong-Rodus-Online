/* eslint-disable react/prop-types */
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Map as MapIcon } from 'lucide-react';
import "../styles/mapSelection.css"

const MapSelection = ({ maps, onMapSelect }) => {
  const [selectedMapIndex, setSelectedMapIndex] = useState(0);
  const currentMap = maps[selectedMapIndex];

  const handlePrevMap = () => {
    setSelectedMapIndex((prev) => (prev > 0 ? prev - 1 : maps.length - 1));
  };

  const handleNextMap = () => {
    setSelectedMapIndex((prev) => (prev < maps.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="map-selection-container">
      <div className="map-overlay">
        <div className="map-header">
          <h1><MapIcon className="map-icon" color="#D4AF37" /> Выбор карты</h1>
          <h2>{currentMap.userName}</h2>
          <div className="map-info">
            <span>Размер: {currentMap.size[0]}x{currentMap.size[1]}</span>
            <span>Крипы: {currentMap.creeps ? 'Да' : 'Нет'}</span>
          </div>
        </div>
        <div className="map-navigation">
          <button className="nav-button" onClick={handlePrevMap}>
            <ChevronLeft size={24} color="#D4AF37" />
          </button>
          <div className="map-image">
            <img src={`/assets/images/${currentMap.image}`} />
          </div>
          <button className="nav-button" onClick={handleNextMap}>
            <ChevronRight size={24} color="#D4AF37" />
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