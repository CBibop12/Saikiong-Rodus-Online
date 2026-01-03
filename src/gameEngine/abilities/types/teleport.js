import { startGlobalCooldownForCaster } from "../abilityManager";

export function applyTeleportAbility({ abilityObj, caster, matchState, addActionLog, teamTurn, targetCoord }) {
  caster.position = targetCoord;
  matchState.teams[teamTurn].remain.actions -= 1;
  addActionLog?.(`${caster.name} телепортируется на ${targetCoord}`);
  startGlobalCooldownForCaster(caster);
}


