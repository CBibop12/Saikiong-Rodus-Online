/* eslint-disable react-hooks/exhaustive-deps */
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
import ZoneEffectsManager from "./scripts/zoneEffectsManager";
import { calculateCellsForZone } from "./scripts/calculateCellsForZone";
import CharacterInfoPanel from "./components/CharacterInfoPanel";
import Notification from './Notification';
import { attack, attackBase, attackBuilding } from "./scripts/attack";
import Store from "./components/Store";
import GameHeader from "./components/GameHeader";
import ControlButton from "./components/ControlButton";
import BaseInfo from "./components/BaseInfo";
import Finale from "./components/FinaleWindow";
import { startingWalls } from "./scripts/building";
import ShopDistribution from "./components/ShopDistribution";
import { updateCreeps } from "./scripts/creaturesStore";
import { isItMyTurn } from "./scripts/tools/simplifierStore";
import {
  makeMapSignature,
  makeTeamsSignature,
  makeObjectsSignature,
  makeMovementKey,
  makeAttackKey,
  makeNearStoreKey,
  getMovementFromCache,
  setMovementInCache,
  getAttackFromCache,
  setAttackInCache,
  getNearStoreFromCache,
  setNearStoreInCache,
} from "./scripts/tools/cacheStore";
import { findCharacter, findCharacterByPosition, cellHasType, objectOnCell, endTurn, getFreeCellLines, getFreeCellsAround } from "../routes";
import { useRoomSocket } from "../hooks/useRoomSocket";

// Debug/metrics flags (toggle locally as needed)
const DEBUG_NET = false; // лог сетевых событий
const DEBUG_METRICS = false; // измерение времени/размера diff

/**
 * ВЫНОСИМ ВНЕ КОМПОНЕНТА, чтобы она не пересоздавалась на каждом рендере
 * и не вызывала повторный useEffect.
 */

const RANGE_OF_THROWABLE_OBJECTS = 5;
const RANGE_OF_BUILDING_OBJECTS = 1;
const INVENTORY_BASE_LIMIT = 3;

const GAME_BASE = 'https://saikiong-rodus-08b1dee9bafb.herokuapp.com';

