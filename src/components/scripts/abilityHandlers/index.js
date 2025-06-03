import { handleChargesArea } from "./handleChargesArea";
// импортируем другие обработчики по аналогии...

const handlers = {
  "Заряды по области": handleChargesArea,
  // остальные типы...
};

export default handlers;
