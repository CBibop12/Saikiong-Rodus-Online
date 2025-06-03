export const handleAreaPlacement = (character, ability, context) => {
  const { matchState, addActionLog, calculateZoneArea } = context;

  // Определяем координаты центра зоны (например, позиция персонажа или выбранная координата)
  const zoneCenter = character.position;

  // Рассчитываем зону (все клетки, входящие в область эффекта)
  const zoneCells = calculateZoneArea(
    zoneCenter,
    ability.stats.rangeOfObject,
    matchState.selectedMap.size
  );

  // Собираем всех персонажей, которые находятся в этой зоне
  const affectedCharacters = [];
  ["red", "blue"].forEach((team) => {
    matchState.teams[team].characters.forEach((ch) => {
      if (zoneCells.includes(ch.position)) {
        affectedCharacters.push(ch);
      }
    });
  });

  // Создаём объект зоны
  const newZone = {
    ...ability,
    coordinates: zoneCenter,
    zoneEffect: ability.zoneEffect,
    turnsRemain: ability.turnsRemain,
    putBy: character.name,
  };

  // Добавляем зону на карту
  context.addObjectOnMap(newZone);

  // Мгновенное применение эффекта зоны (если эффект зоны срабатывает мгновенно)
  if (newZone.zoneEffect) {
    newZone.zoneEffect(affectedCharacters);
    addActionLog(
      `${character.name} разместил зону "${
        ability.name
      }" на ${zoneCenter}, затронуты: ${affectedCharacters
        .map((ch) => ch.name)
        .join(", ")}`
    );
  }
};
