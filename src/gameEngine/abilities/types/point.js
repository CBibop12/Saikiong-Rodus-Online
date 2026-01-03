import { startGlobalCooldownForCaster } from "../abilityManager";

export function applyPointAbility({ abilityObj, caster, matchState, selectedMap, addActionLog, teamTurn, pointDestination, charactersAtPoint }) {
  if (typeof abilityObj?.effect === "function") {
    abilityObj.effect(charactersAtPoint || [], {
      caster,
      matchState,
      selectedMap,
      addActionLog,
      teamTurn,
      pointDestination,
    });
  }
  matchState.teams[teamTurn].remain.actions -= 1;
  startGlobalCooldownForCaster(caster);
}


