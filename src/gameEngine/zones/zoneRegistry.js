/**
 * zoneRegistry — реестр обработчиков зон по handlerKey.
 * Важно: функции живут здесь (в коде), а в matchState хранится только handlerKey + params.
 */

import { addEffect } from "../../effects";

/** @type {Record<string, Function>} */
export const zoneHandlers = {
  /**
   * Ядовитое облако: накладывает эффект "Яд" (и по окончании — иммунитет).
   * Сейчас реализовано через legacy addEffect (в следующем todo переведём на effectRegistry).
   */
  poison_potion: ({ character }) => {
    character.effects = character.effects || [];
    const hasImmunity = character.effects.some((e) => e.name === "Иммунитет к яду");
    const hasPoison = character.effects.some((e) => e.name === "Яд");
    if (hasImmunity || hasPoison) return;

    addEffect(character, {
      effectKey: "poison",
      name: "Яд",
      description: "Получает 100 урона каждый ход в течение 3 ходов",
      effectType: "negative",
      canCancel: false,
      typeOfEffect: "each turn",
      turnsRemain: 3,
      params: { damage: 100 },
    });
  },
};

export function applyZoneCharacterHandler(handlerKey, { character, matchState, zone, helpers, log }) {
  if (!handlerKey) return { ok: false, reason: "no_handlerKey" };
  const handler = zoneHandlers[handlerKey];
  if (typeof handler !== "function") {
    log?.(`Зона «${zone?.name || "?"}»: неизвестный handlerKey=${handlerKey}`, "system", "Зона");
    return { ok: false, reason: "unknown_handlerKey" };
  }
  try {
    handler({ character, matchState, zone, helpers, log });
    return { ok: true };
  } catch (e) {
    console.error("[zoneRegistry] handler failed", handlerKey, e);
    log?.(`Зона «${zone?.name || "?"}»: ошибка обработчика (${handlerKey})`, "error", "Зона");
    return { ok: false, reason: "handler_error", error: e };
  }
}


