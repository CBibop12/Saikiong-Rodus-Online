import { findCharacterByPosition } from "./characterStore";
import { maps } from "../../../maps";

export const normalizeCoordToArray = (coord) => {
    if (typeof coord === "string") {
        let [x, y] = splitCoord(coord)
        return [x - 1, y - 1]
    }
    else if (typeof coord === "object") {
        if (coord === null) return coord;
        if (Array.isArray(coord)) return coord;
        if ("x" in coord && "y" in coord) return [coord.x, coord.y];
    }
    return coord;
}

export const getMapObjectByName = (name) => {
  return maps.find(m => m.name === name)
}

export const splitCoord = (coord, minus = 0) => {
    return coord.split("-").map(num => Number(num) - minus)
}

export const stringFromCoord = (coord, add = 1) => {
    let normalizedCoord = normalizeCoordToArray(coord)
    return `${normalizedCoord[0] + add}-${normalizedCoord[1] + add}`
}

export const initialOfCell = (coords, selectedMap) => {
    let normalizedCoord = normalizeCoordToArray(coords)
    return selectedMap.map[normalizedCoord[1]][normalizedCoord[0]].initial
}

export const allCellType = (type, selectedMap, response = "object", add = 0) => {
    let arr = []
    for (let y = 0; y < selectedMap.map.length; y++) {
        for (let x = 0; x < selectedMap.map[y].length; x++) {
            if (selectedMap.map[y][x].initial === type) {
                if (response === "object") {
                    arr.push({ x: x + add, y: y + add });
                }
                else if (response === "string") {
                    arr.push(stringFromCoord([x, y]));
                }
            }
        }
    }
    return arr;
}

export const cellHasType = (type, cellCoord, selectedMap) => {
    let coord = normalizeCoordToArray(cellCoord)
    let types = Array.isArray(type) ? [...type] : [type]
    return types.includes(selectedMap.map[coord[1]][coord[0]].initial)
}

export const objectOnCell = (cellCoord, matchState, type = "") => {
    let normalizedCoord = normalizeCoordToArray(cellCoord)
    return matchState.objectsOnMap.find((obj) => obj.position === stringFromCoord(normalizedCoord, 1) && obj.type.includes(type))
}

