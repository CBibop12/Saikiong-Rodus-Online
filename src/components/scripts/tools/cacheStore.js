// Простой модуль кэша для клиентских расчётов
// Ключи строятся детерминированно, чтобы сбрасываться при изменении позиции/параметров

const movementCache = new Map();
const attackCache = new Map();
const nearStoreCache = new Map();

const safe = (val) => (val == null ? "" : String(val));

export const makeMapSignature = (selectedMap) => {
    if (!selectedMap) return "no-map";
    const name = safe(selectedMap.name);
    const size = Array.isArray(selectedMap.size) ? selectedMap.size.join("x") : safe(selectedMap.size);
    return `${name}:${size}`;
};

export const makeTeamsSignature = (matchState) => {
    if (!matchState || !matchState.teams) return "no-teams";
    const red = matchState.teams.red?.characters?.length || 0;
    const blue = matchState.teams.blue?.characters?.length || 0;
    // Включаем номер хода для естественного сброса по времени
    const turn = matchState.turn ?? "?";
    return `r${red}-b${blue}-t${turn}`;
};

export const makeObjectsSignature = (matchState) => {
    if (!matchState || !matchState.objectsOnMap) return "no-objects";
    return String(matchState.objectsOnMap.length);
};

export const makeMovementKey = ({ characterName, position, range, mapSig, teamsSig, objectsSig }) => {
    return `move|${safe(characterName)}|${safe(position)}|${safe(range)}|${safe(mapSig)}|${safe(teamsSig)}|${safe(objectsSig)}`;
};

export const makeAttackKey = ({ characterName, position, range, mapSig, teamsSig, objectsSig }) => {
    return `attack|${safe(characterName)}|${safe(position)}|${safe(range)}|${safe(mapSig)}|${safe(teamsSig)}|${safe(objectsSig)}`;
};

export const makeNearStoreKey = ({ characterName, position, mapSig }) => {
    return `nearStore|${safe(characterName)}|${safe(position)}|${safe(mapSig)}`;
};

export const getMovementFromCache = (key) => movementCache.get(key);
export const setMovementInCache = (key, value) => movementCache.set(key, value);

export const getAttackFromCache = (key) => attackCache.get(key);
export const setAttackInCache = (key, value) => attackCache.set(key, value);

export const getNearStoreFromCache = (key) => nearStoreCache.get(key);
export const setNearStoreInCache = (key, value) => nearStoreCache.set(key, value);


