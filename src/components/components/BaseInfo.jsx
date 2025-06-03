import React from 'react';
import { Box } from 'lucide-react';
const BaseInfo = ({ inventory, gold, team, remain, advancedSettings, teamTurn }) => {
  return (
    <>
    <div className={`base-info ${team === "red" ? "left" : "right"}`}>
        <h3>{team === "red" ? "Красная" : "Синяя"} База</h3>
        <div className="base-info__items">
        {[1, 2, 3].map((slot) => (
                <div key={slot} className="base-info__item">
                  {inventory?.[slot - 1] ? (
                    <img 
                      src={`/src/assets/items/${items.find(item => item.name === inventory[slot - 1].name)?.image || 'default.png'}`} 
                      alt={inventory[slot - 1].name || 'Предмет'}
                    />
                  ) : (
                    <Box className="base-info__item-empty" />
                  )}
        </div>
      ))}
      </div>
      <div className="base-info__gold">
        <div className="base-info__gold-icon">
          <img src="/src/assets/images/coin.png" alt="Gold" />
        </div>
        <span className="base-info__gold-value">{gold}</span>
      </div>
      <div className="base-info__remain">
      {team === teamTurn && (
        <div className="base-info__remain-things">
          <div className="base-info__remain-moves">
            {Array.from({ length: advancedSettings.movesPerTurn }).map((_, index) => (
              <div key={`move-${index}`} className="base-info__remain-item">
              <img 
                key={`move-${index}`} 
                src={`/src/assets/interfaceIcons/moveIcon.png`} 
                alt="Перемещение" 
                style={{ 
                  filter: index >= remain.moves ? "grayscale(100%)" : "none",
                  opacity: index >= remain.moves ? 0.5 : 1
                }}
              />
              </div>
            ))}
          </div>
          <div className="base-info__remain-actions">
            {Array.from({ length: advancedSettings.actionsPerTurn }).map((_, index) => (
              <div key={`action-${index}`} className="base-info__remain-item">
              <img 
                key={`action-${index}`} 
                src={`/src/assets/interfaceIcons/actionIcon.png`} 
                alt="Действие" 
                style={{ 
                  filter: index >= remain.actions ? "grayscale(100%)" : "none",
                  opacity: index >= remain.actions ? 0.5 : 1
                }}
              />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </div>
    </>
  );
};

export default BaseInfo;
