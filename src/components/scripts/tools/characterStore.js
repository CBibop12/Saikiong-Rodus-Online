import { stringFromCoord } from "./mapStore";

export const findCharacter = (name, matchState) => {
  if (!matchState || !matchState.teams) return null;

  const lowerName = name.toLowerCase();
  return (
    matchState.teams.red.characters.find(
      (ch) => ch.name.toLowerCase() === lowerName
    ) ||
    matchState.teams.blue.characters.find(
      (ch) => ch.name.toLowerCase() === lowerName
    )
  );
};

export const findCharacterByPosition = (coords, matchState) => {
  if (!matchState || !matchState.teams) return null;

  let coordToSearch = typeof coords !== "string" ? stringFromCoord(coords) : coords
  return (
    matchState.teams.red.characters.find(
      (ch) => ch.position === coordToSearch
    ) ||
    matchState.teams.blue.characters.find(
      (ch) => ch.position === coordToSearch
    )
  );
};