export const calculateCellsZone = (startCoord, range, matchState, mapSize, selectedMap, forbiddenTypes = [], canGoThroughCharacters = false, canGoThroughObjects = false, teleportGoThrough = false) => {
    let [startCol, startRow] = normalizeCoordToArray(startCoord);
    const reachableTeleports = []
    const cols = mapSize[0],
      rows = mapSize[1];

    const costGrid = Array.from({ length: rows }, () =>
      Array(cols).fill(Infinity)
    );

    const canEnter = (r, c) => {
      if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
      if (
        cellHasType(forbiddenTypes, [c, r], selectedMap)
      ) {
        return false;
      }
      if (!canGoThroughCharacters && findCharacterByPosition(stringFromCoord([c, r], 1), matchState)) {
        return false;
      }
      if (!canGoThroughObjects && objectOnCell(stringFromCoord([c, r], 1), matchState)) {
        return false;
      }
      return true;
    };

    // Очередь для обхода клеток (используется BFS)
    const queue = [];

    costGrid[startRow][startCol] = 0;
    queue.push({ row: startRow, col: startCol, cost: 0 });

    // Возможные направления перемещения (вверх, вправо, вниз, влево)
    const directions = [
      { dr: -1, dc: 0 },
      { dr: 0, dc: 1 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
    ];

    // Обход клеток с накоплением затрат
    while (queue.length) {
      const { row, col, cost } = queue.shift();
      const cell = selectedMap.map[row][col];
      // Если текущая стоимость достигла лимита перемещения, дальнейший обход прекращается
      if (cost >= range) continue;

      if (cellHasType(["red portal", "blue portal"], [col, row], selectedMap)) {
        let doesExist = reachableTeleports.find(tp => tp.affiliate === (cell.initial === "red portal" ? "red" : "blue") && tp.coordinates === `${col + 1}-${row + 1}`)
        if (!doesExist) reachableTeleports.push({ affiliate: cell.initial === "red portal" ? "red" : "blue", coordinates: stringFromCoord([col, row]), distanceLeft: range - cost })
      }
      // Стоимость выхода из текущей клетки (учитываем тип клетки: bush – стоимость 2, иначе 1)
      const exitCost = selectedMap.map[row][col].initial === "bush" ? 2 : 1;

      // Проверяем соседние клетки
      for (const { dr, dc } of directions) {
        const newRow = row + dr;
        const newCol = col + dc;

        // Если клетку нельзя посетить, переходим к следующей
        if (!canEnter(newRow, newCol)) continue;

        const newCost = cost + exitCost;
        if (newCost <= range && newCost < costGrid[newRow][newCol]) {
          costGrid[newRow][newCol] = newCost;
          queue.push({ row: newRow, col: newCol, cost: newCost });
        }
      }
    }

    // Собираем координаты клеток, до которых можно добраться
    const reachable = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (costGrid[r][c] <= range) {
          reachable.push(stringFromCoord([c, r]));
        }
      }
    }

    if (reachableTeleports.length > 0 && teleportGoThrough) {
      for (let tp of reachableTeleports) {
        let portalPair = []
        let anotherPortal

        if (tp.affiliate === "red") {
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              if (selectedMap.map[r][c].initial === "red portal" && stringFromCoord([c, r]) != tp.coordinates) {
                portalPair.push({ coordinates: stringFromCoord([c, r]), affiliate: "red", distanceLeft: tp.distanceLeft })
              }
            }
          }
          anotherPortal = portalPair.find(portal => portal.coordinates != tp.coordinates)
        }
        else {
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              if (selectedMap.map[r][c].initial === "blue portal" && stringFromCoord([c, r]) != tp.coordinates) {
                portalPair.push({ coordinates: stringFromCoord([c, r]), affiliate: "blue", distanceLeft: tp.distanceLeft })
              }
            }
          }
          anotherPortal = portalPair.find(portal => portal.coordinates != tp.coordinates)
        }

        let [startC, startR] = splitCoord(anotherPortal.coordinates, 1);
        const queue = [];
        costGrid[startR][startC] = 0;
        queue.push({ row: startR, col: startC, cost: 0 });

        // Возможные направления перемещения (вверх, вправо, вниз, влево)
        const directions = [
          { dr: -1, dc: 0 },
          { dr: 0, dc: 1 },
          { dr: 1, dc: 0 },
          { dr: 0, dc: -1 },
        ];
        // Обход клеток с накоплением затрат
        while (queue.length) {
          const { row, col, cost } = queue.shift();
          // Если текущая стоимость достигла лимита перемещения, дальнейший обход прекращается
          if (cost >= anotherPortal.distanceLeft) continue;
          // Стоимость выхода из текущей клетки (учитываем тип клетки: bush – стоимость 2, иначе 1)
          const exitCost = selectedMap.map[row][col].initial === "bush" ? 2 : 1;

          // Проверяем соседние клетки
          for (const { dr, dc } of directions) {
            const newRow = row + dr;
            const newCol = col + dc;

            // Если клетку нельзя посетить, переходим к следующей
            if (!canEnter(newRow, newCol)) continue;

            const newCost = cost + exitCost;
            if (newCost <= anotherPortal.distanceLeft && newCost < costGrid[newRow][newCol]) {
              costGrid[newRow][newCol] = newCost;
              queue.push({ row: newRow, col: newCol, cost: newCost });
            }
          }
        }
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (costGrid[r][c] <= anotherPortal.distanceLeft) {
              if (!reachable.includes(stringFromCoord([c, r])))
                reachable.push(stringFromCoord([c, r]));
            }
          }
        }
      }
    }

    return reachable;
  };

export const calculateNearCells = (startCoord, selectedMap) => {
    let [startX, startY] = normalizeCoordToArray(startCoord)
    const cols = selectedMap.size[0],
      rows = selectedMap.size[1];

    // Массив для хранения координат атакуемых клеток в формате "col-row"
    const nearCells = [];

    // Определяем четыре направления атаки: вверх, вправо, вниз, влево
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
    ];

    // Для каждого направления идём клетками до предельного шага effectiveRange
    for (const { dx, dy } of directions) {
      for (let step = 1; step <= 1; step++) {
        const newX = startX + dx * step;
        const newY = startY + dy * step;

        // Проверка выхода за границы карты
        if (newX < 0 || newX >= cols || newY < 0 || newY >= rows) break;

        // Преобразуем координаты в формат "col-row" (1-индекс)
        const cellPos = `${newX + 1}-${newY + 1}`;
        nearCells.push(cellPos);
      }
    }

    return nearCells;
  };

export const isNearType = (cellCoord, selectedMap, type) => {
  let coord = normalizeCoordToArray(cellCoord)
  for (let cell of calculateNearCells(coord, selectedMap)) {
    if (cellHasType(type, cell, selectedMap)) {
      return true;
    }
  }
  return false;
}