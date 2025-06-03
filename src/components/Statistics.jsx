/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import {
  ChevronRight,
  Play,
  Pause,
  ArrowLeft,
  Activity,
  PieChart,
  BarChart2,
  Calendar,
  Clock,
  Award,
  Target,
  Zap,
  DollarSign,
  Users,
  Move,
  BookOpen,
  Shield,
  Heart,
  User,
  X,
  GitCommit,
  TrendingUp,
  Search,
} from "lucide-react";
import "../styles/statistics.css";

const Statistics = () => {
  const [matches, setMatches] = useState([]);
  const [filter, setFilter] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedTimelineMatch, setSelectedTimelineMatch] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null); // для модального окна персонажа
  const [loading, setLoading] = useState(true);
  const [currentTimelineTurn, setCurrentTimelineTurn] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timelineLog, setTimelineLog] = useState([]);
  // Загрузка данных из localStorage (массив партий)
  useEffect(() => {
    const storedArray = localStorage.getItem("globalArray");
    if (storedArray) {
      try {
        const parsed = JSON.parse(storedArray);
        setMatches(parsed);
      } catch (e) {
        console.error("Ошибка парсинга JSON:", e);
        setMatches([]);
      }
    }
    setLoading(false);
  }, []);

  const filteredMatches = matches.filter((match) => {
    if (filter.trim() === "") return true;
    return (
      match.id.toLowerCase().includes(filter.toLowerCase()) ||
      match.date.includes(filter)
    );
  });

  // Функция форматирования длительности (ч:м:с)
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}ч ${mins}м ${secs}с`;
  };

  // Общие расчёты
  const totalMatches = matches.length;
  const avgTurns =
    matches.reduce((sum, m) => sum + m.turn, 0) / totalMatches || 0;
  const avgDuration =
    matches.reduce((sum, m) => sum + m.gameDuration, 0) / totalMatches || 0;
  const avgTurnDuration =
    matches.reduce((sum, m) => sum + m.gameDuration / m.turn, 0) /
      totalMatches || 0;
  const avgTurnDurationRounded = Math.round(avgTurnDuration);
  const formatTurnDuration = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}м ${secs < 10 ? "0" : ""}${secs}с`;
  };

  // Остальные вычисления, например для золота, урона, перемещений, рейтинга типов и т.д.
  const avgGoldTeam =
    totalMatches > 0
      ? matches.reduce((sum, m) => {
          const redGold = m.teams?.red?.gold || 0;
          const blueGold = m.teams?.blue?.gold || 0;
          return sum + (redGold + blueGold) / 2;
        }, 0) / totalMatches
      : 0;

  // Для расчёта урона по атакам разделим персонажей по командам (на основе общепринятых имён)
  const redNames = [
    "Подсолнух",
    "Король некромантов",
    "Заклинатель рун",
    "Юань-ти",
    "Легионер",
  ];
  const blueNames = [
    "Дракула",
    "Пламенный шаман",
    "Голиаф",
    "Лесной брат",
    "Леприкон",
  ];

  // Средний урон за ход одной команды (только атаки)
  const avgAttackDamagePerTurnTeam =
    totalMatches > 0
      ? matches.reduce((sum, m) => {
          const redAttackDamage = (m.actions || [])
            .filter((a) => a.type === "attack" && redNames.includes(a.attacker))
            .reduce((s, a) => s + (a.damage || 0), 0);
          const blueAttackDamage = (m.actions || [])
            .filter(
              (a) => a.type === "attack" && blueNames.includes(a.attacker)
            )
            .reduce((s, a) => s + (a.damage || 0), 0);
          const redPerTurn = m.turn ? redAttackDamage / m.turn : 0;
          const bluePerTurn = m.turn ? blueAttackDamage / m.turn : 0;
          return sum + (redPerTurn + bluePerTurn) / 2;
        }, 0) / totalMatches
      : 0;

  // Общее количество использований способностей (action.type === 'ability')
  const totalAbilitiesUsed =
    totalMatches > 0
      ? matches.reduce(
          (sum, m) =>
            sum + (m.actions?.filter((a) => a.type === "ability").length || 0),
          0
        )
      : 0;
  const purchaseRegex = /покупает\s+.+\s+за\s+(\d+)\s+золота/i;
  const totalGoldSpent =
    totalMatches > 0
      ? matches.reduce((sum, m) => {
          const matchPurchases = (m.actions || []).filter(
            (a) => a.type === "generic" && purchaseRegex.test(a.text)
          );
          const goldInMatch = matchPurchases.reduce((s, a) => {
            const res = a.text.match(purchaseRegex);
            return s + (res ? parseInt(res[1]) : 0);
          }, 0);
          return sum + goldInMatch;
        }, 0)
      : 0;
  const avgGoldSpent = totalMatches ? totalGoldSpent / totalMatches : 0;
  const totalPurchaseCount =
    totalMatches > 0
      ? matches.reduce((sum, m) => {
          const count = (m.actions || []).filter(
            (a) => a.type === "generic" && purchaseRegex.test(a.text)
          ).length;
          return sum + count;
        }, 0)
      : 0;
  const avgPurchaseCount = totalMatches ? totalPurchaseCount / totalMatches : 0;
  const typeCounts = {};
  matches.forEach((m) => {
    if (m.teams) {
      ["red", "blue"].forEach((teamKey) => {
        const team = m.teams[teamKey];
        if (team && team.characters) {
          team.characters.forEach((ch) => {
            const type = ch.type;
            typeCounts[type] = (typeCounts[type] || 0) + 1;
          });
        }
      });
    }
  });
  const totalChars = Object.values(typeCounts).reduce((s, v) => s + v, 0);
  const typeRatings = Object.keys(typeCounts)
    .map((type) => ({
      type,
      count: typeCounts[type],
      percentage: ((typeCounts[type] / totalChars) * 100).toFixed(1),
    }))
    .sort((a, b) => b.count - a.count);
  let totalMoveDistance = 0;
  let totalMoveCount = 0;
  matches.forEach((m) => {
    const movesByChar = {};
    (m.actions || [])
      .filter((a) => a.type === "move" && a.coords)
      .forEach((a) => {
        if (!movesByChar[a.character]) movesByChar[a.character] = [];
        movesByChar[a.character].push({ turn: a.turn, coords: a.coords });
      });
    Object.values(movesByChar).forEach((moves) => {
      moves.sort((a, b) => a.turn - b.turn);
      for (let i = 0; i < moves.length - 1; i++) {
        const [x1, y1] = moves[i].coords.split("-").map(Number);
        const [x2, y2] = moves[i + 1].coords.split("-").map(Number);
        const dist = Math.abs(x2 - x1) + Math.abs(y2 - y1);
        totalMoveDistance += dist;
        totalMoveCount++;
      }
    });
  });
  const avgMovementDistance = totalMoveCount
    ? (totalMoveDistance / totalMoveCount).toFixed(2)
    : 0;
  const allActions = matches.flatMap((m) => m.actions || []);
  const totalAttackActions = allActions.filter(
    (a) => a.type === "attack"
  ).length;
  const totalAbilityActions = allActions.filter(
    (a) => a.type === "ability"
  ).length;
  const totalMoveActions = allActions.filter((a) => a.type === "move").length;
  const totalPurchaseActions = allActions.filter(
    (a) => a.type === "generic" && purchaseRegex.test(a.text)
  ).length;
  const totalCountActions =
    totalAttackActions +
    totalAbilityActions +
    totalMoveActions +
    totalPurchaseActions;
  const percentAttack = totalCountActions
    ? ((totalAttackActions / totalCountActions) * 100).toFixed(1)
    : 0;
  const percentAbility = totalCountActions
    ? ((totalAbilityActions / totalCountActions) * 100).toFixed(1)
    : 0;
  const percentMove = totalCountActions
    ? ((totalMoveActions / totalCountActions) * 100).toFixed(1)
    : 0;
  const percentPurchase = totalCountActions
    ? ((totalPurchaseActions / totalCountActions) * 100).toFixed(1)
    : 0;
  const statusMapping = {
    red_base_destroyed: "Красная база разрушена",
    red_team_destroyed: "Красные персонажи уничтожены",
    blue_base_destroyed: "Синяя база разрушена",
    blue_team_destroyed: "Синие персонажи уничтожены",
    in_process: "Партия не доиграна",
  };
  const statusCounts = {};
  matches.forEach((m) => {
    const status = m.status;
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });
  const statusLabels = Object.keys(statusCounts).map(
    (key) => statusMapping[key] || key
  );
  const statusData = Object.values(statusCounts);
  const statusChartData = {
    labels: statusLabels,
    datasets: [
      {
        data: statusData,
        backgroundColor: [
          "#ef4444",
          "#f3f4f6",
          "#8b5cf6",
          "#4c1d95",
          "#6d28d9",
        ],
      },
    ],
  };
  const actionsChartData = {
    labels: ["Атака", "Способность", "Перемещение", "Покупка"],
    datasets: [
      {
        data: [
          Number(percentAttack),
          Number(percentAbility),
          Number(percentMove),
          Number(percentPurchase),
        ],
        backgroundColor: ["#ef4444", "#10b981", "#6d28d9", "#f59e0b"],
      },
    ],
  };
  const parameterList = [
    {
      name: "Общее число партий",
      value: totalMatches,
      description: "Общее количество сыгранных партий",
      icon: <Activity size={18} />,
    },
    {
      name: "Длительность партии",
      value: avgDuration ? formatDuration(Math.round(avgDuration)) : "0",
      description: "Длительность в формате ч:м:с",
      icon: <Clock size={18} />,
    },
    {
      name: "Ходов в партии",
      value: avgTurns.toFixed(1),
      description: "Среднее количество ходов в партии",
      icon: <GitCommit size={18} />,
    },
    {
      name: "Длительность хода",
      value: formatTurnDuration(avgTurnDuration),
      description: "Длительность хода в формате м:с",
      icon: <Clock size={18} />,
    },
    {
      name: "Урон за ход (команда)",
      value: avgAttackDamagePerTurnTeam.toFixed(2),
      description: "Средний урон за ход одной команды (атаки)",
      icon: <Target size={18} />,
    },
    {
      name: "Золото (команда)",
      value: avgGoldTeam.toFixed(2),
      description: "Среднее золото, заработанное одной командой",
      icon: <DollarSign size={18} />,
    },
    {
      name: "Покупки (кол-во)",
      value: avgPurchaseCount.toFixed(2),
      description: "Среднее число покупок за партию",
      icon: <DollarSign size={18} />,
    },
    {
      name: "Потрачено золота",
      value: avgGoldSpent.toFixed(2),
      description: "Среднее количество золота, потраченное обеими командами",
      icon: <DollarSign size={18} />,
    },
    {
      name: "Дальность перемещения",
      value: avgMovementDistance,
      description: "Средняя дальность перемещения между ходами",
      icon: <Move size={18} />,
    },
    {
      name: "Использовано способностей",
      value: totalAbilitiesUsed,
      description: "Общее количество использованных способностей",
      icon: <Zap size={18} />,
    },
    {
      name: "Действия: атаки",
      value: `${percentAttack}%`,
      description: "Процент атак от всех действий",
      icon: <Target size={18} />,
    },
    {
      name: "Действия: способности",
      value: `${percentAbility}%`,
      description: "Процент способностей от всех действий",
      icon: <Zap size={18} />,
    },
    {
      name: "Действия: перемещения",
      value: `${percentMove}%`,
      description: "Процент перемещений от всех действий",
      icon: <Move size={18} />,
    },
    {
      name: "Действия: покупки",
      value: `${percentPurchase}%`,
      description: "Процент покупок от всех действий",
      icon: <DollarSign size={18} />,
    },
  ];

  // Функция вычисления детальной статистики для каждого персонажа
  const computeDetailedCharacterStats = () => {
    const stats = {}; // ключ – имя персонажа
    matches.forEach((match) => {
      // Для каждой команды
      ["red", "blue"].forEach((teamKey) => {
        if (
          match.teams &&
          match.teams[teamKey] &&
          match.teams[teamKey].characters
        ) {
          match.teams[teamKey].characters.forEach((character) => {
            if (!stats[character.name]) {
              stats[character.name] = {
                totalDamage: 0,
                gamesPlayed: 0,
                totalAliveTurns: 0,
                baseDamage: 0,
                purchases: {},
                totalAgility: 0,
                agilityCount: 0,
              };
            }
            stats[character.name].gamesPlayed += 1;
            // Добавляем базовую ловкость из статов персонажа
            stats[character.name].totalAgility +=
              character.stats["Ловкость"] || 0;
            stats[character.name].agilityCount += 1;
            if (character.currentHP > 0) {
              stats[character.name].totalAliveTurns += match.turn;
            }
          });
        }
      });
      // Обработка действий в партии
      if (match.actions) {
        match.actions.forEach((action) => {
          const charName = action.character;
          if (stats[charName]) {
            if (action.type === "attack" && typeof action.damage === "number") {
              stats[charName].totalDamage += action.damage;
              if (
                action.target &&
                action.target.toLowerCase().includes("база")
              ) {
                stats[charName].baseDamage += action.damage;
              }
            }
            if (
              action.type === "generic" &&
              action.text.toLowerCase().includes("покупает")
            ) {
              const purchaseMatch = action.text.match(/покупает\s+(.+)/i);
              if (purchaseMatch) {
                const item = purchaseMatch[1].trim();
                stats[charName].purchases[item] =
                  (stats[charName].purchases[item] || 0) + 1;
              }
            }
          }
        });
      }
    });
    const detailedStats = [];
    for (const name in stats) {
      const data = stats[name];
      detailedStats.push({
        name,
        avgDamage: (data.totalDamage / data.gamesPlayed).toFixed(2),
        avgAliveTurns: (data.totalAliveTurns / data.gamesPlayed).toFixed(2),
        avgBaseDamage: (data.baseDamage / data.gamesPlayed).toFixed(2),
        avgAgility: (data.totalAgility / data.agilityCount).toFixed(2),
        mostPurchased:
          Object.entries(data.purchases).sort((a, b) => b[1] - a[1])[0]?.[0] ||
          "Нет",
      });
    }
    return detailedStats;
  };

  // Используем вычисленные детальные данные для отображения карточек
  const detailedCharacterStats = computeDetailedCharacterStats();

  // Отрисовка карточек персонажей (два столбца)
  const renderCharacterStatsTab = () => (
    <div className="statistics-container">
      <h2>
        <User size={20} /> Статистика персонажей
      </h2>
      <div className="character-grid">
        {detailedCharacterStats.map((char, i) => (
          <div
            key={i}
            className="character-card"
            onClick={() => setSelectedCharacter(char)}
            style={{
              backgroundImage: `url(${char.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <h3>{char.name}</h3>
            <div className="stats-preview">
              <span>
                <Target size={16} /> Урон: {char.avgDamage}
              </span>
              <span>
                <Zap size={16} /> Ловкость: {char.avgAgility}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Модальное окно для детальной статистики выбранного персонажа
  const renderCharacterModal = () => {
    if (!selectedCharacter) return null;
    return (
      <div className="modal-overlay">
        <div className="character-modal">
          <button
            className="modal-close"
            onClick={() => setSelectedCharacter(null)}
          >
            <X size={16} />
          </button>
          <h2>{selectedCharacter.name}</h2>
          <div className="character-modal-stats">
            <p>
              <Target size={16} /> Средний урон за игру:{" "}
              <strong>{selectedCharacter.avgDamage}</strong>
            </p>
            <p>
              <Heart size={16} /> Среднее число ходов жизни:{" "}
              <strong>{selectedCharacter.avgAliveTurns}</strong>
            </p>
            <p>
              <Shield size={16} /> Средний урон по базе:{" "}
              <strong>{selectedCharacter.avgBaseDamage}</strong>
            </p>
            <p>
              <Zap size={16} /> Средняя ловкость:{" "}
              <strong>{selectedCharacter.avgAgility}</strong>
            </p>
            <p>
              <DollarSign size={16} /> Чаще всего покупают:{" "}
              <strong>{selectedCharacter.mostPurchased}</strong>
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Остальные вкладки (overview, matchDetails, matchResults) оставляем без изменений
  const renderOverviewTab = () => (
    <div className="game-statistics-dashboard__content">
      <section className="game-statistics-dashboard__summary">
        {parameterList.slice(0, 10).map((param, i) => (
          <div
            key={i}
            className="game-statistics-dashboard__stat-card game-statistics-dashboard__fade-in"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <h3 className="game-statistics-dashboard__stat-title">
              {param.icon} {param.name}
            </h3>
            <p className="game-statistics-dashboard__stat-value">
              {param.value}
            </p>
            <small className="game-statistics-dashboard__stat-description">
              {param.description}
            </small>
          </div>
        ))}
      </section>

      <section className="game-statistics-dashboard__charts-grid">
        <div className="game-statistics-dashboard__chart-container">
          <h3 className="game-statistics-dashboard__chart-title">
            <BarChart2 size={18} /> Основные параметры
          </h3>
          <Bar
            data={{
              labels: parameterList.slice(0, 10).map((p) => p.name),
              datasets: [
                {
                  label: "Значение",
                  data: parameterList
                    .slice(0, 10)
                    .map((p) => (isNaN(Number(p.value)) ? 0 : Number(p.value))),
                  backgroundColor: "rgba(109, 40, 217, 0.7)",
                  borderColor: "rgba(109, 40, 217, 1)",
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
              },
              scales: {
                y: {
                  grid: {
                    color: "rgba(156, 163, 175, 0.1)",
                  },
                  ticks: {
                    color: "#9ca3af",
                  },
                },
                x: {
                  grid: {
                    display: false,
                  },
                  ticks: {
                    color: "#9ca3af",
                    maxRotation: 90,
                    minRotation: 45,
                  },
                },
              },
            }}
          />
        </div>

        <div className="game-statistics-dashboard__chart-container">
          <h3 className="game-statistics-dashboard__chart-title">
            <PieChart size={18} /> Статусы партий
          </h3>
          <Pie
            data={statusChartData}
            options={{
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "bottom",
                  labels: {
                    color: "#9ca3af",
                    padding: 20,
                    usePointStyle: true,
                  },
                },
              },
            }}
          />
        </div>

        <div className="game-statistics-dashboard__chart-container">
          <h3 className="game-statistics-dashboard__chart-title">
            <PieChart size={18} /> Типы действий
          </h3>
          <Pie
            data={actionsChartData}
            options={{
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "bottom",
                  labels: {
                    color: "#9ca3af",
                    padding: 20,
                    usePointStyle: true,
                  },
                },
              },
            }}
          />
        </div>

        <div className="game-statistics-dashboard__chart-container">
          <h3 className="game-statistics-dashboard__chart-title">
            <TrendingUp size={18} /> Динамика длительности партий
          </h3>
          <Line
            data={{
              labels: matches.map((m, idx) => `Матч ${idx + 1}`),
              datasets: [
                {
                  label: "Длительность (сек)",
                  data: matches.map((m) => m.duration || 0),
                  fill: false,
                  borderColor: "#8b5cf6",
                  backgroundColor: "rgba(139, 92, 246, 0.1)",
                  tension: 0.4,
                  pointRadius: 4,
                  pointHoverRadius: 6,
                  pointBackgroundColor: "#6d28d9",
                },
              ],
            }}
            options={{
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "top",
                  labels: {
                    color: "#9ca3af",
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: "rgba(156, 163, 175, 0.1)",
                  },
                  ticks: {
                    color: "#9ca3af",
                  },
                },
                x: {
                  grid: {
                    display: false,
                  },
                  ticks: {
                    color: "#9ca3af",
                  },
                },
              },
            }}
          />
        </div>
      </section>

      <section className="game-statistics-dashboard__character-stats">
        <h3 className="game-statistics-dashboard__section-title">
          <Users size={18} /> Рейтинг типов персонажей
        </h3>
        <div className="game-statistics-dashboard__characters-grid">
          {typeRatings.map((item, i) => (
            <div key={i} className="game-statistics-dashboard__character-card">
              <h4 className="game-statistics-dashboard__character-name">
                {item.type}
              </h4>
              <div className="game-statistics-dashboard__character-stats">
                <div className="game-statistics-dashboard__character-stat">
                  <span className="game-statistics-dashboard__character-stat-label">
                    <PieChart size={16} /> Процент использования
                  </span>
                  <span className="game-statistics-dashboard__character-stat-value">
                    {item.percentage}%
                  </span>
                </div>
                <div className="game-statistics-dashboard__character-stat">
                  <span className="game-statistics-dashboard__character-stat-label">
                    <Users size={16} /> Количество игр
                  </span>
                  <span className="game-statistics-dashboard__character-stat-value">
                    {item.count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderMatchDetailsTab = () => (
    <div className="game-statistics-dashboard__content">
      <div className="game-statistics-dashboard__search-container">
        <input
          type="text"
          placeholder="Поиск по ID или дате..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="game-statistics-dashboard__search"
        />
      </div>
      <div className="game-statistics-dashboard__matches-list">
        {filteredMatches.map((match, index) => (
          <div
            key={match.id}
            className="game-statistics-dashboard__match-card"
            onClick={() => setSelectedMatch(match)}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="game-statistics-dashboard__match-header">
              <span className="game-statistics-dashboard__match-id">
                <GitCommit size={16} /> {match.gameID}
              </span>
              <span className="game-statistics-dashboard__match-date">
                <Calendar size={16} />{" "}
                {new Date(match.playingDateStart).toLocaleString()}
              </span>
            </div>
            <div className="game-statistics-dashboard__match-stats">
              <div className="game-statistics-dashboard__match-stat">
                <span className="game-statistics-dashboard__match-stat-label">
                  <Clock size={16} /> Длительность
                </span>
                <span className="game-statistics-dashboard__match-stat-value">
                  {formatDuration(match.gameDuration)}
                </span>
              </div>
              <div className="game-statistics-dashboard__match-stat">
                <span className="game-statistics-dashboard__match-stat-label">
                  <GitCommit size={16} /> Ходов
                </span>
                <span className="game-statistics-dashboard__match-stat-value">
                  {match.turn}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMatchDetailModal = () => {
    if (!selectedMatch) return null;
    setSelectedTimelineMatch(selectedMatch);
    return (
      <div className="game-statistics-dashboard__modal-overlay">
        <div className="game-statistics-dashboard__modal">
          <button
            className="game-statistics-dashboard__modal-close"
            onClick={() => setSelectedMatch(null)}
          >
            <X size={16} />
          </button>
          <h2 className="game-statistics-dashboard__modal-title">
            <BookOpen size={18} /> Пошаговый просмотр: {selectedMatch.gameID}
          </h2>
          <div className="game-statistics-dashboard__timeline-controls">
            <button
              className="game-statistics-dashboard__timeline-button"
              onClick={() =>
                setCurrentTimelineTurn((prev) => (prev > 1 ? prev - 1 : prev))
              }
              disabled={currentTimelineTurn <= 1}
            >
              <ArrowLeft size={18} />
              Назад
            </button>
            <button
              className="game-statistics-dashboard__timeline-button"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <>
                  <Pause size={18} /> Пауза
                </>
              ) : (
                <>
                  <Play size={18} /> Воспроизвести
                </>
              )}
            </button>
          </div>
          <div className="game-statistics-dashboard__timeline-progress">
            <div
              className="game-statistics-dashboard__timeline-progress-bar"
              style={{
                width: `${(currentTimelineTurn / selectedMatch.turn) * 100}%`,
              }}
            />
          </div>
          <div className="game-statistics-dashboard__timeline">
            {timelineLog?.map((entry, i) => (
              <div
                key={i}
                className="game-statistics-dashboard__timeline-event"
              >
                <div className="game-statistics-dashboard__timeline-turn">
                  Ход {entry.turn}
                </div>
                <div className="game-statistics-dashboard__timeline-description">
                  {entry.actions}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    let interval;
    if (isPlaying && selectedTimelineMatch) {
      const totalTurns =
        selectedTimelineMatch.turn || selectedTimelineMatch.turns || 0;
      interval = setInterval(() => {
        setCurrentTimelineTurn((prev) => {
          if (prev >= totalTurns) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, selectedTimelineMatch]);

  const renderTimelineModal = () => {
    if (!selectedTimelineMatch) return null;
    const totalTurns =
      selectedTimelineMatch.turn || selectedTimelineMatch.turn || 0;
    setTimelineLog(
      (selectedTimelineMatch.log || []).filter(
        (entry) =>
          entry.turn <= currentTimelineTurn && entry.messageType !== "generic"
      )
    );

    return (
      <div className="game-statistics-dashboard__modal-overlay">
        <div className="game-statistics-dashboard__modal">
          <button
            className="game-statistics-dashboard__modal-close"
            onClick={() => {
              setSelectedTimelineMatch(null);
              setCurrentTimelineTurn(1);
              setIsPlaying(false);
            }}
          >
            <X size={16} />
          </button>
          <h2 className="game-statistics-dashboard__modal-title">
            <GitCommit size={18} /> Детали партии:{" "}
            {selectedTimelineMatch.gameID}
          </h2>
          <div className="game-statistics-dashboard__modal-content">
            <div className="game-statistics-dashboard__timeline">
              {(selectedMatch.log || []).map((entry, i) => (
                <div
                  key={i}
                  className="game-statistics-dashboard__timeline-event"
                >
                  <div className="game-statistics-dashboard__timeline-turn">
                    Ход {entry.turn}
                  </div>
                  <div className="game-statistics-dashboard__timeline-description">
                    {entry.actions}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="game-statistics-dashboard__container">
      <header className="game-statistics-dashboard__header">
        <h1 className="game-statistics-dashboard__title">Статистика партий</h1>
        <div className="game-statistics-dashboard__tabs-container">
          <button
            onClick={() => setActiveTab("overview")}
            className={`game-statistics-dashboard__tab ${
              activeTab === "overview"
                ? "game-statistics-dashboard__tab--active"
                : ""
            }`}
          >
            <Activity size={18} /> Общая статистика
          </button>
          <button
            onClick={() => setActiveTab("matchDetails")}
            className={`game-statistics-dashboard__tab ${
              activeTab === "matchDetails"
                ? "game-statistics-dashboard__tab--active"
                : ""
            }`}
          >
            <GitCommit size={18} /> Детали матчей
          </button>
          <button
            onClick={() => setActiveTab("matchResults")}
            className={`game-statistics-dashboard__tab ${
              activeTab === "matchResults"
                ? "game-statistics-dashboard__tab--active"
                : ""
            }`}
          >
            <Award size={18} /> Результаты партий
          </button>
          <button
            onClick={() => setActiveTab("characterStats")}
            className={`game-statistics-dashboard__tab ${
              activeTab === "characterStats"
                ? "game-statistics-dashboard__tab--active"
                : ""
            }`}
          >
            <User size={18} /> Статистика персонажей
          </button>
        </div>
      </header>

      {activeTab === "overview" && renderOverviewTab()}
      {activeTab === "matchDetails" && renderMatchDetailsTab()}
      {activeTab === "matchResults" && (
        <div className="statistics-container">
          <h2>
            <Award size={20} /> Результаты партий
          </h2>
          <div className="game-statistics-dashboard__search-container">
            <input
              type="text"
              placeholder="Фильтр по ID или дате"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="game-statistics-dashboard__search"
            />
          </div>
          <div className="matches-list">
            {filteredMatches.map((match, index) => {
              let resultStr = "";
              let resultIcon = null;
              switch (match.status) {
                case "red_base_destroyed":
                  resultStr = "Синие победили (Красная база разрушена)";
                  resultIcon = <Shield size={16} color="#8b5cf6" />;
                  break;
                case "red_team_destroyed":
                  resultStr = "Синие победили (Красные персонажи уничтожены)";
                  resultIcon = <Users size={16} color="#8b5cf6" />;
                  break;
                case "blue_base_destroyed":
                  resultStr = "Красные победили (Синяя база разрушена)";
                  resultIcon = <Shield size={16} color="#ef4444" />;
                  break;
                case "blue_team_destroyed":
                  resultStr = "Красные победили (Синие персонажи уничтожены)";
                  resultIcon = <Users size={16} color="#ef4444" />;
                  break;
                case "in_process":
                  resultStr = "Ничья (Партия не доиграна)";
                  resultIcon = <Activity size={16} color="#9ca3af" />;
                  break;
                default:
                  resultStr = match.status;
                  resultIcon = <Activity size={16} />;
              }

              return (
                <div
                  key={match.id}
                  className="stat-card"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <h3>
                    <GitCommit size={18} /> {match.id}
                  </h3>
                  <p>
                    <Calendar size={16} /> Дата:{" "}
                    {new Date(match.playingDateStart).toLocaleString()}
                  </p>
                  <p>
                    <Clock size={16} /> Длительность:{" "}
                    {formatDuration(match.gameDuration)}
                  </p>
                  <p>
                    {resultIcon} Результат: {resultStr}
                  </p>
                  <div className="match-buttons">
                    <button onClick={() => setSelectedMatch(match)}>
                      <BookOpen size={16} /> Перейти к логу партии
                    </button>
                    <button onClick={() => setSelectedTimelineMatch(match)}>
                      <Play size={16} /> Просмотреть игру пошагово
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {activeTab === "characterStats" && renderCharacterStatsTab()}

      {selectedMatch && renderMatchDetailModal()}
      {/* {selectedTimelineMatch && renderTimelineModal()} */}
      {renderCharacterModal()}
    </div>
  );
};

export default Statistics;
