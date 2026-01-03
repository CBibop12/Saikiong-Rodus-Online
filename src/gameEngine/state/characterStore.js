/**
 * characterStore — утилиты для поиска сущностей в matchState.
 * Должны быть чистыми и детерминированными.
 */

export function findCharacter(name, matchState) {
  const lower = String(name || "").toLowerCase();
  const teams = matchState?.teams;
  if (!teams) return null;

  return (
    teams.red?.characters?.find((ch) => String(ch?.name || "").toLowerCase() === lower) ||
    teams.blue?.characters?.find((ch) => String(ch?.name || "").toLowerCase() === lower) ||
    null
  );
}

export function getTeamKeyByCharacterName(name, matchState) {
  const ch = findCharacter(name, matchState);
  return ch?.team || null;
}

export function findBuildingById(buildingId, matchState) {
  const id = String(buildingId || "");
  const list = matchState?.objectsOnMap || [];
  return list.find((o) => String(o?.id || "") === id) || null;
}


