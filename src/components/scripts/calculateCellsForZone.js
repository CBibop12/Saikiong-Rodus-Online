/**
 * Вычисляет все клетки на карте, которые попадают в радиус (movementRange)
 * от заданной стартовой клетки (centerCoord), игнорируя любые препятствия.
 * Возвращает массив координат в формате "x-y".
 *
 * @param {string} centerCoord - Координаты центра в формате "col-row" (1-индекс).
 * @param {number} movementRange - Радиус (максимальная "стоимость пути").
 * @param {object} mapSize - [ширина, высота] карты, например [40, 28].
 * @returns {string[]} Массив координат клеток, напр. ["1-1","2-1","2-2",...].
 */
export function calculateCellsForZone(centerCoord, movementRange, mapSize) {
  // Парсим строку центра в (x,y) с 0-индексом
  const [startCol, startRow] = centerCoord.split("-").map(Number);
  const cols = mapSize[0];
  const rows = mapSize[1];

  // Для удобства приведём к 0-индексам:
  const startC = startCol - 1;
  const startR = startRow - 1;

  // Создаём матрицу "стоимости" и заполняем бесконечностями
  const costGrid = Array.from({ length: rows }, () =>
    Array(cols).fill(Infinity)
  );

  // Функция для проверки выхода за границы (всё остальное игнорируем)
  const inBounds = (r, c) => {
    return r >= 0 && r < rows && c >= 0 && c < cols;
  };

  // BFS-очередь
  const queue = [];
  costGrid[startR][startC] = 0;
  queue.push({ row: startR, col: startC, cost: 0 });

  // Стандартные четыре направления (вверх,вправо,вниз,влево)
  const directions = [
    { dr: -1, dc: 0 },
    { dr: 0, dc: 1 },
    { dr: 1, dc: 0 },
    { dr: 0, dc: -1 },
  ];

  // Собственно BFS, без учёта препятствий
  while (queue.length) {
    const { row, col, cost } = queue.shift();

    // Если уже достигли порога (movementRange), не продолжаем
    if (cost >= movementRange) continue;

    for (const { dr, dc } of directions) {
      const newR = row + dr;
      const newC = col + dc;
      if (!inBounds(newR, newC)) continue; // только проверка границ

      const newCost = cost + 1; // всегда шаг = 1
      if (newCost <= movementRange && newCost < costGrid[newR][newC]) {
        costGrid[newR][newC] = newCost;
        queue.push({ row: newR, col: newC, cost: newCost });
      }
    }
  }

  // Собираем результат в массив "x-y" (1-индекс)
  const resultCells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (costGrid[r][c] <= movementRange) {
        resultCells.push(`${c + 1}-${r + 1}`);
      }
    }
  }

  return resultCells;
}

/**
 * Возвращает массив клеток по форме и радиусу/размерам.
 * shape: "romb" (по умолчанию), "circle", "rectangle", "cross".
 */
export function getCellsForShape(centerCoord, shape = "romb", stats = {}, mapSize) {
  const radius = stats.rangeOfObject ?? stats.radius ?? 1;
  if (shape === "romb") return calculateCellsForZone(centerCoord, radius, mapSize);
  if (shape === "circle") return calculateCellsForZoneCircle(centerCoord, radius, mapSize);
  if (shape === "rectangle") return calculateCellsForZoneRectangle(centerCoord, stats.rangeWidth || 1, stats.rangeHeight || 1, mapSize);
  if (shape === "cross") return calculateCellsForZoneCross(centerCoord, radius, mapSize);
  return calculateCellsForZone(centerCoord, radius, mapSize);
}

export function calculateCellsForZoneCircle(centerCoord, radius, mapSize) {
  const [cx, cy] = centerCoord.split("-").map(Number);
  const cols = mapSize[0];
  const rows = mapSize[1];
  const res = [];
  const r2 = radius * radius;
  for (let y = Math.max(1, cy - radius); y <= Math.min(rows, cy + radius); y++) {
    for (let x = Math.max(1, cx - radius); x <= Math.min(cols, cx + radius); x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) res.push(`${x}-${y}`);
    }
  }
  return res;
}

export function calculateCellsForZoneRectangle(centerCoord, width, height, mapSize) {
  const [cx, cy] = centerCoord.split("-").map(Number);
  const cols = mapSize[0];
  const rows = mapSize[1];
  const halfW = Math.floor(Math.max(1, Number(width)) / 2);
  const halfH = Math.floor(Math.max(1, Number(height)) / 2);
  const res = [];
  for (let y = Math.max(1, cy - halfH); y <= Math.min(rows, cy + halfH); y++) {
    for (let x = Math.max(1, cx - halfW); x <= Math.min(cols, cx + halfW); x++) {
      res.push(`${x}-${y}`);
    }
  }
  return res;
}

export function calculateCellsForZoneCross(centerCoord, radius, mapSize) {
  const [cx, cy] = centerCoord.split("-").map(Number);
  const cols = mapSize[0];
  const rows = mapSize[1];
  const res = new Set([`${cx}-${cy}`]);
  for (let d = 1; d <= radius; d++) {
    if (cx + d <= cols) res.add(`${cx + d}-${cy}`);
    if (cx - d >= 1) res.add(`${cx - d}-${cy}`);
    if (cy + d <= rows) res.add(`${cx}-${cy + d}`);
    if (cy - d >= 1) res.add(`${cx}-${cy - d}`);
  }
  return [...res];
}

