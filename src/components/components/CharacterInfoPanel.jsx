import React, { useState, useEffect } from 'react';
import '../../styles/characterInfoPanel.css';
import { Box, CircleX, Info, Sparkle, Sword, Swords } from 'lucide-react';
import { abilities as abilitiesList } from '../../abilities.js';
import { items } from '../../data';

const CharacterInfoPanel = ({ character, onClose, onAttack, onAbilityClick, onUnselectAttack, pendingMode, onEffectClick, teamTurn, onItemClick}) => {
  if (!character) return null;
  const [attackMode, setAttackMode] = useState(false);

  useEffect(() => {
    if (pendingMode === "attack") {
      setAttackMode(true);
    }
    else {
      setAttackMode(false);
    }
  }, [pendingMode]);

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

  const getParameterName = (parameter) => {
    switch (parameter) {
      case "HP":
        return "currentHP";
      case "Мана":
        return "currentMana";
      case "Броня":
        return "currentArmor";
      case "Ловкость":
        return "currentAgility";
      case "Урон":
        return "currentDamage";
      case "Дальность":
        return "currentRange";
    }
  };

  const handleAttack = () => {
    if (attackMode) {
      console.log("unselect attack");
      onUnselectAttack()
      setAttackMode(false);
    }
    else {
      console.log("attack mode");
      onAttack(character);
      setAttackMode(true);
    }
  };

  const handleAbilityClick = (ability, index) => {
    console.log(ability);
    if (ability.currentCooldown === 0) {
      onAbilityClick(character.name, index);
    }
  };

  const handleEffectClick = (effect) => {
    console.log("Effect is clicked: ", effect)
    onEffectClick(effect)
  }

  const handleSlotClick = (slot) => {
    console.log(slot);
    if (slot) {
      onItemClick(slot, character)
    }
  }

  if (teamTurn === character.team) {
    return (
      <div className="info-panel">
        <div className="character-info-panel-header">
          {character.name}
        </div>
        <div className="info-content-container">
          {character.effects.length > 0 && (
            <div className="character-effects">
              <div className="character-effect-header">
                Эффекты
              </div>
              {character.effects.map((effect) => (
                <div 
                  key={effect.effectId} 
                  className={`character-effect ${effect.effectType}`}
                  onClick={() => handleEffectClick(effect)}
                >
                  {effect.name} ({effect.turnsRemain})
                </div>
              ))}
            </div>
          )}
          <div className="character-info-panel">
              <div className="abilities-section">
                {character.abilities?.map((ability, index) => (
                  <div 
                    key={index} 
                    className="ability-container"
                    onClick={() => handleAbilityClick(ability, index + 1)}
                  >
                    <div className="ability-icon">
                      <div className="ability-loadingCircle">
                        <div className="ability-pie" style={{'--pct': ability.currentCooldown === 0 ? 100 : (ability.coolDown - ability.currentCooldown) / ability.coolDown * 100}}>
                        </div>
                      </div>
                      {ability.image ? (
                        <img src={`/src/assets/abilities/${ability.image}`} alt={ability.name} />
                      ) : (
                        <Swords />
                      )}
                      <div className="ability-tooltip">
                        <div className="ability-name">{abilitiesList[ability.key].name}</div>
                        <div className="ability-description">{ability.description}</div>
                        <div className="ability-cooldown">КД: {ability.coolDown}</div>
                      </div>
                    </div>
                    <div className="ability-cooldown">КД: {ability.coolDown}</div>
                  </div>
                ))}
              </div>
          <div className="character-center">
            <div className="character-avatar"
              style={{ backgroundColor: typeColors[character.type] }}
            >
              <img 
                src={`/src/assets/characters/${character.image}`} 
                alt={character.name}
                style={{
                  transform: character.team === "blue" ? "scaleX(-1)" : "none",
                }}
              />
            </div>
            <div className="character-type">{character.type}</div>
          </div>
  
          <div className="stats-section">
          <div className="stats-grid">
              {Object.entries(character.stats)
                .filter(([key]) => !['HP', 'Мана'].includes(key))
                .map(([key, value]) => (
                  <div key={key} className="stat-item">
                    <div className="stat-name">{key}</div>
                    <div className="stat-value">{character[getParameterName(key)]}/{key === "Броня" ? 5 : value}</div>
                  </div>
                ))}
            </div>
            <div className="inventoryBarsContainer">
              <div className="inventory-slots">
              {[1, 2, 3].map((slot) => (
                  <div key={slot} className="inventory-slot">
                    {character.inventory?.[slot - 1] ? (
                      <img 
                        src={`/src/assets/items/${items.find(item => item.name === character.inventory[slot - 1].name)?.image || 'default.png'}`} 
                        alt={character.inventory[slot - 1].name || 'Предмет'}
                        onClick={() => {
                          console.log(character.inventory?.[slot - 1], "is clicked");
                          handleSlotClick(character.inventory?.[slot - 1])
                          }}
                      />
                    ) : (
                      <Box className="inventory-slot-empty" />
                    )}
                  </div>
                ))}
              </div>
              <div className="bar-container">
                <div className="health-bar-container">
                  <div className="health-bar" style={{ '--health-percentage': `${(character.currentHP / character.stats.HP) * 100}%` }}>
                    <div className="health-bar-fill" />
                    <div className="bar-value">{character.currentHP}/{character.stats.HP}</div>
                  </div>
                </div>
                  <div className="mana-bar-container">
                    <div className="mana-bar" style={{ '--mana-percentage': `${(character.currentMana / character.stats.Мана) * 100}%` }}>
                      <div className="mana-bar-fill" />
                      <div className="bar-value">{character.currentMana}/{character.stats.Мана}</div>
                    </div>
                  </div>
              </div>
            </div>
          </div>
          <div className="info-panel-buttons">
          <button className="info-panel-button" onClick={() => {
            onClose();
            setAttackMode(false);
          }}><CircleX /></button>
          <button className={`info-panel-button ${attackMode ? 'active' : ''}`} onClick={handleAttack}
          title={attackMode ? "Отменить атаку" : "Атаковать"}
          >
            <Sword />
          </button>
          <button className="info-panel-button" onClick={() => {
            console.log(character);
          }}>
            <Info />
          </button>
          </div>
          </div>
        </div>
      </div>
    );
  }
  else {
    return (
      <div className="info-panel">
        <div className="character-info-panel-header">
          {character.name}
        </div>
        <div className="info-content-container">
          {character.effects.length > 0 && (
            <div className="character-effects">
              <div className="character-effect-header">
                Эффекты
              </div>
              {character.effects.map((effect) => (
                <div 
                  key={effect.effectId} 
                  className={`character-effect ${effect.effectType}`}
                  onClick={() => handleEffectClick(effect)}
                >
                  {effect.name} ({effect.turnsRemain})
                </div>
              ))}
            </div>
          )}
          <div className="character-info-panel">
              <div className="abilities-section">
                {character.abilities?.map((ability, index) => (
                  <div 
                    key={index} 
                    className="ability-container"
                  >
                    <div className="ability-icon">
                      <div className="ability-loadingCircle">
                        <div className="ability-pie" style={{'--pct': ability.currentCooldown === 0 ? 100 : (ability.coolDown - ability.currentCooldown) / ability.coolDown * 100}}>
                        </div>
                      </div>
                      {ability.image ? (
                        <img src={`/src/assets/abilities/${ability.image}`} alt={ability.name} />
                      ) : (
                        <Swords />
                      )}
                      <div className="ability-tooltip">
                        <div className="ability-name">{abilitiesList[ability.key].name}</div>
                        <div className="ability-description">{ability.description}</div>
                        <div className="ability-cooldown">КД: {ability.coolDown}</div>
                      </div>
                    </div>
                    <div className="ability-cooldown">КД: {ability.coolDown}</div>
                  </div>
                ))}
              </div>
          <div className="character-center">
            <div className="character-avatar"
              style={{ backgroundColor: typeColors[character.type] }}
            >
              <img 
                src={`/src/assets/characters/${character.image}`} 
                alt={character.name}
                style={{
                  transform: character.team === "blue" ? "scaleX(-1)" : "none",
                }}
              />
            </div>
            <div className="character-type">{character.type}</div>
          </div>
  
          <div className="stats-section">
          <div className="stats-grid">
              {Object.entries(character.stats)
                .filter(([key]) => !['HP', 'Мана'].includes(key))
                .map(([key, value]) => (
                  <div key={key} className="stat-item">
                    <div className="stat-name">{key}</div>
                    <div className="stat-value">{character[getParameterName(key)]}/{key === "Броня" ? 5 : value}</div>
                  </div>
                ))}
            </div>
            <div className="inventoryBarsContainer">
              <div className="inventory-slots">
                {[1, 2, 3].map((slot) => (
                  <div key={slot} className="inventory-slot">
                    {character.inventory?.[slot - 1] ? (
                      <img 
                        src={`/src/assets/items/${items.find(item => item.name === character.inventory[slot - 1].name)?.image || 'default.png'}`} 
                        alt={character.inventory[slot - 1].name || 'Предмет'}
                        onClick={() => {
                          console.log(character.inventory?.[slot - 1], "is clicked");
                          handleSlotClick(character.inventory?.[slot - 1])
                          }}
                      />
                    ) : (
                      <Box className="inventory-slot-empty" />
                    )}
                  </div>
                ))}
              </div>
              <div className="bar-container">
                <div className="health-bar-container">
                  <div className="health-bar" style={{ '--health-percentage': `${(character.currentHP / character.stats.HP) * 100}%` }}>
                    <div className="health-bar-fill" />
                    <div className="bar-value">{character.currentHP}/{character.stats.HP}</div>
                  </div>
                </div>
                  <div className="mana-bar-container">
                    <div className="mana-bar" style={{ '--mana-percentage': `${(character.currentMana / character.stats.Мана) * 100}%` }}>
                      <div className="mana-bar-fill" />
                      <div className="bar-value">{character.currentMana}/{character.stats.Мана}</div>
                    </div>
                  </div>
              </div>
            </div>
          </div>
          <div className="info-panel-buttons">
          <button className="info-panel-button" onClick={() => {
            console.log(character);
            onClose();
          }}><CircleX /></button>
          </div>
          </div>
        </div>
      </div>
    );
  }
};

export default CharacterInfoPanel;