/* eslint-disable react/prop-types */
import React, { useState } from "react";
import { abilities as abilitiesList } from "../../abilities.js";

const CharacterModal = ({ character, onClose }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!character) return null;

  // Функция определения типа эффекта
  // const getEffectType = (effect) => {
  //   const positiveEffects = [
  //     "Лечение",
  //     "Щит",
  //     "Ускорение",
  //     "Усиление урона",
  //     "Иммунитет",
  //     "Точность",
  //     "Вампиризм",
  //   ];
  //   const negativeEffects = [
  //     "Ядовитый урон",
  //     "Слабость",
  //     "Уязвимость",
  //     "Опутывание",
  //     "Оглушение",
  //     "Обезоруживание",
  //   ];
  //   const neutralEffects = [
  //     "Невидимость",
  //     "Полет",
  //     "Страх",
  //     "Притягивание",
  //     "Провокация",
  //   ];
  //   if (positiveEffects.some((e) => effectName.includes(e))) return "positive";
  //   if (negativeEffects.some((e) => effectName.includes(e))) return "negative";
  //   if (neutralEffects.some((e) => effectName.includes(e))) return "neutral";
  //   return "neutral"; // По умолчанию считаем эффект нейтральным
  // };

  const getProperValue = (key) => {
    let value;
    if (key == "Урон") {
      value = character.currentDamage;
    } else if (key == "Мана") {
      value = character.currentMana;
    } else if (key == "Ловкость") {
      value = character.currentAgility;
    } else if (key == "Броня") {
      value = character.currentArmor;
    } else if (key == "Дальность") {
      value = character.currentRange;
    }
    return value;
  };

  // Функция получения стиля для эффекта
  const getEffectStyle = (effect) => {
    const type = effect.effectType;
    const baseStyle = {
      padding: "8px 12px",
      margin: "4px",
      borderRadius: "6px",
      fontSize: "14px",
      fontWeight: "500",
      alignItems: "center",
      gap: "8px",
      transition: "all 0.2s ease",
    };
    switch (type) {
      case "positive":
        return {
          ...baseStyle,
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          color: "#22c55e",
          border: "1px solid rgba(34, 197, 94, 0.2)",
        };
      case "negative":
        return {
          ...baseStyle,
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          color: "#ef4444",
          border: "1px solid rgba(239, 68, 68, 0.2)",
        };
      case "neutral":
      default:
        return {
          ...baseStyle,
          backgroundColor: "rgba(75, 85, 99, 0.1)",
          color: "#4b5563",
          border: "1px solid rgba(75, 85, 99, 0.2)",
        };
    }
  };

  // Функция получения иконки для эффекта
  const getEffectIcon = (effectType) => {
    switch (effectType) {
      case "positive":
        return "✨";
      case "negative":
        return "💀";
      case "neutral":
      default:
        return "🔄";
    }
  };

  // Стили для оверлея (центрирование окна)
  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  // Стили для контейнера модального окна (центрированное положение)
  const modalContainerStyle = {
    backgroundColor: "#1f2937", // фоновый цвет для всего окна
    borderRadius: "12px",
    overflow: "hidden",
    display: "flex",
    maxWidth: showDetails ? "860px" : "500px",
    width: "100%",
    maxHeight: "90vh",
    transition: "max-width 0.3s ease",
    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
    margin: "0 auto", // Обеспечиваем центрирование
  };

  const mainContentStyle = {
    width: "460px",
    flexShrink: 0,
    padding: "16px 20px",
    overflow: "scroll",
  };

  // Стиль для контейнера изображения персонажа
  const characterImageContainerStyle = {
    width: "120px",
    height: "120px",
    borderRadius: "8px",
    overflow: "hidden",
    marginBottom: "16px",
    backgroundColor: "rgba(75, 85, 99, 0.1)", // Фон для случая, если изображение не загрузится
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(75, 85, 99, 0.2)",
  };

  // Стиль для изображения
  const characterImageStyle = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center top",
  };

  // Стиль для гибкого контейнера заголовка
  const headerFlexStyle = {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "20px",
  };

  // Стиль для информации о персонаже в заголовке
  const headerInfoStyle = {
    flex: 1,
  };

  // Правый блок "подробностей" (теперь с тем же фоном, что и основной блок)
  const detailsContentStyle = {
    width: "400px",
    padding: "20px",
    borderLeft: "1px solid rgba(75, 85, 99, 0.2)",
    animation: showDetails
      ? "characterModalInfoSlideRight 0.3s ease-out forwards"
      : "none",
    overflowY: "auto",
    maxHeight: "90vh", // чтобы вертикальный скролл внутри блока
  };

  // Стиль для кнопки "Подробнее/←/→" (исправленная стрелка)
  const detailsButtonStyle = {
    position: "absolute",
    right: 0,
    top: "60%",
    transform: "translateY(-50%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 8px",
    width: "32px",
    height: "64px",
    backgroundColor: "rgba(75, 85, 99, 0.2)",
    color: "#e5e7eb",
    border: "1px solid rgba(75, 85, 99, 0.3)",
    borderRadius: showDetails ? "0 8px 8px 0" : "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.3s ease",
    zIndex: 10,
    textOrientation: "mixed",
  };

  // Стиль для кнопки закрытия (теперь перемещается с краем окна)
  const closeButtonStyle = {
    position: "absolute",
    top: "10px",
    right: "10px", // Всегда в правом углу окна, независимо от состояния
    zIndex: 20,
    background: "transparent",
    border: "none",
    fontSize: "20px",
    color: "#eee",
    cursor: "pointer",
  };

  // --- Стили для секций расширенного блока ---
  const sectionTitleStyle = {
    fontSize: "16px",
    fontWeight: "600",
    color: "#e5e7eb",
    marginBottom: "12px",
    marginTop: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const infoRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid rgba(75, 85, 99, 0.1)",
  };

  const propertyNameStyle = {
    color: "#9ca3af",
    fontSize: "14px",
  };

  const propertyValueStyle = {
    color: "#e5e7eb",
    fontSize: "14px",
    fontWeight: "500",
  };

  // функция для булевых значений
  const getBooleanValueStyle = (value) => ({
    ...propertyValueStyle,
    color: value ? "#22c55e" : "#ef4444",
  });

  // --- стили для способностей (abilities) ---
  const abilityContainerStyle = {
    backgroundColor: "rgba(31, 41, 55, 0.2)",
    borderRadius: "8px",
    padding: "12px",
    margin: "8px 0",
    border: "1px solid rgba(75, 85, 99, 0.1)",
  };

  const abilityHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  };

  const abilityKeyStyle = {
    color: "#60a5fa",
    fontSize: "14px",
    fontWeight: "500",
  };

  const abilityCooldownStyle = {
    color: "#9ca3af",
    fontSize: "12px",
    backgroundColor: "rgba(75, 85, 99, 0.1)",
    padding: "4px 8px",
    borderRadius: "12px",
  };

  const abilityDescriptionStyle = {
    color: "#d1d5db",
    fontSize: "14px",
    lineHeight: "1.4",
  };

  // Получаем URL для изображения персонажа
  const getCharacterImageUrl = () => {
    // Проверяем наличие свойства image у персонажа
    if (character.image) {
      // Используем имя файла из свойства image
      return `https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/characters/${character.image}`;
    }
    // Заглушка, если изображение не указано
    return null;
  };

  // Рендер расширенного блока (подробности)
  const renderAdditionalInfo = () => {
    return (
      <div
        style={detailsContentStyle}
        className="character-modal__additional-info"
      >
        {/* Functions */}
        {character.functions && (
          <div className="character-modal__functions-section">
            <h4 style={sectionTitleStyle}>
              <span style={{ fontSize: "18px" }}>⚙️</span> Функциональность
            </h4>
            <div>
              <div style={infoRowStyle}>
                <span style={propertyNameStyle}>Способность двигаться</span>
                <span
                  style={getBooleanValueStyle(
                    character.functions.movementAbility
                  )}
                >
                  {character.functions.movementAbility ? "Да" : "Нет"}
                </span>
              </div>
              <div style={infoRowStyle}>
                <span style={propertyNameStyle}>Способность действовать</span>
                <span
                  style={getBooleanValueStyle(
                    character.functions.actionAbility
                  )}
                >
                  {character.functions.actionAbility ? "Да" : "Нет"}
                </span>
              </div>
              <div style={infoRowStyle}>
                <span style={propertyNameStyle}>
                  Использование способностей
                </span>
                <span
                  style={getBooleanValueStyle(
                    character.functions.abilityUsability
                  )}
                >
                  {character.functions.abilityUsability ? "Да" : "Нет"}
                </span>
              </div>
              <div style={infoRowStyle}>
                <span style={propertyNameStyle}>Использование предметов</span>
                <span
                  style={getBooleanValueStyle(
                    character.functions.itemUsability
                  )}
                >
                  {character.functions.itemUsability ? "Да" : "Нет"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Settings */}
        {character.advancedSettings && (
          <div
            className="character-modal__advanced-settings-section"
            style={{ marginTop: "24px" }}
          >
            <h4 style={sectionTitleStyle}>
              <span style={{ fontSize: "18px" }}>🔮</span> Расширенные настройки
            </h4>
            <div>
              <div style={infoRowStyle}>
                <span style={propertyNameStyle}>
                  Множитель получаемого урона
                </span>
                <span style={propertyValueStyle}>
                  {character.advancedSettings.appliedDamageMultiplier}×
                </span>
              </div>
              <div style={infoRowStyle}>
                <span style={propertyNameStyle}>
                  Множитель наносимого урона
                </span>
                <span style={propertyValueStyle}>
                  {character.advancedSettings.damageMultiplier}×
                </span>
              </div>
              <div style={infoRowStyle}>
                <span style={propertyNameStyle}>Вампиризм</span>
                <span style={propertyValueStyle}>
                  {character.advancedSettings.vampirism}%
                </span>
              </div>
              <div style={infoRowStyle}>
                <span style={propertyNameStyle}>Базовый шанс уворота</span>
                <span style={propertyValueStyle}>
                  {character.advancedSettings.basicDodge}%
                </span>
              </div>
              <div style={infoRowStyle}>
                <span style={propertyNameStyle}>Продвинутый шанс уворота</span>
                <span style={propertyValueStyle}>
                  {character.advancedSettings.advancedDodge}%
                </span>
              </div>
              <div style={infoRowStyle}>
                <span style={propertyNameStyle}>Слой персонажа</span>
                <span style={propertyValueStyle}>
                  {character.advancedSettings.characterLayer}
                </span>
              </div>
              <div style={infoRowStyle}>
                <span style={propertyNameStyle}>Тип урона</span>
                <span
                  style={{
                    ...propertyValueStyle,
                    color:
                      character.advancedSettings.damageType === "физический"
                        ? "#f97316"
                        : character.advancedSettings.damageType === "магический"
                          ? "#8b5cf6"
                          : "#e5e7eb",
                  }}
                >
                  {character.advancedSettings.damageType}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={modalOverlayStyle} className="modal-overlay">
      <div className="character-modal" style={modalContainerStyle}>
        {/* Основной контент (слева) */}
        <div style={mainContentStyle}>
          <div className="modal-header" style={{ marginBottom: "16px" }}>
            <div style={headerFlexStyle}>
              {/* Контейнер для изображения персонажа */}
              {character.image && (
                <div style={characterImageContainerStyle}>
                  <img
                    src={getCharacterImageUrl()}
                    alt={character.name}
                    style={characterImageStyle}
                  />
                </div>
              )}

              {/* Информация о персонаже */}
              <div style={headerInfoStyle}>
                <h3
                  className="character-name"
                  style={{ fontSize: "20px", color: "#fff", margin: 0 }}
                >
                  {character.name}
                </h3>
                <div
                  className="character-type"
                  style={{
                    color: "#bbb",
                    fontSize: "14px",
                    marginTop: "4px",
                    display: "inline-block",
                  }}
                >
                  {character.type}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-body">
            {/* HP Bar */}
            <div className="character-hp" style={{ marginBottom: "16px" }}>
              <div
                className="hp-label"
                style={{ marginBottom: "4px", color: "#9ca3af" }}
              >
                HP
              </div>
              <div
                className="hp-bar"
                style={{
                  backgroundColor: "#4b5563",
                  height: "8px",
                  borderRadius: "4px",
                }}
              >
                <div
                  className="hp-fill"
                  style={{
                    height: "100%",
                    borderRadius: "4px",
                    width: `${(character.currentHP / (character.stats.HP || 1)) * 100
                      }%`,
                    backgroundColor:
                      character.currentHP < (character.stats.HP || 1) * 0.3
                        ? "#ef4444"
                        : "#22c55e",
                    transition: "width 0.3s",
                  }}
                />
              </div>
              <div
                className="hp-value"
                style={{ marginTop: "4px", fontSize: "14px", color: "#e5e7eb" }}
              >
                {character.currentHP} / {character.stats.HP}
              </div>
            </div>

            {/* Main Stats */}
            <div
              className="stats-grid"
              style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
            >
              {character.stats &&
                Object.entries(character.stats).map(([key, value]) =>
                  key !== "HP" ? (
                    <div
                      key={key}
                      className="stat-card"
                      style={{
                        borderRadius: "6px",
                        padding: "8px 12px",
                        width: "calc(50% - 8px)",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <div className="stat-icon" style={{ fontSize: "16px" }}>
                        {key === "Урон" && "⚔️"}
                        {key === "Мана" && "✨"}
                        {key === "Броня" && "🛡️"}
                        {key === "Ловкость" && "💨"}
                        {key === "Дальность" && "🎯"}
                      </div>
                      <div className="stat-info">
                        <div
                          className="stat-name"
                          style={{ color: "#9ca3af", fontSize: "12px" }}
                        >
                          {key}
                        </div>
                        <div
                          className="stat-value"
                          style={{ color: "#fff", fontSize: "14px" }}
                        >
                          {getProperValue(key)}/{key === "Броня" ? 5 : value}
                        </div>
                      </div>
                    </div>
                  ) : null
                )}
            </div>

            {/* Inventory */}
            {character.inventory && character.inventory.length > 0 && (
              <div className="inventory-section" style={{ marginTop: "16px" }}>
                <h4 style={{ color: "#fff", marginBottom: "8px" }}>
                  Инвентарь
                </h4>
                <div
                  className="inventory-grid"
                  style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}
                >
                  {character.inventory.map((item, index) => (
                    <div
                      key={index}
                      className="inventory-item"
                      style={{
                        backgroundColor: "rgba(31, 41, 55, 0.2)",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        color: "#e5e7eb",
                        fontSize: "14px",
                      }}
                    >
                      {item.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Effects */}
            {character.effects?.length > 0 && (
              <div className="effects-section" style={{ marginTop: 16 }}>
                <h4 style={{ color: "#fff", marginBottom: 8 }}>Эффекты</h4>

                <div className="effects-list" style={{ display: "flex", flexDirection: "column" }}>
                  {character.effects.map((effect, index) => (
                    <div
                      key={index}
                      className="effect-item"
                      style={getEffectStyle(effect)}   /* фон/бордер по типу */
                    >
                      {/* строка с иконкой, названием и ходами */}
                      <div className="effect-header">
                        <span className="effect-icon">{getEffectIcon(effect.effectType)}</span>
                        <span className="effect-name">{effect.name}</span>
                        {effect.turnsRemain !== undefined && (
                          <span className="effect-turns">({effect.turnsRemain})</span>
                        )}
                      </div>

                      {/* Описание будет раскрываться/скрываться по ховеру */}
                      {effect.description && (
                        <div className="effect-description">
                          {effect.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Abilities */}
            {character.abilities && character.abilities.length > 0 && (
              <div
                className="character-modal__abilities-section"
                style={{ marginTop: "16px" }}
              >
                <h4
                  style={{
                    color: "#fff",
                    fontSize: "16px",
                    marginBottom: "12px",
                  }}
                >
                  Способности
                </h4>
                {character.abilities.map((ability, index) => (
                  <div key={index} style={abilityContainerStyle}>
                    <div style={abilityHeaderStyle}>
                      <div style={abilityKeyStyle}>
                        {abilitiesList[ability.key].name}
                      </div>
                      <div style={abilityCooldownStyle}>
                        Перезарядка: {ability.coolDown}{" "}
                        {ability.coolDown > 1
                          ? ability.coolDown < 5
                            ? "хода"
                            : "ходов"
                          : "ход"}
                      </div>
                    </div>
                    <div style={abilityDescriptionStyle}>
                      {ability.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Кнопка подробнее (на границе между основным и дополнительным контентом) */}
        <button
          style={detailsButtonStyle}
          onClick={() => setShowDetails(!showDetails)}
          className="character-modal__details-toggle"
        >
          {showDetails ? "←" : "→"}{" "}
          {/* Стрелка показывает направление (вправо/влево) */}
        </button>

        {/* Дополнительная информация (раскрывается вправо) */}
        {showDetails && renderAdditionalInfo()}

        {/* Кнопка закрытия */}
        <button
          style={closeButtonStyle}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          ✕
        </button>

        {/* CSS для анимации блока справа */}
        <style jsx>{`
          @keyframes characterModalInfoSlideRight {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default CharacterModal;
