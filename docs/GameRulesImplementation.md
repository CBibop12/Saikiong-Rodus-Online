# Implementation of Saikiong Rodus Board-Game Rules

> This document shows **where exactly in the code** each rule from the official rulebook (file `srchttps://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/rules.js`) is implemented.

## 1. General Turn Loop
| Rule | Location in code |
|------|------------------|
| During a turn a character may perform **1 action** and **1 movement** | `executeCommand.js` — properties `matchState.teams.<color>.remain` are decremented in the `move` branch and most action branches |
| The turn passes to the other player when both teams have `remain.actions===0` | `ChatConsole.jsx → handleFinishTurn()` |

## 2. Movement
* Check available agility points: `move` branch in `executeCommand.js`.
* Diagonal movement is disabled via `dx/dy` calculation (see comments in code).
* Red/blue square and wall restrictions — `calculateCellsForZone.js`.

## 3. Combat System
| Feature | File / function |
|---------|-----------------|
| Damage type (physical / technical / magical / pure) | `attack.js → normalizeDamageType()` |
| Armor reduction when attacking | `attack.js → switch(damageType)` |
| Life-steal (attacker HP restore) | `attack.js` — line `attacker.caster.currentHP = ...` |
| Base attack | `attack.js → attackBase()` |

## 4. Abilities
* All properties are described in `src/abilities.js`:
  ```js
  {
    name: "Fireball",
    affiliate: "negative only",
    damageType: "magical",
    shape: "circle",
    radius: 2,
    handler: "handleFireball" // → scripts/abilityHandlers/handleFireball.js
  }
  ```
* Universal geometry helpers:
  * Circle / square area — `calculateCellsForZone.js`.
  * Beam — `calculateBeamCells.js`.
  * Destination point (teleport) — `calculateTeleportationCells.js`.

## 5. Effects & Statuses
| Rule effect | Constructor in code |
|-------------|--------------------|
| Agility boost | `effects.js → agilityBoost()` |
| Shield | `effects.js → shield()` |
| Silence | `effects.js → silence()` (extra check `hasSilenceBesides()`) |

All effects support the fields `turnsRemain`, `effect` (called each turn) and `consequence` (on removal).

## 6. Shops & Items
* Goods list — array `items` in `src/data.js`.
* Item purchase — branch `case "buy"` in `executeCommand.js`.
  * Passives are applied by `apply*Passive()` functions from `itemEffects.js`.
  * Actives — `use*Active()` (often with a check of the consumable type).
* Laboratory / Armory cooldown is implemented via the `cooldown` flag inside shop state.

## 7. Buildings
| Rule | Implementation |
|------|---------------|
| Walls have 750 HP and become “half-ruined” at 375 HP | `building.js` + check in `attackBuilding()` |
| Base 1500 HP, defeat at 0 | `attack.js → attackBase()` and UI display (`TopBar.jsx`) |
| Building inside the “blue square” is impossible | check in `calculateCellsForZone.js` before calling `build()` |

## 8. Map & Zones
* `maps.js` — JSON description: `T` — wall tile, `H` — temple, `S` — blue square, etc.
* During initialization `MapSelection.jsx` converts symbols into `matchState.cells` objects.

## 9. Rulebook in the UI
`Rules.jsx` parses the `<title>` / `<subtitle>` tag markup from `srchttps://pdjerosynzbsjmwqdxbr.supabase.co/storage/v1/object/public/images/rules.js`, builds a navigation menu and provides search with highlighting.

## 10. Extending the Rules
To add a new rule follow the “declaration + handler” principle:
1. Describe the entity (ability, item, building) in the corresponding *data* file.
2. Implement the handler in `scripts/`.
3. Register it in `executeCommand.js` or `abilityHandlers/index.js`. 