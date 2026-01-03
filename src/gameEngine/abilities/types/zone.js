import ZoneEffectsManager from "../../../components/scripts/zoneEffectsManager";
import { startGlobalCooldownForCaster } from "../abilityManager";

function averageCenter(selectionOverlay) {
  if (!selectionOverlay?.length) return null;
  let sumX = 0;
  let sumY = 0;
  selectionOverlay.forEach((cell) => {
    const [col, row] = cell.split("-").map(Number);
    sumX += col;
    sumY += row;
  });
  const cx = Math.round(sumX / selectionOverlay.length);
  const cy = Math.round(sumY / selectionOverlay.length);
  return `${cx}-${cy}`;
}

export function applyZoneAbility({
  abilityObj,
  caster,
  matchState,
  selectedMap,
  addActionLog,
  teamTurn,
  charactersInZone,
  selectionOverlay,
  chargesDistribution,
}) {
  const type = abilityObj?.type;

  if (type === "Заряды по области" && typeof abilityObj?.effectPerAttack === "function") {
    const preparedCharacters = (charactersInZone || [])
      .map((ch) => ({ ch, amount: chargesDistribution?.[ch.name] || 0 }))
      .filter((x) => x.amount > 0);
    abilityObj.effectPerAttack({ affectedCharacters: preparedCharacters, addActionLog });
  } else if (type === "Мгновенная область способности" && typeof abilityObj?.zoneEffect === "function") {
    abilityObj.zoneEffect(charactersInZone || []);
  } else if (type === "Область с перемещением" && typeof abilityObj?.zoneEffect === "function") {
    abilityObj.zoneEffect(charactersInZone || []);
    const center = averageCenter(selectionOverlay);
    if (center) {
      caster.position = center;
      addActionLog?.(`${caster.name} перемещается в центр области (${center})`);
    }
  }

  // Постоянная зона (размещение)
  if (type === "Размещение области с эффектом зоны" && typeof abilityObj?.turnsRemain === "number" && abilityObj.turnsRemain > 0) {
    if (!Array.isArray(matchState.zoneEffects)) matchState.zoneEffects = [];
    const zoneManager = new ZoneEffectsManager(matchState, selectedMap, addActionLog);
    const center = averageCenter(selectionOverlay) || caster.position;
    zoneManager.createZone({
      id: `zone_${Date.now()}`,
      name: abilityObj.name,
      affiliate: abilityObj.affiliate || "neutral",
      stats: abilityObj.stats || {},
      turnsRemain: abilityObj.turnsRemain,
      coordinates: abilityObj.coordinates,
      chase: abilityObj.chase,
      caster,
      center,
      handlerKey: abilityObj.handlerKey || null,
      params: abilityObj.params || null,
    });
  }

  matchState.teams[teamTurn].remain.actions -= 1;
  startGlobalCooldownForCaster(caster);
}


