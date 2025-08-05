
# Saikiong Rodus — tabletop strategy simulator & statistical recorder

The project delivers a full-featured web version of the board game *“Saikiong Rodus”* (4th Edition) with turn-by-turn replay, detailed statistics tracking, and an interactive rulebook.

Main features  
1. 🚦 Match control: movement, attacks, ability and item usage through a single command parser.  
2. 🎯 Precise combat mechanics (armor / damage type) exactly as in the official rules.  
3. 🛠️ Map editor plus item, ability and building constructor.  
4. 📊 Logging and visualization of each character’s HP/mana, actions and effects.  
5. 📚 Built-in viewer with full-text search across the entire rulebook.

## Quick start
```bash
# 1. Install dependencies
npm i

# 2. Run the dev server
npm run dev

# 3. Open the browser at the URL shown by Vite (usually http://localhost:5173)
```
Production build:
```bash
npm run build   # outputs to dist/
```

Requirements: Node >= 18, npm >= 9.

## Repository layout
```
stats/
├─ public/                # static assets
├─ src/
│  ├─ assets/             # images, rules in *rules.js*
│  ├─ components/         # React UI components
│  │  ├─ scripts/         # game engine (see below)
│  │  └─ …
│  ├─ styles/             # CSS modules
│  ├─ abilities.js        # declarative ability list
│  ├─ itemEffects.js      # active/passive item scripts
│  ├─ effects.js          # generic status-effects
│  ├─ maps.js             # all official 40×28 maps
│  └─ data.js             # heroes, items, initial stats
└─ docs/                  # extra documentation (your additions)
```

## Game-engine architecture
* **Command parser** (`executeCommand.js`) — single entry point. Parses text commands (buy, attack, build, etc.) and calls the corresponding handlers.  
* **Combat system** (`attack.js`) — calculates damage with respect to type (`physical | technical | magical | pure`) and target armor; also handles destruction of buildings and base.  
* **Buildings** (`building.js`) plus helpers (`addBuilding`, `removeBuilding`) — support for temporary and permanent objects on the map.  
* **Effect system** (`effects.js`, `effectsManager.js`) — declarative “constructors” of buffs/debuffs with automatic expiration and side actions.  
* **Abilities** (`abilities.js`) are stored as JSON-like objects: area shape, affiliation, cost, cooldowns. When activated, they call handlers from `abilityHandlers/`.  
* **Match state** is kept in a transient Redux-like store (`mapStore.js`, `characterStore.js`); the UI subscribes via React’s `useState` hook.

See `docs/Architecture.md` for details.

## Rule implementation
The tabletop mechanics are fully ported to code. Quick mapping:  
* **Turns/actions** — counters `remain.actions` and `remain.moves` inside a command object (`executeCommand`).  
* **Movement** — respects `currentAgility`; diagonals excluded.  
* **Damage types & armor** — see `attack.js` (comments at top).  
* **Ability charges** — field `currentCharges`; validated before activation.  
* **Zones** (red/blue/healing) — pre-loaded in `maps.js`, logical checks in `calculateCellsForZone.js`.  
* **Shops & currency** — purchase processing in `executeCommand ➜ case "buy"`.

Full breakdown is in `docs/GameRulesImplementation.md`.

## npm scripts
* `dev` — local dev server with HMR.  
* `build` — production build.  
* `preview` — local preview of the prod build.  
* `lint` — run ESLint with the config from `eslint.config.js`.

## License
This project is distributed under the MIT license (see `LICENSE`, if present).
