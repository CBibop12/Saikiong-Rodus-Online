/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
/**
 * parseAndExecuteCommand.js
 *
 * Функция parseAndExecuteCommand парсит и выполняет команду игры.
 * Здесь реализована обработка множества вариантов команд:
 *   - Покупка предмета
 *   - Установка золота базы
 *   - Установка HP базы
 *   - Атака (базы или персонажа)
 *   - Перемещение персонажа
 *   - Подбор предмета
 *   - Размещение зоны эффекта
 *   - Сбрасывание предмета
 *   - Назначение атрибутов персонажу
 *   - Применение эффекта (например, очищение или наложение эффекта)
 *   - Использование способности (номер способности)
 *   - Использование активных предметов (с исчезновением, если они расходные)
 *   - Обработка нераспознанной команды (generic)
 *
 * Для работы функция принимает два параметра:
 *   @param {string} commandText - текст введённой команды
 *   @param {object} context - объект контекста, содержащий необходимые данные и функции:
 *       {
 *         matchState,
 *         updateMatchState,
 *         addActionLog,
 *         setTeam1Gold,
 *         setTeam2Gold,
 *         setZoneSelectionMode,
 *         setPendingZoneEffect,
 *         setHighlightedZone,
 *         selectedMap,
 *         ... (при необходимости другие переменные)
 *       }
 *
 * Необходимые импорты:
 *   - availableItems из ../data
 *   - Функции-эффекты из ../itemEffects
 */

import { items as availableItems } from "../../data";
import { abilities as abilitiesMap } from "../../abilities.js";
import {
  applyArmorEffect,
  useDamageBoostEffect,
  applyPhilosopherStonePassive,
  applyCoronaRaPassive,
  useCoronaRaActive,
  applyEmeraldTimePassive,
  useTimeManipulatorActive,
  useUroborosActive,
  applyLightBootsPassive,
  useLightBootsActive,
  applyBalanceAmuletPassive,
  applyBackpackPassive,
  applyGlovePassive,
  useGloveActive,
  useSpatialTetrahedronActive,
  applyCronosScepterPassive,
  applyLichCrownPassive,
  useLichCrownActive,
  applyWindRingPassive,
  applyManaCrystalPassive,
  useManaCrystalActive,
  applyElvenCloakPassive,
  useElvenCloakActive,
  applyKatanaPassive,
  applyMidasGlovePassive,
  useMidasGloveActive,
  applyTelescopePassive,
  applyScarletGobletPassive,
  applyTwilightCloakPassive,
  applyKoboldPickaxePassive,
  applyMercuryBootsPassive,
  useMercuryBootsActive,
  useHealthPotionActive,
  useAccelerationPotionActive,
  usePoisonPotionActive,
  useManaPotionActive,
  useLightningPotionActive,
  useResurrectionPotionActive,
  useTurretActive,
  useArcherTowerActive,
  useWallActive,
  useWagonActive,
  useInfirmaryActive,
  useMineActive,
  useFreezePotionActive,
  useSmokeBombActive,
  useBatteringRamActive,
  useSpatialGloveActive,
  useDarkPactActive,
  usePyromancyScrollActive,
  useCharmScrollActive,
  useWonderScrollActive,
} from "../../itemEffects";
import { calculateCellsForZone } from "./calculateCellsForZone";

