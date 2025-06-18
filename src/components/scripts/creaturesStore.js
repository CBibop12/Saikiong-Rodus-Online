// creaturesStore.js – логика нейтральных существ (крипов)
// Экспортируются функции для спавна, хода и жизненного цикла крипов.

import { generateId } from "./tools/simplifierStore";
import {
    splitCoord,
    stringFromCoord,
    cellHasType,
    objectOnCell,
} from "./tools/mapStore";
import { findCharacterByPosition } from "./tools/characterStore";
import { attack } from "./attack";

// Базовые характеристики крипа
const CREEP_BASE_STATS = {
    HP: 200,
    Damage: 100,
    Mana: 0,
    Agility: 5, // количество шагов за ход
    Armor: 1,
    Range: 2,
    damageType: "физический",
};

// Возвращает массив координат спавнов крипов
function getSpawnPoints(selectedMap) {
    const points = [];
    for (let r = 0; r < selectedMap.map.length; r++) {
        for (let c = 0; c < selectedMap.map[r].length; c++) {
            if (selectedMap.map[r][c].initial === "mob spawnpoint") {
                points.push(stringFromCoord([c, r]));
            }
        }
    }
    return points;
}

// Спавним крипов на всех точках, возвращаем массив созданных объектов
export function spawnCreeps(matchState, selectedMap) {
    const points = getSpawnPoints(selectedMap);
    const creeps = [];
    for (const coord of points) {
        const creepObj = {
            id: generateId(),
            type: "building", // чтобы существующая логика атаки работала
            isCreep: true,
            name: "Крип",
            image: "creep.png", // ожидается наличие этого файла, иначе отображение по умолчанию
            description: "Нейтральное существо поля битвы.",
            position: coord,
            spawnPoint: coord,
            bounty: 100,
            stats: {
                HP: CREEP_BASE_STATS.HP,
                Урон: CREEP_BASE_STATS.Damage,
                Мана: CREEP_BASE_STATS.Mana,
                Ловкость: CREEP_BASE_STATS.Agility,
                Броня: CREEP_BASE_STATS.Armor,
                Дальность: CREEP_BASE_STATS.Range,
            },
            currentHP: CREEP_BASE_STATS.HP,
            currentDamage: CREEP_BASE_STATS.Damage,
            currentMana: CREEP_BASE_STATS.Mana,
            currentAgility: CREEP_BASE_STATS.Agility,
            currentArmor: CREEP_BASE_STATS.Armor,
            currentRange: CREEP_BASE_STATS.Range,
        };
        matchState.objectsOnMap.push(creepObj);
        creeps.push(creepObj);
    }
    return creeps;
}

// Проверка, является ли объект крипом
function isCreep(obj) {
    return obj && obj.isCreep;
}

// Манхэттенское расстояние
function manhattan(a, b) {
    const [ax, ay] = splitCoord(a);
    const [bx, by] = splitCoord(b);
    return Math.abs(ax - bx) + Math.abs(ay - by);
}

// Возвращает соседние клетки (вверх/вниз/лево/право) в формате "x-y"
function adjacentCells(coord, mapSize) {
    // Преобразуем в 0-индекс для работы с массивом карты
    const [x, y] = splitCoord(coord, 1);
    const dirs = [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
    ];
    const cells = [];
    for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < mapSize[0] && ny >= 0 && ny < mapSize[1]) {
            cells.push(stringFromCoord([nx, ny], 1));
        }
    }
    return cells;
}

// Проверяет, свободна ли клетка для перемещения
function isCellFree(cell, matchState, selectedMap) {
    // Нельзя входить в непроходимые клетки
    if (!cell) return false;
    if (cellHasType([
        "wall",
        "red base",
        "blue base",
        "magic shop",
        "armory",
        "laboratory",
    ], cell, selectedMap)) return false;
    // персонажи
    if (findCharacterByPosition(cell, matchState)) return false;
    // другие объекты/постройки/крипы
    if (objectOnCell(cell, matchState)) return false;
    return true;
}

// BFS-поиск следующего шага к цели с учётом препятствий
function nextStepTowards(start, target, matchState, selectedMap) {
    if (start === target) return start;
    const queue = [start];
    const visited = new Set([start]);
    const parent = new Map();

    while (queue.length) {
        const current = queue.shift();
        const neighbors = adjacentCells(current, selectedMap.size).filter(c => isCellFree(c, matchState, selectedMap));
        for (const n of neighbors) {
            if (visited.has(n)) continue;
            visited.add(n);
            parent.set(n, current);
            if (n === target) {
                // восстановить путь: идём от target к start пока не дойдём до соседа start
                let step = n;
                while (parent.get(step) !== start) {
                    step = parent.get(step);
                }
                return step;
            }
            queue.push(n);
        }
    }
    // пути нет – стоим на месте
    return start;
}

