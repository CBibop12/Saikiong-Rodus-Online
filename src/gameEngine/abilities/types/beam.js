import { startGlobalCooldownForCaster } from "../abilityManager";

function moveCasterAfterBeam({ caster, beamCells, selectedMap, matchState }) {
  if (!beamCells?.length) return null;
  const [casterCol, casterRow] = caster.position.split("-").map(Number);
  const [firstBeamCol, firstBeamRow] = beamCells[0].split("-").map(Number);
  const dirX = firstBeamCol > casterCol ? 1 : firstBeamCol < casterCol ? -1 : 0;
  const dirY = firstBeamRow > casterRow ? 1 : firstBeamRow < casterRow ? -1 : 0;

  let maxDistance = 0;
  let endPosition = null;

  beamCells.forEach((cell) => {
    const [cellCol, cellRow] = cell.split("-").map(Number);
    const isOnCentralLine =
      (dirX === 0 && cellCol === casterCol) ||
      (dirY === 0 && cellRow === casterRow) ||
      (Math.abs(cellCol - casterCol) === Math.abs(cellRow - casterRow) &&
        Math.sign(cellCol - casterCol) === dirX &&
        Math.sign(cellRow - casterRow) === dirY);
    if (!isOnCentralLine) return;
    const distance = Math.max(Math.abs(cellCol - casterCol), Math.abs(cellRow - casterRow));
    if (distance > maxDistance) {
      maxDistance = distance;
      endPosition = cell;
    }
  });

  if (!endPosition) return null;

  let targetPosition = endPosition;
  const isOccupied = (coord) =>
    ["red", "blue"].some((team) =>
      matchState.teams[team].characters.some((ch) => ch.position === coord && ch.currentHP > 0)
    );

  if (isOccupied(targetPosition)) {
    const [endCol, endRow] = endPosition.split("-").map(Number);
    const adjacentCells = [
      `${endCol + 1}-${endRow}`,
      `${endCol - 1}-${endRow}`,
      `${endCol}-${endRow + 1}`,
      `${endCol}-${endRow - 1}`,
      `${endCol + 1}-${endRow + 1}`,
      `${endCol - 1}-${endRow - 1}`,
      `${endCol + 1}-${endRow - 1}`,
      `${endCol - 1}-${endRow + 1}`,
    ];
    const validCells = adjacentCells.filter((cell) => {
      const [col, row] = cell.split("-").map(Number);
      return col >= 1 && col <= selectedMap.size[0] && row >= 1 && row <= selectedMap.size[1];
    });
    const freeCells = validCells.filter((cell) => !isOccupied(cell));
    if (freeCells.length > 0) {
      targetPosition = freeCells[Math.floor(Math.random() * freeCells.length)];
    }
  }

  caster.position = targetPosition;
  return targetPosition;
}

export function applyBeamAbility({ abilityObj, caster, matchState, selectedMap, addActionLog, teamTurn, beamCells, charactersInZone }) {
  if (typeof abilityObj?.beamEffect === "function") {
    abilityObj.beamEffect(charactersInZone, {
      caster,
      beamCells,
      matchState,
      selectedMap,
      addActionLog,
      teamTurn,
    });
  }

  if (abilityObj?.type === "Луч с перемещением") {
    const movedTo = moveCasterAfterBeam({ caster, beamCells, selectedMap, matchState });
    if (movedTo) addActionLog?.(`${caster.name} перемещается на ${movedTo} после применения луча.`);
  }

  matchState.teams[teamTurn].remain.actions -= 1;
  startGlobalCooldownForCaster(caster);
}


