/**
 * effectRegistry — реестр эффектов по effectKey.
 * В matchState храним только данные эффекта (effectKey/params/turnsRemain/permanent),
 * а поведение живёт здесь.
 */

/** @type {Record<string, {onApply?:Function, onTick?:Function, onExpire?:Function}>} */
export const effectHandlers = {
  poison: {
    onTick: (character, effect /*, matchState */) => {
      const dmg = Number(effect?.params?.damage ?? 100);
      character.currentHP = Math.max(0, (character.currentHP || 0) - dmg);
    },
    onExpire: (character /*, effect, matchState */) => {
      // иммунитет выдаём отдельным эффектом (без поведения)
      // Важно: добавление эффекта выполняет внешний код (effects.js addEffect) — здесь только возвращаем мету.
      // Поэтому эффекты, которые "порождают" другие эффекты, делаем через effectsManager (см. tickEffect()).
    },
  },

  poison_immunity: {
    // permanent: true обычно
  },

  agility_boost: {
    onApply: (character, effect) => {
      const amount = Number(effect?.params?.amount ?? 0);
      character.currentAgility = (character.currentAgility || 0) + amount;
    },
    onExpire: (character, effect) => {
      const amount = Number(effect?.params?.amount ?? 0);
      character.currentAgility = (character.currentAgility || 0) - amount;
    },
  },

  damage_boost: {
    onApply: (character, effect) => {
      const amount = Number(effect?.params?.amount ?? 0);
      character.currentDamage = (character.currentDamage || 0) + amount;
    },
    onExpire: (character, effect) => {
      const amount = Number(effect?.params?.amount ?? 0);
      character.currentDamage = (character.currentDamage || 0) - amount;
    },
  },

  shield: {
    onApply: (character, effect) => {
      const amount = Number(effect?.params?.amount ?? 0);
      character.currentHP = (character.currentHP || 0) + amount;
    },
    onExpire: (character, effect) => {
      const cap = Number(effect?.params?.capHP ?? effect?.params?.initialHP ?? character?.stats?.HP ?? Infinity);
      character.currentHP = Math.min(character.currentHP || 0, cap);
    },
  },

  mana_boost: {
    onApply: (character, effect) => {
      const amount = Number(effect?.params?.amount ?? 0);
      character.currentMana = (character.currentMana || 0) + amount;
    },
    onExpire: (character, effect) => {
      const cap = Number(effect?.params?.capMana ?? effect?.params?.initialMana ?? character?.stats?.Мана ?? Infinity);
      character.currentMana = Math.min(character.currentMana || 0, cap);
    },
  },

  vampirism: {
    onApply: (character, effect) => {
      const amount = Number(effect?.params?.amount ?? 0);
      character.advancedSettings = character.advancedSettings || {};
      character.advancedSettings.vampirism = (character.advancedSettings.vampirism || 0) + amount;
    },
    onExpire: (character, effect) => {
      const amount = Number(effect?.params?.amount ?? 0);
      character.advancedSettings = character.advancedSettings || {};
      character.advancedSettings.vampirism = (character.advancedSettings.vampirism || 0) - amount;
    },
  },

  silence: {
    onApply: (character /*, effect */) => {
      character.functions = character.functions || {};
      character.functions.abilityUsability = false;
    },
    onExpire: (character /*, effect */) => {
      // В legacy была проверка "есть ли ещё молчание". Здесь делаем мягко:
      // если других silence нет — возвращаем.
      const stillSilenced = (character.effects || []).some((e) => normalizeEffectKey(e.effectKey) === "silence" && e.turnsRemain > 0);
      if (!stillSilenced) {
        character.functions = character.functions || {};
        character.functions.abilityUsability = true;
      }
    },
  },
};

export function normalizeEffectKey(key) {
  return String(key || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_а-яё]/gi, "");
}

export function applyEffectOnApply(effect, character, matchState, log) {
  const key = normalizeEffectKey(effect?.effectKey);
  const h = effectHandlers[key];
  if (h?.onApply) {
    try {
      h.onApply(character, effect, matchState, log);
    } catch (e) {
      console.error("[effectRegistry] onApply failed", key, e);
    }
  }
}

export function tickEffect(effect, character, matchState, log, { addEffect } = {}) {
  const key = normalizeEffectKey(effect?.effectKey);
  const h = effectHandlers[key];

  // 1) onTick
  if (effect?.typeOfEffect === "each turn" && h?.onTick) {
    try {
      h.onTick(character, effect, matchState, log);
    } catch (e) {
      console.error("[effectRegistry] onTick failed", key, e);
    }
  }

  // 2) decrement duration (если не permanent)
  if (!effect?.permanent && typeof effect?.turnsRemain === "number") {
    effect.turnsRemain -= 1;
  }

  // 3) expire
  if (!effect?.permanent && typeof effect?.turnsRemain === "number" && effect.turnsRemain <= 0) {
    if (h?.onExpire) {
      try {
        h.onExpire(character, effect, matchState, log);
      } catch (e) {
        console.error("[effectRegistry] onExpire failed", key, e);
      }
    }

    // Специальные последствия, которые создают новые эффекты, делаем здесь (данными)
    if (key === "poison" && typeof addEffect === "function") {
      addEffect(character, {
        effectKey: "poison_immunity",
        name: "Иммунитет к яду",
        description: "Не может быть повторно отравлён этим облаком до конца игры",
        effectType: "positive",
        canCancel: false,
        permanent: true,
      }, matchState);
    }

    return { remove: true };
  }

  return { remove: false };
}


