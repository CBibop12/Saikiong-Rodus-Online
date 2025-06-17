/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Send,
  Map as MapIcon,
  Users,
  MessageSquare,
  ChevronRight,
  Pause,
} from "lucide-react";
import { items as availableItems, characters } from "../data";
import { abilities as abilitiesList } from "../abilities";
import "../styles/chatConsole.css";
import "../styles/mapSelection.css";
// В начале файла импортируются необходимые компоненты и стили, а также хук debounce, если понадобится оптимизация.
import PauseModal from "./components/pauseModal";
import CharacterModal from "./components/CharacterModal";
import Teams from "./components/Teams";
import executeCommand from "./scripts/executeCommand";
import ContextMenu from "./components/ContextMenu";
import EffectsManager from "./scripts/effectsManager";
import { calculateCellsForZone } from "./scripts/calculateCellsForZone";
import CharacterInfoPanel from "./components/CharacterInfoPanel";
import Notification from './Notification';
import { attack, attackBase, attackBuilding } from "./scripts/attack";
import Store from "./components/Store";
import GameHeader from "./components/GameHeader";
import ControlButton from "./components/ControlButton";
import BaseInfo from "./components/BaseInfo";
import Finale from "./components/FinaleWindow";
import { removeEffect } from "../effects";
import { generateId } from "./scripts/tools/simplifierStore";
import { startingWalls } from "./scripts/building";
import ShopDistribution from "./components/ShopDistribution";
import { findCharacter, findCharacterByPosition } from "./scripts/tools/characterStore";
import { allCellType, calculateCellsZone, cellHasType, initialOfCell, isNearType, objectOnCell, splitCoord, stringFromCoord, calculateNearCells } from "./scripts/tools/mapStore";
import { randomArrayElement } from "./scripts/tools/simplifierStore";
/**
 * ВЫНОСИМ ВНЕ КОМПОНЕНТА, чтобы она не пересоздавалась на каждом рендере
 * и не вызывала повторный useEffect.
 */

const RANGE_OF_THROWABLE_OBJECTS = 5;
const RANGE_OF_BUILDING_OBJECTS = 1;
const INVENTORY_BASE_LIMIT = 3;

