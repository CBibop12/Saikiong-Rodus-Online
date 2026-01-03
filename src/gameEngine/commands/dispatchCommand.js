/**
 * dispatchCommand — единая точка диспетчеризации команд.
 * Пока каркас: в следующих шагах подключим handler'ы buy/attack/move/useAbility/...
 */

export function dispatchCommand(command, ctx) {
    const type = command?.commandType;
    const handlers = ctx?.handlers || {};
    const h = handlers[type];
    if (typeof h !== "function") {
        ctx?.log?.(`Команда "${type}" не поддерживается`, "error");
        return { ok: false, error: "unsupported_command" };
    }
    return h(command, ctx);
}


