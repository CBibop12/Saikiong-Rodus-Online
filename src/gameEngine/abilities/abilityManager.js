/**
 * AbilityManager — helpers для подготовки/применения способностей без хранения функций в state/UI.
 * Само поведение способности остаётся в `abilities.js` (это уже и есть "registry").
 */

export function startGlobalCooldownForCaster(caster) {
  if (!caster?.abilities || !Array.isArray(caster.abilities)) return;
  caster.abilities.forEach((ab) => {
    ab.currentCooldown = ab.coolDown || 0;
  });
}

/**
 * Подготовка способности к применению.
 * Возвращает либо описание UI-режима выбора (zone/beam/point/teleport),
 * либо immediate-инструкцию (выполняется сразу без UI).
 */
export function prepareAbility({
  spellKey,
  caster,
  abilityObj,
  matchState,
  selectedMap,
  services,
  addActionLog,
}) {
  const type = abilityObj?.type || "";
  const base = {
    spellKey,
    casterName: caster?.name,
    type,
    name: abilityObj?.name,
    stats: abilityObj?.stats || {},
    affiliate: abilityObj?.affiliate,
    coordinates: abilityObj?.coordinates,
    distance: abilityObj?.distance,
    turnsRemain: abilityObj?.turnsRemain,
    chase: abilityObj?.chase,
    handlerKey: abilityObj?.handlerKey || null,
    params: abilityObj?.params || null,
    canGoThroughWalls: abilityObj?.canGoThroughWalls || false,
  };

  switch (type) {
    case "Мгновенная область способности":
      return {
        mode: "zone",
        pendingZoneEffect: { ...base, isChargeArea: false },
        selectionOverlay: services.calculateCellsForZone(
          caster.position,
          abilityObj.stats?.rangeOfObject,
          selectedMap.size
        ),
        logText: `${caster.name} готовит "Мгновенную область способности" (${abilityObj.name}). Выберите зону, а затем нажмите подтвердить.`,
      };

    case "Область с перемещением":
      return {
        mode: "zone",
        pendingZoneEffect: { ...base, isChargeArea: false },
        selectionOverlay: services.calculateCellsForZone(
          caster.position,
          abilityObj.stats?.rangeOfObject,
          selectedMap.size
        ),
        logText: `${caster.name} готовит "Область с перемещением" (${abilityObj.name}). Выберите зону, а затем нажмите подтвердить.`,
      };

    case "Заряды по области":
      return {
        mode: "zone",
        pendingZoneEffect: { ...base, isChargeArea: true },
        selectionOverlay: services.calculateCellsForZone(
          caster.position,
          abilityObj.stats?.rangeOfObject,
          selectedMap.size
        ),
        logText: `${caster.name} готовит "Заряды по области" (${abilityObj.name}). Выберите зону, а затем распределите заряды.`,
      };

    case "Луч": {
      const [x, y] = caster.position.split("-").map(Number);
      return {
        mode: "beam",
        pendingBeamEffect: { ...base },
        beamCells: services.calculateBeamCells(
          caster.position,
          `${x}-${y - 1}`,
          selectedMap.size,
          abilityObj.coordinates,
          abilityObj.stats?.beamWidth || 1,
          abilityObj.canGoThroughWalls || false
        ),
        logText: `${caster.name} готовит способность "${abilityObj.name}" (Луч). Выберите направление луча.`,
      };
    }

    case "Луч с перемещением": {
      const [x, y] = caster.position.split("-").map(Number);
      return {
        mode: "beam",
        pendingBeamEffect: { ...base },
        beamCells: services.calculateBeamCellsComb(
          caster.position,
          `${x}-${y - 1}`,
          selectedMap.size,
          abilityObj.coordinates,
          abilityObj.stats?.beamWidth || 1,
          abilityObj.canGoThroughWalls || false
        ),
        logText: `${caster.name} готовит способность "${abilityObj.name}" (Луч с перемещением). Выберите направление луча.`,
      };
    }

    case "Точка":
      return {
        mode: "point",
        pendingPointEffect: { ...base },
        logText: `${caster.name} готовит способность "${abilityObj.name}" (Точка). Выберите клетку.`,
      };

    case "Телепортация":
      return {
        mode: "teleport",
        pendingTeleportation: { ...base },
        teleportationCells: services.calculateTeleportationCells(
          caster.position,
          abilityObj.distance,
          selectedMap.size
        ),
        logText: `${caster.name} выбирает клетку для телепортации (${abilityObj.name}).`,
      };

    // immediate
    case "Эффект на себя":
      return {
        mode: "immediate",
        execute: () => {
          if (typeof abilityObj.effect === "function") {
            abilityObj.effect(caster);
            addActionLog?.(`${caster.name} применяет эффект на себя ("${abilityObj.name}").`);
          } else {
            addActionLog?.(`${caster.name} использует "${abilityObj.name}" (нет функции effect).`);
          }
          matchState.teams[caster.team].remain.actions -= 1;
          startGlobalCooldownForCaster(caster);
        },
      };

    default:
      return {
        mode: "unknown",
        logText: `${caster.name} использует способность "${abilityObj?.name}" (тип: ${type}), логика не описана.`,
      };
  }
}



