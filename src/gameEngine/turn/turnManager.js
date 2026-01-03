/**
 * turnManager — единая точка завершения хода.
 * Здесь только доменная логика; UI очищается снаружи (ChatConsole).
 */

import EffectsManager from "../../components/scripts/effectsManager";
import ZoneEffectsManager from "../../components/scripts/zoneEffectsManager";

/**
 * @param {object} args
 * @param {object} args.matchState
 * @param {object} args.selectedMap
 * @param {Function} args.addActionLog
 * @param {string} args.teamTurn
 * @param {string} args.firstTeamToAct
 * @param {Function} args.updateCreeps optional async
 * @param {string} args.roomCode optional
 * @returns {{ nextTeam: "red"|"blue", isNewRoundStarting: boolean }}
 */
export async function endTurnEngine({
  matchState,
  selectedMap,
  addActionLog,
  teamTurn,
  firstTeamToAct,
  updateCreeps,
  roomCode,
}) {
  const nextTeam = teamTurn === "red" ? "blue" : "red";
  const isNewRoundStarting = nextTeam === firstTeamToAct;

  // 1) Эффекты персонажей/клеток
  const effectsManager = new EffectsManager(matchState, selectedMap, addActionLog);
  effectsManager.applyCharacterEffects(teamTurn);
  effectsManager.applyZoneEffects(matchState.churches, teamTurn);

  // 2) Зоны на карте (handlerKey/params)
  const zoneManager = new ZoneEffectsManager(matchState, selectedMap, addActionLog);
  try {
    zoneManager.applyZonesAtTurnEnd(teamTurn);
  } catch (e) {
    console.error("[TurnManager] applyZonesAtTurnEnd failed", e);
  }

  // 3) Новый раунд: КД/ресурсы/крипы
  if (isNewRoundStarting) {
    // cooldown abilities
    matchState.teams.red.characters.forEach((ch) => {
      (ch.abilities || []).forEach((ab) => {
        if (ab.currentCooldown > 0) ab.currentCooldown -= 1;
      });
      if (ch.labCooldown > 0) ch.labCooldown -= 1;
      if (ch.armoryCooldown > 0) ch.armoryCooldown -= 1;
    });
    matchState.teams.blue.characters.forEach((ch) => {
      (ch.abilities || []).forEach((ab) => {
        if (ab.currentCooldown > 0) ab.currentCooldown -= 1;
      });
      if (ch.labCooldown > 0) ch.labCooldown -= 1;
      if (ch.armoryCooldown > 0) ch.armoryCooldown -= 1;
    });

    matchState.teams.red.remain.moves = matchState.advancedSettings.movesPerTurn;
    matchState.teams.red.remain.actions = matchState.advancedSettings.actionsPerTurn;
    matchState.teams.blue.remain.moves = matchState.advancedSettings.movesPerTurn;
    matchState.teams.blue.remain.actions = matchState.advancedSettings.actionsPerTurn;
    matchState.turn += 1;

    if (matchState.turn >= 5 && typeof updateCreeps === "function") {
      try {
        await updateCreeps(roomCode);
      } catch (e) {
        // Крипы — вспомогательная логика; её 404/ошибки не должны ломать endTurn.
        console.error("[TurnManager] updateCreeps failed (ignored)", e);
        addActionLog?.(`(warn) Не удалось обновить крипов: ${e?.message || e}`, "system", "Крипы");
      }
    }

    addActionLog?.(`--- Ход ${matchState.turn} завершён ---`);
  }

  return { nextTeam, isNewRoundStarting };
}


