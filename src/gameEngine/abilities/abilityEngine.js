import { abilities as abilitiesMap } from "../../abilities";
import { findCharacter } from "../state/characterStore";
import { getAbilityTypeManager } from "./abilityTypeRegistry";

/**
 * Единая точка применения способности после выбора цели в UI.
 * UI передаёт selection (charactersInZone/beamCells/pointDestination/targetCoord/...)
 * а движок:
 * - резолвит abilityObj по spellKey
 * - резолвит кастера по casterName
 * - вызывает менеджер по type
 * - ставит global cooldown, списывает action (внутри type manager)
 * - пишет action в matchState.actions
 */
export function applyAbilitySelection({
  spellKey,
  casterName,
  matchState,
  selectedMap,
  addActionLog,
  teamTurn,
  selection,
}) {
  const abilityObj = abilitiesMap[spellKey];
  if (!abilityObj) return { ok: false, error: "ability_not_found" };
  const caster = findCharacter(casterName, matchState);
  if (!caster) return { ok: false, error: "caster_not_found" };

  const mgr = getAbilityTypeManager(abilityObj.type);
  if (!mgr?.apply) {
    addActionLog?.(`${casterName} использует способность "${abilityObj.name}" (тип: ${abilityObj.type}), логика не описана.`, "system", "Способность");
    return { ok: false, error: "ability_type_not_supported" };
  }

  mgr.apply({
    abilityObj,
    caster,
    matchState,
    selectedMap,
    addActionLog,
    teamTurn,
    ...selection,
  });

  matchState.actions = matchState.actions || [];
  matchState.actions.push({
    type: "ability",
    character: caster.name,
    abilityKey: abilityObj.name,
    turn: matchState.turn,
    timestamp: new Date().toISOString(),
  });

  return { ok: true };
}


