import { attack } from "./components/scripts/attack";
import { generateId } from "./components/scripts/tools/simplifierStore";
// effects.js – конструкторы и хелперы для стат‑эффектов персонажей
// Экспортируйте отсюда функции‑«пресеты» и универсальный addEffect, если понадобится.

/**
 * Универсальный помощник: добавляет effectObj в character.effects.
 * Возвращает ссылку на сам effectObj (можно пригодится).
 */

export function addEffect(character, effectObj) {
  if (!character.effects) character.effects = [];
  const id = generateId();
  const newEffect = { ...effectObj, effectId: id };
  character.effects.push(newEffect);
  // Регистрируем функции эффекта в реестре, чтобы переживать сериализацию состояния
  if (typeof window !== 'undefined') {
    window.__charEffectHandlers = window.__charEffectHandlers || {};
    window.__charEffectHandlers[id] = {
      effect: typeof effectObj.effect === 'function' ? effectObj.effect : null,
      consequence: typeof effectObj.consequence === 'function' ? effectObj.consequence : null,
    };
  }
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
  const eff = character.effects[effectIndex];
  // Ре-гидратация consequence при необходимости
  if (typeof eff.consequence !== 'function' && typeof window !== 'undefined' && window.__charEffectHandlers?.[eff.effectId]?.consequence) {
    eff.consequence = window.__charEffectHandlers[eff.effectId].consequence;
  }
  if (typeof eff.consequence === 'function') {
    eff.consequence(character, eff.initialDamage ? eff.initialDamage : null);
  }
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
  /* ── где хранится «текущая ловкость» ───────────────────────── */
  const addAgi = (ch, val) => {
    ch.currentAgility += val;
  };

  addAgi(character, amount);            // сразу выдаём бафф

  return addEffect(character, {
    name,
    description,
    effectType,
    canCancel,
    typeOfEffect,
    turnsRemain: duration,
    /* выполняется каждый ход, если нужно */
    effect: () => { },                   // agility увеличили 1 раз — больше делать нечего
    /* снимаем бафф */
    consequence: (ch) => addAgi(ch, -amount),
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
  /* ── где хранится «текущая ловкость» ───────────────────────── */
  const addDmg = (ch, val) => {
    ch.currentDamage += val;
  };

  addDmg(character, amount);            // сразу выдаём бафф

  return addEffect(character, {
    name,
    description,
    effectType,
    canCancel,
    typeOfEffect,
    turnsRemain: duration,
    /* выполняется каждый ход, если нужно */
    effect: () => { },                   // agility увеличили 1 раз — больше делать нечего
    /* снимаем бафф */
    consequence: (ch) => addDmg(ch, -amount),
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
  /* ── где хранится «текущая ловкость» ───────────────────────── */
  const addHP = (ch, val) => {
    ch.currentHP += val;
  };

  addHP(character, amount);            // сразу выдаём бафф

  const removeShield = (ch, initialHP, amount) => {
    ch.currentHP = Math.min(ch.currentHP, initialHP)
  }


  return addEffect(character, {
    name,
    description,
    effectType,
    canCancel,
    typeOfEffect,
    turnsRemain: duration,
    /* выполняется каждый ход, если нужно */
    effect: () => { },                   // agility увеличили 1 раз — больше делать нечего
    /* снимаем бафф */
    consequence: (ch) => removeShield(ch, initialHP, amount),
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
  const addMana = (ch, val) => {
    ch.currentMana += val;
  };

  addMana(character, amount);            // сразу выдаём бафф

  const removeMana = (ch, initialMana, amount) => {
    ch.currentMana = Math.min(ch.currentMan, initialMana - amount)
  }


  return addEffect(character, {
    name,
    description,
    effectType,
    canCancel,
    typeOfEffect,
    turnsRemain: duration,
    /* выполняется каждый ход, если нужно */
    effect: () => { },                   // agility увеличили 1 раз — больше делать нечего
    /* снимаем бафф */
    consequence: (ch) => removeMana(ch, initialMana, amount),
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
  /* ── где хранится «текущая ловкость» ───────────────────────── */
  const addVamp = (ch, val) => {
    ch.advancedSettings.vampirism += val;
  };

  addVamp(character, amount);            // сразу выдаём бафф

  return addEffect(character, {
    name,
    description,
    effectType,
    canCancel,
    typeOfEffect,
    turnsRemain: duration,
    /* выполняется каждый ход, если нужно */
    effect: () => { },                   // agility увеличили 1 раз — больше делать нечего
    /* снимаем бафф */
    consequence: (ch) => addVamp(ch, -amount),
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
  character.functions.abilityUsability = false;

  addEffect(character, {
    name,
    description,
    effectType,
    canCancel,
    typeOfEffect,
    turnsRemain: duration,
    /* выполняется каждый ход, если нужно */
    effect: () => { },                   // agility увеличили 1 раз — больше делать нечего
    /* снимаем бафф */
    consequence: (ch) => {
      if (!hasSilenceBesides(ch)) {
        ch.functions.abilityUsability = true;
      }
    },
  })
}