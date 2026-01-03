import { applyZoneAbility } from "./types/zone";
import { applyBeamAbility } from "./types/beam";
import { applyPointAbility } from "./types/point";
import { applyTeleportAbility } from "./types/teleport";

/**
 * Реестр типов способностей -> менеджер применения.
 * Подготовка (prepare) живёт в prepareAbility (пока), а применение — здесь.
 * Дальше можно вынести и prepare в те же модули.
 */
export const abilityTypeManagers = {
  "Мгновенная область способности": { apply: applyZoneAbility },
  "Область с перемещением": { apply: applyZoneAbility },
  "Заряды по области": { apply: applyZoneAbility },
  "Размещение области с эффектом зоны": { apply: applyZoneAbility },

  "Луч": { apply: applyBeamAbility },
  "Луч с перемещением": { apply: applyBeamAbility },

  "Точка": { apply: applyPointAbility },

  "Телепортация": { apply: applyTeleportAbility },
};

export function getAbilityTypeManager(type) {
  return abilityTypeManagers[type] || null;
}


