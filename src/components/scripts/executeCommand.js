/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/rules-of-hooks */
/**
 * executeCommand — тонкий UI-адаптер: принимает команду и контекст из ChatConsole,
 * вызывает gameEngine handlers и, при необходимости, включает UI-режимы выбора целей.
 */

import { dispatchCommand } from "../../gameEngine/commands/dispatchCommand";
import { createCommandHandlers } from "../../gameEngine/commands/handlers";
import { abilities as abilitiesMap } from "../../abilities";

const handlers = createCommandHandlers();

export default function executeCommand(command, context) {
  // Прокидываем сервисы, которые живут в ChatConsole (геометрия/клетки и т.п.)
  const services = {
    calculateCellsForZone: context.calculateCellsForZone || null,
    calculateBeamCells: context.calculateBeamCells || null,
    calculateBeamCellsComb: context.calculateBeamCellsComb || null,
    calculateTeleportationCells: context.calculateTeleportationCells || null,
    calculatePointCells: context.calculatePointCells || null,
  };

  const ctx = { ...context, handlers, services, log: context.addActionLog };
  const res = dispatchCommand(command, ctx);

  // Специальный случай: useAbility возвращает prep, который надо развернуть в UI.
  if (command?.commandType === "useAbility" && res?.prep) {
    const prep = res.prep;
    if (prep.mode === "zone") {
      context.setZoneSelectionMode?.(true);
      context.setPendingZoneEffect?.(prep.pendingZoneEffect);
      context.setSelectionOverlay?.(prep.selectionOverlay || []);
      if (prep.logText) context.addActionLog?.(prep.logText);
    } else if (prep.mode === "beam") {
      context.setBeamSelectionMode?.(true);
      context.setPendingBeamEffect?.(prep.pendingBeamEffect);
      context.setBeamCells?.(prep.beamCells || []);
      if (prep.logText) context.addActionLog?.(prep.logText);
    } else if (prep.mode === "point") {
      context.setPointSelectionMode?.(true);
      context.setPendingPointEffect?.(prep.pendingPointEffect);
      // Для режима "Точка" UI ожидает массив pointCells (используется в calculateCastingAllowance через .includes()).
      // В новом движке prepareAbility не считает pointCells, поэтому считаем тут через сервис.
      const pending = prep.pendingPointEffect || {};
      const casterName = pending.casterName;
      const findCharacter = (name) => {
        const lower = String(name || "").toLowerCase();
        return (
          context.matchState?.teams?.red?.characters?.find((ch) => String(ch?.name || "").toLowerCase() === lower) ||
          context.matchState?.teams?.blue?.characters?.find((ch) => String(ch?.name || "").toLowerCase() === lower) ||
          null
        );
      };
      const caster = findCharacter(casterName);
      const range = typeof pending.distance === "number"
        ? pending.distance
        : typeof pending.coordinates === "number"
          ? pending.coordinates
          : typeof abilitiesMap[pending.spellKey]?.distance === "number"
            ? abilitiesMap[pending.spellKey].distance
            : 1;
      const canGoThroughWalls = !!pending.canGoThroughWalls;

      if (caster?.position && typeof context.calculatePointCells === "function") {
        (async () => {
          try {
            const cells = await context.calculatePointCells(caster.position, range, context.selectedMap?.size, canGoThroughWalls);
            context.setPointCells?.(Array.isArray(cells) ? cells : []);
          } catch (e) {
            console.error("[executeCommand][prep point] calculatePointCells failed", e);
            context.setPointCells?.([]);
          }
        })();
      } else {
        context.setPointCells?.([]);
      }
      if (prep.logText) context.addActionLog?.(prep.logText);
    } else if (prep.mode === "teleport") {
      context.setTeleportationMode?.(true);
      context.setPendingTeleportation?.(prep.pendingTeleportation);
      context.setTeleportationCells?.(prep.teleportationCells || []);
      if (prep.logText) context.addActionLog?.(prep.logText);
    } else if (prep.logText) {
      context.addActionLog?.(prep.logText);
    }
  }

  return res;
}