// Функция для обработки команды
const parseAndExecuteCommand = (commandText, context) => {
  const {
    matchState,
    updateMatchState,
    addActionLog,
    setTeam1Gold,
    setTeam2Gold,
    setZoneSelectionMode,
    setPendingZoneEffect,
    selectedMap,
    // turn – текущий ход
    turn,
    setBeamSelectionMode,
    setPendingBeamEffect,
    setHighlightedZone,
    addObjectOnMap,
    setSelectionOverlay,
    setBeamCells,
    calculateBeamCells,
    calculateBeamCellsComb,
    setTeleportationMode,
    setPendingTeleportation,
    setTeleportationCells,
    calculateTeleportationCells,
    setPointSelectionMode,
    setPendingPointEffect,
    setPointCells,
    calculatePointCells,
  } = context;

  const findCharacter = (name) => {
    const lowerName = name.toLowerCase();
    return (
      matchState.teams.red.characters.find(
        (ch) => ch.name.toLowerCase() === lowerName
      ) ||
      matchState.teams.blue.characters.find(
        (ch) => ch.name.toLowerCase() === lowerName
      )
    );
  };

  let match;

  // ─────────────────────────────────────────────
  // 1. Обработка команды покупки предмета
  // Формат: "[Персонаж]  покупает  [Предмет]"
  // ─────────────────────────────────────────────
  const purchaseRegex = /^(?<character>.+?)\s\s+покупает\s+(?<item>.+?)\s*$/i;
  match = commandText.match(purchaseRegex);
  if (match) {
    const { character, item } = match.groups;
    const cleanCharacter = character.trim();
    const itemData = availableItems.find(
      (it) => it.name.toLowerCase() === item.toLowerCase()
    );
    if (!itemData) {
      addActionLog(`Товар "${item}" не найден в магазине`);
      return;
    }
    let requiredCurrency;
    if (itemData.shopType === "Магический") {
      requiredCurrency = "золото";
    } else if (
      itemData.shopType === "Лаборатория" ||
      itemData.shopType === "Оружейная"
    ) {
      requiredCurrency = "маны";
    } else {
      requiredCurrency = "маны";
    }
    let costValue = 0;
    if (typeof itemData.price === "number") {
      costValue = itemData.price;
    } else {
      costValue = 0;
    }
    // Поиск персонажа в matchState
    let charObj = matchState.teams.red.characters.find(
      (ch) => ch.name.toLowerCase() === cleanCharacter.toLowerCase()
    );
    let team = "red";
    if (!charObj) {
      charObj = matchState.teams.blue.characters.find(
        (ch) => ch.name.toLowerCase() === cleanCharacter.toLowerCase()
      );
      team = "blue";
    }
    if (!charObj) {
      addActionLog(`Не найден персонаж ${cleanCharacter}`);
      return;
    }
    // Проверка и списание валюты
    if (requiredCurrency === "маны") {
      if (charObj.currentMana < costValue) {
        addActionLog(
          `Недостаточно маны у ${cleanCharacter} для покупки ${item}`
        );
        return;
      }
      if (costValue > 0) {
        charObj.currentMana -= costValue;
      }
    } else {
      if (matchState.teams[team].gold < costValue) {
        addActionLog(
          `Недостаточно золота у команды ${team} для покупки ${item}`
        );
        return;
      }
      matchState.teams[team].gold -= costValue;
      if (team === "red") setTeam1Gold(matchState.teams.red.gold);
      else setTeam2Gold(matchState.teams.blue.gold);
    }
    if (
      charObj.inventory.length >= 3 &&
      item !== "Броня" &&
      item !== "Усиление урона"
    ) {
      addActionLog(
        `${cleanCharacter} не имеет свободного места для покупки ${item}`
      );
      return;
    }
    // Обработка специальных предметов (пассивов)
    if (item === "Броня") {
      if (charObj.currentArmor <= 4) {
        const result = applyArmorEffect(charObj);
        if (!result.success) {
          addActionLog(result.message);
          return;
        }
        addActionLog(result.message);
      } else {
        addActionLog(`Броня ${charObj.name} достигла предела`);
      }
    } else if (item === "Усиление урона") {
      const result = useDamageBoostEffect(charObj);
      addActionLog(result.message);
    } else if (item === "Философский камень") {
      const result = applyPhilosopherStonePassive(charObj);
      addActionLog(result.message);
    } else if (item === "Корона Ра") {
      const result = applyCoronaRaPassive(charObj);
      addActionLog(result.message);
    } else if (item === "Изумруд времени") {
      const result = applyEmeraldTimePassive(charObj);
      addActionLog(result.message);
    } else if (item === "Обращатель времени") {
      addActionLog(`${cleanCharacter} покупает Обращатель времени`);
    } else if (item === "Уроборос") {
      addActionLog(`${cleanCharacter} покупает Уроборос`);
      charObj.inventory.push({ name: item });
    } else if (item === "Сапоги света") {
      const result = applyLightBootsPassive(charObj);
      addActionLog(result.message);
    } else if (item === "Амулет равновесия") {
      const result = applyBalanceAmuletPassive(charObj);
      addActionLog(result.message);
    } else if (item === "Рюкзак") {
      const result = applyBackpackPassive(charObj);
      addActionLog(result.message);
    } else if (item === "Перчатка повышенного урона") {
      const result = useDamageBoostEffect
        ? useDamageBoostEffect(charObj)
        : applyGlovePassive(charObj);
      addActionLog(result.message);
    } else if (item === "Пространственный тетраэдр") {
      const result = useSpatialTetrahedronActive(charObj);
      addActionLog(result.message);
    } else if (item === "Скипетр Кроноса") {
      const result = applyCronosScepterPassive(charObj);
      addActionLog(result.message);
    } else if (item === "Корона Лича") {
      const result = applyLichCrownPassive(charObj);
      addActionLog(result.message);
    } else if (item === "Кольцо ветров") {
      const result = applyWindRingPassive(charObj);
      addActionLog(result.message);
    } else if (item === "Кристалл маны") {
      const result = applyManaCrystalPassive(charObj);
      addActionLog(result.message);
    } else if (item === "Эльфийский плащ") {
      const result = applyElvenCloakPassive(charObj);
      addActionLog(result.message);
    } else if (item === "Катана") {
      const result = applyKatanaPassive(charObj);
      addActionLog(result.message);
    } else if (item === "Перчатка Мидаса") {
      const result = applyMidasGlovePassive(charObj);
      addActionLog(result.message);
    } else if (item === "Телескоп") {
      const result = applyTelescopePassive(charObj);
      addActionLog(result.message);
    } else if (item === "Алый бокал") {
      const result = applyScarletGobletPassive(charObj);
      addActionLog(result.message);
    } else if (item === "Сумеречный плащ") {
      const result = applyTwilightCloakPassive(charObj);
      addActionLog(result.message);
    } else if (item === "Кирка кобольда") {
      const result = applyKoboldPickaxePassive(charObj);
      addActionLog(result.message);
    } else if (item === "Ртутные сапоги") {
      const result = applyMercuryBootsPassive(charObj);
      addActionLog(result.message);
    } else {
      addActionLog(`${cleanCharacter} покупает ${item}`);
    }
    if (
      charObj.inventory.length < 3 &&
      item !== "Броня" &&
      item !== "Усиление урона"
    ) {
      charObj.inventory.push({ name: item });
    }
    updateMatchState();
    return;
  }

  // ─────────────────────────────────────────────
  // 2. Команда установки золота базы
  // Формат: "Золото красной команды = [число]"
  // ─────────────────────────────────────────────
  const goldRegex = /^Золото\s+(красной|синей)\s+команды\s*=\s*(\d+)\s*$/i;
  match = commandText.match(goldRegex);
  if (match) {
    const teamColor = match[1].toLowerCase();
    const goldValue = parseInt(match[2]);
    if (teamColor.includes("крас")) {
      matchState.teams.red.gold = goldValue;
      addActionLog(`Золото красной команды обновлено до ${goldValue}`);
      setTeam1Gold(goldValue);
    } else {
      matchState.teams.blue.gold = goldValue;
      addActionLog(`Золото синей команды обновлено до ${goldValue}`);
      setTeam2Gold(goldValue);
    }
    updateMatchState();
    return;
  }

  // ─────────────────────────────────────────────
  // 3. Команда установки HP базы
  // Формат: "HP красной базы = [число]"
  // ─────────────────────────────────────────────
  const baseHPRegex =
    /^HP\s+(?<color>красной|синей)\s+базы\s*=\s*(?<value>\d+)\s*$/i;
  match = commandText.match(baseHPRegex);
  if (match) {
    const { color, value } = match.groups;
    const newHP = parseInt(value);
    if (color.toLowerCase().includes("крас")) {
      matchState.teams.red.baseHP = newHP;
      addActionLog(`HP красной базы = ${newHP}`);
      if (newHP <= 0) {
        addActionLog("Красная база разрушена. Победа синей команды!");
        matchState.status = "red_base_destroyed";
      }
    } else {
      matchState.teams.blue.baseHP = newHP;
      addActionLog(`HP синей базы = ${newHP}`);
      if (newHP <= 0) {
        addActionLog("Синяя база разрушена. Победа красной команды!");
        matchState.status = "blue_base_destroyed";
      }
    }
    updateMatchState();
    return;
  }

  // ─────────────────────────────────────────────
  // 4. Команда атаки
  // Форматы:
  //   - Атака базы: "[Атакующий]  атакует на [число] [тип урона].урона [цель]"
  //   - Атака персонажа: аналогично, с поиском цели в командах
  // ─────────────────────────────────────────────
  const attackRegex =
    /^(?<attacker>.+?)\s\s+атакует\s+на\s+(?<damage>\d+)\s+(?<damageType>\S+)\.урона\s+(?<target>.+)$/i;
  match = commandText.match(attackRegex);
  if (match) {
    const { attacker, damage, damageType, target } = match.groups;
    const dmg = parseInt(damage);
    const dtLower = damageType.toLowerCase();
    let normalizedDamageType = "";
    if (dtLower.includes("физ")) {
      normalizedDamageType = "физический";
    } else if (dtLower.includes("маг")) {
      normalizedDamageType = "магический";
    } else if (dtLower.includes("тех")) {
      normalizedDamageType = "технический";
    } else if (dtLower.includes("чист")) {
      normalizedDamageType = "чистый";
    } else {
      normalizedDamageType = dtLower;
    }
    const targetLower = target.toLowerCase().trim();
    // Обработка атаки по базе
    if (targetLower === "красная база" || targetLower === "красной база") {
      let newHP = Math.max(matchState.teams.red.baseHP - dmg, 0);
      matchState.teams.red.baseHP = newHP;
      addActionLog(`HP красной базы = ${newHP}`);
      if (newHP <= 0) {
        addActionLog("Красная база разрушена. Победа синей команды!");
        matchState.status = "red_base_destroyed";
      }
      const actionObject = {
        type: "attack_base",
        attacker,
        damage: dmg,
        damageType: normalizedDamageType,
        target: "красная база",
        turn,
        timestamp: new Date().toISOString(),
      };
      matchState.actions.push(actionObject);
      updateMatchState();
      addActionLog(commandText);
      return;
    } else if (
      targetLower === "синяя база" ||
      targetLower === "синей базы" ||
      targetLower === "синюю базу"
    ) {
      let newHP = Math.max(matchState.teams.blue.baseHP - dmg, 0);
      matchState.teams.blue.baseHP = newHP;
      addActionLog(`HP синей базы = ${newHP}`);
      if (newHP <= 0) {
        addActionLog("Синяя база разрушена. Победа красной команды!");
        matchState.status = "blue_base_destroyed";
      }
      const actionObject = {
        type: "attack_base",
        attacker,
        damage: dmg,
        damageType: normalizedDamageType,
        target: "синяя база",
        turn,
        timestamp: new Date().toISOString(),
      };
      matchState.actions.push(actionObject);
      updateMatchState();
      addActionLog(commandText);
      return;
    }
    // Поиск цели среди персонажей
    let targetIndex = matchState.teams.red.characters.findIndex(
      (ch) => ch.name.toLowerCase() === target.toLowerCase()
    );
    let targetChar, targetTeam;
    if (targetIndex !== -1) {
      targetChar = matchState.teams.red.characters[targetIndex];
      targetTeam = "red";
    } else {
      targetIndex = matchState.teams.blue.characters.findIndex(
        (ch) => ch.name.toLowerCase() === target.toLowerCase()
      );
      if (targetIndex !== -1) {
        targetChar = matchState.teams.blue.characters[targetIndex];
        targetTeam = "blue";
      }
    }
    if (!targetChar) {
      addActionLog(`Не найден персонаж ${target}`);
      return;
    }
    // Обработка брони при атаке персонажа
    if (targetChar.currentArmor > 0 && normalizedDamageType !== "чистый") {
      if (normalizedDamageType === "магический") {
        const armorAvailable = targetChar.currentArmor;
        if (armorAvailable >= 2) {
          targetChar.currentArmor -= 2;
          addActionLog(`С ${target} снято 2 брони (магический урон)`);
          const actionObject = {
            type: "attack",
            attacker,
            damage: 0,
            damageType: normalizedDamageType,
            target,
            turn,
            timestamp: new Date().toISOString(),
          };
          matchState.actions.push(actionObject);
          updateMatchState();
          addActionLog(commandText);
          return;
        } else if (armorAvailable === 1) {
          targetChar.currentArmor = 0;
          addActionLog(`С ${target} снята 1 броня (магический урон)`);
          const remainingDamage = Math.ceil(dmg / 2);
          const newHP = Math.max(targetChar.currentHP - remainingDamage, 0);
          targetChar.currentHP = newHP;
          addActionLog(`HP ${target} = ${newHP}`);
        }
      } else {
        targetChar.currentArmor = Math.max(targetChar.currentArmor - 1, 0);
        addActionLog(`С ${target} снята 1 броня (физический/технический урон)`);
        const actionObject = {
          type: "attack",
          attacker,
          damage: 0,
          damageType: normalizedDamageType,
          target,
          turn,
          timestamp: new Date().toISOString(),
        };
        matchState.actions.push(actionObject);
        updateMatchState();
        addActionLog(commandText);
        return;
      }
    } else {
      const newHP = Math.max(targetChar.currentHP - dmg, 0);
      targetChar.currentHP = newHP;
      addActionLog(`HP ${target} = ${newHP}`);
      if (newHP <= 0) {
        addActionLog(`${target} умер`);
        targetChar.position = "0-0";
        if (targetTeam === "red") {
          matchState.teams.blue.gold += 500;
          setTeam2Gold(matchState.teams.blue.gold);
          addActionLog(`Золото синей команды = ${matchState.teams.blue.gold}`);
        } else {
          matchState.teams.red.gold += 500;
          setTeam1Gold(matchState.teams.red.gold);
          addActionLog(`Золото красной команды = ${matchState.teams.red.gold}`);
        }
      }
    }
    const actionObject = {
      type: "attack",
      attacker,
      damage: dmg,
      damageType: normalizedDamageType,
      target,
      turn,
      timestamp: new Date().toISOString(),
    };
    matchState.actions.push(actionObject);
    updateMatchState();
    addActionLog(commandText);
    return;
  }

  // ─────────────────────────────────────────────
  // 5. Команда перемещения
  // Формат: "[Персонаж]  перемещается на [координаты]"
  // ─────────────────────────────────────────────
  const moveRegex =
    /^(?<character>.+?)\s\s+перемещается\s+на\s+(?<coords>\d+-\d+)$/i;
  match = commandText.match(moveRegex);
  if (match) {
    const { character, coords } = match.groups;
    let charObj = matchState.teams.red.characters.find(
      (ch) => ch.name.toLowerCase() === character.toLowerCase()
    );
    if (!charObj) {
      charObj = matchState.teams.blue.characters.find(
        (ch) => ch.name.toLowerCase() === character.toLowerCase()
      );
    }
    if (charObj) {
      charObj.position = coords;
      addActionLog(`${character} перемещается на ${coords}`);
      updateMatchState();
    } else {
      addActionLog(`Не найден персонаж ${character}`);
    }
    const actionObject = {
      type: "move",
      character,
      coords,
      turn,
      timestamp: new Date().toISOString(),
    };
    matchState.actions.push(actionObject);
    updateMatchState();
    return;
  }

  // ─────────────────────────────────────────────
  // 6. Команда подбора предмета
  // Формат: "[Персонаж]  подбирает [Предмет]"
  // ─────────────────────────────────────────────
  const pickupRegex = /^(?<character>.+?)\s\s+подбирает\s+(?<item>.+)$/i;
  match = commandText.match(pickupRegex);
  if (match) {
    const { character, item } = match.groups;
    const cleanCharacter = character.trim();
    let charObj = matchState.teams.red.characters.find(
      (ch) => ch.name.toLowerCase() === cleanCharacter.toLowerCase()
    );
    let team = "red";
    if (!charObj) {
      charObj = matchState.teams.blue.characters.find(
        (ch) => ch.name.toLowerCase() === cleanCharacter.toLowerCase()
      );
      team = "blue";
    }
    if (!charObj) {
      addActionLog(`Не найден персонаж ${cleanCharacter}`);
      return;
    }
    if (charObj.inventory.length >= 3) {
      addActionLog(
        `${cleanCharacter} не имеет свободного места для подбора ${item}`
      );
      return;
    }
    charObj.inventory.push({ name: item });
    addActionLog(`${cleanCharacter} подбирает ${item}`);
    const actionObject = {
      type: "pickup",
      character: cleanCharacter,
      item,
      turn,
      timestamp: new Date().toISOString(),
    };
    matchState.actions.push(actionObject);
    updateMatchState();
    return;
  }

  // ─────────────────────────────────────────────
  // 7. Команда размещения зоны эффекта
  // Формат: "[Персонаж]  размещает зону [Название эффекта] на [координаты] [длительность] ходов"
  // ─────────────────────────────────────────────
  const zoneRegex =
    /^(?<character>.+?)\s\s+размещает\s+зону\s+(?<effectName>.+?)\s+на\s+(?<coords>\d+-\d+)\s+(?<duration>\d+)\s+ходов$/i;
  match = commandText.match(zoneRegex);
  if (match) {
    const { character, effectName, coords, duration } = match.groups;
    const newZone = {
      name: effectName,
      type: "эффект от зелья/способности",
      putBy: character.trim(),
      coordinates: coords,
      turnsRemain: parseInt(duration),
      affiliate: "neutral",
      stats: {
        HP: 0,
        currentHP: 0,
        Speed: 0,
        Damage: 0,
        Armor: 0,
        attackRange: 0,
        rangeOfObject: 3,
        rangeShape: "romb",
        rangeColor: "#ffcc00",
      },
      zoneEffect: (affectedCharacters) => {
        affectedCharacters.forEach((ch) => {
          ch.currentHP = Math.max(ch.currentHP - 50, 0);
        });
      },
    };
    // Функция добавления объекта на карту (предполагается, что она передана через context)
    context.addObjectOnMap(newZone);
    // Мгновенное применение эффекта (если необходимо)
    newZone.zoneEffect([]);
    addActionLog(
      `${character.trim()} размещает зону ${effectName} на ${coords} на ${duration} ходов`
    );
    return;
  }

  // ─────────────────────────────────────────────
  // 8. Команда сброса (скидывания) предмета
  // Формат: "[Персонаж]  скидывает [Предмет] на [координаты]"
  // ─────────────────────────────────────────────
  const discardRegex =
    /^(?<character>.+?)\s\s+скидывает\s+(?<item>.+?)\s+на\s+(?<coords>\d+-\d+)\s*$/i;
  match = commandText.match(discardRegex);
  if (match) {
    const { character, item, coords } = match.groups;
    const cleanCharacter = character.trim();
    let charObj = matchState.teams.red.characters.find(
      (ch) => ch.name.toLowerCase() === cleanCharacter.toLowerCase()
    );
    if (!charObj) {
      charObj = matchState.teams.blue.characters.find(
        (ch) => ch.name.toLowerCase() === cleanCharacter.toLowerCase()
      );
    }
    if (!charObj) {
      addActionLog(`Не найден персонаж ${cleanCharacter}`);
      return;
    }
    const itemIndex = charObj.inventory.findIndex(
      (it) => it.name.toLowerCase() === item.toLowerCase()
    );
    if (itemIndex === -1) {
      addActionLog(`${cleanCharacter} не имеет предмета ${item}`);
      return;
    }
    charObj.inventory.splice(itemIndex, 1);
    addActionLog(`${cleanCharacter} скидывает ${item} на ${coords}`);
    const actionObject = {
      type: "discard",
      character: cleanCharacter,
      item,
      coords,
      turn,
      timestamp: new Date().toISOString(),
    };
    matchState.actions.push(actionObject);
    updateMatchState();
    return;
  }

  // ─────────────────────────────────────────────
  // 9. Команда назначения атрибута персонажу
  // Формат: "[Атрибут] [Персонаж]  = [значение]"
  // ─────────────────────────────────────────────
  const assignRegex =
    /^(?<attribute>HP|Ловкость|Мана|Урон|Тип урона|Броня|Дальность)\s+(?<character>.+?)\s\s+=\s+(?<value>.+)\s*$/i;
  match = commandText.match(assignRegex);
  if (match) {
    const { attribute, character, value } = match.groups;
    const cleanCharacter = character.trim();
    let charObj = matchState.teams.red.characters.find(
      (ch) => ch.name.toLowerCase() === cleanCharacter.toLowerCase()
    );
    let team = "red";
    if (!charObj) {
      charObj = matchState.teams.blue.characters.find(
        (ch) => ch.name.toLowerCase() === cleanCharacter.toLowerCase()
      );
      team = "blue";
    }
    if (!charObj) {
      addActionLog(`Не найден персонаж ${cleanCharacter}`);
      return;
    }
    switch (attribute.toLowerCase()) {
      case "hp": {
        const newHP = parseInt(value);
        charObj.currentHP = newHP;
        addActionLog(`HP ${cleanCharacter} = ${newHP}`);
        if (newHP === 0) {
          addActionLog(`${cleanCharacter} умер`);
          charObj.position = "0-0";
          if (team === "red") {
            matchState.teams.blue.gold += 500;
            setTeam2Gold(matchState.teams.blue.gold);
          } else {
            matchState.teams.red.gold += 500;
            setTeam1Gold(matchState.teams.red.gold);
          }
        }
        break;
      }
      case "ловкость":
        charObj.stats.Ловкость = parseInt(value);
        addActionLog(`Ловкость ${cleanCharacter} = ${value}`);
        break;
      case "мана":
        charObj.stats.Мана = parseInt(value);
        charObj.currentMana = parseInt(value);
        addActionLog(`Мана ${cleanCharacter} = ${value}`);
        break;
      case "урон":
        charObj.stats.Урон = parseInt(value);
        addActionLog(`Урон ${cleanCharacter} = ${value}`);
        break;
      case "тип урона":
        charObj.damageType = value.toLowerCase();
        addActionLog(`Тип урона ${cleanCharacter} = ${value}`);
        break;
      case "броня":
        charObj.currentArmor = parseInt(value);
        addActionLog(`Броня ${cleanCharacter} = ${value}`);
        break;
      case "дальность":
        charObj.stats.Дальность = parseInt(value);
        addActionLog(`Дальность ${cleanCharacter} = ${value}`);
        break;
      default:
        addActionLog(`Неизвестный атрибут: ${attribute}`);
    }
    const actionObject = {
      type: "assign",
      character: cleanCharacter,
      attribute,
      newValue: parseInt(value),
      turn,
      timestamp: new Date().toISOString(),
    };
    matchState.actions.push(actionObject);
    updateMatchState();
    return;
  }

  // ─────────────────────────────────────────────
  // 10. Команда применения эффекта персонажу
  // Формат: "[Персонаж]  получает эффект [Эффект]  на [число] ходов"
  // ─────────────────────────────────────────────
  const effectRegex =
    /^(?<character>.+?)\s\s+получает\s+эффект\s+(?<effect>.+?)\s\s+на\s+(?<duration>\d+)\s+ходов\s*$/i;
  match = commandText.match(effectRegex);
  if (match) {
    const { character, effect, duration } = match.groups;
    const cleanCharacter = character.trim();
    let charObj = matchState.teams.red.characters.find(
      (ch) => ch.name.toLowerCase() === cleanCharacter.toLowerCase()
    );
    if (!charObj) {
      charObj = matchState.teams.blue.characters.find(
        (ch) => ch.name.toLowerCase() === cleanCharacter.toLowerCase()
      );
    }
    if (!charObj) {
      addActionLog(`Не найден персонаж ${cleanCharacter}`);
      return;
    }
    if (effect.toLowerCase() === "очищение") {
      const negativeEffects = [
        "Ядовитый урон",
        "Слабость",
        "Уязвимость",
        "Опутывание",
        "Оглушение",
        "Обезоруживание",
      ];
      charObj.effects = charObj.effects.filter(
        (eff) => !negativeEffects.includes(eff.name.toLowerCase())
      );
      addActionLog(`${cleanCharacter} получает эффект Очищение`);
      const actionObject = {
        type: "effect",
        character: cleanCharacter,
        effect: { name: "Очищение" },
        turn,
        timestamp: new Date().toISOString(),
      };
      matchState.actions.push(actionObject);
    } else {
      charObj.effects = charObj.effects || [];
      charObj.effects.push({
        name: effect,
        remainingTurns: parseInt(duration),
      });
      addActionLog(
        `${cleanCharacter} получает эффект ${effect} на ${duration} ходов`
      );
      const actionObject = {
        type: "effect",
        character: cleanCharacter,
        effect: { name: effect, remainingTurns: parseInt(duration) },
        turn,
        timestamp: new Date().toISOString(),
      };
      matchState.actions.push(actionObject);
    }
    updateMatchState();
    return;
  }

  // ─────────────────────────────────────────────
  // 11. Команда использования способности
  // Формат: "[Персонаж]  использует [номер]-я способность"
  // Особый случай для Рыцаря тьмы, где включается режим выбора зоны эффекта
  // ─────────────────────────────────────────────

  const abilityRegex =
    /^(?<charName>.+?)\s\s+использует\s+(?<spellIndex>[123])-ю\s+способность\s*$/i;
  match = commandText.match(abilityRegex);

  if (match) {
    const { charName, spellIndex } = match.groups;
    const caster = findCharacter(charName);
    if (!caster) {
      addActionLog(`Не найден персонаж ${charName}`);
      return;
    }
    const indexNum = parseInt(spellIndex, 10) - 1;
    // Проверяем, есть ли у персонажа такая способность (учитывая, что у танков 2)
    if (!caster.abilities || !caster.abilities[indexNum]) {
      addActionLog(`Введенная способность не найдена у персонажа ${charName}`);
      return;
    }
    const abilityData = caster.abilities[indexNum];
    // Если нет abilityObject, просто логируем
    if (!abilityData.key) {
      addActionLog(
        `${charName} использует ${spellIndex}-ю способность (${abilityData.description})`
      );
      return;
    }
    const abilityObj = abilitiesMap[abilityData.key];

    // Разделяем по типу
    const abilityType = abilityObj.type || "";
    addActionLog(
      `Проверка способности: ${charName} (${abilityObj.name}, тип: ${abilityType})`
    );

    // Если вообще нет типа, просто логируем
    if (!abilityType) {
      addActionLog(
        `${charName} использует способность "${abilityObj.name}", но её тип не указан.`
      );
      return;
    }

    // Объект/функции для дальнейшего применения эффекта
    const immediateApplyArea = (center, radius, shape, color, effectFunc) => {
      // Сразу считаем ячейки
      const areaCells = calculateCellsForZone(center, radius, selectedMap.size);
      // Находим персонажей в этих клетках
      const affectedChars = [];
      ["red", "blue"].forEach((teamKey) => {
        matchState.teams[teamKey].characters.forEach((ch) => {
          if (ch.position && areaCells.includes(ch.position)) {
            // Определяем ally/enemy/itself
            let status = "enemy";
            if (ch === caster) status = "itself";
            else if (ch.team === caster.team) status = "ally";
            affectedChars.push({ ch, status });
          }
        });
      });
      // Вызываем переданную функцию эффекта
      effectFunc(affectedChars);
    };

    // Обработчик
    switch (abilityType) {
      case "Мгновенная область способности": {
        setZoneSelectionMode(true);
        setPendingZoneEffect({
          ...abilityObj,
          caster,
          isChargeArea: false,
        });
        setSelectionOverlay(
          calculateCellsForZone(
            caster.position,
            abilityObj.stats.rangeOfObject,
            selectedMap.size
          )
        );
        console.log("Команда передала область и способность в основной файл");

        addActionLog(
          `${charName} готовит "Мгновенную область способности" (${abilityObj.name}). Выберите зону, а затем нажмите подтвердить.`
        );
        break;
      }
      case "Луч": {
        const [x, y] = caster.position.split("-").map(Number);
        setBeamSelectionMode(true);
        setPendingBeamEffect({
          ...abilityObj,
          caster,
        });
        setBeamCells(
          calculateBeamCells(
            caster.position,
            `${x}-${y-1}`, // координата, куда указывает пользователь для направления луча
            selectedMap.size,
            abilityObj.coordinates, 
            abilityObj.stats.beamWidth || 1,
            abilityObj.canGoThroughWalls || false
          )
        );
        addActionLog(
          `${charName} готовит способность "${abilityObj.name}" (Луч). Выберите направление луча.`
        );
        break;
      }
      case "Точка": {
        setPointSelectionMode(true);
        setPendingPointEffect({
          ...abilityObj,
          caster,
        });
        setPointCells(
          calculatePointCells(
            caster.position,
            abilityObj.distance,
            selectedMap.size,
            abilityObj.canGoThroughWalls || false
          )
        );
        addActionLog(
          `${charName} готовит способность "${abilityObj.name}" (Точка). Выберите клетку.`
        );
        break;
      }
      case "Луч с перемещением": {
        const [x, y] = caster.position.split("-").map(Number);
        setBeamSelectionMode(true);
        setPendingBeamEffect({
          ...abilityObj,
          caster,
        });
        setBeamCells(
          calculateBeamCellsComb(
            caster.position,
            `${x}-${y-1}`, // координата, куда указывает пользователь для направления луча
            selectedMap.size,
            abilityObj.coordinates,
            abilityObj.stats.beamWidth || 1,
            abilityObj.canGoThroughWalls || false
          )
        );
        addActionLog(
          `${charName} готовит способность "${abilityObj.name}" (Луч с перемещением). Выберите направление луча.`
        );
        break;
      }
      case "Размещение области (моментальный урон)": {
        // Сразу применяем эффект в области вокруг персонажа
        if (abilityObj.stats && abilityObj.stats.rangeOfObject && typeof abilityObj.zoneEffect === "function") {
          const radius = abilityObj.stats.rangeOfObject;
          const shape = abilityObj.stats.rangeShape || "circle";
          const color = abilityObj.stats.rangeColor || "#ff0000";
          
          immediateApplyArea(caster.position, radius, shape, color, (affectedChars) => {
            // Фильтруем персонажей в зависимости от affiliate
            const filteredChars = affectedChars.filter(({ ch, status }) => {
              if (abilityObj.affiliate === "negative only" && status === "enemy") return true;
              if (abilityObj.affiliate === "positive only" && (status === "ally" || status === "itself")) return true;
              if (abilityObj.affiliate === "neutral" || !abilityObj.affiliate) return true;
              return false;
            }).map(({ ch }) => ch);
            
            // Применяем эффект
            abilityObj.zoneEffect(filteredChars, caster);
          });
          
          addActionLog(
            `${charName} применяет "${abilityObj.name}" в области вокруг себя.`
          );
        } else {
          addActionLog(
            `${charName} использует "${abilityObj.name}", но не указаны параметры области или функция эффекта.`
          );
        }
        break;
      }
      case "Заряды по области": {
        // Аналогично: выбор области, после чего пользователь должен выбрать персонажей (и количество зарядов)
        setZoneSelectionMode(true);
        setPendingZoneEffect({
          ...abilityObj,
          caster,
          isChargeArea: true,
        });
        setSelectionOverlay(
          calculateCellsForZone(
            caster.position,
            abilityObj.stats.rangeOfObject,
            selectedMap.size
          )
        );
        console.log("Команда передала область и способность в основной файл");

        addActionLog(
          `${charName} готовит "Заряды по области" (${abilityObj.name}). Выберите зону, а затем распределите заряды.`
        );
        break;
      }
      case "Эффект на себя": {
        // Сразу вызываем effect
        if (typeof abilityObj.effect === "function") {
          abilityObj.effect(caster);
          addActionLog(
            `${charName} применяет эффект на себя ("${abilityObj.name}").`
          );
        } else {
          addActionLog(
            `${charName} использует "${abilityObj.name}" (нет функции effect).`
          );
        }
        break;
      }
      case "Размещение области с эффектом зоны": {
        // Выбираем место установки «постройки»
        setZoneSelectionMode(true);
        setPendingZoneEffect({
          ...abilityObj,
          caster,
          isZonePlacement: true,
        });
        addActionLog(
          `${charName} выбирает клетку для размещения области "${abilityObj.name}".`
        );
        break;
      }
      case "Точечное накладывание эффекта":
      case "Точечное наложение эффекта":
      case "Точечная атака":
      case "Точечное действие": {
        // Считаем, что нужно выбрать конкретного персонажа/клетку на расстоянии abilityObj.coordinates
        setZoneSelectionMode(true);
        setPendingZoneEffect({
          ...abilityObj,
          caster,
          isPointEffect: true,
        });
        addActionLog(
          `${charName} выбирает цель для точечного эффекта "${abilityObj.name}".`
        );
        break;
      }
      case "Щит": {
        // Если coordinates=0, накладывается на себя, иначе выбираем цель
        if (!abilityObj.coordinates || abilityObj.coordinates === 0) {
          if (typeof abilityObj.effect === "function") {
            abilityObj.effect(caster);
            addActionLog(
              `${charName} накладывает щит "${abilityObj.name}" на себя.`
            );
          } else {
            addActionLog(`${charName} использует щит, но логика не описана.`);
          }
        } else {
          setZoneSelectionMode(true);
          setPendingZoneEffect({
            ...abilityObj,
            caster,
            isShield: true,
          });
          addActionLog(
            `${charName} выбирает цель для щита "${abilityObj.name}".`
          );
        }
        break;
      }
      case "Захват": {
        // Выбор одного противника, наложение эффекта на него и на себя
        setZoneSelectionMode(true);
        setPendingZoneEffect({
          ...abilityObj,
          caster,
          isGrab: true,
        });
        addActionLog(
          `${charName} выбирает цель для "Захвата" (${abilityObj.name}).`
        );
        break;
      }
      case "Телепортация": {
        // Выбираем клетку для телепортации
        setTeleportationMode(true);
        setPendingTeleportation({
          ...abilityObj,
          caster,
        });
        setTeleportationCells(
          calculateTeleportationCells(
            caster.position,
            abilityObj.distance,
            selectedMap.size
          )
        );
        addActionLog(
          `${charName} выбирает клетку для телепортации (${abilityObj.name}).`
        );
        break;
      }

      default:
        addActionLog(
          `${charName} использует способность "${abilityObj.name}" (тип: ${abilityType}), логика не описана.`
        );
        break;
    }

    // Регистрируем действие
    matchState.actions.push({
      type: "ability",
      character: charName,
      abilityKey: abilityObj.name,
      turn,
      timestamp: new Date().toISOString(),
    });
    updateMatchState();
    return;
  }
  // ─────────────────────────────────────────────
  // 12. Команда использования активного предмета
  // Формат: "[Персонаж]  использует [Предмет]"
  // Список расходников определяется в массиве vanishItems
  // ─────────────────────────────────────────────
  const vanishItems = [
    "Пространственный тетраэдр",
    "Зелье восстановления",
    "Свиток телепортации",
    "Свиток пиромантии",
    "Свиток чар",
    "Свиток чудес",
    "Зелье здоровья",
    "Зелье ускорения",
    "Зелье отравления",
    "Зелье маны",
    "Зелье магического удара молнии",
    "Зелье воскрешения",
    "Зелье заморозки",
    "Турель",
    "Башня лучников",
    "Стена (х3)",
    "Шахта",
    "Дымовая шашка",
    "Лазарет",
    "Таран",
  ];
  const itemUseRegex = /^(?<character>.+?)\s\s+использует\s+(?<item>.+)\s*$/i;
  match = commandText.match(itemUseRegex);
  if (match) {
    // Если команда соответствует шаблону использования способности, выходим
    if (/^[123]-я\s+способность/i.test(match.groups.item)) {
      return;
    }
    const { character, item } = match.groups;
    const cleanCharacter = character.trim();
    let charObj = matchState.teams.red.characters.find(
      (ch) => ch.name.toLowerCase() === cleanCharacter.toLowerCase()
    );
    if (!charObj) {
      charObj = matchState.teams.blue.characters.find(
        (ch) => ch.name.toLowerCase() === cleanCharacter.toLowerCase()
      );
    }
    if (!charObj) {
      addActionLog(`Не найден персонаж ${cleanCharacter}`);
      return;
    }
    if (
      vanishItems.some((vItem) => vItem.toLowerCase() === item.toLowerCase())
    ) {
      const itemIndex = charObj.inventory.findIndex(
        (it) => it.name.toLowerCase() === item.toLowerCase()
      );
      if (itemIndex === -1) {
        addActionLog(
          `${cleanCharacter} не имеет предмета ${item} для использования`
        );
        return;
      }
      charObj.inventory.splice(itemIndex, 1);
    }
    addActionLog(`${cleanCharacter} использует ${item}`);
    let result;
    if (item === "Корона Ра") {
      result = useCoronaRaActive(charObj);
    } else if (item === "Обращатель времени") {
      result = useTimeManipulatorActive(charObj);
    } else if (item === "Уроборос") {
      result = useUroborosActive(charObj);
    } else if (item === "Сапоги света") {
      result = useLightBootsActive(charObj);
    } else if (item === "Перчатка повышенного урона") {
      result = useGloveActive(charObj);
    } else if (item === "Пространственный тетраэдр") {
      result = useSpatialTetrahedronActive(charObj);
    } else if (item === "Корона Лича") {
      result = useLichCrownActive(charObj);
    } else if (item === "Кристалл маны") {
      result = useManaCrystalActive(charObj);
    } else if (item === "Эльфийский плащ") {
      result = useElvenCloakActive(charObj);
    } else if (item === "Зелье восстановления") {
      result = context.applyRestorePotion(charObj);
    } else if (item === "Свиток телепортации") {
      result = context.useTeleportScrollActive
        ? context.useTeleportScrollActive(charObj)
        : {
            success: true,
            message: `${charObj.name} телепортируется к союзной постройке`,
          };
    } else if (item === "Перчатка Мидаса") {
      result = useMidasGloveActive(charObj);
    } else if (item === "Ртутные сапоги") {
      result = useMercuryBootsActive(charObj);
    } else if (item === "Зелье здоровья") {
      result = useHealthPotionActive(charObj);
    } else if (item === "Зелье ускорения") {
      result = useAccelerationPotionActive(charObj);
    } else if (item === "Зелье отравления") {
      result = usePoisonPotionActive(charObj);
    } else if (item === "Зелье маны") {
      result = useManaPotionActive(charObj, 3000);
    } else if (item === "Зелье магического удара молнии") {
      result = useLightningPotionActive(charObj, { name: "Цель" });
    } else if (item === "Зелье воскрешения") {
      result = useResurrectionPotionActive(charObj, { name: "Воскрешенный" });
    } else if (item === "Турель") {
      result = useTurretActive(charObj);
    } else if (item === "Башня лучников") {
      result = useArcherTowerActive(charObj);
    } else if (item === "Стена (х3)") {
      result = useWallActive(charObj);
    } else if (item === "Повозка") {
      result = useWagonActive(charObj);
    } else if (item === "Лазарет") {
      result = useInfirmaryActive(charObj);
    } else if (item === "Шахта") {
      result = useMineActive(charObj);
    } else if (item === "Зелье заморозки") {
      result = useFreezePotionActive(charObj, null);
    } else if (item === "Дымовая шашка") {
      result = useSmokeBombActive(charObj);
    } else if (item === "Таран") {
      result = useBatteringRamActive(charObj);
    } else if (item === "Пространственная перчатка") {
      result = useSpatialGloveActive(charObj, "Предмет", { name: "Союзник" });
    } else if (item === "Тёмный пакт") {
      result = useDarkPactActive(charObj);
    } else if (item === "Свиток пиромантии") {
      result = usePyromancyScrollActive(charObj, null);
    } else if (item === "Свиток чар") {
      result = useCharmScrollActive(charObj, { name: "Цель" });
    } else if (item === "Свиток чудес") {
      result = useWonderScrollActive(charObj, null);
    } else {
      result = {
        success: false,
        message: `Активная функция для ${item} не определена`,
      };
    }
    addActionLog(result.message);
    const actionObject = {
      type: "item_use",
      character: cleanCharacter,
      item,
      turn,
      timestamp: new Date().toISOString(),
    };
    matchState.actions.push(actionObject);
    updateMatchState();
    return;
  }

  // ─────────────────────────────────────────────
  // 13. Обработка нераспознанной команды (generic)
  // ─────────────────────────────────────────────
  const genericAction = {
    type: "generic",
    text: commandText,
    turn,
    timestamp: new Date().toISOString(),
  };
  matchState.actions.push(genericAction);
  updateMatchState();
  addActionLog(`Нераспознанная команда: ${commandText}`);
};

export default parseAndExecuteCommand;
