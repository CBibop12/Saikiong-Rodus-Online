import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react';
import '../../styles/store.css';
import { items } from '../../data';
import { X } from 'lucide-react';

const Store = ({matchState, character, storeType, onClose, onBuy }) => {
  const [expandedItems, setExpandedItems] = useState({});

  const toggleItem = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const canAffordItem = (item) => {
    if (!character) return false;
    const cooldownByStore = storeType === "laboratory" ? "labCooldown" : "armoryCooldown"
    if (storeType !== 'magic store') {
      return character.currentMana >= item.price && character[cooldownByStore] === 0
    }
    return matchState.teams[character.team].gold >= item.price;
  };

  const filteredItems = items.filter(item => item.shopType === {
    laboratory: 'Лаборатория',
    armory: 'Оружейная',
    'magic shop': 'Магический'
  }[storeType]);

  return (
    <div className="store-container">
      <div className="store-header">
        <div></div>
        <h2>{storeType === 'laboratory' ? 'Лаборатория' : 
             storeType === 'armory' ? 'Оружейная' : 
             'Магический магазин'} {storeType === 'laboratory' && character && character.labCooldown > 0 ? `(КД: ${character.labCooldown})`: storeType === "armory" && character && character.armoryCooldown > 0 ? `(КД: ${character.armoryCooldown})` : ""}</h2>
        <button className="shop-close-button" onClick={onClose}>
          <X />
        </button>
      </div>
      <div className="items-list">
        {filteredItems.map((item, key) => (
          <div 
            key={key} 
            className={`item-card ${!canAffordItem(item) && character ? 'disabled' : ''}`}
          >
            <div className="item-header">
              <img 
                src={`/src/assets/items/${item.image}`} 
                alt={item.name}
                className="item-image"
              />
              <div className="item-info">
                <h3>{item.name}</h3>
                <div className="item-price">
                  {storeType !== 'magic shop' ? 'Мана: ' : 'Золото: '}
                  {item.price}
                </div>
              </div>
              <div className="item-actions">
                {character && (
                  <button 
                    className="buy-button"
                    disabled={!canAffordItem(item)}
                    onClick={() => onBuy(item)}
                  >
                    <ShoppingCart />
                  </button>
                )}
                <button 
                  className="expand-button"
                  onClick={() => toggleItem(item.name)}
                >
                  {expandedItems[item.name] ? <ChevronUp /> : <ChevronDown />}
                </button>
              </div>
            </div>
            {expandedItems[item.name] && (
              <div className="item-description">
                {item.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Store;