// Жадный выбор ближайшей соседней клетки, если путь не найден BFS
function stepTowards(creep, targetCoord, matchState, selectedMap) {
    const bfsStep = nextStepTowards(creep.position, targetCoord, matchState, selectedMap);
    if (bfsStep !== creep.position) return bfsStep;

    const neigh = adjacentCells(creep.position, selectedMap.size).filter(c => isCellFree(c, matchState, selectedMap));
    let best = creep.position;
    let bestDist = manhattan(creep.position, targetCoord);
    neigh.forEach(c => {
        const d = manhattan(c, targetCoord);
        if (d < bestDist) {
            bestDist = d;
            best = c;
        }
    });
    return best;
}

// Выбираем противника для крипа
function selectTarget(creep, matchState) {
    const enemies = [];
    ["red", "blue"].forEach(team => {
        matchState.teams[team].characters.forEach(ch => {
            if (ch.currentHP > 0) {
                const dist = manhattan(creep.position, ch.position);
                if (dist <= 5) {
                    enemies.push({ ch, dist });
                }
            }
        });
    });
    if (!enemies.length) return null;
    // Сортировка: ближайший, затем меньше HP
    enemies.sort((a, b) => {
        if (a.dist !== b.dist) return a.dist - b.dist;
        if (a.ch.currentHP !== b.ch.currentHP) return a.ch.currentHP - b.ch.currentHP;
        return Math.random() - 0.5;
    });
    return enemies[0].ch;
}

// Делаем до maxSteps шагов к цели
function moveCreep(creep, targetCoord, matchState, selectedMap) {
    const maxSteps = Math.max(1, creep.currentAgility || 0);
    for (let i = 0; i < maxSteps; i++) {
        const next = stepTowards(creep, targetCoord, matchState, selectedMap);
        console.log("Creep", creep.id, "step", i + 1, "from", creep.position, "to", next, "target", targetCoord);
        if (next === creep.position) break; // дальше некуда
        creep.position = next;
    }
}

// Выполняет ход одного крипа (изменяет matchState)
function creepTakeTurn(creep, matchState, selectedMap, addActionLog) {
    if (creep.currentHP <= 0) return; // мёртв

    const target = selectTarget(creep, matchState);
    const distToSpawn = manhattan(creep.position, creep.spawnPoint);

    if (target && distToSpawn <= 10) {
        const distToTarget = manhattan(creep.position, target.position);
        if (distToTarget <= creep.currentRange) {
            // атака
            attack({ caster: creep }, "neutral", [target], creep.currentDamage, CREEP_BASE_STATS.damageType);
            addActionLog && addActionLog(`${creep.name} атакует ${target.name} на ${creep.currentDamage} урона`);
        } else {
            // двигаемся на 1 клетку
            moveCreep(creep, target.position, matchState, selectedMap);
            if (manhattan(creep.position, target.position) <= creep.currentRange) {
                // атака
                attack({ caster: creep }, "neutral", [target], creep.currentDamage, CREEP_BASE_STATS.damageType);
                addActionLog && addActionLog(`${creep.name} атакует ${target.name} на ${creep.currentDamage} урона`);
            }
        }
    } else {
        // Возвращаемся к спавну
        if (creep.position !== creep.spawnPoint) {
            moveCreep(creep, creep.spawnPoint, matchState, selectedMap);
        }
    }
}

// Удаляет всех крипов
function removeAllCreeps(matchState) {
    matchState.objectsOnMap = matchState.objectsOnMap.filter(obj => !isCreep(obj));
}

// Главная экспортируемая функция – вызывается каждый новый раунд
export function updateCreeps(matchState, selectedMap, addActionLog) {
    // 1. Проверяем, нужно ли перерождать крипов (каждые 5 ходов)
    if (matchState.turn % 5 === 0) {
        removeAllCreeps(matchState);
        spawnCreeps(matchState, selectedMap);
        addActionLog && addActionLog("Крипы возродились на точках спавна");
    }

    // 2. Совершаем ход каждым крипом
    matchState.objectsOnMap
        .filter(obj => isCreep(obj))
        .forEach(creep => creepTakeTurn(creep, matchState, selectedMap, addActionLog));
} 