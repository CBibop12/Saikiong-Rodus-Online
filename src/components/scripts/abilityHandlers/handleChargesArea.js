export const handleChargesArea = (character, ability, context) => {
  const { matchState, addActionLog } = context;

  const affectedCharacters = [];

  ["red", "blue"].forEach((team) => {
    matchState.teams[team].characters.forEach((ch) => {
      if (
        isInRange(
          character.position,
          ch.position,
          ability.stats.rangeOfObject,
          ability.stats.rangeShape
        )
      ) {
        affectedCharacters.push({ ch, amount: ability.stats.shotsAmount });
      }
    });
  });

  if (affectedCharacters.length) {
    ability.effectPerAttack(affectedCharacters);
    addActionLog(
      `${character.name} применяет способность "${
        ability.name
      }" по области, затронуты: ${affectedCharacters
        .map((ac) => ac.ch.name)
        .join(", ")}`
    );
  }

  function isInRange(center, target, range, shape) {
    const [x1, y1] = center.split("-").map(Number);
    const [x2, y2] = target.split("-").map(Number);
    const dx = Math.abs(x1 - x2);
    const dy = Math.abs(y1 - y2);

    if (shape === "romb") return dx + dy <= range;
    if (shape === "square") return dx <= range && dy <= range;
    if (shape === "cross")
      return (dx === 0 && dy <= range) || (dy === 0 && dx <= range);
    return false;
  }
};
