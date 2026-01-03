/**
 * makeId — генерация коротких ID, безопасных для сериализации (строка).
 * Важно: ID не должен требовать async/серверных вызовов, т.к. он нужен в момент мутации state.
 */
export function makeId(prefix = "id") {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${ts}_${rnd}`;
}


