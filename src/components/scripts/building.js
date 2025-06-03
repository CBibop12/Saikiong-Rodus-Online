import { generateId } from "../../effects";

export function addBuilding(matchState, buildingObj) {
    matchState.objectsOnMap.push({...buildingObj, id: generateId()});
    return buildingObj;
}

export function removeBuilding(remover = null, matchState, id) {
    if (!matchState.objectsOnMap.length) return;
    let buildingIndex = matchState.objectsOnMap.findIndex(building => building.id === id)
    if (remover && matchState.objectsOnMap[buildingIndex].onDestroy) {
        matchState.objectsOnMap[buildingIndex].onDestroy(matchState, remover)
    }
    console.log("Deleting object", matchState.objectsOnMap[buildingIndex]);
    matchState.objectsOnMap.splice(buildingIndex, 1)
    console.log(matchState.objectsOnMap.findIndex(object => object.id === id));
}

export function build(
    character = null,
    matchState, 
    {
        position,
        affiliate = "neutral",
        image,
        initial,
        name = "Постройка",
        description = "Конструкция былых времен",
        type = "building",
        stats = {
            HP: 0,
            Урон: 0,
            Мана: 0,
            Ловкость: 0,
            Броня: 0,
            Дальность: 0,
          },
        currentHP = 0,
        currentMana = 0,
        currentDamage = 0,
        currentAgility = 0,
        currentArmor = 0,
        currentRange = 0,
        onBuild = () => {},
        onFinishTurn = () => {},
        onCharactersInZone = () => {},
        onHit = () => {},
        onDestroy = () => {},
      } = {}
) {
    if (matchState && character && onBuild) {
        onBuild(character, matchState)
    }
    addBuilding(matchState, {
        position,
        affiliate,
        initial,
        name,
        image,
        description,
        type,
        stats,
        currentHP,
        currentMana,
        currentDamage,
        currentAgility,
        currentArmor,
        currentRange,
        onBuild,
        onFinishTurn,
        onCharactersInZone,
        onHit,
        onDestroy,
      })
    console.log("Построили", {
        position,
        affiliate,
        initial,
        name,
        image,
        description,
        type,
        stats,
        currentHP,
        currentMana,
        currentDamage,
        currentAgility,
        currentArmor,
        currentRange,
        onBuild,
        onFinishTurn,
        onCharactersInZone,
        onHit,
        onDestroy,
      });
}

export function startingWalls(
    positions, matchState
) {
    for (let position of positions) {
        build(null, matchState, {
            position,
            image: "wall.png",
            initial: "wall",
            name: "Стена",
            description: "Оборонная конструкция былых времен",
            stats: {
                HP: 750
            },
            currentHP: 750,
        })
    }
}