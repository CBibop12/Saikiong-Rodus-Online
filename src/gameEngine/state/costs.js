/**
 * costs — единые правила списания действий/ходов.
 * Здесь НЕ должно быть UI-логики.
 */

export function canSpendAction(matchState, teamKey, amount = 1) {
  const remain = matchState?.teams?.[teamKey]?.remain;
  if (!remain) return false;
  return (remain.actions || 0) >= amount;
}

export function spendAction(matchState, teamKey, amount = 1) {
  const remain = matchState?.teams?.[teamKey]?.remain;
  if (!remain) return false;
  if ((remain.actions || 0) < amount) return false;
  remain.actions -= amount;
  return true;
}

export function canSpendMove(matchState, teamKey, amount = 1) {
  const remain = matchState?.teams?.[teamKey]?.remain;
  if (!remain) return false;
  return (remain.moves || 0) >= amount;
}

export function spendMove(matchState, teamKey, amount = 1) {
  const remain = matchState?.teams?.[teamKey]?.remain;
  if (!remain) return false;
  if ((remain.moves || 0) < amount) return false;
  remain.moves -= amount;
  return true;
}