const ChatConsole = ({ teams, selectedMap }) => {
  // Состояния для ввода текста, подсказок и сообщений
  const [selectedAction, setSelectedAction] = useState("Взаимодействие");

  const storesCooldown = 6;

  // Состояния для работы с картой и персонажами (наведение, выбор)
  const [hoveredCell, setHoveredCell] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  // Состояния для пошагового режима и таймера игры
  const [gameStartTime, setGameStartTime] = useState(Date.now());
  const [isPaused, setIsPaused] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(false);
  // Состояние текущей команды (чей сейчас ход)
  const [teamTurn, setTeamTurn] = useState(
    () => localStorage.getItem("teamTurn") || null
  );

  // Состояние первой команды, определяемое монеткой
  const [firstTeamToAct, setFirstTeamToAct] = useState(
    () => localStorage.getItem("firstTeamToAct") || null
  );

  // Состояние логов сообщений
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem("gameMessages");
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  // Состояние контекстного меню (показывает меню по правому клику)
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    character: null,
    cellCoord: null,
  });
  // Состояния для подсвеченных клеток (например, доступных для перемещения или атаки)
  const [reachableCells, setReachableCells] = useState([]);
  const [attackableCells, setAttackableCells] = useState([]);
  const [throwableCells, setThrowableCells] = useState([]);
  const [selectionOverlay, setSelectionOverlay] = useState([]);
  const [beamCells, setBeamCells] = useState([]);
  const [pendingMode, setPendingMode] = useState(null); //move, attack, throw, build
  const [dynamicTooltip, setDynamicTooltip] = useState(null);
  // Состояние для поиска сообщений
  const [searchQuery, setSearchQuery] = useState("");
  const filteredMessages = messages.filter((msg) =>
    msg.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [pendingItem, setPendingItem] = useState(null);

  // Рефы для скроллинга списка сообщений и фокусировки ввода
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Состояния для режима выбора зоны эффектов
  const [zoneSelectionMode, setZoneSelectionMode] = useState(false);
  // Состояние для хранения выделенных (подсвеченных) клеток эффекта
  const [cellEffectsInfo, setCellEffectsInfo] = useState(null);
  // Состояние для хранения итоговой области выделенной зоны
  const [highlightedZone, setHighlightedZone] = useState([]);
  // Объект эффекта, ожидающий подтверждения
  const [pendingZoneEffect, setPendingZoneEffect] = useState(null);

  // ─────────────────────────────────────────────
  // 1) Для постоянных зон, которые остаются на карте
  //    Например, после использования способности с длительностью эффекта.
  //    Можно хранить их и в matchState.objectsOnMap, но ради простоты — локально.
  //    Внутри у нас массив объектов { coord, color, zoneId, ... }.
  const [permanentOverlays, setPermanentOverlays] = useState();
  const [allOverlays, setAllOverlays] = useState();
  const [showCharacterInfoPanel, setShowCharacterInfoPanel] = useState(false);
  const [clickedEffectOnPanel, setClickedEffectOnPanel] = useState(null)

  const [lastNotification, setLastNotification] = useState(null);
  const [attackAnimations, setAttackAnimations] = useState([]);
  // ─────────────────────────────────────────────
  // 2) Для временной зоны, которую игрок наводит мышкой/подтверждает и т.п.
  //    Обычно этот массив мы очищаем, когда «подтверждение» произошло или отмена.

  // Инициализация состояния партии (matchState) с использованием localStorage для сохранения
  const [matchState, setMatchState] = useState(() => {
    // пытаемся восстановить партию
    const saved = localStorage.getItem('matchState');
    if (saved) return JSON.parse(saved);

    // стартовая инициализация
    return {
      teams: {
        red: {
          remain: {
            actions: 1,
            moves: 1,
          },
          latestDeath: null,
          baseHP: 1500,
          gold: 0,
          characters: teams.team1.map(ch => ({
            ...ch,
            team: 'red',
            inventory: [],
            armoryCooldown: 0,
            labCooldown: 0
          })),
          inventory: [],
        },
        blue: {
          remain: {
            actions: 1,
            moves: 1,
          },
          latestDeath: null,
          baseHP: 1500,
          gold: 0,
          characters: teams.team2.map(ch => ({
            ...ch,
            team: 'blue',
            inventory: [],
            armoryCooldown: 0,
            labCooldown: 0
          })),
          inventory: [],
        },
      },
      advancedSettings: {
        actionsPerTurn: 1,
        movesPerTurn: 1,
      },
      actions: [],
      turn: 1,
      selectedMap: selectedMap.name,
      status: 'in_process',
      gameDuration: 0,
      objectsOnMap: [],
      churches: [
        {
          coordinates: selectedMap.churches?.red || "n-n",
          powerpoint: selectedMap.churches?.redPowerpoint || "n-n",
          currentAffiliation: "red",
          turnsRemain: 3,
        },
        {
          coordinates: selectedMap.churches?.blue || "n-n",
          powerpoint: selectedMap.churches?.bluePowerpoint || "n-n",
          currentAffiliation: "blue",
          turnsRemain: 3,
        },
      ],
      // Добавляем информацию о времени
      gameTime: {
        startTime: Date.now(),
        pausedTime: 0,
        isPaused: false,
        pauseStartTime: null,
        stopTime: null,
      }
    };
  });
  const [itemHelperInfo, setItemHelperInfo] = useState(null)
  const [throwDestination, setThrowDestination] = useState(null)
  const [zoneFixed, setZoneFixed] = useState(false);
  const [charactersInZone, setCharactersInZone] = useState([]);
  const [chargesDistribution, setChargesDistribution] = useState({});

  // Состояние для режима выбора луча
  const [beamFixed, setBeamFixed] = useState(false);
  const [beamSelectionMode, setBeamSelectionMode] = useState(false);
  const [pendingBeamEffect, setPendingBeamEffect] = useState(null);

  // Состояния для режима выбора точки
  const [pointSelectionMode, setPointSelectionMode] = useState(false);
  const [pendingPointEffect, setPendingPointEffect] = useState(null);
  const [pointCells, setPointCells] = useState([]);
  const [pointDestination, setPointDestination] = useState(null);
  const [charactersAtPoint, setCharactersAtPoint] = useState([]);
  // Состояния для телепортации
  const [teleportationMode, setTeleportationMode] = useState(false);
  const [pendingTeleportation, setPendingTeleportation] = useState(null);
  const [teleportationCells, setTeleportationCells] = useState([]);
  const [teleportationDestination, setTeleportationDestination] = useState(null);

  // Состояния для возведения построек
  const [buildingMode, setBuildingMode] = useState(false);
  const [buildingCells, setBuildingCells] = useState([]);
  const [buildingDestination, setBuildingDestination] = useState([]);

  const [store, setStore] = useState(null);

  const [finalWindow, setFinalWindow] = useState(false)

  const [showManaDistribution, setShowManaDistribution] = useState(false);
  const [showRecipientSelection, setShowRecipientSelection] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [manaDistribution, setManaDistribution] = useState({});
  const [selectedRecipient, setSelectedRecipient] = useState(null);

  // Эффект броска монетки в начале игры и инициализация объектов на карте
  useEffect(() => {
    if (!teamTurn) {
      const result = Math.random() < 0.5 ? "red" : "blue";
      setTeamTurn(result);
      setFirstTeamToAct(result);
      localStorage.setItem("teamTurn", result);
      localStorage.setItem("firstTeamToAct", result);
      addActionLog(
        `🪙 Бросок монетки! Первыми ходят ${result === "red" ? "Красные" : "Синие"
        }!`
      );
    }

    if (matchState && matchState.status != "in_process") {
      setFinalWindow(true)
    }

    if (matchState && matchState.objectsOnMap.length === 0) {
      console.log("Инициализация объектов на карте");
      initializeObjectsOnMap(selectedMap)
    }
    console.log(matchState.objectsOnMap.length, "Объектов на карте");
    for (let object of matchState.objectsOnMap.filter(obj => obj.coordinates === "12-1")) {
      console.log(object);
    }
  }, []);

  //Обновляет зоны
  useEffect(() => {
    if (!matchState) {
      setAllOverlays([]);
      return;
    }

    if (permanentOverlays?.length > 0 || selectionOverlay || beamCells?.length > 0) {
      if (permanentOverlays?.length > 0 && selectionOverlay && beamCells?.length > 0) {
        setAllOverlays([...permanentOverlays, selectionOverlay, beamCells]);
      } else if (permanentOverlays?.length > 0 && selectionOverlay) {
        setAllOverlays([...permanentOverlays, selectionOverlay]);
      } else if (permanentOverlays?.length > 0 && beamCells?.length > 0) {
        setAllOverlays([...permanentOverlays, beamCells]);
      } else if (selectionOverlay && beamCells?.length > 0) {
        setAllOverlays([selectionOverlay, beamCells]);
      } else {
        if (permanentOverlays?.length > 0) {
          setAllOverlays([...permanentOverlays]);
        }
        if (selectionOverlay) {
          setAllOverlays(selectionOverlay);
        }
        if (beamCells?.length > 0) {
          setAllOverlays(beamCells);
        }
      }
    }
  }, [matchState, permanentOverlays, selectionOverlay, beamCells]);

  useEffect(() => {
    const affectedCharacters = [];
    ["red", "blue"].forEach((team) => {
      matchState.teams[team].characters.forEach((ch) => {
        if (pointDestination === ch.position && ch.currentHP > 0) {
          affectedCharacters.push(ch);
        }
      });
    });
    if (pointDestination) {
      setCharactersAtPoint(affectedCharacters);
    }
  }, [pointDestination]);

  const checkForStore = (character) => {
    const storeType = isSelectedNearStore(character);
    if (storeType) {
      setStore(storeType);
    } else {
      setStore(null);
    }
  }

  const handleFinale = () => {
    if (matchState.status.includes("destroyed") || matchState.teams.red.characters.filter(ch => ch.currentHP > 0).length === 0 || matchState.teams.blue.characters.filter(ch => ch.currentHP > 0).length === 0) {
      setFinalWindow(true)
    }
  }

  const initializeObjectsOnMap = (selectedMap) => {
    let objectsOnMap = []
    let walls = []
    for (let rowIndex = 0; rowIndex < selectedMap.size[1]; rowIndex++) {
      for (let columnIndex = 0; columnIndex < selectedMap.size[0]; columnIndex++) {
        if (selectedMap.map[rowIndex][columnIndex].initial === "wall") {
          walls.push(`${columnIndex + 1}-${rowIndex + 1}`)
        }
      }
    }
    startingWalls(walls, matchState)
  }

  const addObjectOnMap = (obj) => {
    const newObjects = [...matchState.objectsOnMap, obj];
    updateMatchState({ objectsOnMap: newObjects });
  };

  // Функция для получения эффектов, которые накладываются на клетку с заданными координатами
  const getEffectsForCell = (cellCoord) => {
    return matchState.objectsOnMap.filter((obj) => {
      // Вычисляем расстояние по манхэттенской метрике от объекта до клетки
      const [objX, objY] = obj.coordinates.split("-").map(Number);
      const [cellX, cellY] = cellCoord.split("-").map(Number);
      const distance = Math.abs(cellX - objX) + Math.abs(cellY - objY);
      return distance <= (obj.stats.rangeOfObject || 0);
    });
  };

  const calculateCastingAllowance = (cell) => {
    // Если включён режим выбора точки, используем pendingPointEffect
    if (pointSelectionMode && pendingPointEffect) {
      return pointCells.includes(cell);
    }

    // Если включён режим выбора луча, используем pendingBeamEffect, иначе — pendingZoneEffect
    const effect = beamSelectionMode ? pendingBeamEffect : pendingZoneEffect;
    if (!effect) return false;

    const [startCol, startRow] = splitCoord(effect.caster.position);
    const [pointX, pointY] = splitCoord(cell);

    if (effect.type === "Луч" && !beamFixed) {
      // Нельзя направлять луч в ту же клетку, что и персонаж
      if (pointX === startCol && pointY === startRow) return false;

      // Допускаются только горизонтальные или вертикальные направления:
      // Если ни столбцы, ни строки не совпадают, значит направление диагональное – возвращаем false.
      if (pointX !== startCol && pointY !== startRow) return false;

      // Проверка, что клетка находится в пределах разрешённой дальности
      const distance = Math.max(Math.abs(pointX - startCol), Math.abs(pointY - startRow));
      if (distance > effect.range) return false;

      // Проверяем только первую смежную клетку от заклинателя
      const stepX = pointX > startCol ? 1 : pointX < startCol ? -1 : 0;
      const stepY = pointY > startRow ? 1 : pointY < startRow ? -1 : 0;

      const nextX = startCol + stepX;
      const nextY = startRow + stepY;

      const nextCell = selectedMap.map[nextY - 1]?.[nextX - 1];
      if (pendingBeamEffect.canGoThroughWalls == false) {
        if (!nextCell ||
          (nextCell.initial !== "empty" &&
            nextCell.initial !== "blue portal" &&
            nextCell.initial !== "red portal" &&
            nextCell.initial !== "healing zone" &&
            nextCell.initial !== "bush")) {
          return false;
        }
      }
      return true;
    }

    // Логика для остальных эффектов (например, зоновых способностей)
    const range = effect.caster.type === "Маг"
      ? effect.caster.currentRange
      : effect.coordinates === "dynamic"
        ? 0
        : effect.coordinates;

    // Проверка для вертикальной линии
    if (pointX === startCol && Math.abs(pointY - startRow) <= range) return true;

    // Проверка для горизонтальной линии
    if (pointY === startRow && Math.abs(pointX - startCol) <= range) return true;

    return false;
  };

  const isSelectedNearStore = (character) => {
    let storeType = null;
    for (let coord of calculateNearCells(character.position, selectedMap)) {
      if (cellHasType(["laboratory", "armory", "magic shop"], coord, selectedMap)) {
        storeType = initialOfCell(coord, selectedMap);
        break;
      }
    }
    return storeType;
  }

  const calculateReachableCells = (startCoord, range) => {
    return calculateCellsZone(startCoord, range, matchState, selectedMap.size, selectedMap, ["red base", "blue base", "magic shop", "laboratory", "armory"], false, false, true);
  }

  // Функция для расчёта клеток, которые можно атаковать, с учётом направления и типа местности
  const calculateAttackableCells = (startCoord, range, mapSize) => {
    // Разбор стартовой клетки в формате "col-row" (1-индекс)
    const [startX, startY] = splitCoord(startCoord, 1);
    const cols = mapSize[0],
      rows = mapSize[1];

    // Если персонаж находится в "bush", дальность атаки уменьшается в 2 раза (округляем вверх)
    let effectiveRange = range;
    if (initialOfCell([startX, startY], selectedMap) === "bush") {
      effectiveRange = Math.ceil(range / 2);
    }

    // Массив для хранения координат атакуемых клеток в формате "col-row"
    const attackable = [];

    // Определяем четыре направления атаки: вверх, вправо, вниз, влево
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
    ];

    // Для каждого направления идём клетками до предельного шага effectiveRange
    for (const { dx, dy } of directions) {
      for (let step = 1; step <= effectiveRange; step++) {
        const newX = startX + dx * step;
        const newY = startY + dy * step;

        if (newX < 0 || newX >= cols || newY < 0 || newY >= rows) break;

        const cellPos = stringFromCoord([newX, newY], 1);

        const hasCharacter =
          matchState.teams.red.characters.some(
            (ch) => ch.position === cellPos
          ) ||
          matchState.teams.blue.characters.some(
            (ch) => ch.position === cellPos
          );
        let object = objectOnCell(cellPos, matchState)
        if (!object) {
          attackable.push(cellPos);
          if (hasCharacter) break;
          if (cellHasType(["red base", "blue base"], [newX, newY], selectedMap)) break;
        } else {
          if (object.type === "building") {
            attackable.push(cellPos);
          }
          break;
        }
      }
    }

    return attackable;
  };

  const calculateThrowableCells = (startCoord, range = 5, mapSize, mode = "throw") => {
    {
      // Разбор стартовой клетки в формате "col-row" (1-индекс)
      const [startX, startY] = splitCoord(startCoord, 1);
      const cols = mapSize[0],
        rows = mapSize[1];

      // Если персонаж находится в "bush", дальность атаки уменьшается в 2 раза (округляем вверх)
      let effectiveRange = range;
      if (initialOfCell([startX, startY], selectedMap) === "bush") {
        effectiveRange = Math.ceil(range / 2);
      }

      // Массив для хранения координат атакуемых клеток в формате "col-row"
      const throwable = [];

      // Определяем четыре направления атаки: вверх, вправо, вниз, влево
      const directions = [
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
      ];

      // Для каждого направления идём клетками до предельного шага effectiveRange
      for (const { dx, dy } of directions) {
        for (let step = 1; step <= effectiveRange; step++) {
          const newX = startX + dx * step;
          const newY = startY + dy * step;

          // Проверка выхода за границы карты
          if (newX < 0 || newX >= cols || newY < 0 || newY >= rows) break;
          // Преобразуем координаты в формат "col-row" (1-индекс)
          const cellPos = `${newX + 1}-${newY + 1}`;

          let object = objectOnCell(cellPos, matchState)
          let characterOnCell = findCharacterByPosition(cellPos, matchState)

          if (!object && !cellHasType(["laboratory", "armory", "magic shop"], [newX, newY], selectedMap)) {
            if (mode === "throw") {
              if (!characterOnCell && !cellHasType(["red base", "blue base"], [newX, newY], selectedMap)) {
                throwable.push(cellPos)
              }
            }
            else if (mode === "putDown") {
              // выкладывать можно персонажу или базе но после этого дальше идти нельзя
              throwable.push(cellPos)
            }
          } else {
            break;
          }
        }
      }

      return throwable;
    };
  }

  const calculateBuildingCells = (startCoord, character, mapSize) => {
    const [startCol, startRow] = splitCoord(startCoord);
    let mapAffiliation = character.team === "red" && startCol < mapSize[0] / 2 || character.team === "blue" && startCol > mapSize[0] / 2;
    let calcMode = mapAffiliation ? "map" : "range";

    if (calcMode === "map") {
      return calculateTeleportationCells(startCoord, "half map", mapSize);
    } else {
      return calculateThrowableCells(startCoord, 1, mapSize);
    }
  }

  // Функция обновления состояния партии и сохранения в localStorage
  const updateMatchState = (newState) => {
    const updated = newState ? { ...matchState, ...newState } : matchState;
    // Проверяем если количество живых персонажей (с currentHP больше 0) в команде меньше чем было до обновления, то обновляем количество золота в команде
    // if (updated.teams.red.characters.filter(ch => ch.currentHP === 0).length > matchState.teams.red.characters.filter(ch => ch.currentHP === 0).length) {
    //   updated.teams.blue.gold += 500;
    // }
    // if (updated.teams.blue.characters.filter(ch => ch.currentHP === 0).length > matchState.teams.blue.characters.filter(ch => ch.currentHP === 0).length) {
    //   updated.teams.red.gold += 500;
    // }
    if (updated.status.includes("destroyed")) {
      updated.gameTime.stopTime = Date.now()
      updated.gameDuration = updated.gameTime.stopTime - updated.gameTime.startTime
    }
    else if (updated.teams.red.characters.filter(ch => ch.currentHP > 0).length === 0) {
      updated.status = "blue_team_won"
      updated.gameTime.stopTime = Date.now()
      updated.gameDuration = updated.gameTime.stopTime - updated.gameTime.startTime
    }
    else if (updated.teams.blue.characters.filter(ch => ch.currentHP > 0).length === 0) {
      updated.status = "red_team_won"
      updated.gameTime.stopTime = Date.now()
      updated.gameDuration = updated.gameTime.stopTime - updated.gameTime.startTime
    }
    setMatchState(updated);
    handleFinale();
    localStorage.setItem("matchState", JSON.stringify(updated));
  };

  const addActionLog = (
    text,
    type = "system",
    commandType = selectedAction
  ) => {
    const newMsg = {
      text,
      timestamp: formatElapsedTime(Date.now() - gameStartTime),
      messageType: type,
      actionType: type === "system" ? `Система / ${commandType}` : commandType,
      turn: matchState.turn,
      team: teamTurn,
    };
    setMessages((prev) => [...prev, newMsg]);
    setLastNotification({ text, type });
  };

  // useEffect для сохранения сообщений и автоскролла
  useEffect(() => {
    localStorage.setItem("gameMessages", JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (pendingMode === "attack") {
      setReachableCells([]);
      setAttackableCells(calculateAttackableCells(selectedCharacter.position, selectedCharacter.currentRange, selectedMap.size));
      setThrowableCells([]);
      setBuildingCells([]);
    }
    if (pendingMode === "move") {
      setAttackableCells([]);
      setReachableCells(calculateReachableCells(selectedCharacter.position, selectedCharacter.currentAgility));
      setThrowableCells([]);
      setBuildingCells([]);
    }
    if (pendingMode === "throw" || pendingMode === "putDown") {
      setAttackableCells([]);
      setReachableCells([]);
      setBuildingCells([]);
    }
    else if (pendingMode === null) {
      setReachableCells([]);
      setAttackableCells([]);
      setThrowableCells([]);
    }
    if ((beamSelectionMode || pointSelectionMode || zoneSelectionMode) && pendingMode !== null) {
      setReachableCells([]);
      setAttackableCells([]);
      setPendingMode(null);
    }
  }, [pendingMode, beamSelectionMode, pointSelectionMode, zoneSelectionMode]);

  useEffect(() => {
    if (attackAnimations.length > 0) {
      setTimeout(() => {
        setAttackAnimations([]);
      }, 1000);
    }
  }, [attackAnimations]);
  // Функция форматирования времени (минуты:секунды)
  const formatElapsedTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Функция для получения CSS-класса клетки в зависимости от её типа
  const getCellClassName = (cell, churchClass) => {
    const baseClass = 'grid-cell';
    switch (cell.initial) {
      case 'empty': return `${baseClass} empty`;
      case 'wall': return `${baseClass} empty`;
      case 'red base': return `${baseClass} red-base`;
      case 'blue base': return `${baseClass} blue-base`;
      case 'magic shop': return `${baseClass} magic-shop`;
      case 'armory': return `${baseClass} armory`;
      case 'laboratory': return `${baseClass} laboratory`;
      case 'bush': return `${baseClass} bush`;
      case 'healing zone': return `${baseClass} healing-zone`;
      case 'red portal': return `${baseClass} red-portal-cover`;
      case 'blue portal': return `${baseClass} blue-portal-cover`;
      case 'red church': return `${baseClass} ${churchClass}-cover`;
      case 'blue church': return `${baseClass} ${churchClass}-cover`;
      case 'redChurch powerpoint': return `${baseClass} red-church-powerpoint`;
      case 'blueChurch powerpoint': return `${baseClass} blue-church-powerpoint`;
      case 'mob spawnpoint': return `${baseClass} mob-spawnpoint`;
      default: return baseClass;
    }
  };

  // Рендер отдельной ячейки
  const renderCell = (cell, rowIndex, colIndex) => {
    const cellCoord = stringFromCoord([colIndex, rowIndex]);
    const character = findCharacterByPosition(cellCoord, matchState);
    const object = objectOnCell(cellCoord, matchState, "item");
    const building = objectOnCell(cellCoord, matchState, "building");

    // Определяем принадлежность храма
    let churchClass = '';
    if (cellHasType(["red church", "blue church"], [colIndex, rowIndex], selectedMap)) {
      for (let church of matchState.churches) {
        if (church.coordinates === cellCoord) {
          churchClass = church.currentAffiliation === "red" ? 'red-church' : 'blue-church';
        }
      }
    }

    // Функция для определения части большого здания
    const getBuildingPart = (buildingType) => {
      // Ищем первую клетку этого типа здания

      if (selectedMap.map[rowIndex - 1][colIndex - 1].initial === buildingType) return 4; // Верхний левый угол
      if (selectedMap.map[rowIndex - 1][colIndex + 1].initial === buildingType) return 3; // Верхний правый угол
      if (selectedMap.map[rowIndex + 1][colIndex - 1].initial === buildingType) return 2; // Нижний левый угол
      if (selectedMap.map[rowIndex + 1][colIndex + 1].initial === buildingType) return 1; // Нижний правый угол
      return null;
    };

    // Определяем, какое большое здание должно отображаться в этой клетке
    let largeBuildingImage = null;
    let buildingPart = null;

    switch (cell.initial) {
      case "red base":
        buildingPart = getBuildingPart("red base");
        if (buildingPart) {
          largeBuildingImage = `/src/assets/cells/red-base-${buildingPart}.png`;
        }
        break;
      case "blue base":
        buildingPart = getBuildingPart("blue base");
        if (buildingPart) {
          largeBuildingImage = `/src/assets/cells/blue-base-${buildingPart}.png`;
        }
        break;
      case "laboratory":
        buildingPart = getBuildingPart("laboratory");
        if (buildingPart) {
          largeBuildingImage = `/src/assets/cells/lab-${buildingPart}.png`;
        }
        break;
      case "magic shop":
        buildingPart = getBuildingPart("magic shop");
        if (buildingPart) {
          largeBuildingImage = `/src/assets/cells/magic-store-${buildingPart}.png`;
        }
        break;
      case "armory":
        buildingPart = getBuildingPart("armory");
        if (buildingPart) {
          largeBuildingImage = `/src/assets/cells/armory-${buildingPart}.png`;
        }
        break;
    }

    return (
      <div className={`${getCellClassName(cell, churchClass)}`}>
        {character && (
          <div className="positioned-character">
            <img
              src={`/src/assets/characters/${character.image}`}
              alt={character.name}
              className={`character-image ${character.team === "red" ? 'red-team' : 'blue-team'}`}
            />
          </div>
        )}
        {object && (
          <div className="positioned-object">
            <img
              src={`/src/assets/items/${object.image}`}
              alt={object.name}
              className={`object-image`}
            />
          </div>
        )}
        {building &&
          <div className="positioned-object">
            <img
              src={`/src/assets/cells/${building.image}`}
              className="object-image building-image"
            />
          </div>
        }
        {largeBuildingImage && (
          <div className="positioned-object">
            <img
              src={largeBuildingImage}
              className="object-image building-image"
            />
          </div>
        )}
      </div>
    );
  };

  const setTeam1Gold = (gold) => {
    matchState.teams.red.gold = gold;
    updateMatchState();
  }

  const setTeam2Gold = (gold) => {
    matchState.teams.blue.gold = gold;
    updateMatchState();
  }

  const handleAbilityClick = (characterName, abilityIndex) => {
    if (matchState.teams[teamTurn].remain.actions === 0) {
      addActionLog(`${characterName} не может использовать способность, так как уже израсходовал все свои действия`);
      return;
    }
    const character = matchState.teams.red.characters.find(ch => ch.name === characterName) || matchState.teams.blue.characters.find(ch => ch.name === characterName);
    executeCommand({
      characterName,
      commandType: "useAbility",
      commandObject: {
        spellKey: character.abilities[abilityIndex - 1].key,
      },
    }, {
      matchState,
      updateMatchState,
      addActionLog,
      setZoneSelectionMode,
      setPendingZoneEffect,
      setBeamSelectionMode,
      setPendingBeamEffect,
      setHighlightedZone,
      calculateBeamCells,
      setBeamCells,
      setTeam1Gold,
      setTeam2Gold,
      selectedMap,
      turn: matchState.turn,
      // Передача дополнительных функций для работы с эффектами и картой
      setSelectionOverlay,
      addObjectOnMap,
      calculateBeamCellsComb,
      calculateTeleportationCells,
      setTeleportationMode,
      setPendingTeleportation,
      setTeleportationCells,
      setPointSelectionMode,
      setPendingPointEffect,
      setPointCells,
      calculatePointCells,
      calculateThrowableCells,
      setThrowableCells,
      throwableCells,
    });
    if (abilitiesList[character.abilities[abilityIndex - 1].key].type === "Эффект на себя") {
      restartAbilityCooldowns(characterName);
      matchState.teams[character.team].remain.actions -= 1;
    }
  };

  const handleAttack = (selectedCharacter) => {
    setPendingMode("attack");
    setAttackableCells(calculateAttackableCells(selectedCharacter.position, selectedCharacter.currentRange, selectedMap.size));
  };

  const initializePlace = (character) => {
    // добавить логику состояния выбора места для воскрешения
    let allyBaseCells = allCellType(`${character.type} base`, selectedMap, "object", 1)
    let allAvailableNeighbours = []
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];
    for (let baseCell of allyBaseCells) {
      for (const [dx, dy] of directions) {
        const newCol = baseCell.x + dx - 1;
        const newRow = baseCell.y + dy - 1;
        if (newCol >= 0 && newCol < selectedMap.size[0] &&
          newRow >= 0 && newRow < selectedMap.size[1]) {
          if (initialOfCell([newCol, newRow], selectedMap) !== `${character.team} base` && !allAvailableNeighbours.includes({ x: newCol, y: newRow })) {
            if (!objectOnCell([newCol, newRow], matchState, "object") && !findCharacterByPosition([newCol, newRow], matchState) && !findCharacterByPosition([newCol, newRow], matchState)) {
              allAvailableNeighbours.push({ x: newCol, y: newRow })
            }
          }
        }
      }
    }
    let randomCellIndex = randomArrayElement(allAvailableNeighbours, "index")
    if (allAvailableNeighbours.length > 0) {
      return stringFromCoord(allAvailableNeighbours[randomCellIndex])
    }
    else {
      return `${character.position}`
    }
  }

  const reviveCharacter = (characterName) => {
    let character = { ...findCharacter(characterName, matchState) }
    let initialCharacter = characters.find((char) => char.name === characterName)
    matchState.teams[character.team].characters.splice(matchState.teams[character.team].characters.findIndex(ch => ch.name === characterName), 1)
    let newCharacter = JSON.parse(JSON.stringify({ ...initialCharacter, position: initializePlace(character), team: character.team, inventory: [], armoryCooldown: 0, labCooldown: 0 }))
    matchState.teams[character.team].characters.push(newCharacter)
    console.log(matchState.teams[character.team].characters.find(ch => ch.name === characterName));

    updateMatchState()
  }

  const handleAttackCharacter = (character) => {
    const results = attack({ caster: selectedCharacter }, "neutral", [character], selectedCharacter.currentDamage, selectedCharacter.advancedSettings.damageType);
    matchState.teams[selectedCharacter.team].remain.actions -= 1;

    if (results[0].hpDamage > 0) {
      selectedCharacter.currentHP += Math.max(selectedCharacter.currentHP, selectedCharacter.currentHP + selectedCharacter.advancedSettings.vampirism)
    }
    if (results[0].currentHP === 0) {
      console.log("Character killed", character);
      matchState.teams[selectedCharacter.team].gold += 500;
      let reviveItem = matchState.teams[character.team].inventory.find((item) => item.name === "Зелье воскрешения")
      if (reviveItem) {
        reviveCharacter(character.name)
        matchState.teams[character.team].inventory.splice(matchState.teams[character.team].inventory.indexOf(reviveItem), 1)
      }
      matchState.teams[selectedCharacter.team].latestDeath = character.name;
      selectedCharacter.effects.map((effect) => {
        if (effect.byKill) {
          effect.byKill(selectedCharacter, character)
        }
      })
    }
    return results[0];
  };

  const handleBuyItem = (item) => {
    const itemData = availableItems.find(
      (it) => it.name.toLowerCase() === item.name.toLowerCase()
    );
    if (matchState.teams[teamTurn].remain.actions === 0 && itemData.shopType !== "Магический") {
      addActionLog(`${selectedCharacter.name} не может купить предмет, так как уже израсходовал все свои действия`);
      return;
    }
    if (item.name === "Зелье воскрешения") {
      if (selectedCharacter.currentMana >= item.price) {
        if (INVENTORY_BASE_LIMIT - matchState.teams[selectedCharacter.team].inventory.length >= 1) {
          selectedCharacter.currentMana -= item.price
          if (matchState.teams[selectedCharacter.team].latestDeath != null) {
            let character = matchState.teams[teamTurn].characters.find(ch => ch.name === matchState.teams[teamTurn].latestDeath);
            const initialCharacter = characters.find((char) => char.name === character.name)
            character = JSON.parse(JSON.stringify(initialCharacter))
            matchState.teams[teamTurn].latestDeath = null;
            updateMatchState();
          }
          else {
            matchState.teams[selectedCharacter.team].inventory.push({ ...itemData, id: generateId() })
          }
        }
        else {
          addActionLog("Инвентарь базы заполнен, предмет не удается разместить")
        }
      }
      else {
        addActionLog("У персонажа недостаточно маны для покупки этого предмета")
      }
    }
    else {
      executeCommand({
        characterName: selectedCharacter.name,
        commandType: "buy",
        commandObject: {
          item: item.name,
        },
      }, {
        matchState,
        updateMatchState,
        addActionLog,
        setTeam1Gold,
        setTeam2Gold,
        setZoneSelectionMode,
        setPendingZoneEffect,
        setBeamSelectionMode,
        setPendingBeamEffect,
        setHighlightedZone,
        calculateBeamCells,
        setBeamCells,
        selectedMap,
        turn: matchState.turn,
        // Передача дополнительных функций для работы с эффектами и картой
        setSelectionOverlay,
        addObjectOnMap,
        calculateBeamCellsComb,
        calculateTeleportationCells,
        setTeleportationMode,
        setPendingTeleportation,
        setTeleportationCells,
        setPointSelectionMode,
        setPendingPointEffect,
        setPointCells,
        calculatePointCells,
        calculateThrowableCells,
        setThrowableCells,
        throwableCells,
      });
    }
    if (matchState.teams[selectedCharacter.team].remain.actions > 0) {
      matchState.teams[selectedCharacter.team].remain.actions -= 1;
    }
    if (itemData.shopType !== "Магический") {
      if (itemData.shopType === "Лаборатория") {
        selectedCharacter.labCooldown = storesCooldown
      }
      else {
        selectedCharacter.armoryCooldown = storesCooldown
      }
    }
  };

  const chooseBuildingPosition = (building) => {
    setBuildingMode(true);
    setPendingMode(null);
    setBuildingCells(calculateBuildingCells(selectedCharacter.position, selectedCharacter, selectedMap.size));
  }

  const calculateBuildingAllowance = (coordinates) => {
    console.log(buildingCells.includes(coordinates) && !buildingDestination.includes(coordinates) && buildingDestination.length < (pendingItem.name === "Стена (х3)" ? pendingItem.left : 1));
    return buildingCells.includes(coordinates) && !buildingDestination.includes(coordinates) && buildingDestination.length < (pendingItem.name === "Стена (х3)" ? pendingItem.left : 1);
  }

  const handleBuild = (character, building, position) => {
    console.log(building, position);
    executeCommand({
      characterName: character.name,
      commandType: "build",
      commandObject: {
        ...building,
        name: building.name === "Стена (х3)" ? "Стена" : building.name,
        position
      },
    }, {
      matchState,
      updateMatchState,
      addActionLog,
      setZoneSelectionMode,
      setPendingZoneEffect,
      setBeamSelectionMode,
      setPendingBeamEffect,
      setHighlightedZone,
      calculateBeamCells,
      setBeamCells,
      setTeam1Gold,
      setTeam2Gold,
      selectedMap,
      turn: matchState.turn,
      // Передача дополнительных функций для работы с эффектами и картой
      setSelectionOverlay,
      addObjectOnMap,
      calculateBeamCellsComb,
      calculateTeleportationCells,
      setTeleportationMode,
      setPendingTeleportation,
      setTeleportationCells,
      setPointSelectionMode,
      setPendingPointEffect,
      setPointCells,
      calculatePointCells,
      calculateThrowableCells,
      setThrowableCells,
      throwableCells,
    });
  }

  const moveToCell = (coordinates) => {
    selectedCharacter.position = coordinates;
    checkForStore(selectedCharacter);
    setReachableCells(calculateReachableCells(selectedCharacter.position, selectedCharacter.currentAgility, selectedMap.size));
    updateMatchState()
  };

  const handleZoneFix = (coordinates) => {
    setZoneFixed(true);
    let cellsInZone = [];

    if (pendingZoneEffect.type === "Луч") {
      const [startCol, startRow] = pendingZoneEffect.caster.position.split("-").map(Number);
      const [endCol, endRow] = coordinates.split("-").map(Number);

      const stepX = endCol > startCol ? 1 : endCol < startCol ? -1 : 0;
      const stepY = endRow > startRow ? 1 : endRow < startRow ? -1 : 0;

      let currentX = startCol;
      let currentY = startRow;

      while (currentX !== endCol || currentY !== endRow) {
        cellsInZone.push(`${currentX}-${currentY}`);
        currentX += stepX;
        currentY += stepY;
      }
      cellsInZone.push(`${endCol}-${endRow}`);

      // Добавляем боковые клетки для ширины луча
      if (pendingBeamEffect.stats.beamWidth > 1) {
        const halfWidth = Math.floor(pendingBeamEffect.stats.beamWidth / 2);
        const cellsToAdd = new Set();

        cellsInZone.forEach(cell => {
          const [x, y] = cell.split("-").map(Number);

          // Для горизонтального луча
          if (startRow === endRow) {
            for (let offset = 1; offset <= halfWidth; offset++) {
              if (y - offset >= 1) cellsToAdd.add(`${x}-${y - offset}`);
              if (y + offset <= selectedMap.size[1]) cellsToAdd.add(`${x}-${y + offset}`);
            }
          }
          // Для вертикального луча
          else if (startCol === endCol) {
            for (let offset = 1; offset <= halfWidth; offset++) {
              if (x - offset >= 1) cellsToAdd.add(`${x - offset}-${y}`);
              if (x + offset <= selectedMap.size[0]) cellsToAdd.add(`${x + offset}-${y}`);
            }
          }
        });

        cellsInZone = [...cellsInZone, ...cellsToAdd];
      }
    } else if (pendingZoneEffect.type === "Область" || pendingZoneEffect.type === "Заряды по области") {
      cellsInZone = calculateCellsForZone(
        coordinates,
        pendingZoneEffect.stats.rangeOfObject,
        selectedMap.size
      );
    }

    const affectedCharacters = [];
    ["red", "blue"].forEach((team) => {
      matchState.teams[team].characters.forEach((ch) => {
        if (cellsInZone.includes(ch.position) && ch.currentHP > 0) {
          affectedCharacters.push(ch);
        }
      });
    });

    setCharactersInZone(affectedCharacters);

    if (pendingZoneEffect.type === "Заряды по области") {
      const initialDistribution = {};
      affectedCharacters.forEach((ch) => {
        initialDistribution[ch.name] = 1;
      });
      setChargesDistribution(initialDistribution);
    }
  };

  const handleZoneFixShort = (corArr) => {
    setZoneFixed(true);
    let cellsInZone = [...corArr];

    const affectedCharacters = [];
    ["red", "blue"].forEach((team) => {
      matchState.teams[team].characters.forEach((ch) => {
        if (cellsInZone.includes(ch.position) && ch.currentHP > 0) {
          affectedCharacters.push(ch);
        }
      });
    });

    setCharactersInZone(affectedCharacters);

    // Инициализируем распределение зарядов
    if (pendingZoneEffect.type === "Заряды по области") {
      const initialDistribution = {};
      affectedCharacters.forEach((ch) => {
        initialDistribution[ch.name] = 1; // по умолчанию каждому по одному заряду
      });
      setChargesDistribution(initialDistribution);
    }
  };





  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  ////////////////////////////////////////////////////////////////
  // Обработка клика по иконке персонажа для вставки команды в поле ввода
  const handleCharacterIconCLick = (character) => {
    const coordinates = character.position;
    if (zoneSelectionMode || beamSelectionMode || pointSelectionMode) {
      if (zoneSelectionMode && calculateCastingAllowance(coordinates)) {
        // Закрепляем зону
        handleZoneFix(coordinates);
        return; // прекращаем дальнейшую обработку клика
      }
      if (beamSelectionMode && calculateCastingAllowance(coordinates)) {
        handleBeamFix(coordinates);
        return; // прекращаем дальнейшую обработку клика
      }
      if (pointSelectionMode && calculateCastingAllowance(coordinates)) {
        setPointDestination(coordinates);
        return; // прекращаем дальнейшую обработку клика
      }
    }
    else if (pendingMode === "attack") {
      if (selectedCharacter.team === teamTurn) {
        if (character.name === selectedCharacter.name) {
          if (matchState.teams[selectedCharacter.team].remain.moves > 0 && teamTurn === selectedCharacter.team) {
            setPendingMode("move");
            setReachableCells(calculateReachableCells(selectedCharacter.position, selectedCharacter.currentAgility));
          }
          else {
            setPendingMode(null)
          }
        }
        else if (attackableCells.includes(character.position)) {
          const result = handleAttackCharacter(character)[0];
          setAttackAnimations(prev => [...prev, {
            position: character.position,
            damageType: selectedCharacter.advancedSettings.damageType || 'физический'
          }]);
          addActionLog(`${selectedCharacter.name} атаковал ${character.name}: HP ${character.name} = ${result.currentHP}, Armor ${character.name} = ${result.currentArmor}`);
          character = JSON.parse(JSON.stringify(result.target));
          if (matchState.teams[selectedCharacter.team].remain.actions === 0) {
            setPendingMode(null);
            setAttackableCells([])
            if (matchState.teams[selectedCharacter.team].remain.moves > 0) {
              setPendingMode("move");
              setReachableCells(calculateReachableCells(selectedCharacter.position, selectedCharacter.currentAgility));
            }
          }
          updateMatchState()
        }
        else {
          setClickedEffectOnPanel(null);
          setShowCharacterInfoPanel(true);
          setSelectedCharacter(character);
          checkForStore(character);
          if (matchState.teams[character.team].remain.moves > 0 && teamTurn === character.team) {
            handleAttack(character);
          }
        }
      }
    }
    else if (pendingMode === "move") {
      if (selectedCharacter && character.name === selectedCharacter.name) {
        if (matchState.teams[teamTurn].remain.actions > 0 && teamTurn === selectedCharacter.team) {
          setPendingMode("attack");
          handleAttack(selectedCharacter);
        }
        else {
          setPendingMode(null)
        }
      }
      else if (matchState.teams[character.team].remain.moves > 0 && teamTurn === character.team) {
        setShowCharacterInfoPanel(true);
        setSelectedCharacter(character);
        setClickedEffectOnPanel(null);
        checkForStore(character);
        setPendingMode("move");
        setReachableCells(calculateReachableCells(character.position, character.currentAgility));
      }
      else if (teamTurn != character.team) {
        setPendingMode(null)
        setReachableCells([])
        setShowCharacterInfoPanel(true);
        setClickedEffectOnPanel(null);
        setSelectedCharacter(character);
      }
    }
    else if (pendingMode === "putDown") {
      putDownObject(character.position)
    }
    else {
      setShowCharacterInfoPanel(true);
      setSelectedCharacter(character);
      setClickedEffectOnPanel(null);
      if (character.team === teamTurn) {
        checkForStore(character)
        if (matchState.teams[character.team].remain.moves > 0) {
          setPendingMode("move");
          setReachableCells(calculateReachableCells(character.position, character.currentAgility));
        }
        else if (matchState.teams[character.team].remain.actions > 0) {
          setPendingMode("attack")
          handleAttack(character)
        }
        else {
          setPendingMode(null);
          setReachableCells([]);
          setAttackableCells([])
        }
      }
      else {
        setPendingMode(null);
        setReachableCells([])
        setAttackableCells([])
      }
    }
  };

  // Обработка клика по клетке карты (добавление координат в команду)
  const handleCellClick = (rowIndex, colIndex) => {
    const coordinates = `${colIndex + 1}-${rowIndex + 1}`;

    if (teleportationMode || zoneSelectionMode || beamSelectionMode || pointSelectionMode || buildingMode || contextMenu.visible) {
      if (teleportationMode && teleportationCells.includes(coordinates)) {
        handleTeleportation(coordinates);
        return;
      }
      if (zoneSelectionMode && calculateCastingAllowance(coordinates)) {
        handleZoneFix(coordinates);
        return;
      }
      if (beamSelectionMode && calculateCastingAllowance(coordinates)) {
        handleBeamFix(coordinates);
        return;
      }
      if (pointSelectionMode && calculateCastingAllowance(coordinates)) {
        setPointDestination(coordinates);
        return;
      }
      if (buildingMode && calculateBuildingAllowance(coordinates)) {
        setBuildingDestination(prev => [...prev, coordinates]);
        return;
      }
      if (contextMenu.visible) {
        setContextMenu({
          visible: false,
          x: 0,
          y: 0,
          character: null,
          cellCoord: null,
        });
      }
    } else {
      if (matchState.objectsOnMap.find(obj => obj.position === coordinates)) {
        if (dynamicTooltip && dynamicTooltip.coordinates === coordinates) {
          if (pendingMode === "attack") {
            if (matchState.objectsOnMap.find(object => object.position === coordinates && object.currentHP)) {
              let building = matchState.objectsOnMap.find(object => object.position === coordinates && object.currentHP)
              let result = attackBuilding(building, { damage: selectedCharacter.currentDamage, damageType: selectedCharacter.advancedSettings.damageType }, matchState)
              matchState.teams[teamTurn].remain.actions--
              let object = matchState.objectsOnMap.find(obj => obj.position === coordinates)
              if (!result.isDestroyed) {
                setDynamicTooltip({
                  coordinates,
                  title: object.name,
                  description: object.description,
                  parameters: object.type === "building" ? {
                    stats: object.stats,
                    current: {
                      currentHP: object.currentHP,
                      currentAgility: object.currentAgility,
                      currentDamage: object.currentDamage,
                      currentMana: object.currentMana,
                      currentArmor: object.currentArmor,
                      currentRange: object.currentRange
                    }
                  } : null,
                  image: object.image,
                  actions: object.type === "item" && [
                    {
                      name: "Взять",
                      onClick: () => {
                        takeObject(object)
                      }
                    }
                  ]
                })
              } else {
                setDynamicTooltip(null)
              }
              setPendingMode(matchState.teams[teamTurn].remain.moves > 0 ? "move" : "null")
            }
          }
          else {
            setDynamicTooltip(null)
          }
        }
        else {
          let object = matchState.objectsOnMap.find(obj => obj.position === coordinates)
          setDynamicTooltip({
            coordinates,
            title: object.name,
            description: object.description,
            parameters: object.type === "building" ? {
              stats: object.stats,
              current: {
                currentHP: object.currentHP,
                currentAgility: object.currentAgility,
                currentDamage: object.currentDamage,
                currentMana: object.currentMana,
                currentArmor: object.currentArmor,
                currentRange: object.currentRange
              }
            } : null,
            image: object.image,
            actions: object.type === "item" && [
              {
                name: "Взять",
                onClick: () => {
                  takeObject(object)
                }
              }
            ]
          })
          console.log({
            coordinates,
            title: object.name,
            description: object.description,
            parameters: object.type === "building" ? {
              stats: object.stats,
              current: {
                currentHP: object.currentHP,
                currentAgility: object.currentAgility,
                currentDamage: object.currentDamage,
                currentMana: object.currentMana,
                currentArmor: object.currentArmor,
                currentRange: object.currentRange
              }
            } : null,
            image: object.image,
            actions: [
              object.type === "item" && {
                name: "Взять",
                onClick: () => {
                  takeObject(object)
                }
              }
            ]
          });
        }
      } else {
        if (reachableCells.includes(coordinates) && pendingMode === "move" && matchState.teams[teamTurn].remain.moves > 0) {
          moveToCell(coordinates);
          matchState.teams[teamTurn].remain.moves -= 1;
          if (matchState.teams[teamTurn].remain.moves === 0) {
            setPendingMode(null);
            setReachableCells([]);
          }
        }
        if (attackableCells.includes(coordinates) && pendingMode === "attack" && matchState.teams[teamTurn].remain.actions > 0) {
          if (selectedMap.map[rowIndex][colIndex].initial === "red base") {
            let result = attackBase("red", selectedCharacter.currentDamage, matchState)
            if (result.status.teamWon) {
              matchState.status = "red_base_destroyed"
            }
            matchState.teams[teamTurn].remain.actions -= 1
            setPendingMode(null)
            setAttackableCells([])
          }
          if (selectedMap.map[rowIndex][colIndex].initial === "blue base") {
            let result = attackBase("blue", selectedCharacter.currentDamage, matchState)
            if (result.status.teamWon) {
              matchState.status = "blue_base_destroyed"
            }
            matchState.teams[teamTurn].remain.actions -= 1
            setPendingMode(null)
            setAttackableCells([])
          }
        }
        if (pendingMode === "putDown" && throwableCells.includes(coordinates)) {
          putDownObject(coordinates)
        }
        if (pendingMode === null) {
          if (matchState.objectsOnMap.find(obj => obj.position === coordinates)) {
            if (dynamicTooltip) {
              setDynamicTooltip(null)
            } else {
              let object = matchState.objectsOnMap.find(obj => obj.position === coordinates)
              setDynamicTooltip({
                coordinates,
                title: object.name,
                description: object.description,
                parameters: object.type === "building" ? {
                  stats: object.stats,
                  current: {
                    currentHP: object.currentHP,
                    currentAgility: object.currentAgility,
                    currentDamage: object.currentDamage,
                    currentMana: object.currentMana,
                    currentArmor: object.currentArmor,
                    currentRange: object.currentRange
                  }
                } : null,
                image: object.image,
                actions: object.type === "item" && [
                  {
                    name: "Взять",
                    onClick: () => {
                      takeObject(object)
                    }
                  }
                ]
              })
            }
          }
        }
        if (["laboratory", "armory", "magic shop"].includes(selectedMap.map[rowIndex][colIndex].initial)) {
          setStore(selectedMap.map[rowIndex][colIndex].initial);
        }
      }
    }
  };

  // Обработка правого клика по клетке карты для отображения контекстного меню
  const handleRightClick = (e, cellCoord, character) => {
    e.preventDefault();

    // Если по клетке есть персонаж – открываем контекстное меню для персонажа
    if (character) {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        isCharacter: true,
        character,
        cellCoord,
      });
      return;
    }

    // Если персонажа нет, определяем тип клетки по координатам
    const [colStr, rowStr] = cellCoord.split("-");
    const col = parseInt(colStr);
    const row = parseInt(rowStr);

    // Получаем клетку карты по координатам (0-индекс)
    const cell = selectedMap.map[row - 1] && selectedMap.map[row - 1][col - 1];
    if (!cell) return;

    // Если клетка является храмом
    if (cell.initial === "red church" || cell.initial === "blue church") {
      const churchTeam = cell.initial === "red church" ? "red" : "blue";
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        cellCoord,
        isCharacter: false,
        church: true,
        churchTeam,
        manaPerTurn: 250
      });
      return;
    }

    // Если клетка является магазином, определяем товары в зависимости от типа магазина
    if (
      cell.initial === "laboratory" ||
      cell.initial === "armory" ||
      cell.initial === "magic shop"
    ) {
      let shopItems = [];
      if (cell.initial === "laboratory") {
        // Товары из Лаборатории
        shopItems = availableItems.filter(
          (it) => it.shopType.toLowerCase() === "лаборатория"
        );
      } else if (cell.initial === "armory") {
        // Товары из Оружейной
        shopItems = availableItems.filter(
          (it) => it.shopType.toLowerCase() === "оружейная"
        );
      } else if (cell.initial === "magic shop") {
        // Товары из Магического магазина
        shopItems = availableItems.filter(
          (it) => it.shopType.toLowerCase() === "магический"
        );
      }
      if (shopItems.length > 0) {
        // Формируем контекстное меню для магазина с перечнем товаров
        setContextMenu({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          cellCoord,
          isCharacter: false,
          shop: true,
          shopItems: shopItems.map((item) => ({
            name: item.name,
            price: item.price,
            currency: item.currency,
          })),
        });
      }
    } else {
      // Если клетка не является магазином, проверяем наличие эффектов на ней
      const effects = getEffectsForCell(cellCoord);
      if (effects.length > 0) {
        // Формируем информацию об эффектах для отображения
        const info = effects.map((effect) => ({
          name: effect.name,
          color: effect.stats.rangeColor,
        }));
        setCellEffectsInfo({ cellCoord, effects: info });
      } else {
        setCellEffectsInfo(null);
      }
    }
  };

  // Пример: когда игрок наводит мышку (handleCellMouseEnter) в режиме выбора,
  const handleCellMouseEnter = (cellCoord) => {
    if ((!zoneSelectionMode && !beamSelectionMode && !teleportationMode) || zoneFixed || beamFixed) {
      setHoveredCell(cellCoord);

      let char = findCharacterByPosition(cellCoord, matchState)

      const [col, row] = splitCoord(cellCoord, 1);
      const cell = selectedMap.map[row][col];

      if (!char && (cell && cellHasType(["empty", "bush", "healing zone"], [col, row], selectedMap)) && !objectOnCell(cellCoord, matchState)) {
        setShowCoordinates(true);
      } else {
        setShowCoordinates(false);
        return;
      }
    }

    if (teleportationMode && teleportationCells.includes(cellCoord)) {
      setTeleportationDestination(cellCoord);
      return; // прекращаем дальнейшую обработку клика
    }

    if ((pendingMode === "throw" || pendingMode === "putDown") && throwableCells.includes(cellCoord)) {
      setThrowDestination(cellCoord);
      return;
    }

    if (calculateCastingAllowance(cellCoord)) {
      if (beamSelectionMode) {
        if (pendingBeamEffect.type === "Луч с перемещением") {
          const cells = calculateBeamCellsComb(
            pendingBeamEffect.caster.position,
            cellCoord,
            selectedMap.size,
            pendingBeamEffect.coordinates,
            pendingBeamEffect.stats.beamWidth,
            pendingBeamEffect.canGoThroughWalls || false
          );
          setBeamCells(cells);
        } else if (pendingBeamEffect.type === "Луч") {
          const cells = calculateBeamCells(
            pendingBeamEffect.caster.position,
            cellCoord,
            selectedMap.size,
            pendingBeamEffect.coordinates,
            pendingBeamEffect.stats.beamWidth,
            pendingBeamEffect.canGoThroughWalls || false
          );
          setBeamCells(cells);
        }
      } else if (zoneSelectionMode) {
        const cells = calculateCellsForZone(
          cellCoord,
          pendingZoneEffect.stats.rangeOfObject,
          selectedMap.size
        );
        setSelectionOverlay(cells);
      }
      else if (pointSelectionMode) {
        setPointDestination(cellCoord);
      }
    }
  };
  ////////////////////////////////////////////////////////////////



















  
  const handleEndTurn = () => {
    const nextTeam = teamTurn === "red" ? "blue" : "red";
    const isNewRoundStarting = nextTeam === firstTeamToAct;

    // Вызов менеджера эффектов для текущей команды (завершающей ход)
    const effectsManager = new EffectsManager(matchState, selectedMap, addActionLog);
    effectsManager.applyCharacterEffects(teamTurn);
    effectsManager.applyZoneEffects(matchState.churches, teamTurn);



    if (isNewRoundStarting) {
      coolingDownAbilities();
      coolingDownStores();
      matchState.teams.red.remain.moves = matchState.advancedSettings.movesPerTurn;
      matchState.teams.red.remain.actions = matchState.advancedSettings.actionsPerTurn;
      matchState.teams.blue.remain.moves = matchState.advancedSettings.movesPerTurn;
      matchState.teams.blue.remain.actions = matchState.advancedSettings.actionsPerTurn;
      matchState.turn += 1;
      addActionLog(`--- Ход ${matchState.turn} завершён ---`);
      // Пример проверки всех объектов:
      const updatedObjects = matchState.objectsOnMap
        .map((obj) => {
          if (obj.type === "zone") {
            // Уменьшаем
            const newRemains = obj.turnsRemain - 1;
            return { ...obj, turnsRemain: newRemains };
          }
          return obj;
        })
        .filter((obj) => {
          // Фильтруем, убираем зоны, у которых turnsRemain <= 0
          if (obj.type === "zone" && obj.turnsRemain <= 0) return false;
          return true;
        });

      updateMatchState({ objectsOnMap: updatedObjects });
    }

    setTeamTurn(nextTeam);

    setThrowableCells([]);
    setReachableCells([]);
    setAttackableCells([]);
    setPointCells([]);
    setPointDestination(null);

    setItemHelperInfo(null);
    setDynamicTooltip(null);

    setPointSelectionMode(false);
    setZoneSelectionMode(false);
    setZoneFixed(false);
    setBeamSelectionMode(false);
    setBeamFixed(false);

    setSelectionOverlay([]);

    setPendingZoneEffect(null);
    setPendingBeamEffect(null);
    setPendingPointEffect(null);
    setPendingItem(null);

    setPendingMode(null);
    setSelectedCharacter(null);
    localStorage.setItem("teamTurn", nextTeam);
    addActionLog(`🎲 Ход команды ${nextTeam === "red" ? "Красные" : "Синие"}`);
    updateMatchState();
  };

  const restartAbilityCooldowns = (characterName) => {
    let char = findCharacter(characterName, matchState);
    char.abilities.forEach(ability => {
      ability.currentCooldown = ability.coolDown;
    });
    updateMatchState();
  }

  const coolingDownAbilities = () => {
    matchState.teams.red.characters.forEach(ch => {
      ch.abilities.forEach(ability => {
        if (ability.currentCooldown > 0) {
          ability.currentCooldown -= 1;
        }
      });
    });
    matchState.teams.blue.characters.forEach(ch => {
      ch.abilities.forEach(ability => {
        if (ability.currentCooldown > 0) {
          ability.currentCooldown -= 1;
        }
      });
    });
  }

  const coolingDownStores = () => {
    matchState.teams.red.characters.forEach(ch => {
      if (ch.labCooldown > 0) ch.labCooldown--
      if (ch.armoryCooldown > 0) ch.armoryCooldown--
    });
    matchState.teams.blue.characters.forEach(ch => {
      if (ch.labCooldown > 0) ch.labCooldown--
      if (ch.armoryCooldown > 0) ch.armoryCooldown--
    });
  }

  const confirmBuilding = () => {
    for (let i = 0; i < buildingDestination.length; i++) {
      handleBuild(selectedCharacter, pendingItem, buildingDestination[i]);
      if (pendingItem.name === "Стена (х3)") {
        selectedCharacter.inventory.find(item => item.name === "Стена (х3)").left -= 1;
        if (selectedCharacter.inventory.find(item => item.name === "Стена (х3)").left === 0) {
          selectedCharacter.inventory = selectedCharacter.inventory.filter(item => item.name !== "Стена (х3)");
        }
      }
      else {
        selectedCharacter.inventory = selectedCharacter.inventory.filter(item => item.name !== pendingItem.name);
      }
    }
    matchState.teams[teamTurn].remain.actions -= 1;
    setBuildingMode(false);
    setBuildingCells([]);
    setBuildingDestination([]);
    setSelectionOverlay([]);
    setPendingItem(null);
    if (matchState.teams[teamTurn].remain.moves > 0) {
      setPendingMode("move");
    } else {
      setPendingMode(null);
    }
  }

  const confirmZoneEffect = () => {
    if (!pendingZoneEffect) return;

    if (pendingZoneEffect.type === "Заряды по области") {
      const preparedCharacters = charactersInZone
        .map((ch) => ({
          ch,
          amount: chargesDistribution[ch.name] || 0,
        }))
        .filter((item) => item.amount > 0);

      pendingZoneEffect.effectPerAttack({
        affectedCharacters: preparedCharacters,
        addActionLog,
      });
    } else if (
      pendingZoneEffect.type === "Мгновенная область способности" &&
      pendingZoneEffect.zoneEffect
    ) {
      pendingZoneEffect.zoneEffect(charactersInZone);
    }
    if (pendingZoneEffect.type === "Область с перемещением") {
      pendingZoneEffect.zoneEffect(charactersInZone);
      // Перемещаем персонажа в центр выбранной области
      if (selectionOverlay.length > 0) {
        // Находим центр области
        let sumX = 0, sumY = 0;
        selectionOverlay.forEach(cell => {
          const [col, row] = cell.split("-").map(Number);
          sumX += col;
          sumY += row;
        });

        // Вычисляем среднее значение координат (центр области)
        const centerX = Math.round(sumX / selectionOverlay.length);
        const centerY = Math.round(sumY / selectionOverlay.length);
        const centerCoord = `${centerX}-${centerY}`;

        // Определяем команду персонажа
        const casterTeam = matchState.teams.red.characters.some(
          ch => ch.name === pendingZoneEffect.caster.name
        ) ? "red" : "blue";

        // Обновляем позицию персонажа
        const updatedCharacter = { ...pendingZoneEffect.caster, position: centerCoord };

        // Обновляем состояние матча
        const updatedTeams = { ...matchState.teams };
        updatedTeams[casterTeam].characters = updatedTeams[casterTeam].characters.map(ch =>
          ch.name === pendingZoneEffect.caster.name ? updatedCharacter : ch
        );

        matchState.teams[casterTeam].remain.actions -= 1;
        updateMatchState({ teams: updatedTeams });
        addActionLog(`${pendingZoneEffect.caster.name} перемещается в центр области (${centerCoord})`);
      }
    }

    // Очищаем состояния
    setZoneSelectionMode(false);
    setZoneFixed(false);
    setSelectionOverlay([]);
    setPendingZoneEffect(null);
    restartAbilityCooldowns(pendingZoneEffect.caster.name);
    setAttackAnimations([...charactersInZone.map(ch => {
      return {
        position: ch.position,
        damageType: pendingZoneEffect.stats.damageType,
      }
    })]);
    setCharactersInZone([]);
    setChargesDistribution({});
    matchState.teams[teamTurn].remain.actions -= 1;
  };

  const confirmBeamEffect = () => {
    if (!pendingBeamEffect) return;

    pendingBeamEffect.beamEffect(charactersInZone);
    if (pendingBeamEffect.type === "Луч с перемещением") {
      // Определяем команду персонажа
      const casterTeam = matchState.teams.red.characters.some(
        ch => ch.name === pendingBeamEffect.caster.name
      ) ? "red" : "blue";

      // Получаем позицию персонажа, который использует способность
      const [casterCol, casterRow] = pendingBeamEffect.caster.position.split("-").map(Number);

      // Определяем направление луча, используя первую клетку в beamCells
      if (beamCells.length > 0) {
        const [firstBeamCol, firstBeamRow] = beamCells[0].split("-").map(Number);

        // Вычисляем направление луча
        const dirX = firstBeamCol > casterCol ? 1 : firstBeamCol < casterCol ? -1 : 0;
        const dirY = firstBeamRow > casterRow ? 1 : firstBeamRow < casterRow ? -1 : 0;

        // Находим длину центральной линии луча
        let maxDistance = 0;
        let endPosition = null;

        // Проходим по всем клеткам луча, чтобы найти самую дальнюю клетку в направлении луча
        beamCells.forEach(cell => {
          const [cellCol, cellRow] = cell.split("-").map(Number);

          // Проверяем, находится ли клетка на центральной линии
          const isOnCentralLine =
            (dirX === 0 && cellCol === casterCol) ||
            (dirY === 0 && cellRow === casterRow) ||
            (Math.abs(cellCol - casterCol) === Math.abs(cellRow - casterRow) &&
              Math.sign(cellCol - casterCol) === dirX &&
              Math.sign(cellRow - casterRow) === dirY);

          if (isOnCentralLine) {
            const distance = Math.max(
              Math.abs(cellCol - casterCol),
              Math.abs(cellRow - casterRow)
            );

            if (distance > maxDistance) {
              maxDistance = distance;
              endPosition = cell;
            }
          }
        });

        if (endPosition) {
          // Проверяем, свободна ли конечная позиция
          let targetPosition = endPosition;
          let isCellOccupied = false;

          // Проверяем, есть ли персонаж на целевой клетке
          ["red", "blue"].forEach(team => {
            matchState.teams[team].characters.forEach(ch => {
              if (ch.position === targetPosition && ch.currentHP > 0) {
                isCellOccupied = true;
              }
            });
          });

          // Если клетка занята, ищем ближайшую свободную
          if (isCellOccupied) {
            const [endCol, endRow] = endPosition.split("-").map(Number);
            const adjacentCells = [
              `${endCol + 1}-${endRow}`, `${endCol - 1}-${endRow}`,
              `${endCol}-${endRow + 1}`, `${endCol}-${endRow - 1}`,
              `${endCol + 1}-${endRow + 1}`, `${endCol - 1}-${endRow - 1}`,
              `${endCol + 1}-${endRow - 1}`, `${endCol - 1}-${endRow + 1}`
            ];

            // Фильтруем клетки, которые находятся в пределах карты
            const validCells = adjacentCells.filter(cell => {
              const [col, row] = cell.split("-").map(Number);
              return col >= 1 && col <= selectedMap.size[0] &&
                row >= 1 && row <= selectedMap.size[1];
            });

            // Проверяем, какие клетки свободны
            const freeCells = validCells.filter(cell => {
              let isOccupied = false;
              ["red", "blue"].forEach(team => {
                matchState.teams[team].characters.forEach(ch => {
                  if (ch.position === cell && ch.currentHP > 0) {
                    isOccupied = true;
                  }
                });
              });
              return !isOccupied;
            });

            if (freeCells.length > 0) {
              // Выбираем случайную свободную клетку
              targetPosition = freeCells[Math.floor(Math.random() * freeCells.length)];
            }
          }

          // Перемещаем персонажа
          const updatedCharacter = { ...pendingBeamEffect.caster, position: targetPosition };

          // Обновляем состояние матча
          const updatedTeams = { ...matchState.teams };
          updatedTeams[casterTeam].characters = updatedTeams[casterTeam].characters.map(ch =>
            ch.name === pendingBeamEffect.caster.name ? updatedCharacter : ch
          );

          matchState.teams[casterTeam].remain.actions -= 1;
          updateMatchState({ teams: updatedTeams });
          addActionLog(`${pendingBeamEffect.caster.name} перемещается на ${targetPosition} после применения луча.`);
        }
      }
    }
    addActionLog(`Луч ${pendingBeamEffect.name} нанес урон персонажам: ${charactersInZone.map((ch) => ch.name).join(", ")}`);
    matchState.teams[teamTurn].remain.actions -= 1;
    setBeamSelectionMode(false);
    setBeamFixed(false);
    setSelectionOverlay([]);
    setPendingBeamEffect(null);
    setAttackAnimations([...charactersInZone.map(ch => {
      return {
        position: ch.position,
        damageType: pendingBeamEffect.stats.damageType,
      }
    })]);
    setCharactersInZone([]);
    setBeamCells([]);
    restartAbilityCooldowns(pendingBeamEffect.caster.name);
  };

  const confirmPointEffect = () => {
    if (!pendingPointEffect) return;

    pendingPointEffect.effect(charactersAtPoint);
    matchState.teams[teamTurn].remain.actions -= 1;
    setPointSelectionMode(false);
    setPointCells([]);
    setPointDestination(null);
    setPendingPointEffect(null);
    restartAbilityCooldowns(pendingPointEffect.caster.name);
  };

  // Функция закрытия модального окна персонажа
  function handleCloseCharacterModal() {
    setSelectedCharacter(null);
    setPendingMode(null);
    setClickedEffectOnPanel(null);
  }

  /**
   * Вычисляет клетки луча с эффектом "вилки". Направление определяется по выбранной клетке,
   * а максимальное расстояние берётся из beamRange (abilityObj.coordinates).
   *
   * @param {string} startCoord - позиция заклинателя, например, "3-5"
   * @param {string} directionCoord - выбранная клетка для направления луча (для вычисления шага)
   * @param {number[]} mapSize - размер карты [кол-во столбцов, кол-во строк]
   * @param {number} beamRange - расстояние луча в клетках (значение из abilityObj.coordinates)
   * @param {number} beamWidth - ширина луча (по умолчанию 1)
   * @returns {string[]} Массив координат в формате "col-row"
   */
  const calculateBeamCells = (startCoord, directionCoord, mapSize, beamRange, beamWidth = 1, canGoThroughWalls = false) => {
    // Преобразуем координаты в числовые значения
    const [startCol, startRow] = startCoord.split('-').map(Number);
    const [dirCol, dirRow] = directionCoord.split('-').map(Number);

    // Вычисляем направление луча: шаг по каждой оси будет 1, -1 или 0.
    const stepX = dirCol === startCol ? 0 : (dirCol - startCol) > 0 ? 1 : -1;
    const stepY = dirRow === startRow ? 0 : (dirRow - startRow) > 0 ? 1 : -1;

    // Перпендикулярный вектор (используется для боковых ветвей)
    const perpX = stepY;
    const perpY = -stepX;

    // Вычисляем центральную линию луча ровно на beamRange шагов (без использования конечной точки)
    // Начинаем с первой клетки, смежной с персонажем.
    const centralBeam = [];
    for (let i = 0; i < beamRange; i++) {
      const currX = startCol + stepX * (i + 1);
      const currY = startRow + stepY * (i + 1);
      // Если клетка выходит за границы карты, завершаем линию
      if (currX < 1 || currX > mapSize[0] || currY < 1 || currY > mapSize[1]) break;
      const cell = selectedMap.map[currY - 1]?.[currX - 1];
      // Если клетка содержит препятствие – прекращаем проход
      if (!cell || ["red base", "blue base", "magic shop", "laboratory", "armory"].includes(cell.initial) && !canGoThroughWalls || (matchState.objectsOnMap.find((obj) => obj.position === `${currX}-${currY}`)) && !canGoThroughWalls) break;
      centralBeam.push({ col: currX, row: currY });
    }

    // Если центральная линия не получилась – возвращаем пустой массив
    if (centralBeam.length === 0) return [];

    // Определяем смещения для ветвей.
    // Всегда есть центральная ветвь (смещение 0). Если ширина больше 1, добавляем боковые ветви (+offset и -offset)
    const branchOffsets = [];
    branchOffsets.push(0);
    if (beamWidth > 1) {
      const halfWidth = Math.floor(beamWidth / 2);
      for (let offset = 1; offset <= halfWidth; offset++) {
        branchOffsets.push(offset, -offset);
      }
    }

    let beamCells = [];
    // Для каждой ветви рассчитываем клетки, используя ту же длину, что и центральная линия.
    for (const offset of branchOffsets) {
      const branchLine = [];
      for (let i = 0; i < centralBeam.length; i++) {
        // Вычисление позиции клетки: стартовая позиция плюс i+1 шагов по направлению и смещение по перпендикулярной оси.
        const x = startCol + stepX * (i + 1) + offset * perpX;
        const y = startRow + stepY * (i + 1) + offset * perpY;
        // Если выходит за границы карты – завершаем эту ветвь
        if (x < 1 || x > mapSize[0] || y < 1 || y > mapSize[1]) break;
        const cell = selectedMap.map[y - 1]?.[x - 1];
        if (!cell || (["red base", "blue base", "magic shop", "laboratory", "armory"].includes(cell.initial) && !canGoThroughWalls) || (matchState.objectsOnMap.find((obj) => obj.position === `${x}-${y}`) && !canGoThroughWalls)) break;
        branchLine.push(`${x}-${y}`);
      }
      beamCells = beamCells.concat(branchLine);
    }
    return beamCells;
  };

  // Расчет клеток луча по методу "расческа"
  const calculateBeamCellsComb = (startPosition, directionCoord, mapSize, beamRange, beamWidth = 1, canGoThroughWalls = false) => {

    const [startCol, startRow] = startPosition.split("-").map(Number);
    const [dirCol, dirRow] = directionCoord.split("-").map(Number);

    // Определяем направление луча
    const stepX = dirCol === startCol ? 0 : (dirCol - startCol) > 0 ? 1 : -1;
    const stepY = dirRow === startRow ? 0 : (dirRow - startRow) > 0 ? 1 : -1;

    // Определяем перпендикулярное направление для боковых ветвей
    const perpX = stepY;
    const perpY = -stepX;

    // Вычисляем центральную линию луча ровно на beamRange шагов
    const centralBeam = [];
    for (let i = 0; i < beamRange; i++) {
      const currX = startCol + stepX * (i + 1);
      const currY = startRow + stepY * (i + 1);

      // Если клетка выходит за границы карты, завершаем линию
      if (currX < 1 || currX > mapSize[0] || currY < 1 || currY > mapSize[1]) break;

      const cell = selectedMap.map[currY - 1]?.[currX - 1];
      // Если клетки нет, прерываем
      if (!cell) break;

      // Если можем проходить сквозь стены, добавляем клетку в любом случае
      if (canGoThroughWalls) {
        centralBeam.push({ col: currX, row: currY });
      } else {
        // Если не можем проходить сквозь стены, проверяем препятствия
        if (["red base", "blue base", "magic shop", "laboratory", "armory"].includes(cell.initial) || (matchState.objectsOnMap.find((obj) => obj.position === `${currX}-${currY}`))) break;
        centralBeam.push({ col: currX, row: currY });
      }
    }

    // Если центральная линия не получилась – возвращаем пустой массив
    if (centralBeam.length === 0) return [];

    // Определяем максимальное смещение для боковых ветвей
    const halfWidth = Math.floor(beamWidth / 2);

    // Создаем массив для хранения клеток луча
    let beamCells = [];
    // Добавляем центральную линию в результат
    centralBeam.forEach(point => {
      beamCells.push(`${point.col}-${point.row}`);
      // Для каждой клетки центральной линии создаем перпендикулярные ветви
      if (beamWidth > 1) {
        // Проверяем в обе стороны от центральной клетки
        for (let direction = -1; direction <= 1; direction += 2) {
          for (let offset = 1; offset <= halfWidth; offset++) {
            const x = point.col + offset * direction * perpX;
            const y = point.row + offset * direction * perpY;

            // Проверяем границы карты
            if (x < 1 || x > mapSize[0] || y < 1 || y > mapSize[1]) break;

            const cell = selectedMap.map[y - 1]?.[x - 1];
            // Если клетки нет, прерываем
            if (!cell) break;

            // Если можем проходить сквозь стены, добавляем клетку в любом случае
            if (canGoThroughWalls) {
              beamCells.push(`${x}-${y}`);
            } else {
              // Если не можем проходить сквозь стены, проверяем препятствия
              if (["red base", "blue base", "magic shop", "laboratory", "armory"].includes(cell.initial) || (matchState.objectsOnMap.find((obj) => obj.position === `${x}-${y}`))) break;
              beamCells.push(`${x}-${y}`);
            }
          }
        }
      }
    });
    return beamCells;
  };

  const calculatePointCells = (startCoord, range, mapSize, canGoThroughWalls = false) => {
    console.log(startCoord, range, mapSize, canGoThroughWalls);
    const [startCol, startRow] = startCoord.split("-").map(Number);
    const cells = new Set(); // Используем Set для уникальных координат

    // Направления: вниз, вверх, вправо, влево
    const directions = [
      { stepX: 0, stepY: 1 },  // Вниз
      { stepX: 0, stepY: -1 }, // Вверх
      { stepX: 1, stepY: 0 },  // Вправо
      { stepX: -1, stepY: 0 }  // Влево
    ];

    // Проходим по каждому направлению
    directions.forEach(({ stepX, stepY }) => {
      // Начинаем с первой клетки, смежной с персонажем
      for (let i = 0; i < range; i++) {
        const currX = startCol + stepX * (i + 1);
        const currY = startRow + stepY * (i + 1);

        // Если клетка выходит за границы карты, завершаем линию
        if (currX < 1 || currX > mapSize[0] || currY < 1 || currY > mapSize[1]) break;

        const cell = selectedMap.map[currY - 1]?.[currX - 1];
        // Если клетки нет, прерываем
        if (!cell) break;

        const cellCoord = `${currX}-${currY}`;

        // Проверяем, есть ли на клетке персонаж
        const hasCharacter = ["red", "blue"].some(team =>
          matchState.teams[team].characters.some(ch => ch.position === cellCoord && ch.currentHP > 0)
        );

        // Если можем проходить сквозь стены, проверяем только персонажей
        if (canGoThroughWalls) {
          // Добавляем клетку в любом случае
          cells.add(cellCoord);

          // Если на клетке есть персонаж, прерываем линию
          if (hasCharacter) break;
        } else {
          // Если не можем проходить сквозь стены, проверяем все препятствия
          if (["red base", "blue base", "magic shop", "laboratory", "armory"].includes(cell.initial) || (matchState.objectsOnMap.find((obj) => obj.position === `${currX}-${currY}`))) {
            break;
          }

          // Добавляем клетку в результат
          cells.add(cellCoord);

          // Если на клетке есть персонаж, прерываем линию
          if (hasCharacter) break;
        }
      }
    });
    return Array.from(cells);
  };

  const handleBeamFix = () => {
    const cellsInBeam = [...beamCells];

    const affectedCharacters = [];
    ["red", "blue"].forEach((team) => {
      matchState.teams[team].characters.forEach((ch) => {
        if (cellsInBeam.includes(ch.position) && ch.currentHP > 0) {
          affectedCharacters.push(ch);
        }
      });
    });
    setCharactersInZone(affectedCharacters);
    setBeamFixed(true);
  };

  const renderCharacterIcon = (char, team) => (
    <button            /* <— button ловит Enter/Space + легко сделать :focus */
      type="button"
      className={`field-character-icon`}
      onClick={(e) => {             // клик по герою
        e.stopPropagation();         // не передаём событие клетке!
        handleCharacterIconCLick(char);
      }}
    >
      <img
        src={`src/assets/characters/${char.image}`}
        alt={char.name}
        style={{
          transform: team === "blue" ? "scaleX(-1)" : "none",
        }}
        draggable={false}
      />
    </button>
  );

  const renderGameMap = () => {
    return (
      <div className="game-map">
        <div
          className="map-preview"
          style={{
            gridTemplateColumns: `repeat(${selectedMap.size[0]}, 1fr)`,
            gridTemplateRows: `repeat(${selectedMap.size[1]}, 1fr)`,
            outline: `5px solid ${teamTurn === "red" ? "#942b2b" : "#1a5896"}`,
            transition: "outline 0.3s ease",
            aspectRatio: "45 / 28",
            minWidth: "400px",
            backgroundColor: "rgb(128, 130, 33)",
            minHeight: "280px",
          }}
        >
          {selectedMap.map.flat().map((cell, index) => {
            const rowIndex = Math.floor(index / selectedMap.size[0]);
            const colIndex = index % selectedMap.size[0];
            const cellKey = `${colIndex + 1}-${rowIndex + 1}`;

            // Ищем подсветки для этой клетки
            // Находим первую подсветку для этой клетки
            const overlay = allOverlays?.find((obj) =>
              obj?.cells?.includes(cellKey)
            );

            // Получаем цвет, если есть
            const highlightColor = overlay?.color ?? null;

            // Формируем inline-стиль, или можно динамический класс
            let highlightStyle = {};
            if (highlightColor) {
              highlightStyle.boxShadow = `inset 0 0 0 3px ${highlightColor}`;
            }

            const redChar = matchState.teams.red.characters.find(
              (ch) => ch.position === cellKey && ch.currentHP > 0
            );
            const blueChar = matchState.teams.blue.characters.find(
              (ch) => ch.position === cellKey && ch.currentHP > 0
            );
            //Все таки будем через заготовленные классы работать
            // Дополнительные классы (reachable, attackable, hovered, etc.)
            const classes = ["cell-wrapper"];
            if (reachableCells.includes(cellKey))
              classes.push("reachable-cell");
            if (attackableCells.includes(cellKey))
              classes.push("attackable-cell");
            if (selectionOverlay.includes(cellKey))
              classes.push("selectable-cell");
            if (beamCells.includes(cellKey))
              classes.push("beam-selection");
            if (throwableCells.includes(cellKey) || buildingCells.includes(cellKey))
              classes.push("throwable-cell");
            if (teleportationCells.includes(cellKey) && cellKey !== teleportationDestination)
              classes.push("cell--teleport-available");
            if (teleportationDestination === cellKey)
              classes.push("cell--teleport-target");
            if (pointCells.includes(cellKey))
              classes.push("cell--point");
            if (pointDestination === cellKey)
              classes.push("cell--point-target");
            if (buildingDestination.includes(cellKey))
              classes.push("cell--building-target");
            if (redChar)
              classes.push("red-character");
            if (blueChar)
              classes.push("blue-character");
            if (hoveredCell === cellKey) classes.push("hovered");
            // Находим персонажа

            // Проверяем, нужно ли показывать координаты
            const showCoordinates = hoveredCell === cellKey &&
              (!redChar && !blueChar) &&
              (cell.initial === "empty" ||
                cell.initial === "wall" ||
                cell.initial === "bush");

            const isAttackAnimation = attackAnimations.find(anim => anim.position === cellKey);

            const getAttackName = (damageType) => {
              switch (damageType) {
                case "физический":
                  return "physicalAttack";
                case "магический":
                  return "magicalAttack";
                case "технический":
                  return "technicalAttack";
                case "чистый":
                  return "pureAttack";
                default:
                  return "physicalAttack";
              }
            };

            return (
              <div
                key={cellKey}
                className={classes.join(" ")}
                style={highlightStyle}
                onMouseEnter={() => handleCellMouseEnter(cellKey)}
                onMouseLeave={() => setHoveredCell(null)}
                onClick={() => {
                  handleCellClick(rowIndex, colIndex);
                }}
                onContextMenu={(e) => handleRightClick(e, cellKey, redChar || blueChar)}
              >
                {renderCell(cell, rowIndex, colIndex)}
                {isAttackAnimation && (
                  <div className="attack-animation">
                    <img src={`/src/assets/gifs/${getAttackName(isAttackAnimation.damageType)}.gif`} />
                  </div>
                )}
                {redChar && renderCharacterIcon(redChar, "red")}
                {blueChar && renderCharacterIcon(blueChar, "blue")}
                {showCoordinates && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '6px',
                    color: 'white',
                    fontWeight: 'bold',
                    textShadow: '1px 1px 1px black',
                    pointerEvents: 'none',
                    zIndex: 1003
                  }}>
                    {cellKey}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Функция для постановки игры на паузу
  const handlePause = () => {
    const updatedMatchState = {
      ...matchState,
      gameTime: {
        ...matchState.gameTime,
        isPaused: true,
        pauseStartTime: Date.now()
      }
    };
    setMatchState(updatedMatchState);
    setIsPaused(true);
  };

  // Функция для продолжения игры после паузы
  const handleResume = () => {
    if (matchState.gameTime.pauseStartTime) {
      const currentPauseDuration = Date.now() - matchState.gameTime.pauseStartTime;
      const updatedMatchState = {
        ...matchState,
        gameTime: {
          ...matchState.gameTime,
          isPaused: false,
          pausedTime: matchState.gameTime.pausedTime + currentPauseDuration,
          pauseStartTime: null
        }
      };
      setMatchState(updatedMatchState);
    }
    setIsPaused(false);
  };

  // Функция для загрузки текущего состояния матча в формате JSON
  const handleDownloadCurrentMatch = () => {
    const blob = new Blob([JSON.stringify(matchState, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `match_${Date.now()}.json`;
    a.click();
  };

  // Функция для загрузки истории матчей (bigMatchHistory) из localStorage
  const handleDownloadAllMatches = () => {
    let bigJSON = localStorage.getItem("bigMatchHistory");
    let history = [];
    if (bigJSON) {
      history = JSON.parse(bigJSON);
    }
    history.push(matchState);
    localStorage.setItem("bigMatchHistory", JSON.stringify(history));
    const blob = new Blob([JSON.stringify(history, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `match_history_${Date.now()}.json`;
    a.click();
  };

  // Функция для расчета доступных клеток для телепортации
  const calculateTeleportationCells = (startCoord, range, mapSize) => {
    const [startCol, startRow] = startCoord.split("-").map(Number);
    const cells = [];

    // Определяем границы для обхода клеток в зависимости от range
    let rowStart = 1, rowEnd = mapSize[1];
    let colStart = 1, colEnd = mapSize[0];

    if (range !== "map") {
      if (range === "half map") {
        // Определяем, на какой половине карты находится персонаж
        const isLeftHalf = startCol <= mapSize[0] / 2;
        colStart = isLeftHalf ? 1 : Math.ceil(mapSize[0] / 2) + 1;
        colEnd = isLeftHalf ? Math.floor(mapSize[0] / 2) : mapSize[0];
      } else {
        // Обычный радиус телепортации
        rowStart = (1, startRow - range);
        rowEnd = Math.min(mapSize[1], startRow + range);
        colStart = Math.max(1, startCol - range);
        colEnd = Math.min(mapSize[0], startCol + range);
      }
    }

    // Проходим по всем клеткам в определенной области
    for (let row = rowStart; row <= rowEnd; row++) {
      for (let col = colStart; col <= colEnd; col++) {
        // Для обычного радиуса проверяем манхэттенское расстояние
        if (range !== "map" && range !== "half map") {
          const distance = Math.abs(col - startCol) + Math.abs(row - startRow);
          if (distance > range) continue;
        }

        const cell = selectedMap.map[row - 1][col - 1];
        // Проверяем, что клетка проходима и не занята другим персонажем
        if (cell && !["red base", "blue base", "magic shop", "laboratory", "armory"].includes(cell.initial) && !matchState.objectsOnMap.find((obj) => obj.position === `${col}-${row}`)) {
          const cellCoord = `${col}-${row}`;
          // Проверяем, нет ли на клетке другого персонажа
          const isOccupied = ["red", "blue"].some(team =>
            matchState.teams[team].characters.some(ch => ch.position === cellCoord && ch.currentHP > 0)
          );
          if (!isOccupied) {
            cells.push(cellCoord);
          }
        }
      }
    }
    return cells;
  };

  const handleTeleportation = (targetCoord) => {
    if (!pendingTeleportation) return;

    // Определяем команду персонажа
    const casterTeam = pendingTeleportation.caster.team

    // Обновляем позицию персонажа
    const updatedCharacter = { ...pendingTeleportation.caster, position: targetCoord };

    // Обновляем состояние матча
    const updatedTeams = { ...matchState.teams };
    updatedTeams[casterTeam].characters = updatedTeams[casterTeam].characters.map(ch =>
      ch.name === pendingTeleportation.caster.name ? updatedCharacter : ch
    );

    updatedTeams[casterTeam].remain.actions -= 1;
    updateMatchState({ teams: updatedTeams });
    addActionLog(`${pendingTeleportation.caster.name} телепортируется на ${targetCoord}`);

    // Очищаем состояния телепортации
    setTeleportationMode(false);
    setPendingTeleportation(null);
    setTeleportationCells([]);
    setTeleportationDestination(null);
    setSelectionOverlay([]);
    restartAbilityCooldowns(pendingTeleportation.caster.name);
    if (matchState.teams[casterTeam].remain.moves > 0) {
      setPendingMode("move")
      setReachableCells(calculateReachableCells(updatedCharacter.position, updatedCharacter.currentAgility))
    }
    else {
      setReachableCells([])
      setPendingMode(null)
    }
  };

  const redChars = useMemo(
    () => matchState.teams.red.characters,
    [matchState.teams.red.characters]   // меняется ТОЛЬКО при реальном апдейте
  );
  const blueChars = useMemo(
    () => matchState.teams.blue.characters,
    [matchState.teams.blue.characters]
  );
  const handleSelectCharacter = useCallback(
    (char) => {
      setSelectedCharacter(char);
      setPendingMode(null);
    },
    []                                   // всегда одна и та же ссылка
  );

  const handleEffectClick = (effect) => {
    if (!clickedEffectOnPanel) {
      setClickedEffectOnPanel(effect)
    }
    else {
      setClickedEffectOnPanel(null)
    }
  }

  const handleItemClick = (itemObject, character) => {
    if (itemHelperInfo && itemHelperInfo.object === itemObject && itemHelperInfo.owner === character) {
      setItemHelperInfo(null)
    }
    else {
      setItemHelperInfo({ ...itemObject, owner: character })
    }
  }

  const handleCancelEffect = () => {
    removeEffect(selectedCharacter, clickedEffectOnPanel.effectId);
    setClickedEffectOnPanel(null);
    updateMatchState();
    matchState.teams[selectedCharacter.team].remain.actions -= 1;
  }

  const handleCloseFinale = () => {
    setFinalWindow(false);
    setMatchState(null);
    localStorage.removeItem("matchState");
    localStorage.removeItem("characterStats");
    localStorage.removeItem("firstTeamToAct");
    localStorage.removeItem("teamTurn");
    localStorage.removeItem("gameTeams");
    localStorage.removeItem("gameStep");
    localStorage.removeItem("selectedMap");
    localStorage.removeItem("gameMessages");
    window.location.href = "/";
  }

  const handleDownloadStats = () => {
    const blob = new Blob([JSON.stringify(matchState, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `match_${Date.now()}.json`;
    a.click();
  }

  const putDownObject = (coordinates) => {
    const [col, row] = splitCoord(coordinates);
    if (["red base", "blue base"].includes(selectedMap.map[row - 1][col - 1].initial)) {
      if (selectedMap.map[row - 1][col - 1].initial === "red base" && INVENTORY_BASE_LIMIT - matchState.teams.red.inventory.length >= 1) {
        matchState.teams.red.inventory.push({ ...pendingItem })
      }
      else if (selectedMap.map[row - 1][col - 1].initial === "blue base" && INVENTORY_BASE_LIMIT - matchState.teams.blue.inventory.length >= 1) {
        matchState.teams.blue.inventory.push({ ...pendingItem })
      }
    }
    else if (findCharacterByPosition(coordinates, matchState)) {
      const character = findCharacterByPosition(coordinates, matchState);
      if (character.team === selectedCharacter.team && character.inventory.length < character.inventoryLimit) {
        character.inventory.push({ ...pendingItem })
      }
    }
    else {
      matchState.objectsOnMap.push({
        ...pendingItem,
        type: "item",
        position: coordinates,
        team: selectedCharacter.team
      });
    }
    selectedCharacter.inventory.splice(selectedCharacter.inventory.indexOf(pendingItem), 1);
    updateMatchState();
    setPendingItem(null);
    setItemHelperInfo(null)
    setThrowableCells([]);
    if (matchState.teams[teamTurn].remain.moves > 0) {
      setPendingMode("move")
      setReachableCells(calculateReachableCells(selectedCharacter.position, selectedCharacter.currentAgility));
    }
    else {
      setPendingMode(null)
    }
    matchState.teams[selectedCharacter.team].remain.actions -= 1;
  }

  const takeObject = (object) => {
    matchState.objectsOnMap.splice(matchState.objectsOnMap.indexOf(object), 1);
    selectedCharacter.inventory.push({ ...object })
    matchState.teams[selectedCharacter.team].remain.actions -= 1;
    setDynamicTooltip(null);
    updateMatchState()
  }

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

  const getMapName = () => {
    switch (matchState.selectedMap) {
      case "pixie-fields": return "pixieFields";
      case "ilmarin-fortress": return "ilmarinFortress";
      case "hochgak-village": return "hochgakVillage";
    }
  }

  const handleManaDistributionChange = (characterName, value) => {
    setManaDistribution(prev => ({
      ...prev,
      [characterName]: Math.min(
        Number(value),
        matchState.teams[teamTurn].characters.find(ch => ch.name === characterName).currentMana
      )
    }));
  };

  const handleManaDistributionNext = () => {
    const totalDistributed = Object.values(manaDistribution).reduce((sum, mana) => sum + mana, 0);
    if (totalDistributed === selectedItem.price) {
      setShowManaDistribution(false);
      if (selectedItem.name !== "Зелье воскрешения") {
        setShowRecipientSelection(true);
      }
      else {
        if (matchState.teams[teamTurn].latestDeath !== null) {
          const character = matchState.teams[teamTurn].characters.find(ch => ch.name === matchState.teams[teamTurn].latestDeath);
          character.currentHP = character.baseHP;
          character.currentMana = character.baseMana;
          matchState.teams[teamTurn].latestDeath = null;
          updateMatchState();
        }
        else {
          matchState.teams[teamTurn].inventory.push(selectedItem);
          updateMatchState();
        }
        handleFinalizePurchase();
      }
    }
  };

  const handleFinalizePurchase = () => {
    // Обновляем ману у персонажей
    Object.entries(manaDistribution).forEach(([name, mana]) => {
      if (mana > 0) {
        const character = matchState.teams[teamTurn].characters.find(ch => ch.name === name);
        character.currentMana -= mana;
        // Устанавливаем перезарядку магазина
        const cooldownField = store === 'laboratory' ? 'labCooldown' : 'armoryCooldown';
        character[cooldownField] = 6;
      }
    });

    // Добавляем предмет получателю
    if (selectedRecipient && selectedItem.type === "wearable") {
      selectedRecipient.wearableItems = selectedRecipient.wearableItems || [];
      selectedRecipient.wearableItems.push(selectedItem);
      if (selectedItem.onWear) {
        selectedItem.onWear(selectedRecipient);
      }
    } else if (selectedRecipient && selectedItem.name !== "Зелье воскрешения") {
      selectedRecipient.inventory.push(selectedItem);
    }

    // Устанавливаем перезарядку магазина для получателя
    const cooldownField = store === 'laboratory' ? 'labCooldown' : 'armoryCooldown';
    selectedRecipient[cooldownField] = 6;

    // Сбрасываем состояние
    setShowManaDistribution(false);
    setShowRecipientSelection(false);
    setSelectedItem(null);
    setManaDistribution({});
    setSelectedRecipient(null);
    setStore(null);
  };

  const alliesNearStore = () => {
    // Получаем всех живых союзников
    const allies = matchState.teams[selectedCharacter.team].characters.filter(ch => ch.currentHP > 0);

    // Получаем инициал магазина в зависимости от типа
    const storeInitial = store
    // Находим все клетки магазинов данного типа
    const storeCells = [];
    for (let y = 0; y < selectedMap.map.length; y++) {
      for (let x = 0; x < selectedMap.map[y].length; x++) {
        if (selectedMap.map[y][x].initial === storeInitial) {
          storeCells.push({ x: x + 1, y: y + 1 });
        }
      }
    }

    // Находим соседние клетки для каждого магазина
    const adjacentCells = new Set();
    storeCells.forEach(store => {
      const directions = [
        { x: store.x + 1, y: store.y },
        { x: store.x - 1, y: store.y },
        { x: store.x, y: store.y + 1 },
        { x: store.x, y: store.y - 1 }
      ];

      directions.forEach(dir => {
        if (dir.x >= 0 && dir.x < selectedMap.map[0].length &&
          dir.y >= 0 && dir.y < selectedMap.map.length &&
          selectedMap.map[dir.y][dir.x] !== storeInitial) {
          adjacentCells.add(`${dir.x}-${dir.y}`);
        }
      });
    });

    return allies.filter(ally => adjacentCells.has(ally.position));
  }

  const handleComplexBuy = (item) => {
    const allies = alliesNearStore();
    if (allies.length === 1) {
      handleBuyItem(item);
    } else {
      setSelectedItem(item);
      const initialDistribution = {};
      allies.forEach(ally => {
        initialDistribution[ally.name] = 0;
      });
      setManaDistribution(initialDistribution);
      setShowManaDistribution(true);
    }
  }

  const handleTakeObjectFromBase = (item) => {
    selectedCharacter.inventory.push(item);
    matchState.teams[selectedCharacter.team].inventory.splice(matchState.teams[selectedCharacter.team].inventory.indexOf(item), 1);
    matchState.teams[selectedCharacter.team].remain.actions -= 1;
    if (matchState.teams[selectedCharacter.team].remain.moves > 0) {
      setPendingMode("move");
    } else {
      setPendingMode(null)
    }
    updateMatchState();
  }

  return (
    <div className={`game-console ${getMapName()}`}>
      {finalWindow && <Finale status={matchState.status} duration={matchState.gameDuration} turns={matchState.turn} handleCloseFinale={handleCloseFinale} handleDownloadStats={handleDownloadStats} />}
      <ShopDistribution
        matchState={matchState}
        teamTurn={teamTurn}
        manaDistribution={manaDistribution}
        showManaDistribution={showManaDistribution}
        setShowManaDistribution={setShowManaDistribution}
        showRecipientSelection={showRecipientSelection}
        setShowRecipientSelection={setShowRecipientSelection}
        selectedItem={selectedItem}
        alliesNearStore={alliesNearStore}
        handleManaDistributionChange={handleManaDistributionChange}
        handleManaDistributionNext={handleManaDistributionNext}
        handleFinalizePurchase={handleFinalizePurchase}
        selectedRecipient={selectedRecipient}
        setSelectedRecipient={setSelectedRecipient}
      />
      <PauseModal
        isPaused={isPaused}
        matchState={matchState}
        onResume={handleResume}
        handleDownloadCurrentMatch={handleDownloadCurrentMatch}
        handleDownloadAllMatches={handleDownloadAllMatches}
      />
      <div className="game-console-overlay" style={{ backgroundColor: `${teamTurn === "red" ? "rgba(102, 24, 24, 0.4)" : "rgba(34, 34, 139, 0.3)"}` }}></div>
      {lastNotification && (
        <Notification
          message={lastNotification.text}
          type={lastNotification.type}
        />
      )}
      {store && (
        <Store
          matchState={matchState}
          character={selectedCharacter ? selectedCharacter : null}
          storeType={store}
          onClose={() => setStore(null)}
          onBuy={handleComplexBuy}
          selectedMap={selectedMap}
          alliesNearStore={alliesNearStore}
        />
      )}
      <GameHeader
        redHP={matchState.teams.red.baseHP}
        blueHP={matchState.teams.blue.baseHP}
        redChars={redChars}
        blueChars={blueChars}
        gameTime={matchState.gameTime}    // меняется только при паузе
        onSelectCharacter={handleSelectCharacter}
      />
      <BaseInfo inventory={matchState.teams.red.inventory} gold={matchState.teams.red.gold} team="red" remain={matchState.teams.red.remain} advancedSettings={matchState.advancedSettings} teamTurn={teamTurn} setItemHelperInfo={setItemHelperInfo} selectedCharacter={selectedCharacter} />
      <BaseInfo inventory={matchState.teams.blue.inventory} gold={matchState.teams.blue.gold} team="blue" remain={matchState.teams.blue.remain} advancedSettings={matchState.advancedSettings} teamTurn={teamTurn} setItemHelperInfo={setItemHelperInfo} selectedCharacter={selectedCharacter} />
      <ControlButton round={matchState.turn} handleEndRound={handleEndTurn} handlePause={handlePause} />

      <div className="game-container">
        {renderGameMap()}
        {finalWindow && <Finale status={matchState.status} duration={matchState.gameDuration} turns={matchState.turn} />}
        {cellEffectsInfo && (
          <div className="cell-effects-tooltip">
            <strong>Эффекты на клетке {cellEffectsInfo.cellCoord}:</strong>
            <ul>
              {cellEffectsInfo.effects.map((eff, idx) => (
                <li key={idx} style={{ color: eff.color }}>
                  {eff.name}
                </li>
              ))}
            </ul>
            <button onClick={() => setCellEffectsInfo(null)}>Закрыть</button>
          </div>
        )}
        {zoneSelectionMode && (
          <div className="game-zone-confirmation__container">
            <p className="game-zone-confirmation__message">
              {teleportationMode ? "Выберите клетку для телепортации" : "Подтвердите размещение зоны эффекта"}
              <br />
              <span style={{ color: "rgb(255, 234, 49)" }}>
                {pendingZoneEffect?.name}
              </span>
            </p>

            {zoneFixed && pendingZoneEffect.type === "Заряды по области" && (
              <>
                <div className="charges-info">
                  Зарядов:{" "}
                  {Object.values(chargesDistribution).reduce(
                    (sum, val) => sum + Number(val),
                    0
                  )}{" "}
                  / {pendingZoneEffect.stats.shotsAmount}
                </div>

                <ul className="affected-characters-list">
                  {charactersInZone.map((ch) => (
                    <li key={ch.name}>
                      <span
                        style={{
                          color: matchState.teams.red.characters.some(
                            (c) => c.name === ch.name
                          )
                            ? "#942b2b"
                            : "#1a5896",
                        }}
                      >
                        {ch.name}
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={chargesDistribution[ch.name] || 0}
                        onChange={(e) => {
                          let val = parseInt(e.target.value, 10) || 0;

                          const currentTotal = Object.values(
                            chargesDistribution
                          ).reduce((sum, v, idx, arr) => sum + Number(v), 0);

                          const availableCharges =
                            pendingZoneEffect.stats.shotsAmount -
                            currentTotal +
                            (chargesDistribution[ch.name] || 0);

                          if (val > availableCharges) {
                            val = availableCharges;
                          }

                          setChargesDistribution((prev) => ({
                            ...prev,
                            [ch.name]: val,
                          }));
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}

            {zoneFixed && (pendingZoneEffect.type === "Мгновенная область способности" || pendingZoneEffect.type === "Область с перемещением") && (
              <ul className="affected-characters-list">
                {charactersInZone.map((ch) => (
                  <li key={ch.name}>
                    <span
                      style={{
                        color: matchState.teams.red.characters.some(
                          (c) => c.name === ch.name
                        )
                          ? "#942b2b"
                          : "#1a5896",
                      }}
                    >
                      {ch.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <button
              className="game-zone-confirmation__button game-zone-pinButton"
              onClick={() => {
                if (zoneFixed) {
                  setZoneFixed(false);
                  setChargesDistribution({});
                } else {
                  handleZoneFixShort(selectionOverlay);
                }
              }}
            >
              {zoneFixed ? "Открепить зону" : "Закрепить зону"}
            </button>

            <div className="game-zone-confirmation__button-group">
              <button
                onClick={confirmZoneEffect}
                className="game-zone-confirmation__button game-zone-confirmation__button--confirm"
              >
                Подтвердить
              </button>
              <button
                onClick={() => {
                  setZoneSelectionMode(false);
                  setZoneFixed(false);
                  setSelectionOverlay([]);
                  setPendingZoneEffect(null);
                  setCharactersInZone([]);
                  setChargesDistribution({});
                  if (matchState.teams[selectedCharacter.team].remain.moves > 0) {
                    setPendingMode("move");
                  } else {
                    setPendingMode(null)
                  }
                }}
                className="game-zone-confirmation__button game-zone-confirmation__button--cancel"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
        {beamSelectionMode && (
          <div className="game-zone-confirmation__container">
            <p className="game-zone-confirmation__message">
              Подтвердите направление луча
              <br />
              <span style={{ color: "rgb(248, 49, 255)" }}>
                {pendingBeamEffect?.name}
              </span>
            </p>

            {beamFixed && (
              <ul className="affected-characters-list">
                {charactersInZone.map((ch) => (
                  <li key={ch.name}>
                    <span
                      style={{
                        color: matchState.teams.red.characters.some(
                          (c) => c.name === ch.name
                        )
                          ? "#942b2b"
                          : "#1a5896",
                      }}
                    >
                      {ch.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <button
              className="game-zone-confirmation__button game-zone-pinButton"
              onClick={() => {
                if (beamFixed) {
                  setBeamFixed(false);
                } else {
                  handleBeamFix();
                }
              }}
            >
              {beamFixed ? "Открепить луч" : "Закрепить луч"}
            </button>

            <div className="game-zone-confirmation__button-group">
              <button
                onClick={confirmBeamEffect}
                className="game-zone-confirmation__button game-zone-confirmation__button--confirm"
              >
                Подтвердить
              </button>
              <button
                onClick={() => {
                  setBeamSelectionMode(false);
                  setBeamFixed(false);
                  setBeamCells([]);
                  setSelectionOverlay([]);
                  setPendingBeamEffect(null);
                  setCharactersInZone([]);
                  if (matchState.teams[selectedCharacter.team].remain.moves > 0) {
                    setPendingMode("move");
                  } else {
                    setPendingMode(null)
                  }
                }}
                className="game-zone-confirmation__button game-zone-confirmation__button--cancel"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
        {teleportationMode && (
          <div className="game-zone-confirmation__container">
            <p className="game-zone-confirmation__message">
              Выберите точку для телепортации
              <br />
              <span style={{ color: "rgb(147, 112, 219)" }}>
                {pendingTeleportation?.name}
              </span>
            </p>

            <div className="game-zone-confirmation__button-group">
              <button
                onClick={() => {
                  setTeleportationMode(false);
                  setPendingTeleportation(null);
                  setTeleportationCells([]);
                  setTeleportationDestination(null);
                  setSelectionOverlay([]);
                  if (matchState.teams[selectedCharacter.team].remain.moves > 0) {
                    setPendingMode("move");
                  } else {
                    setPendingMode(null)
                  }
                }}
                className="game-zone-confirmation__button game-zone-confirmation__button--cancel"
              >
                Отмена
              </button>
            </div>
          </div>
        )}
        {pointSelectionMode && (
          <div className="game-zone-confirmation__container">
            <p className="game-zone-confirmation__message">
              Выберите точку для способности
              <br />
              <span style={{ color: "rgb(147, 112, 219)" }}>
                {pendingPointEffect?.name}
              </span>
            </p>
            {pointDestination && (
              //выбранная координата
              <div className="point-coordinates-container">
                <span className="point-coordinates">
                  {pointDestination}
                </span>
                {charactersAtPoint.length > 0 && (charactersAtPoint.map((ch) => (
                  <span
                    key={ch.name}
                    style={{
                      color: matchState.teams.red.characters.some(
                        (c) => c.name === ch.name
                      )
                        ? "#942b2b"
                        : "#1a5896",
                    }}
                  >
                    {ch.name}
                  </span>
                )))}
              </div>
            )}
            <div className="game-zone-confirmation__button-group">
              <button
                className="game-zone-confirmation__button game-zone-pinButton"
                onClick={() => {
                  setPointSelectionMode(false);
                  setPointCells([]);
                  setPointDestination(null);
                  setSelectionOverlay([]);
                  setPendingPointEffect(null);
                  setAttackAnimations([...charactersAtPoint.map(ch => {
                    return {
                      position: ch.position,
                      damageType: pendingPointEffect.stats.damageType,
                    }
                  })]);
                  setCharactersAtPoint([]);
                  if (matchState.teams[selectedCharacter.team].remain.moves > 0) {
                    setPendingMode("move");
                  } else {
                    setPendingMode(null)
                  }
                }}
              >
                Отмена
              </button>
              {pointDestination && (
                <button
                  onClick={confirmPointEffect}
                  className="game-zone-confirmation__button game-zone-pinButton"
                >
                  Подтвердить
                </button>)}
            </div>
          </div>
        )}
        {pendingMode === "throw" || (pendingMode === "putDown") && (
          <div className="game-zone-confirmation__container">
            <p className="game-zone-confirmation__message">
              Выберите клетку для {pendingMode === "throw" ? "броска предмета" : "выкладки предмета"}
            </p>
            {throwDestination && (
              //выбранная координата
              <div className="point-coordinates-container">
                <span className="point-coordinates">
                  {throwDestination}
                </span>
              </div>
            )}
            <div className="game-zone-confirmation__button-group">
              <button
                className="game-zone-confirmation__button game-zone-pinButton"
                onClick={() => {
                  if (matchState.teams[teamTurn].remain.moves > 0) {
                    setPendingMode("move");
                    setReachableCells(calculateReachableCells(selectedCharacter.position, selectedCharacter.currentAgility));
                  }
                  else {
                    setPendingMode(null)
                  }
                  setThrowDestination(null);
                  setPendingItem(null);
                  setThrowableCells([]);
                  setItemHelperInfo(null);
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        )}
        {buildingMode && (
          <div className="game-zone-confirmation__container building-mode-container">
            <p className="game-zone-confirmation__message">
              Выберите клетк{pendingItem.name === "Стена (х3)" ? "и" : "у"} для возведения постройки
            </p>
            <h5 className="game-zone-confirmation__message">
              ({buildingDestination?.length || 0}/{pendingItem.name === "Стена (х3)" ? 3 : 1})
            </h5>
            {buildingDestination && (
              <div className="point-coordinates-array-container">
                {buildingDestination.map((cell, index) => (
                  <span key={cell} className="array-point-coordinates">
                    <span className="array-point-coordinates-number">{index + 1}.</span>
                    {cell}
                    <button className="array-point-coordinates-cancel-button" onClick={() => {
                      setBuildingDestination(buildingDestination.filter(c => c !== cell) || []);
                    }}>
                      X
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="game-zone-confirmation__button-group">
              <button
                className="game-zone-confirmation__button game-zone-pinButton"
                onClick={() => {
                  setBuildingMode(false);
                  setBuildingCells([]);
                  setBuildingDestination([]);
                  setSelectionOverlay([]);
                  setPendingItem(null);
                  if (matchState.teams[teamTurn].remain.moves > 0) {
                    setPendingMode("move");
                  } else {
                    setPendingMode(null)
                  }
                }}
              >
                Отмена
              </button>
              <button
                className="game-zone-confirmation__button game-zone-confirmation__button--confirm"
                onClick={confirmBuilding}
              >
                Построить
              </button>
            </div>
          </div>
        )}
        {showCharacterInfoPanel && (
          <CharacterInfoPanel
            character={selectedCharacter}
            onClose={handleCloseCharacterModal}
            onAttack={(ch) => {
              if (matchState.teams[teamTurn].remain.actions > 0) {
                handleAttack(ch)
              }
            }}
            onAbilityClick={handleAbilityClick}
            onUnselectAttack={() => {
              if (matchState.teams[teamTurn].remain.moves > 0) {
                setPendingMode("move");
              }
              else {
                setPendingMode(null)
              }
            }}
            pendingMode={pendingMode}
            onEffectClick={handleEffectClick}
            teamTurn={teamTurn}
            onItemClick={handleItemClick}
          />
        )}
        {showCharacterInfoPanel && itemHelperInfo && (
          <div className="tooltip wide">
            <h5 className="tooltip-header">{itemHelperInfo.name}</h5>
            <p className="tooltip-description">{itemHelperInfo.description}</p>
            {itemHelperInfo.owner.team === teamTurn && (
              <>
                {!itemHelperInfo.throwable && selectedCharacter && selectedCharacter.inventory.find(item => item.id === itemHelperInfo.id) &&
                  <button className="tooltip-button" disabled={matchState.teams[teamTurn].remain.actions === 0} onClick={() => {
                    itemHelperInfo.effect(selectedCharacter)
                    if (itemHelperInfo.isSingleUse) {
                      selectedCharacter.inventory.splice(selectedCharacter.inventory.indexOf(itemHelperInfo), 1)
                      setItemHelperInfo(null)
                      if (matchState.teams[teamTurn].remain.moves > 0) {
                        setPendingMode("move")
                      } else {
                        setPendingMode(null)
                      }
                    }
                    matchState.teams[teamTurn].remain.actions -= 1
                    if (matchState.teams[teamTurn].remain.moves > 0) {
                      setPendingMode("move");
                    } else {
                      setPendingMode(null)
                    }
                  }}>
                    Применить (действие)
                  </button>}
                {itemHelperInfo.throwable && selectedCharacter && selectedCharacter.inventory.find(item => item.id === itemHelperInfo.id) &&
                  <button className="tooltip-button" disabled={matchState.teams[teamTurn].remain.actions === 0} onClick={() => {
                    setPendingMode("throw");
                    setPendingItem({ ...itemHelperInfo })
                    setThrowableCells(calculateThrowableCells(selectedCharacter.position, 5, selectedMap.size));
                  }}>
                    Бросить (действие)
                  </button>}
                {itemHelperInfo.type === "building" && selectedCharacter && selectedCharacter.inventory.find(item => item.id === itemHelperInfo.id) &&
                  <button className="tooltip-button" disabled={matchState.teams[teamTurn].remain.actions === 0} onClick={() => {
                    setPendingItem({ ...itemHelperInfo })
                    chooseBuildingPosition(itemHelperInfo)
                  }}>
                    Построить ({itemHelperInfo.name === "Стена (х3)" && "одну или все"})
                  </button>
                }
                {selectedCharacter && selectedCharacter.inventory.find(item => item.id === itemHelperInfo.id) &&
                <button className="tooltip-button" disabled={matchState.teams[teamTurn].remain.actions === 0} onClick={() => {
                  setPendingMode("putDown");
                  setPendingItem({ ...itemHelperInfo })
                  setThrowableCells(calculateThrowableCells(selectedCharacter.position, 1, selectedMap.size, "putDown"));
                }}>
                  Выложить (действие)
                </button>
                }
                {selectedCharacter && isNearType(selectedCharacter.position, selectedMap, `${selectedCharacter.team} base`) && !selectedCharacter.inventory.find(item => item.id === itemHelperInfo.id) &&
                <button className="tooltip-button" disabled={matchState.teams[teamTurn].remain.actions === 0 || selectedCharacter.inventory.length === selectedCharacter.inventoryLimit} onClick={() => {
                  handleTakeObjectFromBase(itemHelperInfo)
                }}>
                  Забрать из базы (действие)
                </button>
                }
              </>
            )}
            <button className="tooltip-button" onClick={() => setItemHelperInfo(null)}>
              Отменить
            </button>
          </div>
        )}
        {showCharacterInfoPanel && clickedEffectOnPanel && (
          <div className="tooltip">
            <p className="tooltip-description">{clickedEffectOnPanel.description}</p>
            {clickedEffectOnPanel.canCancel && (
              <button className="tooltip-button" onClick={() => handleCancelEffect()}>
                Снять эффект (действие)
              </button>
            )}
          </div>
        )}
        {dynamicTooltip && (
          <div className="dynamic-tooltip">
            <div className="dynamic-tooltip-image-container">
              <img src={`/src/assets/items/${dynamicTooltip.image}`} alt={dynamicTooltip.title} className="dynamic-tooltip-image" />
            </div>
            <h5 className="dynamic-tooltip-title">{dynamicTooltip.title}</h5>
            {dynamicTooltip.parameters &&
              <div className="parametersHP-bar">
                <div className="parametersHP-fill" style={{ width: `${(dynamicTooltip.parameters.current.currentHP / dynamicTooltip.parameters.stats.HP) * 100}%` }} />
                <div className="parametersHP-value">{dynamicTooltip.parameters.current.currentHP}/{dynamicTooltip.parameters.stats.HP}</div>
              </div>
            }
            {dynamicTooltip.parameters &&
              <div className="dynamic-tooltip-parameters-grid">
                {Object.entries(dynamicTooltip.parameters.stats)
                  .filter(([key]) => !['HP', 'Мана'].includes(key))
                  .map(([key, value]) => (
                    value != 0 && <div key={key} className="parameters-stat-item">
                      <div className="parameters-stat-name">{key}</div>
                      <div className="parameters-stat-value">{dynamicTooltip.parameters.current[getParameterName(key)]}/{key === "Броня" ? 5 : value}</div>
                    </div>
                  ))}
              </div>
            }
            <p className="dynamic-tooltip-description">{dynamicTooltip.description}</p>
            <div className="dynamic-tooltip-actions">
              {selectedCharacter && dynamicTooltip.actions.length > 0 && dynamicTooltip.actions.map((action) => (
                <button className="tooltip-button" onClick={action.onClick} disabled={matchState.teams[teamTurn].remain.actions === 0}>{action.name} (Действие)</button>
              ))}
              <button className="tooltip-button" onClick={() => setDynamicTooltip(null)}>Закрыть</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatConsole;