// API функции для работы с сервером
const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('srUserToken');
  const response = await fetch(`${GAME_BASE}${url}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
};

// Character Store API


// Map Store API
const splitCoord = async (coord, minus = 0) => {
  const response = await apiRequest(`/api/tools/map/split-coord/${coord}?minus=${minus}`);
  return response.split;
};

const stringFromCoord = async (coord, add = 0) => {
  const response = await apiRequest(`/api/tools/map/string-from-coord`, {
    method: 'POST',
    body: JSON.stringify({ coord, add }),
  });
  return response.string;
};

const initialOfCell = async (coord, roomCode) => {
  const coordStr = Array.isArray(coord) ? `${coord[0] + 1}-${coord[1] + 1}` : coord;
  const response = await apiRequest(`/api/tools/map/initial-of-cell/${roomCode}/${coordStr}`);
  return response.initial;
};

const allCellType = async (type, roomCode, responseType = 'object', add = 0) => {
  const response = await apiRequest(`/api/tools/map/all-cell-type/${roomCode}/${type}?response=${responseType}&add=${add}`);
  return response.cells;
};

const calculateCellsZone = async (startCoord, range, roomCode, forbiddenTypes = [], canGoThroughCharacters = false, canGoThroughObjects = false, teleportGoThrough = false) => {
  const response = await apiRequest(`/api/tools/map/calculate-cells-zone/${roomCode}`, {
    method: 'POST',
    body: JSON.stringify({
      startCoord,
      range,
      forbiddenTypes,
      canGoThroughCharacters,
      canGoThroughObjects,
      teleportGoThrough,
    }),
  });
  // Возвращаем объект {reachable, freeCells} или создаем его из старого формата для совместимости
  return response;
};

const calculateNearCells = async (coord, roomCode) => {
  const response = await apiRequest(`/api/tools/map/calculate-near-cells/${roomCode}/${coord}`);
  return response.nearCells;
};

const isNearType = async (coord, roomCode, type) => {
  const response = await apiRequest(`/api/tools/map/is-near-type/${roomCode}/${coord}/${type}`);
  return response.isNear;
};

// Simplifier Store API
const randomArrayElement = async (arr, mode = 'element') => {
  const response = await apiRequest(`/api/tools/simplifier/random-array-element`, {
    method: 'POST',
    body: JSON.stringify({ arr, mode }),
  });
  return response.result;
};

const generateId = async () => {
  const response = await apiRequest(`/api/tools/simplifier/generate-id`);
  return response.id;
};

// Effects API
const removeEffect = async (characterName, effectId, roomCode) => {
  await apiRequest(`/api/tools/effects/remove/${roomCode}`, {
    method: 'POST',
    body: JSON.stringify({ characterName, effectId }),
  });
};

// Attack API
const attackCharacter = async (attackerName, affiliate, targets, damage, damageType, roomCode) => {
  const response = await apiRequest(`/api/tools/attack/character/${roomCode}`, {
    method: 'POST',
    body: JSON.stringify({
      attackerName,
      affiliate,
      targets,
      damage,
      damageType,
    }),
  });
  return response.result;
};

const attackBaseAPI = async (baseAffiliate, damage, roomCode) => {
  const response = await apiRequest(`/api/tools/attack/base/${roomCode}`, {
    method: 'POST',
    body: JSON.stringify({
      baseAffiliate,
      damage,
    }),
  });
  return response.result;
};

const attackBuildingAPI = async (buildingId, damage, damageType, roomCode) => {
  const response = await apiRequest(`/api/tools/attack/building/${roomCode}`, {
    method: 'POST',
    body: JSON.stringify({
      buildingId,
      damage,
      damageType,
    }),
  });
  return response.result;
};

// Building API
const buildObject = async (characterName, buildingConfig, roomCode) => {
  const response = await apiRequest(`/api/tools/building/build/${roomCode}`, {
    method: 'POST',
    body: JSON.stringify({
      characterName,
      buildingConfig,
    }),
  });
  return response.building;
};

// Creatures API
const updateCreepsAPI = async (roomCode) => {
  await apiRequest(`/api/tools/creatures/update/${roomCode}`, {
    method: 'POST',
  });
};

const ChatConsole = ({ socket, user: initialUser, room, teams, selectedMap, matchState: initialMatchState, teamTurn: initialTeamTurn, firstTeamToAct, messages: initialMessages, roomCode }) => {
  // Состояния для ввода текста, подсказок и сообщений
  const [selectedAction, setSelectedAction] = useState("Взаимодействие");
  const [user, setUser] = useState(initialUser);

  // Стабилизация пользователя: берём username из JWT, если проп ещё не готов
  useEffect(() => {
    if (user?.username) return;
    try {
      const token = localStorage.getItem('srUserToken');
      if (!token) return;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      const payload = JSON.parse(jsonPayload);
      const tokenUsername = payload?.username || payload?.user?.username || payload?.name || payload?.sub || null;
      if (tokenUsername) {
        setUser((prev) => prev?.username ? prev : { username: tokenUsername });
      }
    } catch { /* noop */ }
  }, [user?.username]);

  // Обновляем локального пользователя при изменении пропа
  useEffect(() => {
    if (!initialUser) return;
    if (!user || initialUser?.username !== user?.username) {
      setUser(initialUser);
    }
  }, [initialUser?.username]);

  // Локальная функция для проверки близости к базе команды
  const isNearTeamBase = (position, team) => {
    const [posCol, posRow] = position.split('-').map(Number);
    const adjacentPositions = [
      `${posCol + 1}-${posRow}`, `${posCol - 1}-${posRow}`,
      `${posCol}-${posRow + 1}`, `${posCol}-${posRow - 1}`
    ];

    return adjacentPositions.some(adjPos => {
      const [col, row] = adjPos.split('-').map(Number);
      if (col < 1 || col > selectedMap.size[0] || row < 1 || row > selectedMap.size[1]) return false;
      return selectedMap.map[row - 1][col - 1].initial === `${team} base`;
    });
  };

  // Серверный выбор клетки респавна рядом с базой
  const getRandomReviveCell = async (roomCode, team, fallbackCoord = null, maxRadius = 4) => {
    const response = await apiRequest(`/api/tools/map/random-revive-cell/${roomCode}`, {
      method: 'POST',
      body: JSON.stringify({
        team,
        maxRadius,
        allowedTypes: ["empty", "bush", "healing zone"],
        fallbackCoord,
      }),
    });
    return response.coord;
  };

  const storesCooldown = 6;

  // Состояния для работы с картой и персонажами (наведение, выбор)
  const [hoveredCell, setHoveredCell] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  // Состояния для пошагового режима и таймера игры
  const [gameStartTime, setGameStartTime] = useState(Date.now());
  const [isPaused, setIsPaused] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(false);
  // Состояние текущей команды (чей сейчас ход)
  const [teamTurn, setTeamTurn] = useState(initialTeamTurn);

  // Состояние логов сообщений
  const [messages, setMessages] = useState(initialMessages || []);
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
  const [freeCells, setFreeCells] = useState([]); // Клетки-партнёры порталов для selectedCharacter
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

  // Состояние партии получаем из веб-сокета
  // matchStateCheckpoint — последняя версия, подтверждённая сервером
  const deepClone = (obj) => JSON.parse(JSON.stringify(obj));
  const [matchStateCheckpoint, setMatchStateCheckpoint] = useState(deepClone(initialMatchState));
  // matchState — локальная версия, может содержать ещё не отправленные изменения
  const [matchState, setMatchState] = useState(initialMatchState);
  const [itemHelperInfo, setItemHelperInfo] = useState(null)
  const [throwDestination, setThrowDestination] = useState(null)
  const [throwDestIsFixed, setThrowDestIsFixed] = useState(false);
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
  // ─────────────────────────────────────────────
  //  Автозавершение хода            
  const [autoEndTimer, setAutoEndTimer] = useState(null); // { id, start }
  const [countdownProgress, setCountdownProgress] = useState(0); // 0-1
  const [isMyTurn, setIsMyTurn] = useState(false);

  const [magicCart, setMagicCart] = useState([]);

  // Эффект для синхронизации состояний с веб-сокетом
  useEffect(() => {
    if (initialMatchState) {
      setMatchState(initialMatchState);
      setMatchStateCheckpoint(deepClone(initialMatchState));
    }
  }, [initialMatchState]);

  // Пересчитываем «мой ход» когда готовы user/room/teamTurn
  useEffect(() => {
    if (!user?.username || !room || teamTurn == null || !matchState) return;
    const currentPlayer = matchState?.teams?.[teamTurn]?.player;
    const me = user?.username || initialUser?.username;
    const myTurn = Boolean(currentPlayer && me && currentPlayer === me);
    if (isMyTurn !== myTurn) setIsMyTurn(myTurn);
  }, [user?.username, room?._id, teamTurn, matchState?.teams?.red?.player, matchState?.teams?.blue?.player]);

  // Эффект для обработки входящих diff-ов от сервера
  useEffect(() => {
    if (!socket) return;



    const handleMatchStateFull = (data) => {
      if (DEBUG_NET) console.log('Получено полное состояние от сервера');
      updateMatchStateLocally(data.matchState, 'full');
    };

    const handleUpdateConfirmed = (data) => {
      if (DEBUG_NET) console.log('Обновление подтверждено сервером');
    };

    const handleUpdateError = (data) => {
      console.error('Ошибка при обновлении на сервере:', data?.error || data);
      addActionLog(`Ошибка синхронизации: ${data.error}`, "error");
    };

    // Подписываемся на события
    socket.on('MATCH_STATE_FULL', handleMatchStateFull);
    socket.on('MATCH_STATE_UPDATE_CONFIRMED', handleUpdateConfirmed);
    socket.on('MATCH_STATE_UPDATE_ERROR', handleUpdateError);

    // Очищаем подписки при размонтировании
    return () => {
      socket.off('MATCH_STATE_FULL', handleMatchStateFull);
      socket.off('MATCH_STATE_UPDATE_CONFIRMED', handleUpdateConfirmed);
      socket.off('MATCH_STATE_UPDATE_ERROR', handleUpdateError);
    };
  }, [socket]);

  // Эффект для присоединения к комнате при монтировании
  useEffect(() => {
    if (roomCode && socket) {
      joinSocketRoom();

      // Опционально: запрашиваем полное состояние при подключении
      // requestFullMatchState();
    }
  }, [roomCode, socket]);

  useEffect(() => {
    if (initialTeamTurn) {
      setTeamTurn(initialTeamTurn);
    }
  }, [initialTeamTurn]);

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Эффект для проверки состояния игры
  useEffect(() => {
    if (matchState && matchState.status != "in_process") {
      setFinalWindow(true)
    }
  }, [matchState]);

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

  const checkForStore = async (character) => {
    const storeType = await isSelectedNearStore(character);
    if (storeType === "laboratory" || storeType === "armory" || storeType === "magic shop") {
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

  const checkModePossibility = async () => {
    if (matchState.teams[selectedCharacter.team].remain.moves > 0) {
      setPendingMode("move");
      const cellsData = await calculateReachableCellsWithFree(selectedCharacter.position, selectedCharacter.currentAgility);
      setReachableCells(cellsData.reachable);
      setFreeCells(cellsData.freeCells);
      setAttackableCells([]);
    }
    else if (matchState.teams[selectedCharacter.team].remain.actions > 0) {
      setPendingMode("attack");
      setAttackableCells(await calculateAttackableCells(selectedCharacter.position, selectedCharacter.currentRange, selectedMap.size));
      setReachableCells([]);
      // Сохраняем freeCells только если персонаж на портале
      if (!isCharacterOnPortal(selectedCharacter.position)) {
        setFreeCells([]);
      }
    }
    else {
      setPendingMode(null);
      setReachableCells([]);
      setAttackableCells([]);
      // Очищаем freeCells только если персонаж не на портале
      if (!isCharacterOnPortal(selectedCharacter.position)) {
        setFreeCells([]);
      }
    }
  }

  const checkModePossibilityForCharacter = async (character, state = matchState) => {
    if (state.teams[character.team].remain.moves > 0) {
      setPendingMode("move");
      const cellsData = await calculateReachableCellsWithFree(character.position, character.currentAgility);
      setReachableCells(cellsData.reachable);
      setFreeCells(cellsData.freeCells);
      setAttackableCells([]);
    }
    else if (state.teams[character.team].remain.actions > 0) {
      setPendingMode("attack");
      setAttackableCells(await calculateAttackableCells(character.position, character.currentRange, selectedMap.size));
      setReachableCells([]);
      // Сохраняем freeCells только если персонаж на портале
      if (!isCharacterOnPortal(character.position)) {
        setFreeCells([]);
      }
    }
    else {
      setPendingMode(null);
      setReachableCells([]);
      setAttackableCells([]);
      // Очищаем freeCells только если персонаж не на портале
      if (!isCharacterOnPortal(character.position)) {
        setFreeCells([]);
      }
    }
  }

  const addObjectOnMap = (obj) => {
    const newObjects = [...matchState.objectsOnMap, obj];
    updateMatchState({ objectsOnMap: newObjects }, 'partial');
  };

  // Функция для получения эффектов, которые накладываются на клетку с заданными координатами
  const getEffectsForCell = (cellCoord) => {
    if (!matchState || !matchState.objectsOnMap) return [];

    return matchState.objectsOnMap.filter((obj) => {
      // Вычисляем расстояние по манхэттенской метрике от объекта до клетки
      const [objX, objY] = obj.coordinates.split("-").map(Number);
      const [cellX, cellY] = cellCoord.split("-").map(Number);
      const distance = Math.abs(cellX - objX) + Math.abs(cellY - objY);
      return distance <= (obj.stats.rangeOfObject || 0);
    });
  };

  const calculateCastingAllowance = (cell) => {
    // Если луч/зона уже закреплены, запрещаем пересчёт при наведении
    if (beamSelectionMode && beamFixed) return false;
    if (zoneSelectionMode && zoneFixed) return false;

    // Если включён режим выбора точки, используем pendingPointEffect
    if (pointSelectionMode && pendingPointEffect) {
      return pointCells.includes(cell);
    }

    // Если включён режим выбора луча, используем pendingBeamEffect, иначе — pendingZoneEffect
    const effect = beamSelectionMode ? pendingBeamEffect : pendingZoneEffect;
    if (!effect) return false;

    const [startCol, startRow] = splitCoordLocal(effect.caster.position);
    const [pointX, pointY] = splitCoordLocal(cell);

    if (effect.type === "Луч") {
      if (beamFixed) return false;
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

  const isSelectedNearStore = async (character) => {
    if (!character) return null;
    const mapSig = makeMapSignature(selectedMap);
    const cacheKey = makeNearStoreKey({ characterName: character.name, position: character.position, mapSig });
    const cached = getNearStoreFromCache(cacheKey);
    if (cached !== undefined) return cached;

    // Локальная проверка: смотрим 4 соседние клетки, не дергая API для каждой клетки
    const [c, r] = splitCoordLocal(character.position, 1);
    const neighbours = [
      `${c}-${r - 1}`,
      `${c + 1}-${r}`,
      `${c}-${r + 1}`,
      `${c - 1}-${r}`,
    ];

    let storeType = null;
    for (let coord of neighbours) {
      const [nc, nr] = splitCoordLocal(coord, 1);
      const cell = selectedMap?.map?.[nr]?.[nc];
      const init = cell?.initial;
      if (init && ["laboratory", "armory", "magic shop"].includes(init)) {
        storeType = init;
        break;
      }
    }

    setNearStoreInCache(cacheKey, storeType);
    return storeType;
  }

  const calculateReachableCells = async (startCoord, range) => {
    const result = await calculateCellsZone(startCoord, range, roomCode, ["red base", "blue base", "magic shop", "laboratory", "armory"], false, false, true);
    return result.reachable;
  }

  const calculateReachableCellsWithFree = async (startCoord, range) => {
    const characterName = selectedCharacter?.name || "unknown";
    const mapSig = makeMapSignature(selectedMap);
    const teamsSig = makeTeamsSignature(matchState);
    const objectsSig = makeObjectsSignature(matchState);
    const cacheKey = makeMovementKey({ characterName, position: startCoord, range, mapSig, teamsSig, objectsSig });
    const cached = getMovementFromCache(cacheKey);
    if (cached) return cached;

    const result = await calculateCellsZone(startCoord, range, roomCode, ["red base", "blue base", "magic shop", "laboratory", "armory"], false, false, true);
    setMovementInCache(cacheKey, result);
    return result;
  }

  const isCharacterOnPortal = (position) => {
    const [col, row] = splitCoordLocal(position, 1);
    const cell = selectedMap?.map?.[row]?.[col];
    return cell && (cell.initial === "red portal" || cell.initial === "blue portal");
  }

  // Локальный расчёт клеток для атаки без обращения к API
  const calculateAttackableCells = async (startCoord, range, mapSize) => {
    const characterName = selectedCharacter?.name || "unknown";
    const mapSig = makeMapSignature(selectedMap);
    const teamsSig = makeTeamsSignature(matchState);
    const objectsSig = makeObjectsSignature(matchState);
    const cacheKey = makeAttackKey({ characterName, position: startCoord, range, mapSig, teamsSig, objectsSig });
    const cached = getAttackFromCache(cacheKey);
    if (cached) return cached;

    // Возвращает «четырёхлучевую» форму длиной `range`,
    // прерываясь, если встречена стена (wall), база или объект/персонаж

    // Парсим строку "col-row" в числа 0-индекс
    const [startX, startY] = startCoord.split('-').map((n) => Number(n) - 1);

    const cols = mapSize[0];
    const rows = mapSize[1];

    // Учитываем кусты – вдвое меньше дальность (округляем вверх)
    let effectiveRange = range;
    const startCellInitial = selectedMap.map[startY]?.[startX]?.initial;
    if (startCellInitial === 'bush') {
      effectiveRange = Math.ceil(range / 2);
    }

    const attackable = [];

    const directions = [
      { dx: 0, dy: -1 }, // вверх
      { dx: 1, dy: 0 },  // вправо
      { dx: 0, dy: 1 },  // вниз
      { dx: -1, dy: 0 }, // влево
    ];

    for (const { dx, dy } of directions) {
      for (let step = 1; step <= effectiveRange; step++) {
        const newX = startX + dx * step;
        const newY = startY + dy * step;

        // Выход за границы – прекращаем направление
        if (newX < 0 || newX >= cols || newY < 0 || newY >= rows) break;

        const cellPos = `${newX + 1}-${newY + 1}`; // обратно в 1-индекс

        const cellInitial = selectedMap.map[newY]?.[newX]?.initial;

        const object = matchState.objectsOnMap.find((o) => o.position === cellPos);
        const hasCharacter = !!findCharacterByPositionLocal(cellPos);

        // Добавляем клетку, если она пустая или содержит здание/персонаж
        if (!object) {
          attackable.push(cellPos);

          // Прерываемся, если встретили базу, персонажа или стену
          if (cellInitial === 'red base' || cellInitial === 'blue base' || cellInitial === 'wall' || hasCharacter) break;
        } else {
          // Здание можно атаковать – добавляем и останавливаемся
          if (object.type === 'building') {
            attackable.push(cellPos);
          }
          break;
        }
      }
    }

    setAttackInCache(cacheKey, attackable);
    return attackable;
  };

  const calculateThrowableCells = async (startCoord, range = 5, mapSize, mode = "throw") => {
    // Определяем финальный range с учётом режима и «кустов» на старте (локально, без API)
    const [startX, startY] = splitCoordLocal(startCoord, 1);
    const cellType = selectedMap?.map?.[startY]?.[startX]?.initial;
    let effectiveRange = range;
    if (cellType === "bush") {
      effectiveRange = Math.ceil(range / 2);
    }

    // Доп. правка по режиму: для "putDown" обычно дальность 1
    const finalRange = mode === "putDown" ? 1 : effectiveRange;

    // Бэкенд вернёт уже отфильтрованные свободные клетки по прямым направлениям
    const freeCells = await getFreeCellLines(roomCode, startCoord, finalRange);
    return freeCells.freeCells;
  }

  const calculateBuildingCells = async (startCoord, character, mapSize) => {
    const [startCol, startRow] = await splitCoord(startCoord);
    let mapAffiliation = character.team === "red" && startCol < mapSize[0] / 2 || character.team === "blue" && startCol > mapSize[0] / 2;
    let calcMode = mapAffiliation ? "map" : "range";

    if (calcMode === "map") {
      return await calculateTeleportationCells(startCoord, "half map", mapSize);
    } else {
      return await calculateThrowableCells(startCoord, 1, mapSize);
    }
  }

  // ─────────────────────────────────────────────
  // Новый deepDiff, соответствующий договорённому формату
  const deepDiff = (oldObj, newObj, path = '') => {
    const changes = {};

    // Ключи нового объекта
    for (const key in newObj) {
      const currentPath = path ? `${path}.${key}` : key;
      const oldValue = oldObj?.[key];
      const newValue = newObj[key];

      if (oldValue === undefined) {
        changes[currentPath] = { type: 'added', value: newValue };
      } else if (newValue === null || newValue === undefined) {
        if (oldValue !== null && oldValue !== undefined) {
          changes[currentPath] = { type: 'deleted' };
        }
      } else if (
        typeof newValue === 'object' &&
        typeof oldValue === 'object' &&
        !Array.isArray(newValue) &&
        !Array.isArray(oldValue)
      ) {
        const nested = deepDiff(oldValue, newValue, currentPath);
        Object.assign(changes, nested);
      } else if (Array.isArray(newValue) && Array.isArray(oldValue)) {
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes[currentPath] = { type: 'changed', oldValue, newValue };
        }
      } else if (oldValue !== newValue) {
        changes[currentPath] = { type: 'changed', oldValue, newValue };
      }
    }

    // Удалённые ключи
    for (const key in oldObj) {
      if (!(key in newObj)) {
        const currentPath = path ? `${path}.${key}` : key;
        changes[currentPath] = { type: 'deleted' };
      }
    }

    return changes;
  };

  // ─────────────────────────────────────────────

  // КЛИЕНТСКОЕ применение diff к объекту состояния
  const applyDiffLocal = (targetObj, changes) => {
    const result = targetObj;
    for (const [path, change] of Object.entries(changes || {})) {
      const keys = path.split('.');
      let current = result;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
          current[key] = {};
        }
        current = current[key];
      }
      const finalKey = keys[keys.length - 1];
      switch (change.type) {
        case 'added':
        case 'changed':
          current[finalKey] = change.value !== undefined ? change.value : change.newValue;
          break;
        case 'deleted':
          delete current[finalKey];
          break;
        default:
          break;
      }
    }
    return result;
  };

  // ─────────────────────────────────────────────

  // Функция для отправки diff через веб-сокет
  const sendMatchStateDiff = (diff) => {
    if (Object.keys(diff).length === 0) return;

    if (DEBUG_NET) console.log('Отправка diff в веб-сокет');

    // Отправляем diff через веб-сокет
    if (gameSocket) {
      gameSocket.emit('MATCH_STATE_DIFF', { roomCode, diff });
    }
  };

  // Функция для запроса полного состояния от сервера
  const requestFullMatchState = () => {
    if (socket) {
      console.log('Запрос полного состояния матча для комнаты:', roomCode);
      socket.emit('GET_MATCH_STATE', roomCode);
    }
  };

  // Функция для присоединения к комнате веб-сокета
  const joinSocketRoom = () => {
    if (socket && roomCode) {
      socket.emit('JOIN_ROOM', roomCode);
    }
  };

  // Функция локального обновления состояния (без отправки в WebSocket)
  // Используется для:
  // - Применения diff-ов от сервера
  // - Обновления состояния из внешних источников
  // - Любых случаев, когда НЕ нужно отправлять изменения в WebSocket
  const updateMatchStateLocally = (newState, mode = 'full') => {
    if (!matchState) return;

    let updated;

    if (mode === 'partial' && newState && typeof newState === 'object') {
      // Режим partial: применяем переданные изменения поверх текущего состояния
      updated = { ...matchState, ...newState };
    } else if (mode === 'diff-applied') {
      // Режим diff-applied: состояние уже обновлено через applyDiffToState
      updated = newState;
    } else {
      // Режим full: полное состояние или патч поверх текущего
      updated = (newState && typeof newState === 'object' && newState.teams)
        ? newState  // полный объект состояния
        : newState ? { ...matchState, ...newState } : { ...matchState };  // патч или копия
    }

    // Проверяем и обновляем статус игры
    if (updated.status && updated.status.includes("destroyed")) {
      updated.gameTime.stopTime = Date.now()
      updated.gameDuration = updated.gameTime.stopTime - updated.gameTime.startTime
    }
    else if (updated.teams && updated.teams.red && updated.teams.red.characters.filter(ch => ch.currentHP > 0).length === 0) {
      updated.status = "blue_team_won"
      updated.gameTime.stopTime = Date.now()
      updated.gameDuration = updated.gameTime.stopTime - updated.gameTime.startTime
    }
    else if (updated.teams && updated.teams.blue && updated.teams.blue.characters.filter(ch => ch.currentHP > 0).length === 0) {
      updated.status = "red_team_won"
      updated.gameTime.stopTime = Date.now()
      updated.gameDuration = updated.gameTime.stopTime - updated.gameTime.startTime
    }

    // Обновляем состояния локально БЕЗ отправки в WebSocket
    setMatchState(updated);
    setMatchStateCheckpoint(deepClone(updated));
    handleFinale();

    console.log('Локальное обновление состояния:', updated);
  };

  // Функция обновления состояния партии (с отправкой в WebSocket)
  // Используется для:
  // - Локальных действий игрока
  // - Изменений, которые нужно синхронизировать с другими игроками
  // - Любых случаев, когда НУЖНО отправлять изменения в WebSocket
  const updateMatchState = (newState = matchState, mode = 'full') => {
    const baseline = matchStateCheckpoint;
    let updated;
    let diff;

    if (mode === 'partial' && newState && typeof newState === 'object') {
      // Режим partial: используем переданные изменения как diff без тяжелого сравнения
      updated = { ...baseline, ...newState };
    } else {
      // Режим full: полное сравнение объектов
      updated = (newState && typeof newState === 'object' && newState.teams)
        ? newState  // полный объект состояния
        : newState ? { ...baseline, ...newState } : { ...baseline };  // патч или копия
    }

    // Проверяем и обновляем статус игры перед вычислением diff
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

    // Вычисляем diff после всех изменений
    const t0 = DEBUG_METRICS ? performance.now() : 0;
    diff = deepDiff(baseline, updated);
    if (DEBUG_METRICS) {
      const t1 = performance.now();
      const paths = Object.keys(diff).length;
      let size = 0;
      try { size = JSON.stringify(diff).length; } catch { size = 0; }
      console.debug(`[WS] deepDiff: ${Math.round(t1 - t0)} ms, paths=${paths}, size=${size} bytes`);
    }
    sendMatchStateDiff(diff);

    setMatchState(updated);
    setMatchStateCheckpoint(deepClone(updated));
    handleFinale();
  };

  const addActionLog = (
    text,
    type = "system",
    commandType = selectedAction
  ) => {
    const now = Date.now();
    const gt = matchState?.gameTime || { startTime: gameStartTime, pausedTime: 0, pauseStartTime: null };
    const paused = gt.pausedTime + (gt.pauseStartTime ? (now - gt.pauseStartTime) : 0);
    const elapsedMs = now - (gt.startTime || gameStartTime) - paused;
    const newMsg = {
      text,
      timestamp: formatElapsedTime(Math.max(0, elapsedMs)),
      messageType: type,
      actionType: type === "system" ? `Система / ${commandType}` : commandType,
      turn: matchState.turn,
      team: teamTurn,
    };
    setMessages((prev) => [...prev, newMsg]);
    setLastNotification({ text, type });
  };

  // useEffect для автоскролла
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const updateCells = async () => {
      if (pendingMode === "attack" && selectedCharacter) {
        if (selectedCharacter.team === teamTurn) {
          setReachableCells([]);
          console.log('Calculating attackable cells for character:', selectedCharacter.position, selectedCharacter.currentRange, selectedMap.size);
          setAttackableCells(await calculateAttackableCells(selectedCharacter.position, selectedCharacter.currentRange, selectedMap.size));
          setThrowableCells([]);
          setBuildingCells([]);
          setFreeCells([]);
        } else {
          // Запрещаем просмотр области атаки противника: очищаем подсветку и выходим из режима атаки
          setPendingMode(null);
          setAttackableCells([]);
          setReachableCells([]);
          setThrowableCells([]);
          setBuildingCells([]);
          setFreeCells([]);
        }
      }
      if (pendingMode === "move" && selectedCharacter) {
        setAttackableCells([]);
        const cellsData = await calculateReachableCellsWithFree(selectedCharacter.position, selectedCharacter.currentAgility);
        setReachableCells(cellsData.reachable);
        setFreeCells(cellsData.freeCells);
        setThrowableCells([]);
        setBuildingCells([]);
      }
      if (pendingMode === "throw" || pendingMode === "putDown") {
        setAttackableCells([]);
        setReachableCells([]);
        setBuildingCells([]);
        setFreeCells([]);
      }
      else if (pendingMode === null) {
        setReachableCells([]);
        setAttackableCells([]);
        setThrowableCells([]);
        if (selectedCharacter && isCharacterOnPortal(selectedCharacter.position)) {
          const cellsData = await calculateReachableCellsWithFree(selectedCharacter.position, selectedCharacter.currentAgility);
          console.log('freeCells', cellsData.freeCells);
          setFreeCells(cellsData.freeCells);
        }
        else {
          setFreeCells([]);
        }
      }
      if ((beamSelectionMode || pointSelectionMode || zoneSelectionMode) && pendingMode !== null) {
        setReachableCells([]);
        setAttackableCells([]);
        setPendingMode(null);
        setFreeCells([]);
      }
    };

    updateCells();
  }, [pendingMode, beamSelectionMode, pointSelectionMode, zoneSelectionMode, selectedCharacter, selectedCharacter?.position]);

  // Синхронизация постоянных оверлеев с активными зонами на карте
  useEffect(() => {
    const zones = Array.isArray(matchState?.zoneEffects) ? matchState.zoneEffects : [];
    if (!zones?.length) {
      setPermanentOverlays([]);
      return;
    }
    const overlays = zones.map((z) => ({
      id: z.id,
      color: z.color || z.stats?.rangeColor || "#9d45f5",
      cells: (() => {
        const size = selectedMap.size;
        const center = z.center;
        const shape = z.shape || z.stats?.rangeShape || "romb";
        const radius = z.stats?.rangeOfObject ?? 1;
        // Лёгкий локальный расчёт, синхронно (для отрисовки)
        // Ромб — используем уже готовую функцию
        if (shape === "romb") {
          return calculateCellsForZone(center, radius, size);
        }
        if (shape === "circle") {
          const [cx, cy] = center.split("-").map(Number);
          const cols = size[0];
          const rows = size[1];
          const res = [];
          const r2 = radius * radius;
          for (let y = Math.max(1, cy - radius); y <= Math.min(rows, cy + radius); y++) {
            for (let x = Math.max(1, cx - radius); x <= Math.min(cols, cx + radius); x++) {
              const dx = x - cx;
              const dy = y - cy;
              if (dx * dx + dy * dy <= r2) res.push(`${x}-${y}`);
            }
          }
          return res;
        }
        if (shape === "rectangle") {
          const [cx, cy] = center.split("-").map(Number);
          const cols = size[0];
          const rows = size[1];
          const w = Math.max(1, Number(z.stats?.rangeWidth) || 1);
          const h = Math.max(1, Number(z.stats?.rangeHeight) || 1);
          const halfW = Math.floor(w / 2);
          const halfH = Math.floor(h / 2);
          const res = [];
          for (let y = Math.max(1, cy - halfH); y <= Math.min(rows, cy + halfH); y++) {
            for (let x = Math.max(1, cx - halfW); x <= Math.min(cols, cx + halfW); x++) {
              res.push(`${x}-${y}`);
            }
          }
          return res;
        }
        if (shape === "cross") {
          const [cx, cy] = center.split("-").map(Number);
          const cols = size[0];
          const rows = size[1];
          const res = new Set([`${cx}-${cy}`]);
          for (let d = 1; d <= radius; d++) {
            if (cx + d <= cols) res.add(`${cx + d}-${cy}`);
            if (cx - d >= 1) res.add(`${cx - d}-${cy}`);
            if (cy + d <= rows) res.add(`${cx}-${cy + d}`);
            if (cy - d >= 1) res.add(`${cx}-${cy - d}`);
          }
          return [...res];
        }
        return calculateCellsForZone(center, radius, size);
      })(),
    }));
    setPermanentOverlays(overlays);
  }, [matchState?.zoneEffects, selectedMap]);

  // Авто-обновление карточки выбранного персонажа при изменении matchState
  useEffect(() => {
    if (!showCharacterInfoPanel || !selectedCharacter || !matchState) return;
    const teamBucket = matchState.teams?.[selectedCharacter.team];
    if (!teamBucket) return;
    const fresh = teamBucket.characters.find((ch) => ch.name === selectedCharacter.name);
    if (fresh) {
      setSelectedCharacter(fresh);
    } else {
      // Персонаж исчез (например, погиб/удалён) — закрываем панель
      setSelectedCharacter(null);
      setShowCharacterInfoPanel(false);
    }
  }, [matchState]);

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
      case 'red church': return `${baseClass} empty`;
      case 'blue church': return `${baseClass} empty`;
      case 'redChurch powerpoint': return `${baseClass} red-church-powerpoint`;
      case 'blueChurch powerpoint': return `${baseClass} blue-church-powerpoint`;
      case 'mob spawnpoint': return `${baseClass} mob-spawnpoint`;
      default: return baseClass;
    }
  };

  // Рендер отдельной ячейки
  const renderCell = (cell, rowIndex, colIndex) => {
    const cellCoord = `${colIndex + 1}-${rowIndex + 1}`;
    const character = matchState.teams.red.characters.find(ch => ch.position === cellCoord && ch.currentHP > 0) ||
      matchState.teams.blue.characters.find(ch => ch.position === cellCoord && ch.currentHP > 0);
    const object = matchState.objectsOnMap.find(obj => obj.position === cellCoord && obj.type === "item");
    const building = matchState.objectsOnMap.find(obj => obj.position === cellCoord && obj.type === "building");

    // Определяем принадлежность храма (синхронная проверка)
    let churchClass = '';
    if (cell.initial === "red church" || cell.initial === "blue church") {
      for (let church of matchState.churches) {
        if (church.coordinates === cellCoord) {
          churchClass = church.currentAffiliation === "red" ? 'red-church' : 'blue-church';
        }
      }
    }

    // Функция для определения части большого здания
    const getBuildingPart = (buildingType) => {
      // Ищем первую клетку этого типа здания
      if (selectedMap.map[rowIndex - 1]?.[colIndex - 1]?.initial === buildingType) return 4; // Верхний левый угол
      if (selectedMap.map[rowIndex - 1]?.[colIndex + 1]?.initial === buildingType) return 3; // Верхний правый угол
      if (selectedMap.map[rowIndex + 1]?.[colIndex - 1]?.initial === buildingType) return 2; // Нижний левый угол
      if (selectedMap.map[rowIndex + 1]?.[colIndex + 1]?.initial === buildingType) return 1; // Нижний правый угол
      return null;
    };

    // Определяем, какое большое здание должно отображаться в этой клетке
    let largeBuildingImage = null;
    let buildingPart = null;

    switch (cell.initial) {
      case "red base":
        buildingPart = getBuildingPart("red base");
        if (buildingPart) {
          largeBuildingImage = `https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/cells/red-base-${buildingPart}.png`;
        }
        break;
      case "blue base":
        buildingPart = getBuildingPart("blue base");
        if (buildingPart) {
          largeBuildingImage = `https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/cells/blue-base-${buildingPart}.png`;
        }
        break;
      case "laboratory":
        buildingPart = getBuildingPart("laboratory");
        if (buildingPart) {
          largeBuildingImage = `https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/cells/lab-${buildingPart}.png`;
        }
        break;
      case "magic shop":
        buildingPart = getBuildingPart("magic shop");
        if (buildingPart) {
          largeBuildingImage = `https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/cells/magic-store-${buildingPart}.png`;
        }
        break;
      case "armory":
        buildingPart = getBuildingPart("armory");
        if (buildingPart) {
          largeBuildingImage = `https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/cells/armory-${buildingPart}.png`;
        }
        break;
    }

    return (
      <div className={`${getCellClassName(cell, churchClass)}`}>
        {character && (
          <div className="positioned-character">
            <img
              src={`https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/characters/${character.image}`}
              alt={character.name}
              className={`character-image ${character.team === "red" ? 'red-team' : 'blue-team'}`}
            />
          </div>
        )}
        {object && (
          <div className="positioned-object">
            <img
              src={`https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/items/${object.image}`}
              alt={object.name}
              className={`object-image`}
            />
          </div>
        )}
        {building &&
          <div className="positioned-object">
            <img
              src={`https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/cells/${building.image}`}
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

  const handleAttack = async () => {
    setPendingMode("attack");
  };

  const initializePlace = async (character) => {
    // Полностью серверный выбор клетки — один запрос
    const fallback = character.position || `${Math.ceil(selectedMap.size[0] / 2)}-${Math.ceil(selectedMap.size[1] / 2)}`;
    console.log('[revive:initPlace] server-request', { team: character.team, fallback });
    const coord = await getRandomReviveCell(roomCode, character.team, fallback, 4);
    return coord;
  }

  const reviveCharacter = async (characterName, teamHint = null) => {
    console.log('[revive] старт', { characterName, teamHint });
    // Определяем команду персонажа без сетевых вызовов
    let team = teamHint;
    if (!team) {
      const inRed = matchState.teams.red.characters.find((ch) => ch.name === characterName);
      const inBlue = matchState.teams.blue.characters.find((ch) => ch.name === characterName);
      if (inRed) team = "red";
      else if (inBlue) team = "blue";
      else if (Array.isArray(matchState.teams.red.latestDeath) && matchState.teams.red.latestDeath.includes(characterName)) team = "red";
      else if (Array.isArray(matchState.teams.blue.latestDeath) && matchState.teams.blue.latestDeath.includes(characterName)) team = "blue";
    }
    console.log('[revive] команда определена', team);
    if (!team) {
      console.warn('[revive] не удалось определить команду, отменяю возрождение');
      return;
    }

    const teamBucket = matchState.teams[team];
    const idx = teamBucket.characters.findIndex((ch) => ch.name === characterName);
    console.log('[revive] индекс персонажа в списке', idx);
    const initialCharacter = characters.find((char) => char.name === characterName);
    if (!initialCharacter) {
      console.warn('[revive] нет шаблона персонажа в characters', { characterName });
      return;
    }

    console.log('[revive] начинаю подбор клетки');
    let place = null;
    try {
      place = await initializePlace({ team, position: teamBucket.characters[idx]?.position || `${Math.ceil(selectedMap.size[0] / 2)}-${Math.ceil(selectedMap.size[1] / 2)}` });
    } catch (e) {
      console.error('[revive] ошибка при подборе клетки', e);
    }
    console.log('[revive] клетка выбрана', place);
    const newCharacter = JSON.parse(JSON.stringify({
      ...initialCharacter,
      position: place,
      team,
      inventory: [],
      armoryCooldown: 0,
      labCooldown: 0,
      currentHP: (initialCharacter.stats && (initialCharacter.stats.HP || initialCharacter.stats.ХП)) || initialCharacter.baseHP || initialCharacter.currentHP || 1,
      currentMana: (initialCharacter.stats && (initialCharacter.stats.Мана || initialCharacter.stats.Mana)) || initialCharacter.baseMana || initialCharacter.currentMana || 0,
    }));
    console.log('[revive] собран персонаж для вставки', { name: newCharacter.name, pos: newCharacter.position, team: newCharacter.team, HP: newCharacter.currentHP, Mana: newCharacter.currentMana });

    if (idx !== -1) {
      console.log('[revive] удаляю старую запись персонажа по индексу', idx);
      teamBucket.characters.splice(idx, 1);
    }
    console.log('[revive] добавляю персонажа в список команды');
    teamBucket.characters.push(newCharacter);
    console.log('[revive] обновляю состояние матча');
    updateMatchState();
    console.log('[revive] завершено');
  }

  const handleAttackCharacter = (character) => {
    const results = attack({ caster: selectedCharacter }, "neutral", [character], selectedCharacter.currentDamage, selectedCharacter.advancedSettings.damageType);
    matchState.teams[selectedCharacter.team].remain.actions -= 1;
    if (matchState.teams[selectedCharacter.team].remain.actions === 0) {
      if (matchState.teams[selectedCharacter.team].remain.moves > 0) {
        setPendingMode("move");
      }
      else {
        setPendingMode(null);
      }
    }

    if (results[0].currentHP === 0) {
      console.log("Character killed", character);
      // Добавляем смерть в список команды погибшего
      console.log('[revive:onKill] latestDeath(before)', matchState.teams[character.team].latestDeath);
      let deadTeamBucket = matchState.teams[character.team].latestDeath;
      if (deadTeamBucket === null || !Array.isArray(deadTeamBucket)) {
        deadTeamBucket = [];
      }
      deadTeamBucket.push(character.name);
      matchState.teams[character.team].latestDeath = deadTeamBucket;
      console.log('[revive:onKill] latestDeath(after push)', matchState.teams[character.team].latestDeath);
      // Награда за убийство
      matchState.teams[selectedCharacter.team].gold += 500;
      // Сразу шлём обновление, чтобы зафиксировать смерть и золото
      updateMatchState();

      // Если на базе погибшей команды есть зелье воскрешения – немедленно воскрешаем
      const reviveIdx = (matchState.teams[character.team].inventory || []).findIndex((item) => item.name === "Зелье воскрешения");
      if (reviveIdx !== -1) {
        (async () => {
          console.log('[revive:onKill] найдено зелье в инвентаре базы, индекс', reviveIdx);
          // Сначала тратим зелье, как по требованиям
          matchState.teams[character.team].inventory.splice(reviveIdx, 1);
          updateMatchState();
          // Затем запускаем воскрешение
          await reviveCharacter(character.name);
          // Удаляем запись о последней смерти, если это тот же персонаж
          const arr = matchState.teams[character.team].latestDeath;
          if (Array.isArray(arr) && arr[arr.length - 1] === character.name) {
            arr.pop();
            if (arr.length === 0) matchState.teams[character.team].latestDeath = [];
          }
          console.log('[revive:onKill] latestDeath(after revive)', matchState.teams[character.team].latestDeath);
          updateMatchState();
        })();
      }
      selectedCharacter.effects.map((effect) => {
        if (effect.byKill) {
          effect.byKill(selectedCharacter, character)
        }
      })
    }
    console.log('[handleAttackCharacter] атака завершена', results);
    return results[0];
  };

  const handleBuyItem = async (item) => {
    const itemData = availableItems.find(
      (it) => it.name.toLowerCase() === item.name.toLowerCase()
    );
    if (matchState.teams[teamTurn].remain.actions === 0 && itemData.shopType !== "Магический") {
      addActionLog(`${selectedCharacter.name} не может купить предмет, так как уже израсходовал все свои действия`);
      return;
    }
    if (item.name === "Зелье воскрешения") {
      if (selectedCharacter.currentMana >= item.price) {
        const team = selectedCharacter.team;
        const baseInventory = matchState.teams[team].inventory;
        // Гарантируем массив смертей
        if (!Array.isArray(matchState.teams[team].latestDeath)) {
          matchState.teams[team].latestDeath = matchState.teams[team].latestDeath ? [matchState.teams[team].latestDeath] : [];
        }
        console.log('[revive:onBuy] старт', { team, latestDeath: matchState.teams[team].latestDeath });
        selectedCharacter.currentMana -= item.price;

        if (matchState.teams[team].latestDeath.length > 0) {
          const lastDeadName = matchState.teams[team].latestDeath.pop();
          if (matchState.teams[team].latestDeath.length === 0) {
            matchState.teams[team].latestDeath = [];
          }
          console.log('[revive:onBuy] возрождаю', lastDeadName);
          await reviveCharacter(lastDeadName);
          console.log('[revive:onBuy] возрождение завершено');
          updateMatchState();
        } else {
          if (INVENTORY_BASE_LIMIT - baseInventory.length >= 1) {
            console.log('[revive:onBuy] умерших нет, кладу зелье в базовый инвентарь');
            baseInventory.push({ ...itemData, id: await generateId() })
            updateMatchState();
          } else {
            addActionLog("Инвентарь базы заполнен, предмет не удается разместить")
          }
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

  const chooseBuildingPosition = async (building) => {
    setBuildingMode(true);
    setPendingMode(null);
    setBuildingCells(await calculateBuildingCells(selectedCharacter.position, selectedCharacter, selectedMap.size));
  }

  const calculateBuildingAllowance = async (coordinates) => {
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

  const moveToCell = async (coordinates) => {
    // Создаём копию состояния, чтобы diff был минимальный
    const nextState = deepClone(matchState);
    // Находим нужного персонажа в копии и меняем позицию
    const teamArr = nextState.teams[selectedCharacter.team].characters;
    const idx = teamArr.findIndex((ch) => ch.name === selectedCharacter.name);
    if (idx !== -1) {
      console.log('coordinates', coordinates);
      teamArr[idx].position = coordinates;
      // Движение через портал не тратит ход ТОЛЬКО если ИЗНАЧАЛЬНО стояли на портале
      const wasOnPortal = isCharacterOnPortal(selectedCharacter.position);
      const isFreePortalMove = wasOnPortal && freeCells.includes(coordinates);
      if (!isFreePortalMove) {
        nextState.teams[selectedCharacter.team].remain.moves -= 1;
      }
    }
    console.log('nextState', nextState);
    console.log('matchState', matchState);

    // Передаём в updateMatchState именно новую копию
    // Обновляем динамические зоны: привязываем центр к переместившемуся владельцу
    try {
      if (Array.isArray(nextState.zoneEffects)) {
        const movedChar = idx !== -1 ? teamArr[idx] : null;
        if (movedChar) {
          nextState.zoneEffects.forEach((z) => {
            if (z.dynamic && (z.casterName === movedChar.name || z.chase === "self")) {
              z.center = movedChar.position; // сразу перенести центр зоны
            }
          });
        }
      }
    } catch (e) {
      console.error('[ZoneEffects] update on move failed', e);
    }

    updateMatchState(nextState);

    // Обновляем selectedCharacter с новой позицией и вызываем checkModePossibility
    if (idx !== -1) {
      const updatedCharacter = { ...selectedCharacter, position: coordinates };
      setSelectedCharacter(updatedCharacter);
      await checkModePossibilityForCharacter(updatedCharacter, nextState);
      await checkForStore(updatedCharacter);
    }
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
  const handleCharacterIconCLick = async (character) => {
    const coordinates = character.position;
    if (zoneSelectionMode || beamSelectionMode || pointSelectionMode) {
      if (zoneSelectionMode && await calculateCastingAllowance(coordinates)) {
        // Закрепляем зону
        handleZoneFix(coordinates);
        return; // прекращаем дальнейшую обработку клика
      }
      if (beamSelectionMode && await calculateCastingAllowance(coordinates)) {
        handleBeamFix(coordinates);
        return; // прекращаем дальнейшую обработку клика
      }
      if (pointSelectionMode && await calculateCastingAllowance(coordinates)) {
        setPointDestination(coordinates);
        return; // прекращаем дальнейшую обработку клика
      }
    }
    else if (pendingMode === "attack") {
      if (selectedCharacter.team === teamTurn) {
        if (character.name === selectedCharacter.name) {
          if (matchState.teams[selectedCharacter.team].remain.moves > 0 && teamTurn === selectedCharacter.team) {
            setPendingMode("move");
            const cellsData = await calculateReachableCellsWithFree(selectedCharacter.position, selectedCharacter.currentAgility);
            setReachableCells(cellsData.reachable);
            setFreeCells(cellsData.freeCells);
          }
          else {
            setPendingMode(null)
          }
          await checkForStore(character);
        }
        else if (attackableCells.includes(character.position)) {
          const result = handleAttackCharacter(character);
          setAttackAnimations(prev => [...prev, {
            position: character.position,
            damageType: selectedCharacter.advancedSettings.damageType || 'физический'
          }]);
          console.log('[handleCharacterIconCLick] атака завершена', result);
          addActionLog(`${selectedCharacter.name} атаковал ${character.name}: HP ${character.name} = ${result.currentHP}, Armor ${character.name} = ${result.currentArmor}`);
          character = JSON.parse(JSON.stringify(result.target));
          if (matchState.teams[selectedCharacter.team].remain.actions === 0) {
            setPendingMode(null);
            setAttackableCells([])
            if (matchState.teams[selectedCharacter.team].remain.moves > 0) {
              setPendingMode("move");
              const cellsData = await calculateReachableCellsWithFree(selectedCharacter.position, selectedCharacter.currentAgility);
              setReachableCells(cellsData.reachable);
              setFreeCells(cellsData.freeCells);
            }
          }
        }
        else {
          setClickedEffectOnPanel(null);
          setShowCharacterInfoPanel(true);
          setSelectedCharacter(character);
          await checkForStore(character);
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
        await checkForStore(character);
      }
      else if (matchState.teams[character.team].remain.moves > 0 && teamTurn === character.team) {
        setShowCharacterInfoPanel(true);
        setSelectedCharacter(character);
        setClickedEffectOnPanel(null);
        await checkForStore(character);
        setPendingMode("move");
        setReachableCells(await calculateReachableCells(character.position, character.currentAgility));
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
      await putDownObject(character.position)
    }
    else {
      setShowCharacterInfoPanel(true);
      setSelectedCharacter(character);
      setClickedEffectOnPanel(null)
      if ((matchState?.teams[matchState.teamTurn]?.player === user?.username || false) && character.team === matchState.teamTurn) {
        await checkForStore(character)
        if (matchState.teams[character.team].remain.moves > 0) {
          setPendingMode("move");
          setReachableCells(await calculateReachableCells(character.position, character.currentAgility));
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
  const handleCellClick = async (rowIndex, colIndex) => {
    const coordinates = `${colIndex + 1}-${rowIndex + 1}`;

    if (teleportationMode || zoneSelectionMode || beamSelectionMode || pointSelectionMode || buildingMode || contextMenu.visible) {
      if (teleportationMode && teleportationCells.includes(coordinates)) {
        handleTeleportation(coordinates);
        return;
      }
      if (zoneSelectionMode && await calculateCastingAllowance(coordinates)) {
        handleZoneFix(coordinates);
        return;
      }
      if (beamSelectionMode && await calculateCastingAllowance(coordinates)) {
        handleBeamFix(coordinates);
        return;
      }
      if (pointSelectionMode && await calculateCastingAllowance(coordinates)) {
        setPointDestination(coordinates);
        return;
      }
      if (buildingMode && await calculateBuildingAllowance(coordinates)) {
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
      console.log(coordinates);
      console.log(matchState.objectsOnMap.find(obj => obj.position === coordinates));
      if (matchState.objectsOnMap.find(obj => obj.position === coordinates)) {
        if (dynamicTooltip && dynamicTooltip.coordinates === coordinates) {
          if (pendingMode === "attack") {
            if (matchState.objectsOnMap.find(object => object.position === coordinates && object.currentHP)) {
              let building = matchState.objectsOnMap.find(object => object.position === coordinates && object.currentHP)
              let result = attackBuilding(building, { damage: selectedCharacter.currentDamage, damageType: selectedCharacter.advancedSettings.damageType }, matchState)
              matchState.teams[teamTurn].remain.actions -= 1;
              if (matchState.teams[teamTurn].remain.actions === 0) {
                if (matchState.teams[teamTurn].remain.moves > 0) {
                  setPendingMode("move");
                }
                else {
                  setPendingMode(null);
                }
              }
              let object = matchState.objectsOnMap.find(obj => obj.position === coordinates)
              updateMatchState();
              if (!result.isDestroyed) {
                setDynamicTooltip({
                  coordinates,
                  title: object.name,
                  description: object.description,
                  parameters: object.type === "building" ? {
                    stats: object.stats,
                    isDestroyable: (object.isDestroyable !== undefined ? object.isDestroyable : true),
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
                  actions: object.type === "item" && object.pickable !== false && [
                    {
                      name: "Взять",
                      onClick: async () => {
                        await takeObject(object)
                      }
                    }
                  ]
                })
              } else {
                // Если объект имел награду, начисляем её команде атакующего
                if (building.bounty) {
                  matchState.teams[selectedCharacter.team].gold += building.bounty;
                  updateMatchState();
                }
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
              isDestroyable: (object.isDestroyable !== undefined ? object.isDestroyable : true),
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
            actions: object.type === "item" && object.pickable !== false && [
              {
                name: "Взять",
                onClick: async () => {
                  await takeObject(object)
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
        if (((reachableCells.includes(coordinates) && pendingMode === "move" && matchState.teams[teamTurn].remain.moves > 0) || (freeCells.includes(coordinates) && isCharacterOnPortal(selectedCharacter.position)))) {
          await moveToCell(coordinates);
          if (matchState.teams[teamTurn].remain.moves === 0) {
            setReachableCells([]);
            // Очищаем freeCells только если персонаж не на портале
            if (!isCharacterOnPortal(coordinates)) {
              setFreeCells([]);
            }
            if (matchState.teams[teamTurn].remain.actions > 0) {
              setPendingMode("attack");
            }
            else {
              setPendingMode(null);
            }
          }
        }
        if (attackableCells.includes(coordinates) && pendingMode === "attack" && matchState.teams[teamTurn].remain.actions > 0) {
          if (selectedMap.map[rowIndex][colIndex].initial === "red base") {
            let result = attackBase("red", selectedCharacter.currentDamage, matchState)
            if (result.status.teamWon) {
              matchState.status = "red_base_destroyed"
            }
            matchState.teams[teamTurn].remain.actions -= 1
            updateMatchState();
            setPendingMode(null)
            setAttackableCells([])
          }
          if (selectedMap.map[rowIndex][colIndex].initial === "blue base") {
            let result = attackBase("blue", selectedCharacter.currentDamage, matchState)
            if (result.status.teamWon) {
              matchState.status = "blue_base_destroyed"
            }
            matchState.teams[teamTurn].remain.actions -= 1
            updateMatchState();
            setPendingMode(null)
            setAttackableCells([])
          }
        }
        if (pendingMode === "putDown" && throwableCells.includes(coordinates)) {
          console.log('putDownObject', coordinates);
          await putDownObject(coordinates)
        }
        if (pendingMode === "throw" && throwableCells.includes(coordinates)) {
          if (throwDestIsFixed && throwDestination === coordinates) {
            setThrowDestIsFixed(false);
            setThrowDestination(null);
          } else {
            setThrowDestIsFixed(true);
            setThrowDestination(coordinates);
          }
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
                  isDestroyable: (object.isDestroyable !== undefined ? object.isDestroyable : true),
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
                actions: object.type === "item" && object.pickable !== false && [
                  {
                    name: "Взять",
                    onClick: async () => {
                      await takeObject(object)
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

  // Локальные функции для избежания API запросов при наведении мышки
  const findCharacterByPositionLocal = (cellCoord) => {
    return matchState.teams.red.characters.find(ch => ch.position === cellCoord && ch.currentHP > 0) ||
      matchState.teams.blue.characters.find(ch => ch.position === cellCoord && ch.currentHP > 0);
  };

  const splitCoordLocal = (cellCoord, minus = 0) => {
    const [col, row] = cellCoord.split('-').map(Number);
    return [col - minus, row - minus];
  };

  const cellHasTypeLocal = (types, coord) => {
    const [col, row] = splitCoordLocal(`${coord[0] + 1}-${coord[1] + 1}`);
    const cell = selectedMap.map[row - 1]?.[col - 1];
    return cell && types.includes(cell.initial);
  };

  const objectOnCellLocal = (cellCoord) => {
    return matchState.objectsOnMap.find(obj => obj.position === cellCoord);
  };

  // Пример: когда игрок наводит мышку (handleCellMouseEnter) в режиме выбора,
  const handleCellMouseEnter = (cellCoord) => {
    if ((!zoneSelectionMode && !beamSelectionMode && !teleportationMode) || zoneFixed || beamFixed) {
      setHoveredCell(cellCoord);

      let char = findCharacterByPositionLocal(cellCoord);

      const [col, row] = splitCoordLocal(cellCoord, 1);
      const cell = selectedMap.map[row][col];

      if (!char && (cell && cellHasTypeLocal(["empty", "bush", "healing zone"], [col, row])) && !objectOnCellLocal(cellCoord)) {
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

    if ((pendingMode === "putDown" || (pendingMode === "throw" && !throwDestIsFixed)) && throwableCells.includes(cellCoord)) {
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




















  const handleEndTurn = async () => {
    const nextTeam = teamTurn === "red" ? "blue" : "red";
    const isNewRoundStarting = nextTeam === firstTeamToAct;

    // Вызов менеджера эффектов для текущей команды (завершающей ход)
    const effectsManager = new EffectsManager(matchState, selectedMap, addActionLog);
    effectsManager.applyCharacterEffects(teamTurn);
    effectsManager.applyZoneEffects(matchState.churches, teamTurn);

    // Применяем эффекты активных зон на карте и уменьшаем их длительность
    const zoneManager = new ZoneEffectsManager(matchState, selectedMap, addActionLog);
    const zonesCount = Array.isArray(matchState.zoneEffects) ? matchState.zoneEffects.length : 0;
    console.log(`(debug) Завершение хода команды ${teamTurn}. Активных зон: ${zonesCount}`, 'system', 'Зона');
    try {
      zoneManager.applyZonesAtTurnEnd(teamTurn);
      console.log(`(debug) Обработка зон завершена.`, 'system', 'Зона');
    } catch (e) {
      console.error(`(error) Обработка зон упала: ${e?.message || e}`, 'system', 'Зона');
      console.error('[ZoneEffects] applyZonesAtTurnEnd error', e);
    }



    if (isNewRoundStarting) {
      coolingDownAbilities();
      coolingDownStores();
      matchState.teams.red.remain.moves = matchState.advancedSettings.movesPerTurn;
      matchState.teams.red.remain.actions = matchState.advancedSettings.actionsPerTurn;
      matchState.teams.blue.remain.moves = matchState.advancedSettings.movesPerTurn;
      matchState.teams.blue.remain.actions = matchState.advancedSettings.actionsPerTurn;
      matchState.turn += 1;
      // ── Логика крипов ───────────────────────────────────────────
      if (matchState.turn >= 5) {
        await updateCreepsAPI(roomCode);
      }
      addActionLog(`--- Ход ${matchState.turn} завершён ---`);
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
    setFreeCells([]); // Очищаем freeCells при завершении хода
    addActionLog(`🎲 Ход команды ${nextTeam === "red" ? "Красные" : "Синие"}`);
    updateMatchState({ ...matchState, teamTurn: nextTeam });

    // Очищаем авто-таймер, если он ещё активен
    if (autoEndTimer) {
      console.log("[AutoEndTimer] Очистка таймера внутри handleEndTurn");
      clearTimeout(autoEndTimer.id);
      setAutoEndTimer(null);
      setCountdownProgress(0);
    }
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
    updateMatchState();
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
        updateMatchState({ teams: updatedTeams }, 'partial');
        addActionLog(`${pendingZoneEffect.caster.name} перемещается в центр области (${centerCoord})`);
      }
    }

    // Если это «Размещение области с эффектом зоны» и у способности есть длительность – создаём постоянную зону
    if (
      pendingZoneEffect.type === "Размещение области с эффектом зоны" &&
      typeof pendingZoneEffect.turnsRemain === "number" &&
      pendingZoneEffect.turnsRemain > 0
    ) {
      if (!Array.isArray(matchState.zoneEffects)) matchState.zoneEffects = [];
      const zoneManager = new ZoneEffectsManager(matchState, selectedMap, addActionLog);
      // Центр зоны – средняя точка выделения либо точка клика
      const center = selectionOverlay?.length
        ? (() => {
          let sumX = 0, sumY = 0;
          selectionOverlay.forEach(cell => {
            const [col, row] = cell.split("-").map(Number);
            sumX += col;
            sumY += row;
          });
          const cx = Math.round(sumX / selectionOverlay.length);
          const cy = Math.round(sumY / selectionOverlay.length);
          return `${cx}-${cy}`;
        })()
        : charactersInZone[0]?.position || pendingZoneEffect.caster.position;

      zoneManager.createZone({
        id: `zone_${Date.now()}`,
        name: pendingZoneEffect.name,
        affiliate: pendingZoneEffect.affiliate || "neutral",
        stats: pendingZoneEffect.stats || {},
        turnsRemain: pendingZoneEffect.turnsRemain,
        coordinates: pendingZoneEffect.coordinates,
        chase: pendingZoneEffect.chase,
        caster: pendingZoneEffect.caster,
        center,
        zoneEffect: pendingZoneEffect.zoneEffect,
      });
      updateMatchState({ zoneEffects: matchState.zoneEffects }, 'partial');
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
          updateMatchState({ teams: updatedTeams }, 'partial');
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
    setStore(null);
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

  const calculatePointCells = async (startCoord, range, mapSize, canGoThroughWalls = false) => {
    console.log(startCoord, range, mapSize, canGoThroughWalls);
    const [startCol, startRow] = await splitCoord(startCoord);
    const cells = new Set(); // Используем Set для уникальных координат

    // Направления: вниз, вверх, вправо, влево
    const directions = [
      { stepX: 0, stepY: 1 },  // Вниз
      { stepX: 0, stepY: -1 }, // Вверх
      { stepX: 1, stepY: 0 },  // Вправо
      { stepX: -1, stepY: 0 }  // Влево
    ];

    // Проходим по каждому направлению
    for (const { stepX, stepY } of directions) {
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
          if (["red base", "blue base", "magic shop", "laboratory", "armory"].includes(cell.initial) || (await objectOnCell(`${currX}-${currY}`, roomCode))) {
            break;
          }

          // Добавляем клетку в результат
          cells.add(cellCoord);

          // Если на клетке есть персонаж, прерываем линию
          if (hasCharacter) break;
        }
      }
    }
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
        src={`https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/characters/${char.image}`}
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
            outline: `5px solid ${matchState.teamTurn === "red" ? "#942b2b" : "#1a5896"}`,
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

            // Формируем inline-стиль (покраска клетки фоном)
            let highlightStyle = {};
            if (highlightColor) {
              highlightStyle.backgroundColor = highlightColor;
              highlightStyle.border = `2px solid ${highlightColor}`;
            }

            const redChar = matchState?.teams?.red?.characters?.find(
              (ch) => ch.position === cellKey && ch.currentHP > 0
            );
            const blueChar = matchState?.teams?.blue?.characters?.find(
              (ch) => ch.position === cellKey && ch.currentHP > 0
            );
            //Все таки будем через заготовленные классы работать
            // Дополнительные классы (reachable, attackable, hovered, etc.)
            const classes = ["cell-wrapper"];
            if (reachableCells.includes(cellKey) || freeCells.includes(cellKey))
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
            if (throwDestination === cellKey)
              classes.push("cell--throw-target");
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
                    <img src={`https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/gifs/${getAttackName(isAttackAnimation.damageType)}.gif`} />
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
        pauseStartTime: Date.now(),
        pausedBy: user?.username || initialUser?.username || null,
      }
    };
    // Отправляем как полное обновление, чтобы гарантировать синхронизацию
    updateMatchState(updatedMatchState, 'full');
  };

  // Функция для продолжения игры после паузы
  const handleResume = () => {
    const pausedBy = matchState?.gameTime?.pausedBy;
    const me = user?.username || initialUser?.username;
    // Разрешаем продолжить только инициатору
    if (pausedBy && pausedBy !== me) return;

    if (matchState.gameTime.pauseStartTime) {
      const currentPauseDuration = Date.now() - matchState.gameTime.pauseStartTime;
      const updatedMatchState = {
        ...matchState,
        gameTime: {
          ...matchState.gameTime,
          isPaused: false,
          pausedTime: matchState.gameTime.pausedTime + currentPauseDuration,
          pauseStartTime: null,
          pausedBy: null,
        }
      };
      updateMatchState(updatedMatchState, 'full');
    }
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
  const calculateTeleportationCells = async (startCoord, range, mapSize) => {
    const [startCol, startRow] = await splitCoord(startCoord);
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
        if (cell && !["red base", "blue base", "magic shop", "laboratory", "armory"].includes(cell.initial) && !await objectOnCell(`${col}-${row}`, roomCode)) {
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
    updateMatchState({ teams: updatedTeams }, 'partial');
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
    async (char) => {
      setSelectedCharacter(char);
      setPendingMode(null);
      setFreeCells([]); // Очищаем freeCells при смене персонажа
      await checkForStore(char);
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

  const handleCancelEffect = async () => {
    await removeEffect(selectedCharacter.name, clickedEffectOnPanel.effectId, roomCode);
    setClickedEffectOnPanel(null);
    updateMatchState();
    matchState.teams[selectedCharacter.team].remain.actions -= 1;
  }

  const handleCloseFinale = () => {
    setFinalWindow(false);
    setMatchState(null);
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

  const putDownObject = async (coordinates) => {
    const [col, row] = await splitCoord(coordinates);
    if (["red base", "blue base"].includes(selectedMap.map[row - 1][col - 1].initial)) {
      const nextTeams = deepClone(matchState.teams);
      if (selectedMap.map[row - 1][col - 1].initial === "red base" && INVENTORY_BASE_LIMIT - nextTeams.red.inventory.length >= 1) {
        nextTeams.red.inventory.push({ ...pendingItem });
      }
      else if (selectedMap.map[row - 1][col - 1].initial === "blue base" && INVENTORY_BASE_LIMIT - nextTeams.blue.inventory.length >= 1) {
        nextTeams.blue.inventory.push({ ...pendingItem });
      }
      // убрать предмет у текущего персонажа
      const owner = nextTeams[selectedCharacter.team].characters.find(ch => ch.name === selectedCharacter.name);
      if (owner) {
        const idx = owner.inventory.findIndex(it => it.name === pendingItem.name);
        if (idx !== -1) owner.inventory.splice(idx, 1);
      }
      nextTeams[selectedCharacter.team].remain.actions -= 1;
      updateMatchState({ teams: nextTeams }, 'partial');
    }
    else if (Object.keys(await findCharacterByPosition(coordinates, roomCode)).length) {
      const character = await findCharacterByPosition(coordinates, roomCode);
      const nextTeams = deepClone(matchState.teams);
      const target = nextTeams[character.team].characters.find(ch => ch.name === character.name);
      if (target && target.team === selectedCharacter.team && target.inventory.length < target.inventoryLimit) {
        target.inventory.push({ ...pendingItem });
        // убрать предмет у текущего персонажа
        const owner = nextTeams[selectedCharacter.team].characters.find(ch => ch.name === selectedCharacter.name);
        if (owner) {
          const idx = owner.inventory.findIndex(it => it.name === pendingItem.name);
          if (idx !== -1) owner.inventory.splice(idx, 1);
        }
        nextTeams[selectedCharacter.team].remain.actions -= 1;
        updateMatchState({ teams: nextTeams }, 'partial');
      }
    }
    else {
      const newObjects = [
        ...matchState.objectsOnMap,
        {
          ...pendingItem,
          type: "item",
          position: coordinates,
          team: selectedCharacter.team
        }
      ];
      const nextTeams = deepClone(matchState.teams);
      const owner = nextTeams[selectedCharacter.team].characters.find(ch => ch.name === selectedCharacter.name);
      if (owner) {
        const idx = owner.inventory.findIndex(it => it.name === pendingItem.name);
        if (idx !== -1) owner.inventory.splice(idx, 1);
      }
      nextTeams[selectedCharacter.team].remain.actions -= 1;
      updateMatchState({ teams: nextTeams, objectsOnMap: newObjects }, 'partial');
    }
    // локальные сбросы UI
    setPendingItem(null);
    setItemHelperInfo(null)
    setThrowableCells([]);
    if (matchState.teams[teamTurn].remain.moves > 0) {
      setPendingMode("move")
      const cellsData = await calculateReachableCellsWithFree(selectedCharacter.position, selectedCharacter.currentAgility);
      setReachableCells(cellsData.reachable);
      setFreeCells(cellsData.freeCells);
    }
    else {
      setPendingMode(null)
    }
  }

  const takeObject = async (object) => {
    // Иммутабельное удаление объекта с карты
    const newObjects = (() => {
      const copy = [...matchState.objectsOnMap];
      const idx = copy.findIndex(o => o.position === object.position && o.type === object.type && (o.name ? o.name === object.name : true));
      if (idx !== -1) copy.splice(idx, 1);
      return copy;
    })();

    // Иммутабельное добавление в инвентарь персонажа
    const nextTeams = deepClone(matchState.teams);
    const owner = nextTeams[selectedCharacter.team].characters.find(ch => ch.name === selectedCharacter.name);
    if (owner) {
      owner.inventory.push({ ...object });
    }
    nextTeams[selectedCharacter.team].remain.actions -= 1;

    setDynamicTooltip(null);
    updateMatchState({ teams: nextTeams, objectsOnMap: newObjects }, 'partial');
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
    const contributor = matchState.teams[teamTurn].characters.find(ch => ch.name === characterName);
    const maxByResource = selectedItem?.currency === 'HP'
      ? Math.max(0, (contributor?.currentHP || 0) - 1)
      : (contributor?.currentMana || 0);
    setManaDistribution(prev => ({
      ...prev,
      [characterName]: Math.min(
        Math.max(0, Number(value)),
        maxByResource
      )
    }));
  };

  const handleManaDistributionNext = () => {
    const totalDistributed = Object.values(manaDistribution).reduce((sum, mana) => sum + mana, 0);
    const required = selectedItem?.name === "Усиление урона" ? (selectedRecipient?.stats?.Мана || 0) : selectedItem.price;
    if (totalDistributed === required) {
      setShowManaDistribution(false);
      if (selectedItem.name === "Зелье воскрешения") {
        // Гарантируем массив смертей
        if (!Array.isArray(matchState.teams[teamTurn].latestDeath)) {
          matchState.teams[teamTurn].latestDeath = matchState.teams[teamTurn].latestDeath ? [matchState.teams[teamTurn].latestDeath] : [];
        }
        if (matchState.teams[teamTurn].latestDeath.length > 0) {
          const lastDeadName = matchState.teams[teamTurn].latestDeath.pop();
          // Воскрешаем последнего погибшего
          reviveCharacter(lastDeadName).then(() => {
            updateMatchState();
          });
          if (matchState.teams[teamTurn].latestDeath.length === 0) {
            matchState.teams[teamTurn].latestDeath = [];
          }
          // Зелье считается израсходованным — в инвентарь базы не кладём
        } else {
          // Нет умерших – отправляем зелье в инвентарь базы, если есть место
          if (INVENTORY_BASE_LIMIT - matchState.teams[teamTurn].inventory.length >= 1) {
            matchState.teams[teamTurn].inventory.push(selectedItem);
            updateMatchState();
          } else {
            addActionLog("Инвентарь базы заполнен, предмет не удается разместить");
          }
        }
        handleFinalizePurchase();
      } else if (selectedItem.name === "Усиление урона") {
        // Для усиления урона завершаем сразу после распределения
        handleFinalizePurchase();
      } else {
        // Для остальных предметов – как раньше: после распределения открываем выбор получателя
        setShowRecipientSelection(true);
      }
    }
  };

  const handleFinalizePurchase = () => {
    // Списываем распределенный ресурс (мана или HP)
    Object.entries(manaDistribution).forEach(([name, amount]) => {
      if (amount > 0) {
        const character = matchState.teams[teamTurn].characters.find(ch => ch.name === name);
        if (selectedItem?.currency === 'HP') {
          const minHpAfterPurchase = 1;
          const payable = Math.min(amount, Math.max(0, (character.currentHP || 0) - minHpAfterPurchase));
          character.currentHP -= payable;
        } else {
          character.currentMana -= amount;
        }
        // Устанавливаем перезарядку магазина
        const cooldownField = store === 'laboratory' ? 'labCooldown' : 'armoryCooldown';
        character[cooldownField] = 6;
      }
    });

    // "Усиление урона" не добавляется в инвентарь, а сразу даёт +50 урона
    if (selectedItem?.name === "Усиление урона") {
      selectedRecipient.currentDamage += 50;
    } else if (selectedItem?.name !== "Зелье воскрешения") {
      // Добавляем предмет получателю
      if (selectedRecipient && selectedItem.type === "wearable") {
        selectedRecipient.wearableItems = selectedRecipient.wearableItems || [];
        selectedRecipient.wearableItems.push(selectedItem);
        if (selectedItem.onWear) {
          selectedItem.onWear(selectedRecipient);
        }
      } else if (selectedRecipient) {
        selectedRecipient.inventory.push(selectedItem);
      }
    }

    // Устанавливаем перезарядку магазина для получателя
    if (selectedRecipient) {
      const cooldownField = store === 'laboratory' ? 'labCooldown' : 'armoryCooldown';
      selectedRecipient[cooldownField] = 6;
    }

    // Сбрасываем состояние
    setShowManaDistribution(false);
    setShowRecipientSelection(false);
    setSelectedItem(null);
    setManaDistribution({});
    setSelectedRecipient(null);
    setStore(null);
    matchState.teams[selectedCharacter.team].remain.actions -= 1;
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

    // Функция для вычисления соседних клеток локально (синхронно)
    const calculateNearCellsLocal = (coord) => {
      const [x, y] = coord.split('-').map(Number);
      const nearCells = [];
      const mapHeight = selectedMap.map.length;
      const mapWidth = selectedMap.map[0].length;

      // Проверяем все 8 направлений
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue; // Пропускаем саму клетку

          const newX = x + dx;
          const newY = y + dy;

          // Проверяем границы карты
          if (newX >= 1 && newX <= mapWidth && newY >= 1 && newY <= mapHeight) {
            nearCells.push(`${newX}-${newY}`);
          }
        }
      }

      return nearCells;
    };

    // Находим соседние клетки для каждого магазина
    const adjacentCells = new Set();
    for (let storeCell of storeCells) {
      const nearCells = calculateNearCellsLocal(`${storeCell.x}-${storeCell.y}`);
      nearCells.forEach(cellCoord => {
        adjacentCells.add(cellCoord);
      });
    }

    return allies.filter(ally => adjacentCells.has(ally.position));
  }

  const handleComplexBuy = async (item) => {
    if (store === "magic shop") {
      if (magicCart.length >= selectedCharacter.inventoryLimit - selectedCharacter.inventory.length) {
        addActionLog("Недостаточно места в инвентаре для покупки предмета");
        return;
      }
      setMagicCart(prev => [...prev, item]);
      return;
    }
    const allies = alliesNearStore();
    if (allies.length === 1) {
      // Соло покупка. Для усиления урона цена = 100% от максимума маны покупателя
      if (item.name === "Усиление урона") {
        const buyer = allies[0];
        const required = buyer.stats?.Мана || 0;
        if (buyer.currentMana < required) {
          addActionLog(`Недостаточно маны у ${buyer.name} для покупки Усиления урона (нужно: ${required})`);
          return;
        }
        setSelectedItem(item);
        setSelectedRecipient(buyer);
        const initialDistribution = {};
        allies.forEach(ally => { initialDistribution[ally.name] = 0; });
        setManaDistribution(initialDistribution);
        setShowRecipientSelection(false);
        setShowManaDistribution(true);
        return;
      }
      await handleBuyItem(item);
    } else {
      setSelectedItem(item);
      const initialDistribution = {};
      allies.forEach(ally => {
        initialDistribution[ally.name] = 0;
      });
      setManaDistribution(initialDistribution);
      // Для усиления урона сначала выбираем получателя (чтобы знать цену)
      if (item.name === "Усиление урона") {
        setShowRecipientSelection(true);
      } else {
        setShowManaDistribution(true);
      }
    }
  }

  const handleTakeObjectFromBase = async (item) => {
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

  const handleFinalizeMagicPurchase = () => {
    if (magicCart.length === 0) return;
    const totalCost = magicCart.reduce((sum, it) => sum + it.price, 0);
    if (matchState.teams[teamTurn].gold < totalCost) {
      addActionLog("Недостаточно золота для покупки выбранных предметов");
      return;
    }
    // Сохраняем начальное число действий, чтобы потом списать одно
    const initialActions = matchState.teams[teamTurn].remain.actions;
    magicCart.forEach((it) => {
      executeCommand({
        characterName: selectedCharacter.name,
        commandType: "buy",
        commandObject: { item: it.name }
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
    });
    // Списываем одно действие после всех покупок, если оно было доступно
    if (initialActions > 0) {
      matchState.teams[teamTurn].remain.actions = initialActions - 1;
    }
    // Списываем золото
    // matchState.teams[teamTurn].gold -= totalCost;
    // if (teamTurn === "red") setTeam1Gold(matchState.teams.red.gold);
    // else setTeam2Gold(matchState.teams.blue.gold);
    updateMatchState();
    // Очищаем корзину и закрываем магазин
    setMagicCart([]);
    setStore(null);
  };

  // ─────────────────────────────────────────────
  //  Следим за оставшимися действиями/ходами и запускаем автотаймер
  useEffect(() => {
    if (!matchState) return;

    const remain = matchState.teams[teamTurn]?.remain;
    if (!remain) {
      return;
    }


    // Когда и перемещения, и действия закончены – запускаем таймер, если он ещё не запущен
    if (remain.moves === 0 && remain.actions === 0) {
      if (!autoEndTimer) {
        const start = Date.now();
        const id = setTimeout(() => {
          handleEndTurn();
        }, 5000);
        setAutoEndTimer({ id, start });
        setCountdownProgress(0);
      }
    } else {
      // Если снова появились действия/ходы – убираем таймер
      if (autoEndTimer) {
        clearTimeout(autoEndTimer.id);
        setAutoEndTimer(null);
        setCountdownProgress(0);
      }
    }
  }, [matchState, teamTurn, matchState?.teams?.[teamTurn]?.remain?.moves, matchState?.teams?.[teamTurn]?.remain?.actions]);

  // Обновляем визуальный прогресс таймера
  useEffect(() => {
    if (!autoEndTimer) return;
    if (matchState?.gameTime?.isPaused) return; // не обновляем прогресс во время паузы

    const interval = setInterval(() => {
      const elapsed = Date.now() - autoEndTimer.start;
      const progress = Math.min(elapsed / 5000, 1);
      setCountdownProgress(progress);
    }, 100);

    return () => clearInterval(interval);
  }, [autoEndTimer, matchState?.gameTime?.isPaused]);

  // Во время паузы отменяем автозавершение хода
  useEffect(() => {
    if (matchState?.gameTime?.isPaused && autoEndTimer) {
      clearTimeout(autoEndTimer.id);
      setAutoEndTimer(null);
      setCountdownProgress(0);
    }
  }, [matchState?.gameTime?.isPaused]);

  const isLoading = !matchState || !selectedMap;

  // >>> ADD WS ADAPTER <<<
  // Инициализируем сокет комнаты для игрового обмена (plain WebSocket via hook)
  const { emit: wsEmit } = useRoomSocket(roomCode, (msg) => {
    if (!msg?.type) return;
    const handlers = window.gameWSHandlers?.[msg.type];
    if (handlers) handlers.forEach((fn) => fn(msg.payload ?? msg));
  });

  // Глобальный реестр обработчиков, чтобы разные хуки могли подписываться / отписываться
  if (!window.gameWSHandlers) window.gameWSHandlers = {};

  // Упрощённый API
  const gameSocket = {
    emit: (type, payload) => wsEmit(type, payload),
    on: (type, fn) => {
      window.gameWSHandlers[type] = window.gameWSHandlers[type] || [];
      window.gameWSHandlers[type].push(fn);
    },
    off: (type, fn) => {
      if (!window.gameWSHandlers[type]) return;
      window.gameWSHandlers[type] = window.gameWSHandlers[type].filter((h) => h !== fn);
    },
  };
  // >>> END WS ADAPTER <<<

  // Подписки на серверные события состояния
  useEffect(() => {
    if (!gameSocket) return;

    const onDiff = (payload) => {
      const diff = payload?.diff || payload?.changes || {};
      if (!diff || Object.keys(diff).length === 0) return;
      setMatchState((prev) => {
        const next = deepClone(prev);
        applyDiffLocal(next, diff);
        return next;
      });
      setMatchStateCheckpoint((prev) => {
        const next = deepClone(prev);
        applyDiffLocal(next, diff);
        return next;
      });
    };

    const onUpdated = (state) => {
      if (!state) return;
      setMatchState(state);
      setMatchStateCheckpoint(deepClone(state));
    };

    gameSocket.on('MATCH_STATE_DIFF', onDiff);
    gameSocket.on('MATCH_STATE_UPDATED', onUpdated);

    return () => {
      gameSocket.off('MATCH_STATE_DIFF', onDiff);
      gameSocket.off('MATCH_STATE_UPDATED', onUpdated);
    };
  }, [gameSocket]);

  // Синхронизация локального флага с общим состоянием игры
  useEffect(() => {
    setIsPaused(!!matchState?.gameTime?.isPaused);
  }, [matchState?.gameTime?.isPaused]);

  // Показываем экран загрузки, если состояние игры ещё не получено
  if (isLoading) {
    return (
      <div className="game-console">
        <div className="loading-container">
          <p>Загрузка игры...</p>
        </div>
      </div>
    );
  }

  const handleRemoveFromCart = (index) => {
    setMagicCart(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={`game-console ${getMapName()}`} translate="no">
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
        store={store}
      />
      <PauseModal
        isPaused={isPaused}
        matchState={matchState}
        pausedBy={matchState?.gameTime?.pausedBy || null}
        currentUser={user || initialUser}
        roomCode={roomCode}
        canResume={!matchState?.gameTime?.pausedBy || (matchState?.gameTime?.pausedBy === (user?.username || initialUser?.username))}
        onResume={handleResume}
        handleDownloadCurrentMatch={handleDownloadCurrentMatch}
        handleDownloadAllMatches={handleDownloadAllMatches}
      />
      <div className="game-console-overlay" style={{ backgroundColor: `${matchState.teamTurn === "red" ? "rgba(102, 24, 24, 0.4)" : "rgba(34, 34, 139, 0.3)"}` }}></div>
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
          isMyTurn={matchState?.teams[matchState.teamTurn]?.player === (user?.username || initialUser?.username) || false}
          onClose={() => {
            setMagicCart([]);
            setStore(null);
          }}
          onBuy={handleComplexBuy}
          selectedMap={selectedMap}
          alliesNearStore={alliesNearStore}
          cartItems={magicCart}
          onFinalizeCart={handleFinalizeMagicPurchase}
          onRemoveFromCart={handleRemoveFromCart}
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
      <BaseInfo inventory={matchState.teams.red.inventory} gold={matchState.teams.red.gold} team="red" player={matchState.teams.red.player} remain={matchState.teams.red.remain} advancedSettings={matchState.advancedSettings} teamTurn={teamTurn} setItemHelperInfo={setItemHelperInfo} selectedCharacter={selectedCharacter} />
      <BaseInfo inventory={matchState.teams.blue.inventory} gold={matchState.teams.blue.gold} team="blue" player={matchState.teams.blue.player} remain={matchState.teams.blue.remain} advancedSettings={matchState.advancedSettings} teamTurn={teamTurn} setItemHelperInfo={setItemHelperInfo} selectedCharacter={selectedCharacter} />
      <ControlButton round={matchState.turn} isItMyTurn={matchState?.teams[matchState.teamTurn]?.player === user?.username || false} handleEndRound={handleEndTurn} handlePause={handlePause} countdownProgress={countdownProgress} />
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
        {(pendingMode === "throw" || pendingMode === "putDown") && (
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
            <div className="game-zone-confirmation__toggle">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={!!throwDestIsFixed}
                  onChange={(e) => setThrowDestIsFixed(e.target.checked)}
                />
                <span>{throwDestIsFixed ? "Открепить клетку" : "Закрепить клетку"}</span>
              </label>
            </div>
            <div className="game-zone-confirmation__button-group">
              <button
                className="game-zone-confirmation__button game-zone-confirmation__button--confirm"
                onClick={() => {
                  if (!throwDestination || !pendingItem) return;
                  try {
                    console.log('[ThrowConfirm] try create zone for item', pendingItem?.name, 'at', throwDestination);
                    console.log('[ThrowConfirm] pendingItem full', JSON.parse(JSON.stringify(pendingItem)));
                    // Если у предмета есть зональный эффект – создаём зону по data.js
                    const item = pendingItem;
                    const fallbackDef = availableItems.find((it) => it.name === item.name);
                    const effect = item?.stats?.effect || fallbackDef?.stats?.effect;
                    console.log('[ThrowConfirm] resolved effect source', {
                      fromItem: typeof (item?.stats?.effect) === 'function',
                      fromFallback: typeof (fallbackDef?.stats?.effect) === 'function',
                    });
                    if (typeof effect === 'function') {
                      if (!Array.isArray(matchState.zoneEffects)) matchState.zoneEffects = [];
                      const zoneConfig = effect({ usedBy: selectedCharacter, targetCoord: throwDestination });
                      console.log('[ThrowConfirm] zoneConfig', zoneConfig);
                      const manager = new ZoneEffectsManager(matchState, selectedMap, addActionLog);
                      const createdZone = manager.createZone({
                        name: zoneConfig.name,
                        affiliate: zoneConfig.affiliate || item.stats.affiliation || 'neutral',
                        stats: zoneConfig.stats || {},
                        turnsRemain: zoneConfig.turnsRemain || 3,
                        coordinates: zoneConfig.coordinates || 0,
                        chase: zoneConfig.chase || null,
                        caster: selectedCharacter,
                        usedBy: { name: selectedCharacter.name, team: selectedCharacter.team },
                        sourceItem: { id: item.id, name: item.name },
                        center: zoneConfig.center || throwDestination,
                        handlerKey: zoneConfig.handlerKey || null,
                        characterEffect: zoneConfig.characterEffect,
                        zoneEffect: zoneConfig.zoneEffect,
                      });
                      console.log('[ThrowConfirm] createdZone meta', { id: createdZone?.id, handlerKey: createdZone?.handlerKey, hasCCE: typeof createdZone?.customCharacterEffect === 'function' });
                      // списываем предмет у владельца
                      const nextTeams = deepClone(matchState.teams);
                      const owner = nextTeams[selectedCharacter.team].characters.find(ch => ch.name === selectedCharacter.name);
                      if (owner) {
                        let idx = owner.inventory.findIndex(it => it.id === item.id);
                        if (idx === -1) {
                          idx = owner.inventory.findIndex(it => it.name === item.name);
                        }
                        if (idx !== -1) owner.inventory.splice(idx, 1);
                      }
                      // Добавляем визуальный объект в центр зоны (неподбираемый)
                      const zoneCenter = zoneConfig.center || throwDestination;
                      const newObjects = [
                        ...matchState.objectsOnMap,
                        {
                          id: item.id || `drop_${Date.now()}`,
                          type: 'item',
                          name: item.name,
                          image: item.image,
                          description: item.description || 'Брошенный предмет',
                          position: zoneCenter,
                          team: selectedCharacter.team,
                          pickable: false,
                          zoneId: createdZone?.id || null,
                        }
                      ];
                      matchState.teams[selectedCharacter.team].remain.actions -= 1;
                      updateMatchState({ zoneEffects: matchState.zoneEffects, teams: nextTeams, objectsOnMap: newObjects }, 'partial');
                      console.log('[ThrowConfirm] zone created, state updated');
                    }
                  } catch (e) {
                    console.error('[ThrowConfirm] failed', e);
                  }
                  // Сброс UI
                  setPendingMode(null);
                  setThrowDestination(null);
                  setPendingItem(null);
                  setReachableCells([]);
                  setThrowableCells([]);
                  setItemHelperInfo(null);
                  setSelectionOverlay([]);
                }}
              >
                Подтвердить
              </button>
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
                  setReachableCells([]);
                  setThrowableCells([]);
                  setItemHelperInfo(null);
                  setSelectionOverlay([]);
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
            isMyTurn={matchState?.teams[matchState.teamTurn]?.player === user?.username || false}
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
              } else {
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
                  <button className="tooltip-button" disabled={matchState.teams[teamTurn].remain.actions === 0} onClick={async () => {
                    setPendingMode("throw");
                    setPendingItem({ ...itemHelperInfo })
                    const cells = await calculateThrowableCells(selectedCharacter.position, 5, selectedMap.size);
                    console.log("throwing cells: ", cells);
                    setThrowableCells(cells);
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
                  <button className="tooltip-button" disabled={matchState.teams[teamTurn].remain.actions === 0} onClick={async () => {
                    setPendingMode("putDown");
                    setPendingItem({ ...itemHelperInfo })
                    const cells = await calculateThrowableCells(selectedCharacter.position, 1, selectedMap.size, "putDown");
                    console.log("putting down cells: ", cells);
                    setThrowableCells(cells);
                  }}>
                    Выложить (действие)
                  </button>
                }
                {selectedCharacter && isNearTeamBase(selectedCharacter.position, selectedCharacter.team) && !selectedCharacter.inventory.find(item => item.id === itemHelperInfo.id) &&
                  <button className="tooltip-button" disabled={matchState.teams[teamTurn].remain.actions === 0 || selectedCharacter.inventory.length === selectedCharacter.inventoryLimit} onClick={async () => {
                    await handleTakeObjectFromBase(itemHelperInfo)
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
              {dynamicTooltip.image && (
                <img src={`https://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/items/${dynamicTooltip.image}`} alt={dynamicTooltip.title} className="dynamic-tooltip-image" />
              )}
            </div>
            <h5 className="dynamic-tooltip-title">{dynamicTooltip.title}</h5>
            {dynamicTooltip.parameters && (
              dynamicTooltip.parameters.isDestroyable ? (
                <div className="parametersHP-bar">
                  <div className="parametersHP-fill" style={{ width: `${(dynamicTooltip.parameters.current.currentHP / dynamicTooltip.parameters.stats.HP) * 100}%` }} />
                  <div className="parametersHP-value">{dynamicTooltip.parameters.current.currentHP}/{dynamicTooltip.parameters.stats.HP}</div>
                </div>
              ) : (
                <h2 className="dynamic-tooltip-hp-value">Невозможно разрушить</h2>
              )
            )}
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
              {selectedCharacter && dynamicTooltip.actions.length > 0 && dynamicTooltip.actions.map((action, idx) => (
                <button key={idx} className="tooltip-button" onClick={action.onClick} disabled={matchState.teams[teamTurn].remain.actions === 0}>{action.name} (Действие)</button>
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
