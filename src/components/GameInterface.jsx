import React, { useState } from "react";
import ChatConsole from "./ChatConsole";

const GameInterface = ({ characters, map }) => {
  // characters ожидается в виде { red: [...], blue: [...] }
  const [turn, setTurn] = useState(1);
  const [actionLog, setActionLog] = useState([]);

  const handleConsoleSubmit = (entry) => {
    // Добавляем запись в лог с указанием хода
    setActionLog([...actionLog, { turn, ...entry }]);
  };

  const nextTurn = () => {
    // Добавляем разделитель ходов (опционально)
    setActionLog([...actionLog, { turn, separator: true }]);
    setTurn(turn + 1);
  };

  // Данные для автодополнения (персонажи, предметы, постройки)
  const suggestionsData = {
    characters: [
      { name: "Саламандра" },
      { name: "Юань-ти" },
      { name: "Вендиго" },
      { name: "Повар" },
      // можно добавить ещё
    ],
    items: [
      { name: "Философский камень" },
      { name: "Корона Ра" },
      { name: "Изумруд времени" },
    ],
    buildings: [{ name: "Турель" }, { name: "Башня лучников" }],
  };

  return (
    <div className="game-interface">
      <h2>Партия на карте: {map}</h2>
      <div className="teams">
        <div className="team red">
          <h3>Красная команда</h3>
          <table>
            <thead>
              <tr>
                <th>Персонаж</th>
                <th>HP</th>
                <th>Урон</th>
                <th>Мана</th>
                <th>Ловкость</th>
                <th>Броня</th>
                <th>Дальность</th>
              </tr>
            </thead>
            <tbody>
              {characters.red.map((ch, i) => (
                <tr key={i}>
                  <td>{ch.name}</td>
                  <td>{ch.stats.HP}</td>
                  <td>{ch.stats.Урон}</td>
                  <td>{ch.stats.Мана}</td>
                  <td>{ch.stats.Ловкость}</td>
                  <td>{ch.stats.Броня}</td>
                  <td>{ch.stats.Дальность}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="team blue">
          <h3>Синяя команда</h3>
          <table>
            <thead>
              <tr>
                <th>Персонаж</th>
                <th>HP</th>
                <th>Урон</th>
                <th>Мана</th>
                <th>Ловкость</th>
                <th>Броня</th>
                <th>Дальность</th>
              </tr>
            </thead>
            <tbody>
              {characters.blue.map((ch, i) => (
                <tr key={i}>
                  <td>{ch.name}</td>
                  <td>{ch.stats.HP}</td>
                  <td>{ch.stats.Урон}</td>
                  <td>{ch.stats.Мана}</td>
                  <td>{ch.stats.Ловкость}</td>
                  <td>{ch.stats.Броня}</td>
                  <td>{ch.stats.Дальность}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="chat-section">
        <h3>Ход {turn}</h3>
        <div className="action-log">
          {actionLog.map((entry, i) =>
            entry.separator ? (
              <div key={i} className="turn-separator">
                --- Ход {entry.turn} завершён ---
              </div>
            ) : (
              <div key={i} className="chat-entry">
                <span>[{entry.turn}]</span> {entry.text} (
                <em>{entry.actionType}</em>)
              </div>
            )
          )}
        </div>
        <ChatConsole
          onSubmit={handleConsoleSubmit}
          suggestionsData={suggestionsData}
        />
        <button onClick={nextTurn}>Следующая очередь</button>
      </div>
    </div>
  );
};

export default GameInterface;
