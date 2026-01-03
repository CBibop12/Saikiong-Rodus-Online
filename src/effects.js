import { attack } from "./components/scripts/attack";
import { makeId } from "./gameEngine/state/makeId";
import { applyEffectOnApply, normalizeEffectKey } from "./gameEngine/effects/effectRegistry";
// effects.js – конструкторы и хелперы для стат‑эффектов персонажей
// Экспортируйте отсюда функции‑«пресеты» и универсальный addEffect, если понадобится.

/**
 * Универсальный помощник: добавляет effectObj в character.effects.
 * Возвращает ссылку на сам effectObj (можно пригодится).
 */

export function addEffect(character, effectObj) {
  if (!character.effects) character.effects = [];
  const id = makeId("eff");
  const effectKey = effectObj?.effectKey
    ? normalizeEffectKey(effectObj.effectKey)
    : effectObj?.name
      ? normalizeEffectKey(effectObj.name)
      : "unknown_effect";

  // ВАЖНО: не кладём функции в matchState (effect/consequence)
  const { effect, consequence, ...rest } = effectObj || {};

  const newEffect = {
    ...rest,
    effectKey,
    params: effectObj?.params || rest.params || {},
    effectId: id,
  };
  character.effects.push(newEffect);
  // Применяем onApply сразу (для one-time баффов)
  applyEffectOnApply(newEffect, character, null, null);
  return newEffect;
}

function hasSilenceBesides(character) {
  let silenceCount = 0;
  for (let effect of character.effects) {
    if (effect.name.toLowerCase().includes("молчание")) {
      silenceCount++;
    }
  }
  if (silenceCount > 1) {
    return true;
  }
  return false;
}

export function removeEffect(character, effectId) {
  if (!character.effects) return;
  let effectIndex = character.effects.findIndex(effect => effect.effectId === effectId);
  if (effectIndex === -1) return;
  character.effects.splice(effectIndex, 1);
}
/**
 * Временный бафф ловкости (по умолчанию +2 AGI на 2 хода).
 * Равномерно работает с моделями, где ловкость лежит либо
 *  ‑ в `stats.current.Ловкость`, либо (как в паре старых персонажей) в `stats.currentAgility`.
 *
 * @param {object} character – персонаж, которому даём бафф
 * @param {number} amount    – на сколько увеличить ловкость (default = 2)
 * @param {number} duration  – сколько ходов держится (default = 2)
 * @returns {object}         – добавленный effect‑object
 */
// effects.js
export function agilityBoost(
  character,
  {
    amount = 2,
    duration = 2,
    name = "Повышенная ловкость",
    description = "Увеличивает ловкость персонажа",
    effectType = "positive",
    canCancel = true,
    typeOfEffect = "one time",          // one time | each turn | ...
  } = {}
) {
  return addEffect(character, {
    effectKey: "agility_boost",
    name,
    description,
    effectType,
    canCancel,
    typeOfEffect,
    turnsRemain: duration,
    params: { amount },
  });
}

export function damageBoost(
  character,
  {
    amount = 50,
    duration = 2,
    name = "Повышенный урон",
    description = "Увеличивает урон персонажа",
    effectType = "positive",
    canCancel = true,
    typeOfEffect = "one time",          // one time | each turn | ...
  } = {}
) {
  return addEffect(character, {
    effectKey: "damage_boost",
    name,
    description,
    effectType,
    canCancel,
    typeOfEffect,
    turnsRemain: duration,
    params: { amount },
  });
}

export function shield(
  character,
  {
    initialHP = 300,
    amount = 100,
    duration = 2,
    name = "Щит",
    description = "Добавляет временные HP персонажу",
    effectType = "positive",
    canCancel = true,
    typeOfEffect = "one time",          // one time | each turn | ...
  } = {}
) {
  return addEffect(character, {
    effectKey: "shield",
    name,
    description,
    effectType,
    canCancel,
    typeOfEffect,
    turnsRemain: duration,
    params: { amount, capHP: initialHP },
  });
}

export function manaBoost(
  character,
  {
    initialMana = 2000,
    amount = 1000,
    duration = 2,
    name = "Экста мана",
    description = "Добавляет временный запас маны персонажу",
    effectType = "positive",
    canCancel = true,
    typeOfEffect = "one time",          // one time | each turn | ...
  } = {}
) {
  return addEffect(character, {
    effectKey: "mana_boost",
    name,
    description,
    effectType,
    canCancel,
    typeOfEffect,
    turnsRemain: duration,
    params: { amount, capMana: initialMana },
  });
}

export function vampirism(
  character,
  {
    amount = 50,
    duration = 2,
    name = "Вампиризм",
    description = "Каждая атака уменьшающая HP противника, восстанваливает часть HP персонажу",
    effectType = "positive",
    canCancel = true,
    typeOfEffect = "one time",          // one time | each turn | ...
  } = {}
) {
  return addEffect(character, {
    effectKey: "vampirism",
    name,
    description,
    effectType,
    canCancel,
    typeOfEffect,
    turnsRemain: duration,
    params: { amount },
  });
}

export function poisonousAttack(character,
  {
    initiator,
    damageLine = [],
    name = "Ядовитый урон",
    description = "Наносит персонажу урон несколько ходов подряд",
    effectType = "negative",
    canCancel = false,
    typeOfEffect = "each turn",          // one time | each turn | ...
  } = {}) {
  addEffect(character, {
    name,
    description,
    effectType,
    canCancel,
    typeOfEffect,
    turnsRemain: damageLine.length,
    initiator,
    damageLine,
    /* выполняется каждый ход, если нужно */
    effect: (character, damageLine, matchState) => {
      attack(initiator, "negative only", [character], damageLine[damageLine.length - turnsRemain].damage, damageLine[damageLine.length - turnsRemain].damageType, matchState)
    },
    /* снимаем бафф */
    consequence: (ch) => { },
  });
}

export function silence(character,
  {
    duration = 3,
    name = "Молчание",
    description = "Блокирует способности персонажа",
    effectType = "negative",
    canCancel = false,
    typeOfEffect = "one time",          // one time | each turn | ...
  } = {}) {
  addEffect(character, {
    effectKey: "silence",
    name,
    description,
    effectType,
    canCancel,
    typeOfEffect,
    turnsRemain: duration,
    params: {},
  })
}