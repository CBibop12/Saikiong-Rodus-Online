import React, { useState } from 'react';
import '../../styles/ContextMenu.css';

const ContextMenu = ({
  contextMenu,
  setContextMenu,
  setInputValue,
  inputValue,
  handleInputChange,
  matchState,
  updateMatchState,
  setZoneSelectionMode,
  setPendingZoneEffect
}) => {
  // Состояния для модального окна ввода
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: '',
    title: '',
    subtitle: '',
    placeholder: '',
    initialValue: '',
    onConfirm: () => { }
  });
  const [modalInputValue, setModalInputValue] = useState('');
  const [buyerOptions, setBuyerOptions] = useState([]); // Список покупателей для магазина

  // Функция обработки подтверждения в модальном окне
  const handleModalSubmit = () => {
    modalConfig.onConfirm(modalInputValue);
    setModalConfig({ ...modalConfig, isOpen: false });
    setModalInputValue('');
  };

  // Функция открытия модального окна с конфигурацией
  const openModal = (config) => {
    setModalConfig({
      isOpen: true,
      ...config
    });
    setModalInputValue(config.initialValue || '');
  };

  // Функция закрытия модального окна
  const closeModal = () => {
    setModalConfig({ ...modalConfig, isOpen: false });
    setModalInputValue('');
  };

  // Рендер модального окна ввода
  const renderInputModal = () => {
    if (!modalConfig.isOpen) return null;
    return (
      <div className="game-modal__overlay">
        <div className="game-modal__container">
          <div className="game-modal__header">
            <h3 className="game-modal__title">{modalConfig.title}</h3>
            {modalConfig.subtitle && (
              <p className="game-modal__subtitle">{modalConfig.subtitle}</p>
            )}
          </div>
          {modalConfig.type === "selectBuyer" ? (
            <select
              className="game-modal__input"
              value={modalInputValue}
              onChange={(e) => setModalInputValue(e.target.value)}
              autoFocus
            >
              <option value="">-- Выберите персонажа --</option>
              {buyerOptions.map((opt, idx) => (
                <option key={idx} value={opt.name}>
                  {opt.name} ({opt.currencyValue})
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              className="game-modal__input"
              value={modalInputValue}
              onChange={(e) => setModalInputValue(e.target.value)}
              placeholder={modalConfig.placeholder}
              autoFocus
            />
          )}
          <div className="game-modal__buttons">
            <button
              className="game-modal__button game-modal__button--cancel"
              onClick={closeModal}
            >
              Отмена
            </button>
            <button
              className="game-modal__button game-modal__button--confirm"
              onClick={handleModalSubmit}
            >
              Подтвердить
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Если контекстное меню не активно, ничего не рендерим
  if (!contextMenu.visible) return null;

  // Рендер магазинного контекстного меню (shop === true)
  if (contextMenu.shop) {
    return (
      <>
        <div
          className="game-context-menu__container"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <ul className="game-context-menu__list">
            {contextMenu.shopItems.map((item, idx) => {
              // Определение класса для отображения валюты
              const currencyClass = item.currency.toLowerCase() === "gold"
                ? "data-currency='gold'"
                : "data-currency='mana'";

              return (
                <li
                  key={idx}
                  className="game-context-menu__item game-context-menu__item--shop"
                  onClick={() => {
                    // Если inputValue пустой, выбираем покупателей и открываем модальное окно
                    if (!inputValue || inputValue.trim().length === 0) {
                      const eligibleBuyers = [
                        ...matchState.teams.red.characters,
                        ...matchState.teams.blue.characters
                      ].filter(ch => {
                        if (item.currency.toLowerCase() === "mana") {
                          if (item.name === "Усиление урона") {
                            // В контекстном меню допускаем выбор покупателя; фактическая стоимость будет распределяться совместно
                            return true;
                          }
                          return ch.currentMana >= item.price;
                        } else {
                          return true;
                        }
                      });
                      console.log("Eligible buyers:", eligibleBuyers);
                      if (eligibleBuyers.length === 0) {
                        addActionLog(`Никто не может позволить ${item.name}`);
                        return;
                      }
                      setBuyerOptions(eligibleBuyers.map(ch => ({
                        name: ch.name,
                        currencyValue: item.currency.toLowerCase() === "mana" ? ch.currentMana : "баланс"
                      })));
                      openModal({
                        type: "selectBuyer",
                        title: `Покупка ${item.name}`,
                        subtitle: `Цена: ${item.name === "Усиление урона" ? '100% маны получателя' : item.price} ${item.currency.toLowerCase() === "mana" ? "маны" : item.currency.toLowerCase() === "gold" ? "золота" : item.currency}`,
                        placeholder: "Выберите персонажа",
                        onConfirm: (buyerName) => {
                          if (buyerName) {
                            const newText = `${buyerName}  покупает ${item.name}`;
                            setInputValue(newText);
                            handleInputChange({ target: { value: newText } });
                          }
                          setContextMenu({ ...contextMenu, visible: false });
                        }
                      });
                    } else {
                      // Если уже есть текст, дописываем название товара
                      const newText = inputValue + item.name;
                      setInputValue(newText);
                      handleInputChange({ target: { value: newText } });
                      setContextMenu({ ...contextMenu, visible: false });
                    }
                  }}
                >
                  <span className="game-context-menu__item-name">{item.name}</span>
                  <span className="game-context-menu__item-price" {...currencyClass}>
                    {item.price} {item.currency === "mana" ? "маны" : item.currency === "gold" ? "золота" : item.currency}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        {renderInputModal()}
      </>
    );
  }

  // Рендер стандартного контекстного меню для персонажей (isCharacter === true)
  if (contextMenu.isCharacter) {
    const char = contextMenu.character;
    const defaultAttackDamage = char.stats.Урон;
    return (
      <>
        <div
          className="game-context-menu__container"
          style={{ top: contextMenu.y, left: contextMenu.x, position: 'fixed' }}
        >
          <ul className="game-context-menu__list">
            <li
              className="game-context-menu__item game-context-menu__item--attack"
              onClick={() => {
                openModal({
                  type: 'attack',
                  title: 'Атака персонажа',
                  subtitle: `Урон по умолчанию: ${defaultAttackDamage}`,
                  placeholder: 'Введите цель для атаки',
                  onConfirm: (target) => {
                    if (target) {
                      setInputValue(`${char.name}  атакует на ${defaultAttackDamage} физ.урона ${target}`);
                      handleInputChange({ target: { value: `${char.name}  атакует на ${defaultAttackDamage} физ.урона ${target}` } });
                    }
                    setContextMenu({ ...contextMenu, visible: false });
                  }
                });
              }}
            >
              <span className="game-context-menu__item-icon">⚔️</span>
              Атаковать
            </li>
            <li
              className="game-context-menu__item game-context-menu__item--buy"
              onClick={() => {
                setInputValue(`${char.name}  покупает `);
                handleInputChange({ target: { value: `${char.name}  покупает ` } });
                setContextMenu({ ...contextMenu, visible: false });
              }}
            >
              <span className="game-context-menu__item-icon">🛒</span>
              Купить
            </li>
            <li
              className="game-context-menu__item game-context-menu__item--effect"
              onClick={() => {
                openModal({
                  type: 'effect',
                  title: 'Получение эффекта',
                  subtitle: 'Например: Ядовитый урон на 2 ходов',
                  placeholder: 'Введите эффект и длительность',
                  onConfirm: (effect) => {
                    if (effect) {
                      setInputValue(`${char.name}  получает эффект ${effect}`);
                    }
                    setContextMenu({ ...contextMenu, visible: false });
                  }
                });
              }}
            >
              <span className="game-context-menu__item-icon">✨</span>
              Получить эффект
            </li>
            <li
              className="game-context-menu__item game-context-menu__item--hp"
              onClick={() => {
                setInputValue(`HP ${char.name} = `);
                setContextMenu({ ...contextMenu, visible: false });
              }}
            >
              <span className="game-context-menu__item-icon">❤️</span>
              Показать HP
            </li>
            <li
              className="game-context-menu__item game-context-menu__item--attribute"
              onClick={() => {
                openModal({
                  type: 'attribute',
                  title: 'Назначение атрибута',
                  subtitle: 'Например: Ловкость, Мана, Урон',
                  placeholder: 'Введите атрибут',
                  onConfirm: (attribute) => {
                    if (attribute) {
                      setInputValue(`${attribute} ${char.name} = `);
                      handleInputChange({ target: { value: `${attribute} ${char.name} = ` } });
                    }
                    setContextMenu({ ...contextMenu, visible: false });
                  }
                });
              }}
            >
              <span className="game-context-menu__item-icon">📊</span>
              Назначить атрибут
            </li>
          </ul>
        </div>
        {renderInputModal()}
      </>
    );
  }

  // Рендер контекстного меню для храма
  if (contextMenu.church) {
    return (
      <div
        className="game-context-menu__container"
        style={{ top: contextMenu.y, left: contextMenu.x }}
      >
        <div className="game-context-menu__header">
          <div className="game-context-menu__header-title">
            Храм {contextMenu.churchTeam === "red" ? "Красных" : "Синих"}
          </div>
          <span className="game-context-menu__item-price" data-currency="mana">
            {contextMenu.manaPerTurn} маны/ход
          </span>
        </div>
        <ul className="game-context-menu__list">
          <li
            className="game-context-menu__item game-context-menu__item--switch"
            onClick={() => {
              const newTeam = contextMenu.churchTeam === "red" ? "blue" : "red";
              const newCellClass = newTeam === "red" ? "red-church-cover" : "blue-church-cover";

              // Обновляем класс клетки
              const [colStr, rowStr] = contextMenu.cellCoord.split("-");
              const col = parseInt(colStr) - 1;
              const row = parseInt(rowStr) - 1;

              // Обновляем состояние храмов
              const updatedChurches = { ...matchState.churches };
              if (contextMenu.churchTeam === "red") {
                updatedChurches.red = updatedChurches.red.filter(coord => coord !== contextMenu.cellCoord);
                updatedChurches.blue.push(contextMenu.cellCoord);
              } else {
                updatedChurches.blue = updatedChurches.blue.filter(coord => coord !== contextMenu.cellCoord);
                updatedChurches.red.push(contextMenu.cellCoord);
              }

              // Обновляем matchState
              updateMatchState({ churches: updatedChurches }, 'partial');

              // Закрываем контекстное меню
              setContextMenu({ ...contextMenu, visible: false });
            }}
          >
            <span className="game-context-menu__item-icon">🔄</span>
            <span className="game-context-menu__item-name">
              Передать {contextMenu.churchTeam === "red" ? "Синим" : "Красным"}
            </span>
          </li>
        </ul>
      </div>
    );
  }

  // Если ни один режим не подошёл, возвращаем null
  return null;
};

export default ContextMenu