/* eslint-disable react/prop-types */
import { useState } from 'react';
import { ChevronDown, ChevronUp, ShoppingCart, X } from 'lucide-react';
import '../../styles/store.css';
import { items } from '../../data';

const Store = ({ matchState, character, storeType, onClose, onBuy, selectedMap, alliesNearStore }) => {
  const [expandedItems, setExpandedItems] = useState({});

  const nameOf = (key) => {
    switch (key) {
      case "availability":
        return "Доступность";
      case "passiveAbility":
        return "Пассивная способность";
      case "activeAbility":
        return "Активная способность";
    }
  }
  const toggleItem = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const canAffordItem = (item) => {
    if (!character) return false;
    const cooldownByStore = storeType === "laboratory" ? "labCooldown" : "armoryCooldown"
    if (storeType !== 'magic shop') {
      const totalMana = alliesNearStore().reduce((acc, ally) => acc + ally.currentMana, 0);
      return totalMana >= item.price && alliesNearStore().every(ally => ally[cooldownByStore] === 0);
    }
    return matchState.teams[character.team].gold >= item.price;
  };

  const filteredItems = items.filter(item => item.shopType === {
    laboratory: 'Лаборатория',
    armory: 'Оружейная',
    'magic shop': 'Магический'
  }[storeType]);



  const getStoreInfo = () => {
    if (!character || alliesNearStore().length === 0 || !alliesNearStore().some(ally => ally.name === character.name)) {
      return "";
    }

    const cooldownField = storeType === 'laboratory' ? 'labCooldown' : 'armoryCooldown';
    const alliesWithNoCooldown = alliesNearStore().filter(ally => ally[cooldownField] === 0);

    if (alliesWithNoCooldown.length > 1) {
      const totalMana = alliesWithNoCooldown.reduce((sum, ally) => sum + ally.currentMana, 0);
      return `(Мана: ${totalMana})`;
    } else {
      const minCooldown = Math.min(...alliesNearStore().map(ally => ally[cooldownField]));
      if (minCooldown === 0) {
        return '';
      } else {
        return `(КД: ${minCooldown})`;
      }
    }
  }

  const handleBuyClick = (item) => {
    onBuy(item);
  };

  return (
    <div className="store-container">
      <div className="store-header">
        <div></div>
        <h2>{storeType === 'laboratory' ? 'Лаборатория' :
          storeType === 'armory' ? 'Оружейная' :
            'Магический магазин'} {getStoreInfo()}</h2>
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
                {character && alliesNearStore().length > 0 && alliesNearStore().some(ally => ally.name === character.name) && (
                  <button
                    className="buy-button"
                    disabled={!canAffordItem(item)}
                    onClick={() => {
                      if (alliesNearStore().length === 1) {
                        onBuy(item);
                      } else {
                        handleBuyClick(item);
                      }
                    }}
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
                {item.shopType === "Лаборатория" || item.shopType === "Оружейная" && (
                  item.description
                )}
                {item.shopType === "Магический" && (
                  Object.entries(item.description).filter(([key]) => item.description[key] != null).map(([key, value]) => (
                    <div key={key} className="store-item-description-item">
                      <h3 className="store-item-description-title">{nameOf(key)}</h3>
                      {value}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Store;