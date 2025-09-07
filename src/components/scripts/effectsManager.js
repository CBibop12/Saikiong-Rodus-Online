// components/scripts/EffectsManager.js
// управляет зонами и персональными эффектами в конце хода

export default class EffectsManager {
  constructor(matchState, selectedMap, addActionLog) {
    this.state = matchState;
    this.log = addActionLog;
    this.selectedMap = selectedMap
  }

  /** 
   * Эффекты клеток: лечение в «зеленых» зонах и работа храмов-powerpoint’ов.  
   * ▸ Счётчик `turnsRemain` у храма уменьшается только, если на точке стоит герой противника.  
   * ▸ До 0 — смена принадлежности, затем снова 3.  
   * ▸ Если на клетке храма КАЖДЫЙ ход никого нет – счётчик принудительно сбрасывается на 3. 
   */
  applyZoneEffects(churches, teamTurn) {
    const { teams } = this.state;
    // объединяем всех персонажей – пригодится для проверки «точка пустая?»
    const allCharacters = [...teams.red.characters, ...teams.blue.characters];

    /* ─── 1. Эффекты под героями активной команды ─── */
    for (const character of teams[teamTurn].characters) {
      if (character.currentHP <= 0) continue;                 // пропускаем трупы

      if (!character.position || typeof character.position !== 'string' || !this.selectedMap?.map) continue;
      const [rawX, rawY] = character.position.split('-').map(Number);
      const x = rawX - 1, y = rawY - 1;                       // индексы карты 0-based
      const row = this.selectedMap.map[y];
      if (!row) continue;                                      // вне карты
      const cell = row[x];
      if (!cell) continue;                                     // вне карты
      const tile = cell.initial;

      /* ── лечащая зона ── */
      if (tile === 'healing zone') {
        const isOwnHalf = teamTurn === 'red'
          ? x <= this.selectedMap.size[0] / 2
          : x >= this.selectedMap.size[0] / 2;

        if (isOwnHalf && character.currentHP < character.stats.HP) {
          character.currentHP = Math.min(character.stats.HP, character.currentHP + 25);
        }
      }

      /* ── храм-powerpoint ── */
      if (tile.includes('powerpoint')) {
        const church = churches.find(c => c.powerpoint === character.position);
        if (!church) continue;     // safety-check

        if (church.currentAffiliation === teamTurn) {
          // Свой храм → восстанавливаем ману (кроме «Мех») 
          if (character.type !== 'Меха') {
            character.currentMana = Math.min(character.stats.Мана, character.currentMana + 250);
          }
        } else {
          // Вражеский храм → ослабляем и, при 0, захватываем
          church.turnsRemain = Math.max(0, church.turnsRemain - 1);
          console.log(church);
          if (church.turnsRemain === 0) {
            church.currentAffiliation = teamTurn;
            church.turnsRemain = 3;
            this.log(`Храм ${character.position} перешёл к ${teamTurn}`, 'system', 'Храм');
          }
        }
      }
    }

    /* ─── 2. Сброс cooldown-а храмов, если клетка полностью свободна ─── */
    for (const church of churches) {
      const occupied = allCharacters.some(ch => ch.position === church.powerpoint);
      if (!occupied) church.turnsRemain = 3;
    }
  }


  /* ────────── персонажи ────────── */
  /**
   * Обрабатывает эффекты на всех персонажах указанной команды.
   * @param {"red"|"blue"} teamKey – команда, чей ход только что закончился
   */
  applyCharacterEffects(teamKey) {
    const chars = this.state.teams[teamKey].characters;
    chars.forEach((ch) => this.#tickCharacterEffects(ch));
  }

  /* ────────── helpers ────────── */
  #tickCharacterEffects(character) {
    if (!character.effects?.length) return;

    // идём с конца, чтобы безопасно splice‑ить
    for (let i = character.effects.length - 1; i >= 0; i--) {
      const eff = character.effects[i];

      // 1. эффекты, работающие каждый ход
      if (eff.typeOfEffect === "each turn" && typeof eff.effect === "function") {
        eff.effect(character, this.state);    // передаём state на случай сложной логики
      }

      // 2. счётчик длительности
      if (eff.permanent) continue;            // пассивки/перманентные не уменьшаем
      if (typeof eff.turnsRemain === "number") {
        eff.turnsRemain -= 1;
        if (eff.turnsRemain <= 0) {
          // 3. завершаем эффект
          if (typeof eff.consequence === "function") {
            eff.consequence(character, this.state);
          }
          character.effects.splice(i, 1);
          this.log(
            `⏳ Эффект «${eff.name}» на ${character.name} закончился`,
            "system",
            "Эффект"
          );
        }
      }
    }
  }
}
