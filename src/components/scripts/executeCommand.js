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

/**
 * @typedef {Object} CommandObject
 * @property {string} characterName - имя персонажа
 * @property {string} commandType - тип команды (buy, setBaseHP, attackBase, setGold, setParameter, attack, move, pickUp, placeZone, drop, attribute, effect, ability, build)
 * @property {Object} commandObject - объект команды
 */

/**
 * @param {CommandObject} object - объект команды
 * @param {Object} context - контекст команды
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
import { attack } from "./attack";
import { build } from "./building.js";
import { generateId } from "./tools/simplifierStore.js";

// Функция для обработки команды
const executeCommand = (object, context) => {
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
    calculateThrowableCells,
    setThrowableCells,
    throwableCells
  } = context;
  const {
    characterName,
    commandType,
    commandObject
  } = object;

  const findCharacter = (name, state) => {
    const lowerName = name.toLowerCase();
    return (
      state.teams.red.characters.find(
        (ch) => ch.name.toLowerCase() === lowerName
      ) ||
      state.teams.blue.characters.find(
        (ch) => ch.name.toLowerCase() === lowerName
      )
    );
  };

  let match;

  if (!findCharacter(characterName, matchState)) {
    addActionLog(`Ошибка: персонаж ${characterName} не найден`);
    return;
  }

  if (matchState.teams[findCharacter(characterName, matchState).team].remain.actions === 0 && !(
    commandType === "buy" &&
    (() => {
      const itmName = commandObject?.item;
      const itmData = availableItems.find(it => it.name.toLowerCase() === (itmName || "").toLowerCase());
      return itmData?.shopType === "Магический";
    })()
  )) {
    addActionLog(`${characterName} не может совершить действие`);
    return;
  }
  else {
    // ─────────────────────────────────────────────
    // 1. Обработка команды покупки предмета
    // Формат: "[Персонаж]  покупает  [Предмет]"
    // ─────────────────────────────────────────────
    if (commandType === "buy") {
      const { item } = commandObject;
      let charObj = findCharacter(characterName, matchState);
      if (!charObj) {
        addActionLog(`Ошибка: персонаж ${characterName} не найден`);
        return;
      }
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
      // Проверка и списание валюты
      if (requiredCurrency === "маны") {
        // Специальная логика стоимости для "Усиление урона": цена = 100% от максимума маны получателя (в соло — покупателя)
        if (item === "Усиление урона") {
          const required = charObj.stats.Мана || 0;
          if (charObj.currentMana < required) {
            addActionLog(
              `Недостаточно маны у ${charObj.name} для покупки Усиления урона (нужно: ${required})`
            );
            return;
          }
          charObj.currentMana -= required;
        } else {
          if (charObj.currentMana < costValue) {
            addActionLog(
              `Недостаточно маны у ${charObj.name} для покупки ${item}`
            );
            return;
          }
          if (costValue > 0 && item !== "Броня") {
            charObj.currentMana -= costValue;
          }
        }
      } else {
        if (matchState.teams[findCharacter(characterName, matchState).team].gold < costValue) {
          addActionLog(
            `Недостаточно золота у команды ${findCharacter(characterName, matchState).team} для покупки ${item}`
          );
          matchState.teams[findCharacter(characterName, matchState).team].remain.actions -= 1;
          return;
        }
        matchState.teams[findCharacter(characterName, matchState).team].gold -= costValue;
        if (findCharacter(characterName, matchState).team === "red") setTeam1Gold(matchState.teams.red.gold);
        else setTeam2Gold(matchState.teams.blue.gold);
      }
      if (
        charObj.inventory.length >= 3 &&
        item !== "Броня" &&
        item !== "Усиление урона"
      ) {
        addActionLog(
          `${characterName} не имеет свободного места для покупки ${item}`
        );
        return;
      }
      // Обработка специальных предметов (пассивов)
      if (item === "Броня") {
        if (charObj.currentArmor <= 4) {
          const result = applyArmorEffect(charObj);
          addActionLog(result.message);
          return;
        } else {
          addActionLog(`Броня ${charObj.name} достигла предела`);
          return;
        }
      } else if (item === "Усиление урона") {
        const result = useDamageBoostEffect(charObj);
        addActionLog(result.message);
        // Перезарядка магазина для покупателя (соло-покупка)
        const cooldownField = itemData.shopType === "Лаборатория" ? "labCooldown" : "armoryCooldown";
        charObj[cooldownField] = 6;
      }
      if (
        charObj.inventory.length < 3 &&
        item !== "Броня" &&
        item !== "Усиление урона"
      ) {
        charObj.inventory.push({ ...itemData, left: item === "Стена (х3)" ? 3 : undefined, id: generateId() });
        itemData.onWear ? itemData.onWear(charObj) : null;
      }

      if (itemData.shopType !== "Магический") {
        matchState.teams[findCharacter(characterName, matchState).team].remain.actions -= 1;
      }
      updateMatchState();
      return;
    }

    // ─────────────────────────────────────────────
    // 2. Команда установки золота базы
    // Формат: "Золото красной команды = [число]"
    // ─────────────────────────────────────────────
    if (commandType === "setGold") {
      const { team, gold } = commandObject;
      if (team === "red") {
        matchState.teams.red.gold = gold;
        addActionLog(`Золото красной команды обновлено до ${gold}`);
        setTeam1Gold(gold);
      } else {
        matchState.teams.blue.gold = gold;
        addActionLog(`Золото синей команды обновлено до ${gold}`);
        setTeam2Gold(gold);
      }
      updateMatchState();
      return;
    }

    // ─────────────────────────────────────────────
    // 3. Команда установки HP базы
    // Формат: "HP красной базы = [число]"
    // ─────────────────────────────────────────────
    if (commandType === "setBaseHP") {
      const { team, hp } = commandObject;
      if (team === "red") {
        matchState.teams.red.baseHP = hp;
        addActionLog(`HP красной базы = ${hp}`);
      } else {
        matchState.teams.blue.baseHP = hp;
        addActionLog(`HP синей базы = ${hp}`);
      }
      updateMatchState();
      return;
    }

    // ─────────────────────────────────────────────
    // 4. Команда атаки
    // Форматы:
    //   - Атака базы: "[Атакующий]  атакует на [число] [тип урона].урона [цель]"
    if (commandType === "attackBase") {
      const character = findCharacter(characterName, matchState);
      if (!character) {
        addActionLog(`Ошибка: персонаж ${characterName} не найден`);
        return;
      }
      const { damage, team } = commandObject;
      if (team === "red") {
        matchState.teams.red.baseHP -= damage;
        addActionLog(`HP красной базы = ${matchState.teams.red.baseHP}`);
        if (matchState.teams.red.baseHP <= 0) {
          addActionLog("Красная база разрушена. Победа синей команды!");
          matchState.status = "red_base_destroyed";
        }
      } else {
        matchState.teams.blue.baseHP -= damage;
        addActionLog(`HP синей базы = ${matchState.teams.blue.baseHP}`);
        if (matchState.teams.blue.baseHP <= 0) {
          addActionLog("Синяя база разрушена. Победа красной команды!");
          matchState.status = "blue_base_destroyed";
        }
      }
      matchState.teams[findCharacter(characterName, matchState).team].remain.actions -= 1;
      updateMatchState();
      return;
    }

    // ─────────────────────────────────────────────
    // 4. Команда атаки
    // Форматы:
    //   - Атака базы: "[Атакующий]  атакует на [число] [тип урона].урона [цель]"
    //   - Атака персонажа: аналогично, с поиском цели в командах
    // ─────────────────────────────────────────────
    if (commandType === "attack") {
      const { target } = commandObject;
      const attacker = findCharacter(characterName, matchState);
      if (!attacker) {
        addActionLog(`Ошибка: персонаж ${characterName} не найден`);
        return;
      }
      let targetChar = findCharacter(target, matchState);
      if (!targetChar) {
        addActionLog(`Ошибка: цель ${target} не найдена`);
        return;
      }
      const result = attack(attacker, "neutral", targetChar, attacker.currentDamage, attacker.advancedSettings.damageType)[0];
      if (result.currentHP <= 0) {
        addActionLog(`${target} умер${["а", "я"].includes(target.slice(-1)) ? "ла" : ""}`);
        targetChar.position = "0-0";
        if (targetChar.team === "red") {
          matchState.teams.blue.gold += 500;
          setTeam2Gold(matchState.teams.blue.gold);
          addActionLog(`Золото синей команды = ${matchState.teams.blue.gold}`);
        } else {
          matchState.teams.red.gold += 500;
          setTeam1Gold(matchState.teams.red.gold);
          addActionLog(`Золото красной команды = ${matchState.teams.red.gold}`);
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
      matchState.teams[findCharacter(characterName, matchState).team].remain.actions -= 1;
      matchState.actions.push(actionObject);
      updateMatchState();
      addActionLog(commandText);
      return;
    }
    // ─────────────────────────────────────────────
    // 5. Команда перемещения
    // Формат: "[Персонаж]  перемещается на [координаты]"
    // ─────────────────────────────────────────────
    if (commandType === "move") {
      const { coords } = commandObject;
      const character = findCharacter(characterName, matchState);
      if (!character) {
        addActionLog(`Ошибка: персонаж ${characterName} не найден`);
        return;
      }
      character.position = coords;
      addActionLog(`${character} перемещается на ${coords}`);
      updateMatchState();
      return;
    }

    // ─────────────────────────────────────────────
    // 6. Команда подбора предмета
    // Формат: "[Персонаж]  подбирает [Предмет]"
    // ─────────────────────────────────────────────
    if (commandType === "pickup") {
      const { item } = commandObject;
      const character = findCharacter(characterName, matchState);
      if (!character) {
        addActionLog(`Ошибка: персонаж ${characterName} не найден`);
        return;
      }
      character.inventory.push({ name: item });
      addActionLog(`${character} подбирает ${item}`);
      matchState.teams[findCharacter(characterName, matchState).team].remain.actions -= 1;
      updateMatchState();
      return;
    }

    // ─────────────────────────────────────────────
    // 7. Команда размещения зоны эффекта
    // Формат: "[Персонаж]  размещает зону [Название эффекта] на [координаты] [длительность] ходов"
    // ─────────────────────────────────────────────
    if (commandType === "placeZone") {
      const { coords, duration, zoneEffectKey, effectName, affiliate, stats } = commandObject;
      const character = findCharacter(characterName, matchState);
      if (!character) {
        addActionLog(`Ошибка: персонаж ${characterName} не найден`);
        return;
      }
      const zone = {
        name: effectName,
        type: "эффект от зелья/способности",
        putBy: characterName,
        coordinates: coords,
        turnsRemain: parseInt(duration),
        affiliate,
        stats,
        zoneEffect: zoneEffectKey ? effects[zoneEffectKey] : null,
      };
      context.addObjectOnMap(zone);
      addActionLog(
        `${characterName} размещает зону ${effectName} на ${coords} на ${duration} ходов`
      );
      matchState.teams[findCharacter(characterName, matchState).team].remain.actions -= 1;
      updateMatchState();
      return;
    }

    // ─────────────────────────────────────────────
    // 8. Команда сброса (скидывания) предмета
    // Формат: "[Персонаж]  скидывает [Предмет] на [координаты]"
    // ─────────────────────────────────────────────
    if (commandType === "discard") {
      const { item, coords } = commandObject;
      const character = findCharacter(characterName, matchState);
      if (!character) {
        addActionLog(`Ошибка: персонаж ${characterName} не найден`);
        return;
      }
      const itemIndex = character.inventory.findIndex(
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
      matchState.teams[findCharacter(characterName, matchState).team].remain.actions -= 1;
      updateMatchState();
      return;
    }

    // ─────────────────────────────────────────────
    // 9. Команда назначения атрибута персонажу
    // Формат: "[Атрибут] [Персонаж]  = [значение]"
    // ─────────────────────────────────────────────
    if (commandType === "assign") {
      const { attribute, value } = commandObject;
      const character = findCharacter(characterName, matchState);
      if (!character) {
        addActionLog(`Ошибка: персонаж ${characterName} не найден`);
        return;
      }
      character[attribute] = parseInt(value);
      addActionLog(`${character} получает ${attribute} = ${value}`);
      updateMatchState();
      return;
    }

    // ─────────────────────────────────────────────
    // 10. Команда применения эффекта персонажу
    // Формат: "[Персонаж]  получает эффект [Эффект]  на [число] ходов"
    // ─────────────────────────────────────────────
    if (commandType === "effect") {
      const { effect, duration } = commandObject;
      const character = findCharacter(characterName, matchState);
      if (!character) {
        addActionLog(`Ошибка: персонаж ${characterName} не найден`);
        return;
      }
      character.effects.push({
        name: effect.name,
        description: effect.description,
        effectType: effect.effectType,
        typeOfEffect: effect.typeOfEffect,
        turnsRemain: parseInt(duration),
        effect: effect.effect,
        consequence: effect.consequence,
      });
      addActionLog(`${character} получает эффект ${effect} на ${duration} ходов`);
      updateMatchState();
      return;
    }

    // ─────────────────────────────────────────────
    // 11. Команда использования способности
    // Формат: "[Персонаж]  использует [номер]-я способность"
    // Особый случай для Рыцаря тьмы, где включается режим выбора зоны эффекта
    // ─────────────────────────────────────────────

    if (commandType === "useAbility") {
      const { spellKey } = commandObject;
      const caster = findCharacter(characterName, matchState);
      if (!caster) {
        addActionLog(`Ошибка: персонаж ${characterName} не найден`);
        return;
      }
      const abilityObj = abilitiesMap[spellKey];

      // Разделяем по типу
      const abilityType = abilityObj.type || "";
      addActionLog(
        `Проверка способности: ${characterName} (${abilityObj.name}, тип: ${abilityType})`
      );

      // Если вообще нет типа, просто логируем
      if (!abilityType) {
        addActionLog(
          `${characterName} использует способность "${abilityObj.name}", но её тип не указан.`
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
            `${characterName} готовит "Мгновенную область способности" (${abilityObj.name}). Выберите зону, а затем нажмите подтвердить.`
          );
          break;
        }
        case "Область с перемещением": {
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
            `${characterName} готовит "Область с перемещением" (${abilityObj.name}). Выберите зону, а затем нажмите подтвердить.`
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
              `${x}-${y - 1}`, // координата, куда указывает пользователь для направления луча
              selectedMap.size,
              abilityObj.coordinates,
              abilityObj.stats.beamWidth || 1,
              abilityObj.canGoThroughWalls || false
            )
          );
          addActionLog(
            `${characterName} готовит способность "${abilityObj.name}" (Луч). Выберите направление луча.`
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
              abilityObj.distance || 1,
              selectedMap.size,
              abilityObj.canGoThroughWalls || false
            )
          );
          console.log(calculatePointCells(
            caster.position,
            abilityObj.distance,
            selectedMap.size,
            abilityObj.canGoThroughWalls || false
          ));
          addActionLog(
            `${characterName} готовит способность "${abilityObj.name}" (Точка). Выберите клетку.`
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
              `${x}-${y - 1}`, // координата, куда указывает пользователь для направления луча
              selectedMap.size,
              abilityObj.coordinates,
              abilityObj.stats.beamWidth || 1,
              abilityObj.canGoThroughWalls || false
            )
          );
          addActionLog(
            `${characterName} готовит способность "${abilityObj.name}" (Луч с перемещением). Выберите направление луча.`
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
              `${characterName} применяет "${abilityObj.name}" в области вокруг себя.`
            );
          } else {
            addActionLog(
              `${characterName} использует "${abilityObj.name}", но не указаны параметры области или функция эффекта.`
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
            `${characterName} готовит "Заряды по области" (${abilityObj.name}). Выберите зону, а затем распределите заряды.`
          );
          break;
        }
        case "Эффект на себя": {
          // Сразу вызываем effect
          if (typeof abilityObj.effect === "function") {
            abilityObj.effect(caster);
            addActionLog(
              `${characterName} применяет эффект на себя ("${abilityObj.name}").`
            );
          } else {
            addActionLog(
              `${characterName} использует "${abilityObj.name}" (нет функции effect).`
            );
          }
          matchState.teams[caster.team].remain.actions -= 1
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
            `${characterName} выбирает клетку для размещения области "${abilityObj.name}".`
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
            `${characterName} выбирает цель для точечного эффекта "${abilityObj.name}".`
          );
          break;
        }
        case "Щит": {
          // Если coordinates=0, накладывается на себя, иначе выбираем цель
          if (!abilityObj.coordinates || abilityObj.coordinates === 0) {
            if (typeof abilityObj.effect === "function") {
              abilityObj.effect(caster);
              addActionLog(
                `${characterName} накладывает щит "${abilityObj.name}" на себя.`
              );
            } else {
              addActionLog(`${characterName} использует щит, но логика не описана.`);
            }
          } else {
            setZoneSelectionMode(true);
            setPendingZoneEffect({
              ...abilityObj,
              caster,
              isShield: true,
            });
            addActionLog(
              `${characterName} выбирает цель для щита "${abilityObj.name}".`
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
            `${characterName} выбирает цель для "Захвата" (${abilityObj.name}).`
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
            `${characterName} выбирает клетку для телепортации (${abilityObj.name}).`
          );
          break;
        }

        default:
          addActionLog(
            `${characterName} использует способность "${abilityObj.name}" (тип: ${abilityType}), логика не описана.`
          );
          break;

      }

      // Регистрируем действие
      matchState.actions.push({
        type: "ability",
        character: characterName,
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
    if (commandType === "useItem") {
      const { itemName } = commandObject;
      const character = findCharacter(characterName, matchState);
      if (!character) {
        addActionLog(`Ошибка: персонаж ${characterName} не найден`);
        return;
      }
      if (
        vanishItems.some((vItem) => vItem.toLowerCase() === itemName.toLowerCase())
      ) {
        const itemIndex = character.inventory.findIndex(
          (it) => it.name.toLowerCase() === itemName.toLowerCase()
        );
        if (itemIndex === -1) {
          addActionLog(
            `${cleanCharacter} не имеет предмета ${itemName} для использования`
          );
          return;
        }
        character.inventory.splice(itemIndex, 1);
      }
      addActionLog(`${cleanCharacter} использует ${item}`);
      let result;
      if (itemName === "Корона Ра") {
        result = useCoronaRaActive(charObj);
      } else if (itemName === "Обращатель времени") {
        result = useTimeManipulatorActive(charObj);
      } else if (itemName === "Уроборос") {
        result = useUroborosActive(charObj);
      } else if (itemName === "Сапоги света") {
        result = useLightBootsActive(charObj);
      } else if (itemName === "Перчатка повышенного урона") {
        result = useGloveActive(charObj);
      } else if (itemName === "Пространственный тетраэдр") {
        result = useSpatialTetrahedronActive(charObj);
      } else if (itemName === "Корона Лича") {
        result = useLichCrownActive(charObj);
      } else if (itemName === "Кристалл маны") {
        result = useManaCrystalActive(charObj);
      } else if (itemName === "Эльфийский плащ") {
        result = useElvenCloakActive(charObj);
      } else if (itemName === "Зелье восстановления") {
        result = context.applyRestorePotion(charObj);
      } else if (itemName === "Свиток телепортации") {
        result = context.useTeleportScrollActive
          ? context.useTeleportScrollActive(charObj)
          : {
            success: true,
            message: `${charObj.name} телепортируется к союзной постройке`,
          };
      } else if (itemName === "Перчатка Мидаса") {
        result = useMidasGloveActive(charObj);
      } else if (itemName === "Ртутные сапоги") {
        result = useMercuryBootsActive(charObj);
      } else if (itemName === "Зелье здоровья") {
        result = useHealthPotionActive(charObj);
      } else if (itemName === "Зелье ускорения") {
        result = useAccelerationPotionActive(charObj);
      } else if (itemName === "Зелье отравления") {
        result = usePoisonPotionActive(charObj);
      } else if (itemName === "Зелье маны") {
        result = useManaPotionActive(charObj, 3000);
      } else if (itemName === "Зелье магического удара молнии") {
        result = useLightningPotionActive(charObj, { name: "Цель" });
      } else if (itemName === "Зелье воскрешения") {
        result = useResurrectionPotionActive(charObj, { name: "Воскрешенный" });
      } else if (itemName === "Турель") {
        result = useTurretActive(charObj);
      } else if (itemName === "Башня лучников") {
        result = useArcherTowerActive(charObj);
      } else if (itemName === "Стена (х3)") {
        result = useWallActive(charObj);
      } else if (itemName === "Повозка") {
        result = useWagonActive(charObj);
      } else if (itemName === "Лазарет") {
        result = useInfirmaryActive(charObj);
      } else if (itemName === "Шахта") {
        result = useMineActive(charObj);
      } else if (itemName === "Зелье заморозки") {
        result = useFreezePotionActive(charObj, null);
      } else if (itemName === "Дымовая шашка") {
        result = useSmokeBombActive(charObj);
      } else if (itemName === "Таран") {
        result = useBatteringRamActive(charObj);
      } else if (itemName === "Пространственная перчатка") {
        result = useSpatialGloveActive(charObj, "Предмет", { name: "Союзник" });
      } else if (itemName === "Тёмный пакт") {
        result = useDarkPactActive(charObj);
      } else if (itemName === "Свиток пиромантии") {
        result = usePyromancyScrollActive(charObj, null);
      } else if (itemName === "Свиток чар") {
        result = useCharmScrollActive(charObj, { name: "Цель" });
      } else if (itemName === "Свиток чудес") {
        result = useWonderScrollActive(charObj, null);
      } else {
        result = {
          success: false,
          message: `Активная функция для ${itemName} не определена`,
        };
      }
      addActionLog(result.message);
      updateMatchState();
      matchState.teams[findCharacter(characterName, matchState).team].remain.actions -= 1;
      return;
    }

    // ─────────────────────────────────────────────
    // 13. Команда возведения постройки
    // ─────────────────────────────────────────────
    if (commandType === "build") {

      build(findCharacter(characterName, matchState), matchState, {
        position: commandObject.position,
        affiliate: "neutral",
        image: commandObject.image,
        initial: commandObject.initial,
        name: commandObject.name || "Постройка",
        description: commandObject.description || "Конструкция былых времен",
        type: "building",
        stats: {
          HP: commandObject.stats?.HP || 0,
          Урон: commandObject.stats?.Урон || 0,
          Мана: commandObject.stats?.Мана || 0,
          Ловкость: commandObject.stats?.Ловкость || 0,
          Броня: commandObject.stats?.Броня || 0,
          Дальность: commandObject.stats?.Дальность || 0,
        },
        currentHP: commandObject.currentHP || 0,
        currentMana: commandObject.currentMana || 0,
        currentDamage: commandObject.currentDamage || 0,
        currentAgility: commandObject.currentAgility || 0,
        currentArmor: commandObject.currentArmor || 0,
        currentRange: commandObject.currentRange || 0,
        onBuild: commandObject.onBuild || (() => { }),
        onFinishTurn: commandObject.onFinishTurn || (() => { }),
        onCharactersInZone: commandObject.onCharactersInZone || (() => { }),
        onHit: commandObject.onHit || (() => { }),
        onDestroy: commandObject.onDestroy || (() => { }),
      })
    }

    // ─────────────────────────────────────────────
    // 14. Обработка нераспознанной команды (generic)
    // ─────────────────────────────────────────────
  }
};

export default executeCommand;
