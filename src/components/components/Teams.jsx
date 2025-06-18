/* eslint-disable react/prop-types */
import { Users, ChevronRight } from "lucide-react";

const Teams = ({
  matchState,
  handleHoveredCharacter,
  hoveredCharacter,
  handleCharacterClick,
  handleCharacterInsert,
}) => {
  // Функция для получения URL изображения персонажа
  const getCharacterImageUrl = (character) => {
    // Проверяем наличие свойства image у персонажа
    if (character.image) {
      // Используем имя файла из свойства image
      return `/assets/characters/${character.image}`;
    }
    // Возвращаем null, если изображение не указано
    return null;
  };

  return (
    <div className="teams-container">
      <div className="team team1">
        <div className="team-header mini">
          <h3>Команда красных</h3>
          <div className="team-stats mini">
            <span className="gold">Золото: {matchState.teams.red.gold}</span>
            <span className="hp">HP базы: {matchState.teams.red.baseHP}</span>
          </div>
        </div>
        {matchState.teams.red.characters.map((char, index) => (
          <div
            key={index}
            className="character-item"
            onMouseEnter={() => handleHoveredCharacter(char)}
            onMouseLeave={() => handleHoveredCharacter(null)}
            onClick={() => handleCharacterClick(char)}
            style={{
              position: "relative",
              overflow: "hidden",
              padding: "10px 12px",
              marginBottom: "8px",
              borderLeft: "3px solid #ef4444",
              backgroundColor: "#202020",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            {/* Фоновое изображение персонажа */}
            {char.image && (
              <div
                style={{
                  position: "absolute",
                  right: "0",
                  top: "0",
                  width: "60px",
                  height: "100%",
                  opacity: "0.15", // Полупрозрачное изображение
                  backgroundImage: `url(${getCharacterImageUrl(char)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "grayscale(30%)", // Небольшое обесцвечивание для лучшей интеграции
                  zIndex: "1",
                  borderTopRightRadius: "8px",
                  borderBottomRightRadius: "8px",
                }}
              />
            )}
            {/* Содержимое элемента с персонажем */}
            <div style={{ position: "relative", zIndex: "2" }}>
              <span
                className="char-name"
                style={{
                  display: "block",
                  color: "#e5e7eb",
                  fontWeight: "500",
                  fontSize: "1rem",
                  marginBottom: "4px",
                }}
              >
                {char.name}
              </span>
              <span
                className="char-type"
                style={{
                  display: "block",
                  color: "#9ca3af",
                  fontSize: "0.875rem",
                  transition: "all 0.3s ease",
                }}
              >
                {char.type}
              </span>
              {hoveredCharacter === char && (
                <ChevronRight
                  className="insert-character"
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#60a5fa",
                    transition: "all 0.3s ease",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCharacterInsert(char);
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="team team2">
        <div className="team-header mini">
          <h3>Команда синих</h3>
          <div className="team-stats mini">
            <span className="gold">Золото: {matchState.teams.blue.gold}</span>
            <span className="hp">HP базы: {matchState.teams.blue.baseHP}</span>
          </div>
        </div>
        {matchState.teams.blue.characters.map((char, index) => (
          <div
            key={index}
            className="character-item"
            onMouseEnter={() => handleHoveredCharacter(char)}
            onMouseLeave={() => handleHoveredCharacter(null)}
            onClick={() => handleCharacterClick(char)}
            style={{
              position: "relative",
              overflow: "hidden",
              padding: "10px 12px",
              marginBottom: "8px",
              borderLeft: "3px solid #3b82f6",
              backgroundColor: "#202020",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            {/* Фоновое изображение персонажа */}
            {char.image && (
              <div
                style={{
                  position: "absolute",
                  right: "0",
                  top: "0",
                  width: "60px",
                  height: "100%",
                  opacity: "0.15", // Полупрозрачное изображение
                  backgroundImage: `url(${getCharacterImageUrl(char)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "grayscale(30%)", // Небольшое обесцвечивание для лучшей интеграции
                  zIndex: "1",
                  borderTopRightRadius: "8px",
                  borderBottomRightRadius: "8px",
                }}
              />
            )}
            {/* Содержимое элемента с персонажем */}
            <div style={{ position: "relative", zIndex: "2" }}>
              <span
                className="char-name"
                style={{
                  display: "block",
                  color: "#e5e7eb",
                  fontWeight: "500",
                  fontSize: "1rem",
                  marginBottom: "4px",
                }}
              >
                {char.name}
              </span>
              <span
                className="char-type"
                style={{
                  display: "block",
                  color: "#9ca3af",
                  fontSize: "0.875rem",
                  transition: "all 0.3s ease",
                }}
              >
                {char.type}
              </span>
              {hoveredCharacter === char && (
                <ChevronRight
                  className="insert-character"
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#60a5fa",
                    transition: "all 0.3s ease",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCharacterInsert(char);
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Teams;
