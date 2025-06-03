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
