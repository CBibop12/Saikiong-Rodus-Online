// abilities.js (rev3)
// Универсальные pointAttack / multiAttack работают без явного параметра «attacker».
// Внутри effect / beamEffect / zoneEffect мы вызываем их так: pointAttack(this, target)
// где `this` — сам объект способности. Все стат-поля берутся из него.

import {attack} from "./components/scripts/attack";
import { addEffect, agilityBoost, poisonousAttack, shield, silence, vampirism } from "./effects";

/**
 * Одноцелевой удар.
 * @param {object} abilityObj – сам объект способности (`this` из effect)
 * @param {Character} target
 * @param {{damage?:number, damageType?:string, armorPenetration?:number}} [opts]
 */
export const pointAttack = (abilityObj, target, opts = {}) => {
  const {
    damage = abilityObj.stats?.damage ?? abilityObj.stats?.damagePerShot ?? 0,
    damageType =
      abilityObj.stats?.damageType ||
      abilityObj.stats?.DamageType ||
      "физический",
    armorPenetration = abilityObj.stats?.armorPenetration ?? 0,
    ...rest
  } = opts;

  attack(
    abilityObj,              // «атакующий» (нам достаточно putBy / team)
    abilityObj.affiliate,    // правило «кого можно бить»
    target,
    damage,
    damageType,
    { armorPenetration, ...rest } // опции по желанию
  );
};

/**
 * Многоцелевой удар.
 * @param {object} abilityObj
 * @param {Character[]} targets
 * @param {*} opts
 */
export const multiAttack = (abilityObj, targets, opts = {}) =>
  targets.forEach((t) => pointAttack(abilityObj, t, opts));

export const abilities = {
  
  // ---------- Способности Саламандры ----------
  salamandra_fire_shots: {
    name: "Огненные снаряды",
    coolDown: 10,
    type: "Заряды по области",
    putBy: "Саламандра",
    coordinates: 3,
    turnsRemain: 0,
    affiliate: "negative only",
    stats: {
      shotsAmount: 4,
      DamageType: "физический",
      attackRange: 0,
      rangeOfObject: 5,
      rangeShape: "romb",
      rangeColor: "orange",
    },
    effectPerAttack: ({ affectedCharacters, addActionLog }) => {
      affectedCharacters.forEach(({ ch, amount }) => {
        if (ch.currentArmor >= 1) {
          ch.currentArmor -= 1;
        } else {
          ch.currentHP -= 50 * amount;
        }
      });
      addActionLog(
        `Способность "Огненные снаряды" нанесла урон: ${affectedCharacters
          .map((ac) => ac.ch.name)
          .join(", ")}`
      );
    },
  },

  salamandra_transformation: {
    name: "Превращение в саламандру",
    coolDown: 9,
    type: "Эффект на себя",
    putBy: "Саламандра",
    coordinates: 1,
    turnsRemain: 3,
    affiliate: "positive only",
    effect: (ch) => {
      let initialDamage = JSON.parse(JSON.stringify(ch.currentDamage))
      ch.currentAgility += 2;
      ch.currentDamage = 0;
      ch.advancedSettings.basicDodge += 50;
      addEffect(ch, {
        name: "Режим саламандры",
        description: "Превращается в настоящую саламандру, с повышеной ловкостью и уворотом, но без урона",
        effectType: "positive",
        canCancel: true,
        typeOfEffect: "one time",
        turnsRemain: 3,
        initialDamage: initialDamage,
        /* выполняется каждый ход, если нужно */
        effect: () => {},                   // agility увеличили 1 раз — больше делать нечего
        /* снимаем бафф */
        consequence: (ch, initialDamage) => {
          ch.currentAgility -= 2;
          ch.currentDamage += initialDamage;
          ch.advancedSettings.basicDodge -= 50;
        },
      });
    },
  },

  salamandra_hot_ground: {
    name: "Раскаленная земля",
    coolDown: 8,
    type: "Размещение области с эффектом зоны",
    putBy: "Саламандра",
    coordinates: "dynamic",
    turnsRemain: 3,
    affiliate: "negative only",
    stats: {
      DamageType: "физический",
      attackRange: 0,
      rangeOfObject: 1,
      rangeShape: "romb",
      rangeColor: "#9d45f5",
    },
    zoneEffect: (affectedCharacters) => {
      affectedCharacters.forEach((ch) => {
        if (ch.Броня >= 1) {
          ch.Броня -= 1;
        } else {
          ch.currentHP -= 50;
        }
      });
    },
  },

  // ---------- Способности Юань-ти ----------
  yuanti_binding: {
    name: "Опутывание",
    coolDown: 8,
    type: "Захват",
    putBy: "Юань-ти",
    coordinates: 1,
    turnsRemain: 2,
    affiliate: "neutral",
    effect: (ch, itself) => {
      // Отключаем перемещение и действие у цели
      ch.functions.movementAbility = false;
      ch.functions.actionAbility = false;

      ch.effects.push({
        name: "Опутывание Юань-ти",
        effectType: "negative",
        turnsRemain: 2,
        consequence: (char) => {
          char.functions.movementAbility = true;
          char.functions.actionAbility = true;
        },
      });

      // Пока Юань-ти опутывает, его ловкость = 0
      itself.stats.current.Ловкость = 0;
      itself.effects.push({
        name: "Опутывание Юань-ти",
        turnsRemain: 2,
        effectType: "neutral",
        canSelfStop: true,
        consequence: (char) => {
          char.stats.current.Ловкость = char.stats.Ловкость;
        },
      });
    },
  },

  yuanti_snake_bite: {
    name: "Змеиный укус",
    coolDown: 7,
    type: "Точка",
    putBy: "Юань-ти",
    coordinates: 1,
    turnsRemain: 2,
    affiliate: "negative only",
    effect: (initiator, character) => {
      poisonousAttack(character, {
        initiator,
        damageLine: [{damage: 50, damageType: "физический"}, {damage: 50, damageType: "физический"}],
      })
    },
  },

  yuanti_cobra_dash: {
    name: "Бросок кобры",
    coolDown: 7,
    type: "Эффект на себя",
    putBy: "Юань-ти",
    coordinates: 1,
    turnsRemain: 2,
    affiliate: "positive only",
    effect: (ch) =>     agilityBoost(ch, {
      amount:      3,
      duration:    2,
      description: "Увеличивает ловкость Юань-ти на 3 на 2 хода",
    }),
  },

  // ---------- Способности Вендиго ----------
  wendigo_pull: {
    name: "Притягивание",
    coolDown: 10,
    type: "Точечное накладывание эффекта",
    putBy: "Вендиго",
    coordinates: 6,
    turnsRemain: 4,
    affiliate: "negative neutral",
    effect: (ch, itself) => {
      // Притягиваем цель к Вендиго (упрощённый пример)
      // В оригинале можно считать точные координаты и смещать

      // Отключаем перемещение и действие у цели
      ch.functions.movementAbility = false;
      ch.functions.actionAbility = false;

      ch.effects.push({
        name: "Захват Вендиго",
        effectType: "negative",
        turnsRemain: 4,
        consequence: (char) => {
          char.functions.movementAbility = true;
          char.functions.actionAbility = true;
        },
      });

      // Вендиго теряет ловкость на время "захвата"
      itself.stats.current.Ловкость = 0;
      itself.effects.push({
        name: "Захват цели (Вендиго)",
        turnsRemain: 4,
        effectType: "neutral",
        canSelfStop: true,
        consequence: (char) => {
          char.stats.current.Ловкость = char.stats.Ловкость;
        },
      });
    },
  },

  wendigo_possession: {
    name: "Вселение",
    coolDown: 12,
    type: "Вселение",
    putBy: "Вендиго",
    coordinates: 1,
    turnsRemain: 4,
    affiliate: "positive neutral",
    effect: (ch, itself, matchState) => {
      // Проверяем, что у цели <= 25% HP
      if (ch.stats.current.HP <= ch.stats.HP * 0.25) {
        // Накладываем эффект "одержимости"
        ch.effects.push({
          name: "Одержимость Вендиго",
          effectType: "negative",
          turnsRemain: 4,
          consequence: (target) => {
            // После окончания эффекта цель погибает
            target.stats.current.HP = 0;
            // Вендиго появляется на месте цели
            itself.position = target.position;
          },
        });

        // Меняем команду цели (упрощённый пример)
        const targetTeam = ch.team === "red" ? "blue" : "red";
        const wendigoTeam = itself.team;

        if (targetTeam !== wendigoTeam) {
          matchState.teams[targetTeam].characters = matchState.teams[
            targetTeam
          ].characters.filter((char) => char.id !== ch.id);

          matchState.teams[wendigoTeam].characters.push(ch);
        }

        // Сам Вендиго "исчезает" до окончания эффекта
        // (например, ставим координаты вне поля)
        itself.position = { x: 0, y: 0 };
      }
    },
  },

  wendigo_vampirism: {
    name: "Вампиризм Вендиго",
    coolDown: 6,
    type: "Эффект на себя",
    putBy: "Вендиго",
    coordinates: 1,
    turnsRemain: 4,
    affiliate: "neutral",
    effect: (character) => {
      const initialDamage = character.currentDamage - 50
      character.currentDamage = 50
      character.advancedSettings.vampirism += 50
      addEffect(character, {
        name: "Жажда крови Вендиго",
        description: "Вендиго наносит лишь 50 урона, и восстанавливает 50 HP себе",
        effectType: "positive",
        canCancel: true,
        typeOfEffect: "one time",
        turnsRemain: 4,
        initialDamage,
        /* выполняется каждый ход, если нужно */
        effect: () => {},                   // agility увеличили 1 раз — больше делать нечего
        /* снимаем бафф */
        consequence: (ch) => {
          ch.advancedSettings.vampirism -= 50;
          ch.currentDamage += initialDamage;
        }
      })
    },
  },

  // ---------- Способности Повара ----------
  cook_poisoning: {
    name: "Отравление",
    coolDown: 6,
    type: "Точечное накладывание эффекта со сложным условием",
    putBy: "Повар",
    coordinates: 5,
    turnsRemain: 1,
    affiliate: "negative only",
    // Пример структуры эффекта
    effectLogic: [{ damage: 50, type: "магический" }, "effect"],
    effect: (ch) => {
      // Следующий ход урон по цели удваивается
      ch.advancedSettings.appliedDamageMultiplier = 2;

      ch.effects.push({
        name: "Отравление",
        effectType: "negative",
        turnsRemain: 1,
        consequence: (char) => {
          char.advancedSettings.appliedDamageMultiplier = 1;
        },
      });
    },
  },

  cook_caldron: {
    name: "Казан",
    coolDown: 10,
    type: "Размещение постройки",
    putBy: "Повар",
    coordinates: 5,
    turnsRemain: 4,
    affiliate: "ally",
    buildingStats: {
      name: "Казан(выключен)",
      HP: 200,
      Броня: 2,
      Ловкость: 0,
      position: null,
      isActive: false,
      turnsRemain: 0,
    },
    buildingAction: (building) => {
      building.name = "Казан(включен)";
      building.isActive = true;
      building.turnsRemain = 4;
      building.effects = [
        {
          name: "Регенерация от Казана",
          effectType: "positive",
          turnsRemain: 4,
          rangeOfObject: 5,
          rangeShape: "romb",
          rangeColor: "#9d45f5",
          zoneEffect: (affectedCharacters) => {
            affectedCharacters.forEach((ch) => {
              ch.currentHP = Math.min(ch.stats.HP, ch.currentHP + 50);
            });
          },
          consequence: (bld) => {
            bld.name = "Казан(выключен)";
            bld.isActive = false;
            bld.turnsRemain = 0;
          },
        },
      ];
    },
  },

  cook_random_effect: {
    name: "Случайный эффект",
    coolDown: 2,
    type: "Точечное накладывание эффекта",
    putBy: "Повар",
    coordinates: 1,
    turnsRemain: 10,
    affiliate: "positive only",
    effect: (ch) => {
      const randomEffect = Math.floor(Math.random() * 3) + 1;
      if (randomEffect === 1) {
        // +500 маны на 3 хода
        ch.stats.current.Мана += 500;
        ch.effects.push({
          name: "Бонус маны",
          effectType: "positive",
          turnsRemain: 3,
          consequence: (char) => {
            char.stats.current.Мана -= 500;
          },
        });
      } else if (randomEffect === 2) {
        // +2 ловкости на 2 хода
        ch.stats.current.Ловкость += 2;
        ch.effects.push({
          name: "Бонус ловкости",
          effectType: "positive",
          turnsRemain: 2,
          consequence: (char) => {
            char.stats.current.Ловкость -= 2;
          },
        });
      } else {
        // +1 к броне навсегда
        ch.stats.current.Броня += 1;
      }
    },
  },

  // ---------- Способности Скелета ----------
  skeleton_scare: {
    name: "Отпугивание",
    coolDown: 8,
    type: "Размещение области с эффектом зоны",
    putBy: "Скелет",
    coordinates: 1,
    turnsRemain: 3,
    affiliate: "negative only",
    stats: {
      DamageType: "физический",
      attackRange: 0,
      rangeOfObject: 3,
      rangeShape: "romb",
      rangeColor: "#9d45f5",
    },
    zoneEffect: (affectedCharacters, zoneCenter) => {
      affectedCharacters.forEach((ch) => {
        // Упрощённый пример "убегания" на свою ловкость от центра
        const dx = ch.position.x - zoneCenter.x;
        const dy = ch.position.y - zoneCenter.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const dirX = length > 0 ? dx / length : 0;
        const dirY = length > 0 ? dy / length : 0;

        ch.position.x += Math.round(dirX * ch.stats.current.Ловкость);
        ch.position.y += Math.round(dirY * ch.stats.current.Ловкость);

        // Накладываем эффект, запрещающий входить обратно в зону
        ch.effects.push({
          name: "Отпугивание Скелета",
          effectType: "negative",
          turnsRemain: 3,
          canSelfStop: false,
          restrictedZone: {
            center: zoneCenter,
            radius: 3,
          },
          onMove: (character, targetPosition) => {
            // Проверяем, не пытается ли персонаж войти в запрещённую зону
            const dist = Math.sqrt(
              (targetPosition.x - zoneCenter.x) ** 2 +
                (targetPosition.y - zoneCenter.y) ** 2
            );
            // Разрешаем движение только, если dist > restrictedZone.radius
            return dist > 3;
          },
          consequence: () => {
            // Через 3 хода эффект пропадёт сам
          },
        });
      });
    },
  },

  skeleton_shield: {
    name: "Щит",
    coolDown: 10,
    type: "Эффект на себя",
    putBy: "Скелет",
    turnsRemain: 7,
    shieldStats: {
      HP: 300,
    },
    effect: (ch) => {
      shield(ch, {
        initialHP: ch.currentHP,
        amount: 300,
        duration: 7,
        description: "Добавляет временные HP Скелету"
      })
    },
  },

  skeleton_bow_shot: {
    name: "Выстрел из лука",
    coolDown: 1,
    type: "Точка",
    putBy: "Скелет",
    coordinates: 1,
    affiliate: "negative neutral",
    stats: {
      DamageType: "физический",
      attackRange: 6,
      damage: 150,
    },
    restrictions: {
      canUse: (ch) => !ch.effects.some((e) => e.name === "Щит"),
    },
    // ⬇️ в effect приходит только target
    effect: function (target) {
      pointAttack(this, target);
    },
  },
  // ---------- Способности Гоблина ----------
  goblin_ranged_shot: {
    name: "Выстрел гоблина",
    coolDown: 4,
    type: "Точка",
    putBy: "Гоблин",
    coordinates: 6,
    affiliate: "negative neutral",
    stats: {
      DamageType: "физический",
      damage: 150,
      attackRange: 6,
    },
    effect: function (target) {
      pointAttack(this, target);
    },
  },

  goblin_regeneration: {
    name: "Регенерация гоблина",
    coolDown: 8,
    type: "Эффект на себя",
    putBy: "Гоблин",
    coordinates: 1,
    turnsRemain: 3,
    affiliate: "positive only",
    effect: (ch) => {
      // Накладываем на 3 хода +50 HP каждый ход
      ch.effects.push({
        name: "Гоблинская регенерация",
        effectType: "positive",
        turnsRemain: 3,
        takingType: "once in a round", // Пример "лечим в начале/конце хода"
        onTick: (char) => {
          char.currentHP = Math.min(char.stats.HP, char.currentHP + 50);
        },
      });
    },
  },

  goblin_sniper_mode: {
    name: "Снайперский режим",
    coolDown: 10,
    type: "Смена стойки / Накладывание эффекта на себя",
    putBy: "Гоблин",
    coordinates: 1,
    turnsRemain: 0,
    affiliate: "neutral",
    // Логика: гоблин переходит в режим "стрелка" на 5 выстрелов.
    // Каждый выстрел: дальность 7, урон 125 (техн.).
    effect: (ch) => {
      // Добавляем эффект с 5 зарядами
      ch.effects.push({
        name: "Гоблин-снайпер",
        effectType: "positive",
        shotsLeft: 5,
        damage: 125, // техн. урон
        range: 7,
        // Можно отследить каждое использование атаки из этого эффекта
        onAttack: (char, target) => {
          // Если стреляем "специальной" атакой
          // Например, проверяем "char" имеет этот эффект
          // и хочет воспользоваться именно "снайперской" атакой
          if (this.shotsLeft > 0) {
            // Считаем урон
            target.currentHP -= this.damage;
            this.shotsLeft -= 1;
            // Когда выстрелы закончились — снимаем эффект
            if (this.shotsLeft <= 0) {
              const idx = char.effects.findIndex(
                (e) => e.name === "Гоблин-снайпер"
              );
              if (idx >= 0) {
                char.effects.splice(idx, 1);
              }
            }
          }
        },
      });
    },
  },

  // ---------- Способности Кобольда ----------
  kobold_digging: {
    name: "Копание туннелей",
    coolDown: 0, // пассивная (или условная)
    type: "Пассивная способность",
    putBy: "Кобольд",
    affiliate: "neutral",
    // Пример: позволяет кобольду, если он "зарыт",
    // использовать обычное действие для прокладывания туннеля.
    effect: (ch) => {
      // В реальном коде можно проверять состояние "zaryt" (закопан),
      // а затем разрешать/запрещать действие копать туннель.
      // Здесь просто пример структуры:
      ch.effects.push({
        name: "Подземная активность",
        effectType: "neutral",
        permanent: true, // или turnsRemain: 9999
        canDig: true,
      });
    },
  },

  kobold_explosion: {
    name: "Подрыв заряда",
    coolDown: 10,
    type: "Область",
    putBy: "Кобольд",
    coordinates: 1, // радиус или дальность, если нужно
    turnsRemain: 0,
    affiliate: "negative only",
    stats: {
      damage: 200,
      damageType: "физический",
      // Допустим размер 4x2 — условно:
      rangeShape: "rectangle",
      rangeWidth: 4,
      rangeHeight: 2,
    },
    zoneEffect: (affectedCharacters, user) => {
      // Если кобольд над землёй — обычный взрыв
      // Если под землёй — усиливаем эффект (или "уничтожаем" область)
      // Для примера просто нанесём 200 урона всем
      affectedCharacters.forEach((ch) => {
        ch.currentHP -= 200;
      });
      // Можно проверить, "user.isBurrowed?" — и изменить эффект
    },
  },

  kobold_ladder: {
    name: "Установка лестницы",
    coolDown: 8,
    type: "Размещение объекта",
    putBy: "Кобольд",
    coordinates: 1,
    affiliate: "neutral",
    effect: (ch) => {
      // Ставим лестницу c HP 300
      // Это может быть обычная "постройка" или "объект",
      // к которому можно взаимодействовать: залезть/слезть и т.д.
      ch.spawnedObjects = ch.spawnedObjects || [];
      ch.spawnedObjects.push({
        name: "Лестница",
        HP: 300,
        isLadder: true,
      });
    },
  },

  // ---------- Способности Аараокры ----------
  aarakocra_flight: {
    name: "Полёт аараокры",
    coolDown: 7,
    type: "Эффект на себя + выброс в радиусе",
    putBy: "Аараокра",
    coordinates: 1,
    turnsRemain: 3,
    affiliate: "positive neutral",
    effect: (ch, matchState) => {
      // При активации: Аараокра получает эффект полёта на 3 хода
      ch.effects.push({
        name: "Эффект полёта",
        effectType: "positive",
        turnsRemain: 3,
        canFly: true,
        consequence: (char) => {
          char.effects = char.effects.filter((e) => e !== this);
        },
      });

      // Дополнительно в радиусе 1 выталкивает (если есть цель, которая может двигаться)
      // Пример "пуша" в 1 клетку (упрощённый)
      const center = ch.position || { x: 0, y: 0 };
      const pushRadius = 1;
      matchState.characters.forEach((other) => {
        if (other !== ch && other.position) {
          const dx = other.position.x - center.x;
          const dy = other.position.y - center.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= pushRadius) {
            // Отталкиваем на 1 клетку
            other.position.x += Math.sign(dx);
            other.position.y += Math.sign(dy);
          }
        }
      });
    },
  },

  aarakocra_spear_strike: {
    name: "Удар копьём",
    coolDown: 6,
    type: "Луч",
    putBy: "Аараокра",
    coordinates: 3, // Бьёт на 3 клетки
    affiliate: "negative only",
    stats: {
      damage: 150,
      damageOverTime: 25, // 2 хода
      damageType: "физический",
    },
    beamEffect: function (targets) {
      multiAttack(this, targets);
      // Накладываем негативный DoT на 2 хода по 25 урона
      targets.forEach((ch) => {
        ch.effects.push({
        name: "Рана от копья аараокры",
        effectType: "negative",
        turnsRemain: 2,
        takingType: "once in a round",
        onTick: (char) => {
            char.currentHP -= 25;
          },
        });
      });
    },
  },

  aarakocra_grab: {
    name: "Поднятие когтями",
    coolDown: 1,
    type: "Точечное действие (только в полёте)",
    putBy: "Аараокра",
    coordinates: 1,
    affiliate: "neutral",
    // Логика: если аараокра в полёте, может схватить цель и держать до 2 ходов,
    // может отпустить. При падении противника наносится 175 урона (если враг).
    effect: (attacker, target) => {
      // Проверяем, что у аараокры есть эффект "Эффект полёта"
      const flightEffect = attacker.effects.find(
        (eff) => eff.name === "Эффект полёта" && eff.canFly
      );
      if (!flightEffect) {
        // Если нет полёта — не работает
        return;
      }

      // Схватываем цель (на 2 хода)
      target.effects.push({
        name: "Схвачен когтями аараокры",
        effectType: "negative",
        turnsRemain: 2,
        canSelfStop: true,
        consequence: (ch) => {
          // Когда эффект заканчивается, считаем "бросок" (если было решено, что аараокра отпустил врага)
          // Условно, если это враг, получит 175 урона, если союзник — 0
          if (ch.team !== attacker.team) {
            ch.currentHP -= 175;
          } else {
            // союзник: 0 урона
          }
        },
      });
    },
  },

  // ---------- Подсолнух ----------
  podsolnuh_bind: {
    name: "Окутывание",
    coolDown: 12,
    type: "Точечное наложение эффекта",
    putBy: "Подсолнух",
    coordinates: 6, // дальность 6
    turnsRemain: 2,
    affiliate: "negative only",
    effect: (target, self) => {
      // 1) Наносим 100 урона сразу (в первый ход)
      target.currentHP -= 100;

      // 2) Отключаем движение/действие цели на 2 хода
      target.functions.movementAbility = false;
      target.functions.actionAbility = false;

      // Эффект, который через 2 хода вернёт всё обратно
      target.effects.push({
        name: "Окутывание Подсолнуха",
        effectType: "negative",
        turnsRemain: 2,
        consequence: (ch) => {
          ch.functions.movementAbility = true;
          ch.functions.actionAbility = true;
        },
      });
    },
  },

  podsolnuh_teleport: {
    name: "Телепорт на свою половину карты",
    coolDown: 10,
    type: "Телепортация",
    putBy: "Подсолнух",
    affiliate: "neutral",
    distance: "half map",
  },

  podsolnuh_absorb: {
    name: "Поглощение урона",
    coolDown: 10,
    type: "Эффект на себя",
    putBy: "Подсолнух",
    turnsRemain: 3,
    affiliate: "positive only",
    effect: (self) => {
      // Условно ставим флаг, что поглощается любой физический и магический урон
      // (например, устанавливаем кастомное поле)
      self.advancedSettings.absorbAllDamage = true;

      self.effects.push({
        name: "Поглощение урона (Подсолнух)",
        effectType: "positive",
        turnsRemain: 3,
        consequence: (ch) => {
          ch.advancedSettings.absorbAllDamage = false;
        },
      });
    },
  },

  // ---------- Слизень ----------
  slizen_acid_area: {
    name: "Кислотная область",
    coolDown: 7,
    type: "Мгновенная область способности",
    putBy: "Слизень",
    coordinates: 0, // он кастует вокруг себя
    affiliate: "negative only",
    stats: {
      DamageType: "магический",
      rangeOfObject: 3, // радиус 3
      rangeShape: "romb", // к примеру, ромб
      rangeColor: "#9d45f5",
    },
    // Здесь можно сделать либо мгновенный урон, либо зону на 1 ход.
    // Предположим, что это мгновенный урон по всем в радиусе.
    zoneEffect: (affectedCharacters) => {
      affectedCharacters.forEach((ch) => {
        if (ch.name !== "Слизень") {
          if (ch.currentArmor == 0) {
            ch.currentHP -= 125;
          } else if (ch.currentArmor == 1) {
            ch.currentArmor -= 1;
            ch.currentHP -= 63;
          } else {
            ch.currentArmor -= 2;
          }
        }
      });
    },
  },

  slizen_absorb_half: {
    name: "Поглощение 50% урона",
    coolDown: 7,
    type: "Эффект на себя",
    putBy: "Слизень",
    turnsRemain: 5,
    affiliate: "positive only",
    effect: (self) => {
      // Допустим, используем дополнительное поле, отвечающее за проц. снижения урона
      self.advancedSettings.damageReductionPercent = 50;

      self.effects.push({
        name: "Поглощение 50% урона (Слизень)",
        effectType: "positive",
        turnsRemain: 5,
        consequence: (ch) => {
          ch.advancedSettings.damageReductionPercent = 0;
        },
      });
    },
  },

  slizen_passive_wall: {
    name: "Прохождение сквозь стены (пассивно)",
    coolDown: 0,
    type: "Пассивная способность",
    putBy: "Слизень",
    affiliate: "neutral",
    // Можно определить некую логику onMove или onTurnEnd,
    // которая проверяет: "если персонаж в стене — вытолкнуть наружу"
    // Здесь только формально показываем, что способность пассивная:
    effect: (self, matchState) => {
      // пример псевдокода:
      // if (self.isInsideWall()) {
      //   self.position = findClosestEmptyCell(self.position);
      // }
    },
  },

  // ---------- Подрывница ----------
  bombgirl_flying_stun: {
    name: "Пролёт с оглушением",
    coolDown: 7,
    type: "Луч с перемещением",
    putBy: "Подрывница",
    affiliate: "negative only",
    coordinates: 8,
    canGoThroughWalls: false,
    stats: {
      beamWidth: 3,
    },
    // Условно: пролетает 8 клеток прямо, на 1 клетку по бокам — стан
    beamEffect: function (targets) {
      // Применяем эффект оглушения только к врагам
      targets.forEach((ch) => {
        // Проверяем, что персонаж существует
        if (!ch) return;
        
        // Ищем персонажа "Подрывница" в командах
        let bombgirl = null;
        let bombgirlTeam = null;
        
        ["red", "blue"].forEach(teamKey => {
          const foundChar = matchState.teams[teamKey].characters.find(character => character.name === "Подрывница");
          if (foundChar) {
            bombgirl = foundChar;
            bombgirlTeam = teamKey;
          }
        });
        
        // Определяем, к какой команде принадлежит текущий персонаж
        let charTeam = null;
        ["red", "blue"].forEach(teamKey => {
          if (matchState.teams[teamKey].characters.includes(ch)) {
            charTeam = teamKey;
          }
        });
        
        // Если персонаж из другой команды, чем Подрывница
        if (bombgirlTeam && charTeam && bombgirlTeam !== charTeam) {
          // Отключаем возможность двигаться и действовать
          ch.functions.movementAbility = false;
          ch.functions.actionAbility = false;
          // Возвращаем возможность двигаться и действовать после окончания эффекта
          ch.functions.movementAbility = true;
          ch.functions.actionAbility = true;
        }
      });
    },
  },

  bombgirl_bomb: {
    name: "Бомба с часовым механизмом",
    coolDown: 10,
    type: "Точечное наложение эффекта",
    putBy: "Подрывница",
    coordinates: 4, // дальность 4
    turnsRemain: 3,
    affiliate: "negative only",
    effect: (target) => {
      // Вешаем эффект-бомбу на 3 хода
      target.effects.push({
        name: "Часовая бомба",
        effectType: "negative",
        turnsRemain: 3,
        consequence: (ch) => {
          ch.currentHP -= 200; // когда таймер истекает, наносим урон
        },
      });
    },
  },

  bombgirl_molotov: {
    name: "Коктейль Молотова",
    coolDown: 10,
    type: "Размещение области с эффектом зоны",
    putBy: "Подрывница",
    coordinates: 3, // дальность 3
    turnsRemain: 3, // зона лежит 3 хода
    affiliate: "negative only",
    stats: {
      DamageType: "ядовитый", // или "магический", если нужно
      rangeOfObject: 3, // радиус поражения 3
      rangeShape: "romb",
      rangeColor: "#9d45f5",
    },
    zoneEffect: (affectedCharacters) => {
      // Каждый ход зона наносит 75 урона всем, кто оказался внутри
      affectedCharacters.forEach((ch) => {
        ch.currentHP -= 75;
      });
    },
  },

  // ---------- Амудсиас ----------
  amudsius_possession: {
    name: "Вселение Амудсиаса",
    coolDown: 13,
    type: "Точечное наложение эффекта",
    putBy: "Амудсиас",
    coordinates: 1, // например, ближний бой или до 1 клетки
    turnsRemain: 10,
    affiliate: "neutral",
    effect: (target, self, matchState) => {
      // По условию: складываются HP, броня, урон, мана.
      // Ловкость и дальность — остаются от "носителя".
      // Пример псевдокода:
      const combinedHP = Math.min(target.stats.HP + self.stats.HP, 9999); // некий лимит или как нужно
      target.currentHP = combinedHP;

      // Аналогично с маной, бронёй, уроном.
      // (Как именно складывать — зависит от конкретной логики игры.)
      target.stats.current.Броня += self.stats.current.Броня;
      target.stats.current.Мана += self.stats.current.Мана;
      target.stats.current.Урон += self.stats.current.Урон;
      // Ловкость и дальность — оставляем как у цели.

      // Добавляем эффект, чтобы через 10 ходов всё отменить:
      target.effects.push({
        name: "Амудсиас внутри",
        effectType: "negative",
        turnsRemain: 10,
        consequence: (ch) => {
          // По окончании эффекта можно убить носителя,
          // либо откатить изменения, либо что-то ещё.
          // Здесь — чисто демонстрация возможности.
          // Например, убираем добавленные статы:
          ch.stats.current.Броня -= self.stats.current.Броня;
          ch.stats.current.Мана -= self.stats.current.Мана;
          ch.stats.current.Урон -= self.stats.current.Урон;

          // Амудсиас "выселяется" обратно
          self.position = ch.position;
          // Или возвращается к своим изначальным параметрам —
          // зависит от логики.
        },
      });
    },
  },

  amudsius_scare: {
    name: "Отпугивание (Амудсиас)",
    coolDown: 5,
    type: "Размещение области с эффектом зоны",
    putBy: "Амудсиас",
    coordinates: 1, // он кастует вокруг себя?
    turnsRemain: 1, // или сколько нужно
    affiliate: "negative only",
    stats: {
      rangeOfObject: 5,
      rangeShape: "romb",
      rangeColor: "#9d45f5",
    },
    zoneEffect: (affectedCharacters, zoneCenter) => {
      // Аналогично другим отпугиваниям:
      // выводим врагов за пределы радиуса 5 и запрещаем входить обратно на N ходов.
      affectedCharacters.forEach((ch) => {
        // Упрощённый "побег" на свою ловкость
        const dx = ch.position.x - zoneCenter.x;
        const dy = ch.position.y - zoneCenter.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const dirX = length > 0 ? dx / length : 0;
        const dirY = length > 0 ? dy / length : 0;

        ch.position.x += Math.round(dirX * ch.stats.current.Ловкость);
        ch.position.y += Math.round(dirY * ch.stats.current.Ловкость);

        // Добавим эффект запрета входа
        ch.effects.push({
          name: "Отпугивание Амудсиаса",
          effectType: "negative",
          turnsRemain: 1, // или больше, если нужно
          restrictedZone: {
            center: zoneCenter,
            radius: 5,
          },
        });
      });
    },
  },

  amudsius_shot: {
    name: "Выстрел сгустком (Амудсиас)",
    coolDown: 0,
    type: "Точечная атака",
    putBy: "Амудсиас",
    coordinates: 5, // дальность 5
    affiliate: "negative only",
    // Допустим, не влияет на перезагрузку других способностей.
    // Сделаем плату в мане 750:
    manaCost: 750,
    effect: (target, self) => {
      // Снимаем 750 маны у Амудсиаса
      if (self.currentMana >= 750) {
        self.currentMana -= 750;
        // Урон игнорирует броню (просто вычитаем из HP)
        target.currentHP -= 75;
      }
    },
  },

  // ──────────────── Заклинатель рун ────────────────
  runecaster_hp_rune: {
    name: "Руна НР",
    coolDown: 5,
    type: "Точечное наложение эффекта",
    putBy: "Заклинатель рун",
    coordinates: 1,
    turnsRemain: 0,
    affiliate: "positive only",
    effect: (ch) => {
      // +75 к HP
      // для примера: ch.currentHP += 75;
      // при этом не забываем ограничить максимумом: ch.currentHP = Math.min(ch.stats.HP, ch.currentHP)
      ch.currentHP = Math.min(ch.stats.HP, ch.currentHP + 75);
    },
  },

  runecaster_damage_rune: {
    name: "Руна урона",
    coolDown: 5,
    type: "Точечное наложение эффекта",
    putBy: "Заклинатель рун",
    coordinates: 1,
    turnsRemain: 0,
    affiliate: "positive only",
    effect: (ch) => {
      // +25 к Урону
      // можно временно на несколько ходов или постоянно — пример:
      const bonus = 25;
      ch.stats.current.Урон += bonus;

      // Если нужно время действия, создаём эффект:
      ch.effects.push({
        name: "Руна урона",
        effectType: "positive",
        turnsRemain: 3, // к примеру, 3 хода
        consequence: (char) => {
          // возврат урона
          char.stats.current.Урон -= bonus;
        },
      });
    },
  },

  runecaster_mana_rune: {
    name: "Руна маны",
    coolDown: 5,
    type: "Точечное наложение эффекта",
    putBy: "Заклинатель рун",
    coordinates: 1,
    turnsRemain: 0,
    affiliate: "positive only",
    effect: (ch) => {
      // +1000 маны (учитывайте макс.лимит, если он есть)
      ch.currentMana += 1000;
    },
  },

  // ──────────────── Ночной охотник ────────────────
  night_hunter_bat_beam: {
    name: "Луч летучих мышей",
    coolDown: 8,
    type: "Луч с перемещением",
    putBy: "Ночной охотник",
    coordinates: 8, // дальность 8 клеток
    affiliate: "negative only",
    canGoThroughWalls: true,
    stats: {
      damage: 150,
      damageType: "физический", // или "магический" по вашему усмотрению
    },
    beamEffect: function (targets) {
      multiAttack(this, targets);
    },
  },

  night_hunter_silence_area: {
    name: "Зона молчания",
    coolDown: 7,
    type: "Размещение области с эффектом зоны",
    putBy: "Ночной охотник",
    coordinates: 0, // радиус размещения вокруг себя
    turnsRemain: 3, // область держится 3 хода
    affiliate: "negative only",
    stats: {
      rangeOfObject: 3, // радиус 3
      rangeShape: "circle",
      rangeColor: "#333", // к примеру, тёмный цвет
    },
    zoneEffect: (affectedCharacters) => {
      // В зоне персонажи не могут использовать способности
      affectedCharacters.forEach((ch) => {
        silence(ch, {
          duration: 3,
        })
      });
    },
  },

  night_hunter_vampire_strike: {
    name: "Кровавый удар",
    coolDown: 12,
    type: "Эффект на себя",
    putBy: "Ночной охотник",
    coordinates: 0, // ближняя атака
    turnsRemain: 5, // 5 ходов действует
    affiliate: "positive neutral",
    effect: (ch) => {
      ch.advancedSettings.vampirism += 100
      addEffect(ch, {
        duration: 5,
        name: "Жажда крови",
        description: "Вампиризм = 100 HP за удар, за добивание 100 HP к максимуму.",
        effectType: "positive",
        canCancel: true,
        typeOfEffect: "every hit",
        typeOfHit: "normal", //ability || any
        byKill: (initiator, ch) => {
          if (ch.team != initiator.team) {
            initiator.currentHP += 100
            initiator.stats.HP += 100
          }
        },
        consequence: (ch) => {
          ch.advancedSettings.vampirism -= 100
        }
      })
    }
  },

  // ──────────────── Дейви Джонс ────────────────
  davyjones_teleport: {
    name: "Телепорт к врагу",
    coolDown: 8,
    type: "Точечное действие перемещения",
    putBy: "Дейви Джонс",
    coordinates: 6, // радиус 6 клеток
    affiliate: "neutral",
    effect: (self, target, matchState) => {
      // Пример: перемещаемся к выбранному врагу, если он в радиусе 6
      self.position = target.position; // или рядом, если нужно
    },
  },

  davyjones_strangle: {
    name: "Удушение",
    coolDown: 6,
    type: "Точечное наложение эффекта",
    putBy: "Дейви Джонс",
    coordinates: 1,
    turnsRemain: 2, // 2 хода
    affiliate: "negative only",
    effect: (target, itself) => {
      // Наносит 50 урона/ход 2 хода
      target.effects.push({
        name: "Удушение",
        effectType: "negative",
        turnsRemain: 2,
        onTick: (char) => {
          char.currentHP -= 50;
        },
        consequence: (ch) => {
          // По окончании эффекта возвращаем функции
          ch.functions.movementAbility = true;
          ch.functions.actionAbility = true;
        },
      });

      // Отключаем движение/действие и у цели, и у самого Дейви
      target.functions.movementAbility = false;
      target.functions.actionAbility = false;

      itself.functions.movementAbility = false;

      // У Дейви, если нужно, тоже эффект:
      itself.effects.push({
        name: "Удушение (задействован)",
        effectType: "neutral",
        turnsRemain: 2,
        consequence: (dj) => {
          dj.functions.movementAbility = true;
        },
      });
    },
  },

  davyjones_chest: {
    name: "Сердце в сундуке",
    coolDown: 15, // (перезагружается с начала партии)
    type: "Размещение объекта",
    putBy: "Дейви Джонс",
    coordinates: 1, // или 0, если ставит под собой
    affiliate: "ally",
    buildingStats: {
      name: "Сундук",
      HP: 1,
      Броня: 3,
      position: null,
      isHeartInside: true,
    },
    effect: (dj, matchState) => {
      // Ставим сундук на клетку (допустим, рядом)
      const chestObject = {
        id: `Chest_of_${dj.name}_${Date.now()}`,
        type: "building",
        coordinates: dj.position, // или какую-то соседнюю клетку
        stats: {
          HP: 1,
          Броня: 3,
        },
        name: "Сундук Дейви Джонса",
        isActive: true,
        effectOnDestroy: (chest) => {
          // Если сундук разрушен
          // Дейви Джонс умирает
          dj.currentHP = 0;
        },
      };

      matchState.objectsOnMap.push(chestObject);

      // Делаем Дейви бессмертным, пока сундук жив
      dj.advancedSettings.immortal = true;
      dj.effects.push({
        name: "Сердце в сундуке",
        effectType: "positive",
        permanent: true,
        // Возможен флаг, что снимается, если сундук разрушен
        customRemoveCondition: (effect, char, state) => {
          // Ищем сундук в state.objectsOnMap
          const chest = state.objectsOnMap.find((o) => o.id === chestObject.id);
          // Если сундук нет или он уничтожен, снимаем эффект
          if (!chest || chest.stats.HP <= 0) {
            char.advancedSettings.immortal = false;
            return true;
          }
          return false;
        },
      });
    },
  },

  // ──────────────── Варвар ────────────────
  barbarian_axe_throw: {
    name: "Метание топора",
    coolDown: 7,
    type: "Луч",
    putBy: "Варвар",
    coordinates: 5, // 5 клеток
    affiliate: "negative only",
    stats: {
      damage: 175,
      missChance: 10, // 10% промаха
      damageType: "физический",
    },
    beamEffect: function (targets) {
      // Пробуем промах
      const roll = Math.random() * 100;
      if (roll < 10) {
        // Промах
        // Можно вывести лог
        return;
      }
      multiAttack(this, targets)
    },
  },

  barbarian_ally_pull: {
    name: "Притянуть союзника",
    coolDown: 10,
    type: "Точечное действие",
    putBy: "Варвар",
    coordinates: 999, // "с любой точки карты" — упрощённо ставим большое число
    affiliate: "ally",
    effect: (barb, ally, matchState) => {
      // Перемещаем союзника на клетку Варвара
      ally.position = barb.position;
    },
  },

  barbarian_rage_strike: {
    name: "Ярость Варвара (пассивно)",
    coolDown: 0,
    type: "Пассивная способность",
    putBy: "Варвар",
    affiliate: "neutral",
    // Пример: накопив 3 "Ярости", он наносит 1.5х урон
    effect: (barb) => {
      // Логика пассивного эффекта — например, в onAttack
      barb.effects.push({
        name: "Ярость Варвара",
        effectType: "passive",
        permanent: true,
        onAttack: (char, target) => {
          // Если у char есть 3 стека "ярости", умножаем урон
          if (char.advancedSettings.rageStacks >= 3) {
            target.currentHP -= char.currentDamage * 0.5; // доп.урон +50%
            // обнуляем ярость или снижаем на 3
            char.advancedSettings.rageStacks = 0;
          }
        },
      });
    },
  },

  // ──────────────── Плут ────────────────
  plut_double_agility: {
    name: "Удвоение ловкости",
    coolDown: 6,
    type: "Эффект на себя",
    putBy: "Плут",
    coordinates: 1,
    turnsRemain: 2, // 2 хода
    affiliate: "positive only",
    effect: (plut) =>     agilityBoost(plut, {
      amount:      plut.currentAgility,
      duration:    2,
      description: "Удвоение ловкости Плута на 2 хода",
    }),
  },

  plut_climb_wall: {
    name: "Залезть на стену",
    coolDown: 4,
    type: "Точечное действие",
    putBy: "Плут",
    coordinates: 1,
    affiliate: "neutral",
    effect: (thief, matchState) => {
      // Условная логика: ставим флаг "на стене". Нужно уточнять механику
      thief.advancedSettings.onWall = true;
      thief.effects.push({
        name: "Плут на стене",
        effectType: "neutral",
        turnsRemain: 9999, // пока не спустится
        canSelfStop: true,
        consequence: (ch) => {
          ch.advancedSettings.onWall = false;
        },
      });
    },
  },

  plut_steal_item: {
    name: "Кража предмета",
    coolDown: 0, // не перезагружает другие способности
    type: "Точечное действие",
    putBy: "Плут",
    affiliate: "neutral",
    effect: (thief, target) => {
      // Крадёт предмет из инвентаря противника за 1/2 стоимости
      // Логику цены предмета вы определяете сами.
      if (target.inventory?.length) {
        const stolenItem = target.inventory[0]; // упрощённо крадём первый
        target.inventory.shift();
        thief.inventory.push(stolenItem);
      }
    },
  },

  // ──────────────── Зелос ────────────────
  zelos_meteor: {
    name: "Метеор",
    coolDown: 5,
    type: "Точка",
    putBy: "Зелос",
    coordinates: 10,
    affiliate: "negative only",
    stats: {
      damage: 50,
      damageType: "магический",
    },
    effect: function (target) {
      pointAttack(this, target);
    },
  },

  zelos_absorb_magic: {
    name: "Поглощение магии",
    coolDown: 6,
    type: "Эффект на себя",
    putBy: "Зелос",
    coordinates: 1,
    turnsRemain: 3,
    affiliate: "positive only",
    effect: (ch) => {
      // На 3 хода поглощает маг.урон, физ.урон => в ману *2
      ch.effects.push({
        name: "Поглощение магии",
        effectType: "positive",
        turnsRemain: 3,
        onDamageTaken: (char, damage, dmgType) => {
          if (dmgType === "магический") {
            // поглощаем в 0
            return 0;
          } else {
            // физический урон конвертируем в ману x2
            char.currentMana += damage * 2;
            return damage; // урон всё же нанесёт? Или 0?
            // Можно сделать, что урон проходит, но дополнительно даёт ману
            // Или полностью "преобразует" — на ваш выбор
          }
        },
      });
    },
  },

  zelos_return_damage: {
    name: "Копящий урон",
    coolDown: 6,
    type: "Эффект на себя",
    putBy: "Зелос",
    coordinates: 1,
    turnsRemain: 5,
    affiliate: "positive only",
    effect: (ch) => {
      ch.advancedSettings.storedDamage = 0;

      ch.effects.push({
        name: "Копящий урон",
        effectType: "positive",
        turnsRemain: 5,
        onDamageTaken: (char, dmg) => {
          // Сохраняем весь входящий урон
          char.advancedSettings.storedDamage =
            (char.advancedSettings.storedDamage || 0) + dmg;
        },
        consequence: (char) => {
          // По окончании эффекта наносим накопленный урон по выбранной цели (сквозь броню).
          // Если нужно выбрать цель — реализуйте механику выбора.
          // Сейчас просто, к примеру, бьём ближайшего врага
          const finalDamage = char.advancedSettings.storedDamage || 0;
          delete char.advancedSettings.storedDamage;

          // Пример: ищем любого врага?
          // Или нужна цель, которая атаковала последней? Либо prompt?
          // Здесь условно ничего не делаем, т.к. трудно описать
        },
      });
    },
  },

  // ──────────────── Легионер ────────────────
  legionnaire_mana_strike: {
    name: "Удар по мане",
    coolDown: 6,
    type: "Точечная атака",
    putBy: "Легионер",
    coordinates: 1,
    affiliate: "negative only",
    effect: function (target) {
      const mana = target.currentMana || 0;
      let dmg = 0;
      if (mana >= 5000) dmg = 50;
      else if (mana >= 4000) dmg = 75;
      else if (mana >= 3000) dmg = 100;
      else if (mana >= 2000) dmg = 125;
      else if (mana >= 1000) dmg = 150;
      else if (mana >= 1) dmg = 175;
      pointAttack(this, target, { damage: dmg });
    },
  },
  
  legionnaire_line_formation: {
    name: "Линия легионеров",
    coolDown: 8,
    type: "Размещение области (5х1)",
    putBy: "Легионер",
    coordinates: 1,
    affiliate: "ally",
    buildingStats: {
      name: "Линия легионеров",
      HP: 400,
    },
    effect: (legionnaire, matchState) => {
      // Ставим условный объект "линия из 5 клеток"
      // Можно рассчитать клетки: legionnaire посередине, +2 слева, +2 справа
      // Упрощённо:
      matchState.objectsOnMap.push({
        id: `LegionWall_${Date.now()}`,
        type: "building",
        coordinates: legionnaire.position, // и далее логику, как именно расставить
        stats: { HP: 400 },
        name: "Линия легионеров",
      });
    },
  },

  legionnaire_agility_stack: {
    name: "Боевой азарт (пассивно)",
    coolDown: 0,
    type: "Пассивная способность",
    putBy: "Легионер",
    affiliate: "neutral",
    effect: (legion) => {
      // При каждом попадании подряд +1 ловкость (макс 10).
      // Если пропустил ход без атаки – сброс.
      legion.effects.push({
        name: "Боевой азарт",
        effectType: "passive",
        permanent: true,
        onAttack: (char, target, success) => {
          if (!success) return;
          char.advancedSettings.hitStreak =
            (char.advancedSettings.hitStreak || 0) + 1;
          if (char.advancedSettings.hitStreak > 0) {
            // +1 ловкость
            const newAgi = Math.min(char.stats.current.Ловкость + 1, 10);
            char.stats.current.Ловкость = newAgi;
          }
        },
        onTurnEnd: (char) => {
          // Проверяем, атаковал ли он в этом ходу
          // Если нет – сбрасываем
          // Логику отслеживания кто ходил – зависит от вашей системы
          // Условно можно reset
          const attackedThisTurn = true; // заглушка
          if (!attackedThisTurn) {
            char.advancedSettings.hitStreak = 0;
            char.stats.current.Ловкость = char.stats.Ловкость;
          }
        },
      });
    },
  },

  // ──────────────── Палладин ────────────────
  paladin_divine_area: {
    name: "Святая область",
    coolDown: 9,
    type: "Мгновенная область способности",
    putBy: "Палладин",
    coordinates: 0, // вокруг себя
    turnsRemain: 0,
    affiliate: "negative only",
    stats: {
      rangeOfObject: 5,
      damage: 150,
      damageType: "магический",
      rangeShape: "circle",
      rangeColor: "#f0f0f0",
    },
    zoneEffect: (affectedChars) => {
      // Наносит 150 маг.урона всем в радиусе 5
      affectedChars.forEach((ch) => {
        ch.currentHP -= 150;
      });
    },
  },

  paladin_hammer_throw: {
    name: "Бросок молота",
    coolDown: 8,
    type: "Луч",
    putBy: "Палладин",
    coordinates: 6,
    affiliate: "negative only",
    stats: {
      damage: 125,
      damageType: "физический",
      beamWidth: 1,
    },
    beamEffect: function (targets) {
      multiAttack(this, targets);
    },
  },

  paladin_holy_explosion: {
    name: "Святая вспышка",
    coolDown: 12,
    type: "Мгновенная область способности",
    putBy: "Палладин",
    coordinates: 0,
    affiliate: "negative only",
    stats: {
      rangeOfObject: 4,
      damage: 200,
      damageType: "магический",
      rangeShape: "circle",
      rangeColor: "#fff1a8",
    },
    zoneEffect: (affectedChars) => {
      affectedChars.forEach((ch) => {
        ch.currentHP -= 200;
      });
    },
  },
  // ──────────────── Минотавр ────────────────
  minotaur_charge_beam: {
    name: "Удар рогами (луч + перемещение)",
    coolDown: 4,
    type: "Луч с перемещением",
    putBy: "Минотавр",
    coordinates: 4, // 4 клетки по прямой
    affiliate: "negative only",
    stats: {
      damage: 200,
      damageType: "физический",
      pushEnemies: true, // знак, что двигает врагов
    },
    effect: function (targets) {
      // Для каждого, кто попал в луч, наносим 200 урона, сдвигаем назад
      multiAttack(this, targets);
      // Перемещаем самого Минотавра на конечную точку луча (или в последний занятый)
    },
  },

  minotaur_hammer_legs: {
    name: "Удар по ногам",
    coolDown: 4,
    type: "Точечное наложение эффекта",
    putBy: "Минотавр",
    coordinates: 1,
    turnsRemain: 2, // действует 2 хода
    affiliate: "negative only",
    stats: {
      damagePerTurn: 75,
    },
    effect: (target, minotaur) => {
      // 2 хода по 75 урона/ход + отнимает половину ловкости
      const lostAgi = Math.floor(target.stats.current.Ловкость / 2);
      target.stats.current.Ловкость -= lostAgi;

      target.effects.push({
        name: "Удар по ногам (оглушение)",
        effectType: "negative",
        turnsRemain: 2,
        onTick: (ch) => {
          ch.currentHP -= 75;
        },
        consequence: (ch) => {
          // Возврат ловкости
          ch.stats.current.Ловкость += lostAgi;
        },
      });
    },
  },

  minotaur_aoe_strike: {
    name: "Область удара (3 клетки вокруг)",
    coolDown: 3,
    type: "Размещение области (моментальный урон)",
    putBy: "Минотавр",
    coordinates: 0, // вокруг себя
    affiliate: "negative only",
    stats: {
      damage: 150,
      damageType: "физический",
      rangeOfObject: 3,
      rangeShape: "circle",
    },
    zoneEffect: (affectedCharacters) => {
      // Всем наносим 150
      affectedCharacters.forEach((ch) => {
        ch.currentHP -= 150;
      });
    },
  },

  // ──────────────── Мститель ────────────────
  // (Судя по описанию, первый пункт – "С шансом наносит один из эффектов ниже",
  //  но это не очень конкретно. Ниже - условный пример.)

  avenger_random_effect: {
    name: "Случайный эффект",
    coolDown: 10,
    type: "Точечное действие",
    putBy: "Мститель",
    affiliate: "negative only",
    effect: (avenger, target, matchState) => {
      // Случайный выбор эффекта (просто пример)
      const roll = Math.floor(Math.random() * 3) + 1;
      if (roll === 1) {
        // эффект 1
        target.currentHP -= 50;
      } else if (roll === 2) {
        // эффект 2
        target.stats.current.Ловкость = Math.max(
          0,
          target.stats.current.Ловкость - 2
        );
      } else {
        // эффект 3
        target.functions.actionAbility = false;
        target.effects.push({
          name: "Эффект блока действий",
          effectType: "negative",
          turnsRemain: 2,
          consequence: (ch) => {
            ch.functions.actionAbility = true;
          },
        });
      }
    },
  },

  avenger_punish_effect: {
    name: "Клеймо возмездия",
    coolDown: 10,
    type: "Точечное наложение эффекта",
    putBy: "Мститель",
    coordinates: 1,
    turnsRemain: 4,
    affiliate: "negative only",
    effect: (target, avenger) => {
      // 4 хода: цель не может атаковать мстителя, получает +50% урона
      target.effects.push({
        name: "Клеймо возмездия",
        effectType: "negative",
        turnsRemain: 4,
        onDamageTaken: (ch, dmg, dmgType, source) => {
          // если урон от кого-то, увеличиваем на 50%
          return dmg * 1.5;
        },
        onTryAttack: (ch, victim) => {
          // если victim == avenger, запретить
          if (victim === avenger) {
            return false;
          }
          return true;
        },
      });
    },
  },

  avenger_remove_effects: {
    name: "Снятие эффектов",
    coolDown: 7,
    type: "Точечное действие",
    putBy: "Мститель",
    coordinates: 1,
    affiliate: "neutral",
    effect: (avenger, target) => {
      // Снимаем все эффекты, наложенные персонажем?
      // Нужно уточнить, кем они наложены. Для упрощения — снимаем все эффекты
      target.effects = [];
    },
  },

  // ──────────────── Крестоносец ────────────────
  crusader_heal_allies: {
    name: "Массовое восстановление",
    coolDown: 10,
    type: "Область (союзники)",
    putBy: "Крестоносец",
    coordinates: 999, // условно "по всей карте" или нет
    affiliate: "ally",
    effect: (crusader, matchState) => {
      // Восстанавливает 150 HP всем живым союзникам
      ["red", "blue"].forEach((teamKey) => {
        matchState.teams[teamKey].characters.forEach((ch) => {
          if (ch.currentHP > 0) {
            ch.currentHP = Math.min(ch.stats.HP, ch.currentHP + 150);
          }
        });
      });
    },
  },

  crusader_shield_ally: {
    name: "Щит на союзника",
    coolDown: 7,
    type: "Точка",
    putBy: "Крестоносец",
    coordinates: 5, // 5 клеток
    turnsRemain: 3,
    affiliate: "ally",
    buildingStats: {
      HP: 400,
    },
    effect: (target, crusader) => {
      // Вешаем на 3 хода щит (400 HP)
      target.effects.push({
        name: "Святой щит",
        effectType: "positive",
        turnsRemain: 3,
        remainingStats: {
          HP: 400,
        },
      });
    },
  },

  crusader_global_beam: {
    name: "Луч креста",
    coolDown: 12,
    type: "Луч",
    putBy: "Крестоносец",
    coordinates: 999,
    affiliate: "negative only",
    canGoThroughWalls: true,
    stats: {
      damage: 150,
      damageType: "физический",
      beamWidth: 1,
    },
    beamEffect: function (targets) {
      multiAttack(this, targets);
    },
  },

  // ──────────────── Воздушный монах ────────────────
  wind_monk_wind_dome: {
    name: "Купол ветра",
    coolDown: 4,
    type: "Эффект на себя",
    putBy: "Воздушный монах",
    coordinates: 1,
    turnsRemain: 3,
    affiliate: "positive only",
    stats: {
      domeHP: 200,
      agilityBonus: 2,
    },
    effect: (monk) => {
      // На 3 хода создаёт купол (200 HP), +2 ловкости, но монах не может атаковать
      monk.stats.current.Ловкость += 2;
      monk.functions.actionAbility = false; // запрет атак?

      monk.effects.push({
        name: "Купол ветра",
        effectType: "positive",
        turnsRemain: 3,
        remainingStats: {
          HP: 200,
        },
        consequence: (ch) => {
          ch.stats.current.Ловкость -= 2;
          ch.functions.actionAbility = true;
        },
      });
    },
  },

  wind_monk_hurricane: {
    name: "Ураган",
    coolDown: 7,
    type: "Размещение области с эффектом зоны",
    putBy: "Воздушный монах",
    coordinates: 0, // вокруг себя?
    turnsRemain: 2,
    affiliate: "negative only",
    stats: {
      rangeOfObject: 7,
      damage: 25,
      damageType: "физический",
      rangeShape: "circle",
    },
    zoneEffect: (affectedChars, zoneCenter) => {
      // Притягивает к центру на их ловкость (или ловкость монаха?)
      affectedChars.forEach((ch) => {
        // Пример: dx, dy => движем ch.position
        // Далее 25 урона/ход
        ch.currentHP -= 25;
      });
    },
  },

  wind_monk_bloody_fog: {
    name: "Кровавый туман",
    coolDown: 12,
    type: "Размещение области с эффектом зоны",
    putBy: "Воздушный монах",
    coordinates: 0,
    turnsRemain: 5,
    affiliate: "negative only",
    stats: {
      rangeOfObject: 5,
      damage: 75,
      damageType: "магический",
      rangeShape: "circle",
    },
    zoneEffect: (affectedChars) => {
      // Наносит 75/ход
      // Ловкость всех противников -1/2
      affectedChars.forEach((ch) => {
        ch.currentHP -= 75;
        const lostAgi = Math.floor(ch.stats.current.Ловкость / 2);
        ch.stats.current.Ловкость -= lostAgi;

        ch.effects.push({
          name: "Кровавый туман",
          effectType: "negative",
          turnsRemain: 1, // обновляется каждый ход?
          consequence: (char) => {
            char.stats.current.Ловкость += lostAgi;
          },
        });
      });
    },
  },
  // ──────────────── Древний ────────────────
  drevniy_wall_square: {
    name: "Квадрат из стен",
    coolDown: 10,
    type: "Размещение области (постройки)",
    putBy: "Древний",
    coordinates: 0,
    affiliate: "neutral",
    // 3x3 неразрушимые стены на 7 ходов
    // Псевдокод: создаём 9 клеток-стен
    turnsRemain: 7,
    effect: (caster, matchState) => {
      // В центре caster.position, вокруг — 3x3
      // Упрощённо:
      const midPos = caster.position;
      // Превратить это в массив клеток, создать там объекты "стена"
      // ...
    },
  },

  drevniy_mud_wave: {
    name: "Грязевая волна",
    coolDown: 8,
    type: "Луч",
    putBy: "Древний",
    coordinates: 5,
    affiliate: "negative only",
    stats: {
      damage: 175,
      damageType: "физический",
      beamWidth: 3,
    },
    beamEffect: function (targets) {
      multiAttack(this, targets);
    },
  },

  drevniy_remove_negative: {
    name: "Снятие негативных эффектов",
    coolDown: 10,
    type: "Точечное действие",
    putBy: "Древний",
    coordinates: 1,
    affiliate: "positive only",
    // Снимает все негативные эффекты и даёт иммунитет на 5 ходов
    effect: (target, caster) => {
      // Удаляем негативные эффекты:
      target.effects = target.effects.filter(
        (eff) => eff.effectType !== "negative"
      );

      // Накладываем иммунитет от негативных эффектов
      target.effects.push({
        name: "Иммунитет к негативным эффектам",
        effectType: "positive",
        turnsRemain: 5,
        onTryApplyEffect: (char, incomingEffect) => {
          if (incomingEffect.effectType === "negative") {
            return false;
          }
          return true;
        },
      });
    },
  },

  // ──────────────── Леприкон ────────────────
  leprechaun_area_4_150: {
    name: "Область (радиус 4, 150 урона)",
    coolDown: 8,
    type: "Мгновенная область способности",
    putBy: "Леприкон",
    coordinates: 0,
    affiliate: "negative only",
    stats: {
      rangeOfObject: 4,
      damage: 150,
      damageType: "магический",
      rangeShape: "circle",
    },
    zoneEffect: (affectedChars) => {
      affectedChars.forEach((ch) => {
        if (ch.name !== "Леприкон") {
          if (ch.currentArmor == 0) {
            ch.currentHP -= 150;
          } else if (ch.currentArmor == 1) {
            ch.currentArmor -= 1;
            ch.currentHP -= 75;
          } else {
            ch.currentArmor -= 2;
          }
        }
      });
    },
  },

  leprechaun_global_teleport: {
    name: "Телепорт по карте",
    coolDown: 12,
    type: "Телепортация",
    putBy: "Леприкон",
    affiliate: "neutral",
    distance: "map",
  },

  leprechaun_area_5_200: {
    name: "Область (радиус 5, 200 урона)",
    coolDown: 10,
    type: "Мгновенная область способности",
    putBy: "Леприкон",
    coordinates: 0,
    affiliate: "negative only",
    stats: {
      rangeOfObject: 5,
      damage: 200,
      damageType: "магический",
      rangeShape: "circle",
    },
    zoneEffect: (affectedChars) => {
      affectedChars.forEach((ch) => {
        if (ch.name !== "Леприкон") {
          if (ch.currentArmor == 0) {
            ch.currentHP -= 200;
          } else if (ch.currentArmor == 1) {
            ch.currentArmor -= 1;
            ch.currentHP -= 100;
          } else {
            ch.currentArmor -= 2;
          }
        }
      });
    },
  },

  // ──────────────── Дракула ────────────────
  dracula_move_8: {
    name: "Перемещение (область 8)",
    coolDown: 8,
    type: "Телепортация",
    putBy: "Дракула",
    coordinates: 8,
    affiliate: "neutral",
    distance: 8,
  },

  dracula_drain_100: {
    name: "Перекачка 100 HP",
    coolDown: 8,
    type: "Точечное действие",
    putBy: "Дракула",
    coordinates: 1,
    affiliate: "neutral",
    effect: (caster, target) => {
      // Забираем 100 HP у цели (союзник или враг), передаём Дракуле
      const stolen = Math.min(100, target.currentHP);
      target.currentHP -= stolen;
      caster.currentHP = Math.min(caster.stats.HP, caster.currentHP + stolen);
    },
  },

  dracula_area_3_75x2: {
    name: "Область (радиус 3, 75 урона/ход, 2 хода)",
    coolDown: 10,
    type: "Размещение области с эффектом зоны",
    putBy: "Дракула",
    coordinates: 0,
    turnsRemain: 2,
    affiliate: "negative only",
    stats: {
      rangeOfObject: 3,
      damage: 75,
      damageType: "магический",
      rangeShape: "circle",
    },
    zoneEffect: (affectedChars) => {
      // Каждый ход зона наносит 75
      affectedChars.forEach((ch) => {
        ch.currentHP -= 75;
      });
    },
  },

  // ──────────────── Пламенный шаман ────────────────
  flame_shaman_damage_boost_area: {
    name: "Зона усиления урона",
    coolDown: 10,
    type: "Размещение области (2 хода)",
    putBy: "Пламенный шаман",
    coordinates: 0,
    turnsRemain: 2,
    affiliate: "ally",
    stats: {
      rangeOfObject: 4,
      rangeShape: "circle",
    },
    zoneEffect: (affectedAllies) => {
      // +100 к урону союзникам внутри
      affectedAllies.forEach((ch) => {
        ch.stats.current.Урон += 100;
        ch.effects.push({
          name: "Усиление урона",
          effectType: "positive",
          turnsRemain: 1, // На каждый ход обновляется?
          consequence: (char) => {
            char.stats.current.Урон -= 100;
          },
        });
      });
    },
  },

  flame_shaman_meteor: {
    name: "Метеор (4 клетки)",
    coolDown: 10,
    type: "Точка",
    putBy: "Пламенный шаман",
    distance: 4,
    affiliate: "negative only",
    stats: {
      damage: 250,
      damageType: "магический",
    },
    effect: function (target) {
      pointAttack(this, target);
    },
  },

  flame_shaman_phoenix: {
    name: "Призыв Феникса",
    coolDown: 10,
    type: "Размещение постройки (10 ходов)",
    putBy: "Пламенный шаман",
    coordinates: 4,
    affiliate: "ally",
    buildingStats: {
      name: "Феникс",
      HP: 300,
      duration: 10, // 10 ходов
      radius: 4,
      damagePerTurn: 125,
    },
    effect: (shaman, matchState) => {
      // Ставим феникса, который каждый ход бьёт 125 по одному врагу в радиусе 4
      const phoenixObj = {
        id: `Phoenix_${Date.now()}`,
        type: "building",
        coordinates: shaman.position, // или targetCoord
        stats: {
          HP: 300,
        },
        name: "Феникс",
        isActive: true,
        turnsRemain: 10,
        effectEachTurn: (state) => {
          // Ищем врага в радиусе 4 и наносим 125
        },
      };
      matchState.objectsOnMap.push(phoenixObj);
    },
  },

  // ──────────────── Пикси-целитель ────────────────
  pixie_agility_up: {
    name: "Повышение ловкости",
    coolDown: 8,
    type: "Эффект на себя",
    putBy: "Пикси-целитель",
    coordinates: 1,
    affiliate: "positive only",
    effect: (pixie) =>     agilityBoost(pixie, {
      amount:      2,
      duration:    2,
      description: "Увеличивает ловкость Пикси на 2 на 2 хода",
    }),
  },

  pixie_healing_on_hit: {
    name: "Лечение при ударе",
    coolDown: 8,
    type: "Пассивно на 2 хода? или Точечное наложение эффекта",
    putBy: "Пикси-целитель",
    coordinates: 1,
    turnsRemain: 2,
    affiliate: "positive only",
    // Пример: Пока длится эффект, когда Пикси бьёт врага, восстанавливает HP выбранному союзнику
    effect: (pixie, chosenAlly) => {
      pixie.effects.push({
        name: "Лечение при ударе",
        effectType: "positive",
        turnsRemain: 2,
        onAttack: (char, target, damageDealt) => {
          // Допустим, восстанавливаем 50 HP chosenAlly
          chosenAlly.currentHP = Math.min(
            chosenAlly.stats.HP,
            chosenAlly.currentHP + 50
          );
        },
      });
    },
  },

  pixie_area_regen: {
    name: "Область лечения (2 радиус, 4 хода)",
    coolDown: 10,
    type: "Размещение области с эффектом зоны",
    putBy: "Пикси-целитель",
    coordinates: 0,
    turnsRemain: 4,
    affiliate: "ally",
    stats: {
      rangeOfObject: 2,
      healPerTurn: 75,
      rangeShape: "circle",
    },
    zoneEffect: (affectedAllies) => {
      // Каждому союзнику восстанавливаем 75 HP/ход
      affectedAllies.forEach((ch) => {
        ch.currentHP = Math.min(ch.stats.HP, ch.currentHP + 75);
      });
    },
  },

  // ──────────────── Кровавый маг ────────────────
  bloodmage_maxhp10p: {
    name: "Удар по максимуму HP (10%)",
    // Цена в НР (нет прямого coolDown, но допустим 0, чтобы не конфликтовать)
    // Или если нужна перезарядка, ставим 0, а учитываем затраты HP
    coolDown: 0,
    type: "Точечное действие",
    putBy: "Кровавый маг",
    coordinates: 3,
    affiliate: "negative only",
    // Логика: Кровавый маг платит 100 HP, наносит противнику 10% от его макс. HP
    effect: (mage, target) => {
      // Кровавый маг теряет 100 HP
      mage.currentHP = Math.max(0, mage.currentHP - 100);
      // Снимаем 10% от максимального HP цели
      const damage = Math.floor(target.stats.HP * 0.1);
      target.currentHP = Math.max(0, target.currentHP - damage);
    },
  },

  bloodmage_dot1percent10: {
    name: "Кровавый дот (1%*10 ходов)",
    coolDown: 0,
    type: "Точечное наложение эффекта",
    putBy: "Кровавый маг",
    coordinates: 3,
    affiliate: "negative only",
    // Логика: платим 50 HP, вешаем 10-ходовый дот по 1% HP/ход
    effect: (mage, target) => {
      mage.currentHP = Math.max(0, mage.currentHP - 50);
      target.effects.push({
        name: "Кровавый дот",
        effectType: "negative",
        turnsRemain: 10,
        onTick: (ch) => {
          const dmg = Math.floor(ch.stats.HP * 0.01);
          ch.currentHP = Math.max(0, ch.currentHP - dmg);
        },
      });
    },
  },

  bloodmage_heal_increasing: {
    name: "Возрастающее восстановление",
    coolDown: 6,
    type: "Точечное действие",
    putBy: "Кровавый маг",
    affiliate: "positive only",
    // Накапливающийся эффект: 1-й раз +5%, 2-й +10%, 3-й +20%, 4-й +40%, 5-й +80%...
    effect: (mage) => {
      mage.advancedSettings.healTimes =
        (mage.advancedSettings.healTimes || 0) + 1;
      let healPercent = 5;
      if (mage.advancedSettings.healTimes === 2) healPercent = 10;
      else if (mage.advancedSettings.healTimes === 3) healPercent = 20;
      else if (mage.advancedSettings.healTimes === 4) healPercent = 40;
      else if (mage.advancedSettings.healTimes >= 5) healPercent = 80;

      const healAmount = Math.floor((mage.stats.HP * healPercent) / 100);
      mage.currentHP = Math.min(mage.stats.HP, mage.currentHP + healAmount);
    },
  },

  // ──────────────── Бомбардировщик ────────────────
  bomber_fly8: {
    name: "Пролёт 8 клеток + полёт 10 ходов",
    coolDown: 5,
    type: "Луч с перемещением",
    putBy: "Бомбардировщик",
    coordinates: 8,
    canGoThroughWalls: false,
    affiliate: "neutral",
    effect: (bomber, pathCells, matchState) => {
      // Пролетает 8 клеток, bomber.position -> final
      bomber.position = pathCells[pathCells.length - 1];
      // Включаем "полёт" на 10 ходов
      bomber.effects.push({
        name: "Полёт",
        effectType: "positive",
        turnsRemain: 10,
        canFly: true,
        consequence: (ch) => {
          ch.canFly = false;
        },
      });
    },
  },

  bomber_drop_bomb: {
    name: "Сброс бомбы (150 урона, радиус 2)",
    coolDown: 5,
    type: "Размещение области (моментальный)",
    putBy: "Бомбардировщик",
    coordinates: 2,
    affiliate: "negative only",
    stats: {
      damage: 150,
      damageType: "физический",
      rangeOfObject: 2,
    },
    effect: (bomber, targetCoord, matchState) => {
      // Выбрали точку, в радиусе 2 все на земле получают 150
      // Если кто-то "в полёте" — не получают (учитывая особенность "персонаж на земле")
      // ...
    },
  },

  bomber_line_damage: {
    name: "Пролёт 5 клеток (ширина 3), урон 100",
    coolDown: 5,
    type: "Луч",
    putBy: "Бомбардировщик",
    coordinates: 5,
    affiliate: "negative only",
    stats: {
      damage: 100,
      damageType: "физический",
      patternWidth: 3,
    },
    beamEffect: function (targets) {
      multiAttack(this, targets);
    },
  },

  // ──────────────── Риот ────────────────
  riot_shot150: {
    name: "Выстрел 150",
    coolDown: 3,
    type: "Точка",
    putBy: "Риот",
    distance: 7, // дальность 7
    affiliate: "negative only",
    stats: {
      damage: 150,
      damageType: "физический",
    },
    effect: function (target) {
      pointAttack(this, target);
    },
  },

  riot_pull50: {
    name: "Притяжение (50 урона)",
    coolDown: 5,
    type: "Точечное действие перемещения",
    putBy: "Риот",
    coordinates: 8,
    affiliate: "negative only",
    stats: {
      damage: 50,
    },
    effect: (attacker, target) => {
      // Цель получает 50 урона
      target.currentHP -= 50;
      // Притягиваем к Риоту (можно и "перебросить" через него)
      target.position = attacker.position;
    },
  },

  riot_cross_explosion: {
    name: "Взрыв (крест 2х2), 150 урона + бонус золото",
    coolDown: 6,
    type: "Размещение области",
    putBy: "Риот",
    coordinates: 0,
    affiliate: "negative only",
    stats: {
      shape: "cross", // 2 в каждую сторону?
      damage: 150,
      damageType: "физический",
    },
    zoneEffect: (affectedChars, matchState) => {
      affectedChars.forEach((ch) => {
        // наносим 150 урона
        ch.currentHP -= 150;
        // Если убили, команда получает +50% золота (пример)
        if (ch.currentHP <= 0) {
          // matchState.teams[attackerTeam].gold += extraGold
          // ...
        }
      });
    },
  },

  // ──────────────── Мушкетёр ────────────────
  musketeer_big_shot: {
    name: "Усиленный выстрел",
    coolDown: 7,
    type: "Луч",
    putBy: "Мушкетёр",
    coordinates: 6, // линия 6 клеток
    affiliate: "negative only",
    stats: {
      damage: 150,
      damageType: "физический",
    },
    beamEffect: function (targets) {
      multiAttack(this, targets);
    },
  },

  musketeer_wall_pierce: {
    name: "Выстрел сквозь стены",
    coolDown: 4,
    type: "Точка",
    putBy: "Мушкетёр",
    coordinates: 5,
    affiliate: "negative only",
    stats: {
      damage: 80,
      damageType: "физический",
      ignoreWalls: true,
    },
    effect: function (target) {
      pointAttack(this, target);
    },
  },

  musketeer_area_10_200: {
    name: "Широкая область (радиус 10, 200 урона)",
    coolDown: 12,
    type: "Мгновенная область способности",
    putBy: "Мушкетёр",
    coordinates: 10,
    affiliate: "negative only",
    stats: {
      rangeOfObject: 10,
      damage: 200,
      damageType: "технический",
      rangeShape: "circle",
    },
    zoneEffect: (affectedChars) => {
      affectedChars.forEach((ch) => {
        if (ch.name !== "Мушкетёр") {
          if (ch.currentArmor == 0) {
            ch.currentHP -= 200;
          } else {
            ch.currentArmor -= 1;
          }
        }
      });
    },
  },

  // ──────────────── Снайпер ────────────────
  sniper_bomb_halfmap: {
    name: "Сброс бомбы (на своей половине карты)",
    coolDown: 15,
    type: "Точечное действие",
    putBy: "Снайпер",
    affiliate: "negative only",
    stats: {
      damage: 100,
    },
    effect: (sniper, targetCoord, matchState) => {
      // Наносим 100 урона в выбранной точке своей половины карты
      // (Можно оформить как область 1 клетку)
      // ...
    },
  },

  sniper_invisibility: {
    name: "Невидимость",
    coolDown: 15,
    type: "Эффект на себя",
    putBy: "Снайпер",
    coordinates: 1,
    affiliate: "neutral",
    stats: {
      maxDuration: 3, // до 3 ходов
    },
    effect: (sniper) => {
      sniper.effects.push({
        name: "Невидимость",
        effectType: "positive",
        customRemoveCondition: (eff, ch, state) => {
          // если атакует - развеиваем
          // или если юзер отменяет
          return false;
        },
      });
    },
  },

  sniper_25percent_shot: {
    name: "Усиленный выстрел 25% HP",
    coolDown: 10,
    type: "Точка",
    putBy: "Снайпер",
    coordinates: 10,
    affiliate: "negative only",
    stats: {
      damageType: "физический",
      requiredPreparation: true,
      damage: 100,
    },
    effect: function (target) {
      pointAttack(this, target);
      this.effects.push({
        name: "Подготовка",
        effectType: "positive",
        turnsRemain: 1,
      });
    },
  },

  // ──────────────── Лесной брат ────────────────
  forest_melee_blade: {
    name: "Ближний клинок",
    coolDown: 0, // пассивка
    type: "Точка",
    putBy: "Лесной брат",
    affiliate: "negative only",
    coordinates: 1,
    stats: {
      damage: 125,
      damageType: "физический",
    },
    effect: function (target) {
      pointAttack(this, target);
    },
  },

  forest_poison_arrow: {
    name: "Отравленная стрела",
    coolDown: 5,
    type: "Точка",
    putBy: "Лесной брат",
    coordinates: 7,
    affiliate: "negative only",
    stats: {
      damageFirst: 100,
      damageSecond: 75,
    },
    effect: function (target) {
      pointAttack(this, target);
      target.effects.push({
        name: "Отравление",
        effectType: "negative",
        turnsRemain: 1,
        onTick: (ch) => {
          ch.currentHP -= 75;
        },
      });
    },
  },

  forest_area_fire: {
    name: "Область (радиус 4), 1 ход 150 (тех), ещё 3 хода по 50 (физ.)",
    coolDown: 12,
    type: "Размещение области с эффектом зоны",
    putBy: "Лесной брат",
    coordinates: 4,
    turnsRemain: 4,
    affiliate: "negative only",
    stats: {
      damageFirst: 150,
      damageNext: 50,
      rangeOfObject: 4,
      rangeShape: "circle",
    },
    zoneEffect: (affectedChars, zoneCenter, turnInZone) => {
      // turnInZone = 1 => 150 тех.урона
      // turnInZone = 2..4 => 50 физ.урона
      if (turnInZone === 1) {
        affectedChars.forEach((ch) => (ch.currentHP -= 150));
      } else {
        affectedChars.forEach((ch) => (ch.currentHP -= 50));
      }
    },
  },

  // ──────────────── Палач ────────────────
  palach_absorb_hit: {
    name: "Поглощение 50% урона (1 удар)",
    coolDown: 5,
    type: "Эффект на себя",
    putBy: "Палач",
    coordinates: 1,
    affiliate: "neutral",
    effect: (palach) => {
      // действует 1 раз
      palach.effects.push({
        name: "Поглощение удара",
        effectType: "positive",
        turnsRemain: 1,
        onDamageTaken: (ch, damage) => {
          // снижаем на 50%
          return Math.floor(damage / 2);
        },
      });
    },
  },

  palach_axe_legs: {
    name: "Удар по ногам (50 dmg, -50% ловкости)",
    coolDown: 7,
    type: "Точечное наложение эффекта",
    putBy: "Палач",
    coordinates: 1,
    affiliate: "negative only",
    turnsRemain: 3,
    effect: (target) => {
      // Мгновенный урон 50
      target.currentHP -= 50;
      // Отнимаем 50% ловкости на 3 хода
      const lostAgi = Math.floor(target.stats.current.Ловкость / 2);
      target.stats.current.Ловкость -= lostAgi;

      target.effects.push({
        name: "Рубка ног",
        effectType: "negative",
        turnsRemain: 3,
        consequence: (ch) => {
          ch.stats.current.Ловкость += lostAgi;
        },
      });
    },
  },

  palach_forced_taunt: {
    name: "Провокация на 2 хода",
    coolDown: 12,
    type: "Точечное наложение эффекта",
    putBy: "Палач",
    coordinates: 1,
    affiliate: "negative neutral",
    turnsRemain: 2,
    effect: (target, palach) => {
      // Враги могут бить только Палача 2 хода
      target.effects.push({
        name: "Провокация Палача",
        effectType: "negative",
        turnsRemain: 2,
        onTryAttack: (ch, victim) => {
          // если victim не Палач, запретить
          if (victim !== palach) {
            return false;
          }
          return true;
        },
      });
    },
  },

  // ──────────────── Жнец ────────────────
  reaper_finisher: {
    name: "Финишёр (150 урона при <50% HP)",
    coolDown: 8,
    type: "Точечное действие с перемещением",
    putBy: "Жнец",
    coordinates: 1,
    affiliate: "negative only",
    stats: {
      damage: 150,
      damageType: "физический",
    },
    effect: (reaper, target, matchState) => {
      // Проверяем: у цели <= 50% HP?
      if (target.currentHP <= target.stats.HP / 2) {
        // Перемещаемся к цели
        reaper.position = target.position;
        // Наносим 150 физ. урона
        target.currentHP -= 150;
      }
    },
  },

  reaper_drain_life: {
    name: "Выкачка жизненной энергии (100 сквозь броню)",
    coolDown: 4,
    type: "Точечная атака",
    putBy: "Жнец",
    coordinates: 2,
    affiliate: "negative only",
    stats: {
      damage: 100,
      damageType: "магический",
      ignoreArmor: true,
    },
    effect: (reaper, target) => {
      // 100 урона, игнорируя броню
      target.currentHP -= 100;
    },
  },

  reaper_save_ally: {
    name: "Спасение союзника (пассивно)",
    coolDown: 0,
    type: "Пассивная способность",
    putBy: "Жнец",
    affiliate: "positive only",
    // При смертельном уроне союзнику, Жнец тратит 100 HP и даёт союзнику 100 HP
    effect: (reaper) => {
      reaper.effects.push({
        name: "Спасение союзника",
        effectType: "passive",
        permanent: true,
        onAllyFatalHit: (ally, damage) => {
          // if reaper.currentHP >= 100 ...
          reaper.currentHP = Math.max(0, reaper.currentHP - 100);
          ally.currentHP = Math.min(ally.stats.HP, 100);
        },
      });
    },
  },

  // ──────────────── Рыцарь тьмы ────────────────
  dark_knight_armorbreak150: {
    name: "Снос брони (150 или -3 брони)",
    coolDown: 6,
    type: "Точечная атака",
    putBy: "Рыцарь тьмы",
    coordinates: 1,
    affiliate: "negative only",
    effect: (knight, target) => {
      // Если у цели есть >=3 брони, сносит 3 брони, иначе наносит 150 урона
      if (target.currentArmor >= 3) {
        target.currentArmor = Math.max(0, target.currentArmor - 3);
      } else {
        target.currentHP -= 150;
      }
    },
  },

  dark_knight_damage_aura: {
    name: "Аура тьмы (радиус 3, +50 урона союзникам, 5 ходов)",
    coolDown: 10,
    type: "Размещение области с эффектом зоны",
    putBy: "Рыцарь тьмы",
    coordinates: 0,
    turnsRemain: 5,
    affiliate: "positive only",
    stats: {
      rangeOfObject: 3,
      rangeShape: "circle",
      damageBuff: 50,
    },
    zoneEffect: (affectedAllies) => {
      // Всем союзникам в зоне +50 урона
      affectedAllies.forEach((ch) => {
        ch.stats.current.Урон += 50;
        ch.effects.push({
          name: "Увеличение урона (Рыцарь тьмы)",
          effectType: "positive",
          turnsRemain: 5,
          consequence: (char) => {
            char.stats.current.Урон -= 50;
          },
        });
      });
    },
  },

  dark_knight_strike_crit50: {
    name: "Усиленный удар (шанс 50% двойного урона)",
    coolDown: 8,
    type: "Точечная атака",
    putBy: "Рыцарь тьмы",
    coordinates: 1,
    affiliate: "negative only",
    stats: {
      baseDamage: 150,
      critChance: 50,
    },
    effect: (knight, target) => {
      // Бросаем 50% шанс
      const roll = Math.random() * 100;
      let dmg = 150;
      if (roll < 50) {
        dmg *= 2; // двойной
      }
      target.currentHP -= dmg;
    },
  },

  // ──────────────── Балрок ────────────────
  balrog_absorb_magic: {
    name: "Поглощение магии (50%)",
    coolDown: 9,
    type: "Эффект на себя",
    putBy: "Балрок",
    coordinates: 1,
    affiliate: "positive only",
    turnsRemain: 2,
    effect: (balrog) => {
      balrog.effects.push({
        name: "Поглощение магии",
        effectType: "positive",
        turnsRemain: 2,
        onDamageTaken: (ch, dmg, dmgType) => {
          if (dmgType === "магический") {
            // снижаем на 50%
            return Math.floor(dmg / 2);
          }
          return dmg;
        },
      });
    },
  },

  balrog_dispel_negative: {
    name: "Развеять негатив",
    coolDown: 13,
    type: "Точечное действие",
    putBy: "Балрок",
    coordinates: 3,
    affiliate: "ally",
    effect: (balrog, ally) => {
      // Снимаем все негативные эффекты
      ally.effects = ally.effects.filter((e) => e.effectType !== "negative");
    },
  },

  balrog_dark_flame: {
    name: "Тёмное пламя",
    coolDown: 7,
    type: "Точечная атака",
    putBy: "Балрог",
    coordinates: 6,
    affiliate: "negative only",
    stats: {
      damage: 200,
      damageType: "магический",
    },
    effect: function (target) {
      pointAttack(this, target);
    },
  },


  // ──────────────── Король некромантов ────────────────
  necroking_absorb_phys_tech: {
    name: "Поглощение физ./тех. (1.5x маг. входящий)",
    coolDown: 8,
    type: "Эффект на себя",
    putBy: "Король некромантов",
    coordinates: 1,
    turnsRemain: 3,
    affiliate: "positive neutral",
    effect: (king) => {
      king.effects.push({
        name: "Поглощение физ./тех.",
        effectType: "positive",
        turnsRemain: 3,
        onDamageTaken: (ch, dmg, dmgType) => {
          if (dmgType === "физический" || dmgType === "технический") {
            // поглощаем полностью
            return 0;
          } else if (dmgType === "магический") {
            // наносит 1.5x
            return Math.floor(dmg * 1.5);
          }
          return dmg;
        },
      });
    },
  },

  necroking_area_5_damage_per_count: {
    name: "Область (5 радиус), урон = 75*число противников",
    coolDown: 5,
    type: "Мгновенная область способности",
    putBy: "Король некромантов",
    coordinates: 0,
    affiliate: "negative only",
    stats: {
      rangeOfObject: 5,
      damagePerEnemy: 75,
      damageType: "магический",
    },
    zoneEffect: (affectedEnemies) => {
      const count = affectedEnemies.length;
      const damage = 75 * count;
      affectedEnemies.forEach((ch) => {
        if (ch.name !== "Король некромантов") {
          if (ch.currentArmor == 0) {
            ch.currentHP -= damage;
          } else if (ch.currentArmor == 1) {
            ch.currentArmor -= 1;
            ch.currentHP -= Math.ceil(damage / 2);
          } else {
            ch.currentArmor -= 2;
          }
        }
      });
    },
  },

  necroking_mana_drain: {
    name: "Выкачка маны (до 5 ходов)",
    coolDown: 10,
    type: "Точечное наложение эффекта",
    putBy: "Король некромантов",
    coordinates: 1,
    affiliate: "negative only",
    turnsRemain: 5,
    effect: (king, target) => {
      // На каждый ход 1..5: -50, -100, -150, -200, -250 маны
      target.effects.push({
        name: "Выкачка маны",
        effectType: "negative",
        turnsRemain: 5,
        onTick: (ch, tickCount) => {
          // tickCount = 1..5
          let manaLoss = 50 * tickCount;
          ch.currentMana = Math.max(0, ch.currentMana - manaLoss);
        },
      });
    },
  },

  // ──────────────── Броненосец Тао ────────────────
  tao_jump_smash: {
    name: "Прыжок с ударом",
    coolDown: 10,
    type: "Область с перемещением",
    putBy: "Броненосец Тао",
    coordinates: 8, // прыгает на 8 клеток
    affiliate: "negative only",
    stats: {
      damage: 200,
      damageType: "физический",
      rangeOfObject: 4, // радиус 4 в точке приземления
    },
    zoneEffect: (affectedEnemies) => {
      multiAttack(this, affectedEnemies);
    },
  },

  tao_charge_beam: {
    name: "Рывок с лучом",
    coolDown: 7,
    type: "Луч с перемещением",
    putBy: "Броненосец Тао",
    coordinates: 6, // 6 клеток
    affiliate: "negative only",
    stats: {
      damage: 200,
      damageType: "физический",
    },
    beamEffect: function (targets) {
      multiAttack(this, targets);
    },
  },

  // ──────────────── Голиаф ────────────────
  goliath_stone_skin: {
    name: "Каменная кожа",
    coolDown: 10,
    type: "Эффект на себя",
    putBy: "Голиаф",
    coordinates: 1,
    affiliate: "positive only",
    // Щит 300 НР, может держаться до 10 ходов
    effect: (goliath) => {
      shield(goliath, {
        initialHP: goliath.currentHP,
        amount: 300,
        duration: 10,
        description: "Голиаф превращает свою кожу в камень"
      })
    },
  },

  goliath_aoe_slam: {
    name: "Удар по области (2 радиуса, 200 dmg)",
    coolDown: 7,
    type: "Мгновенная область способности",
    putBy: "Голиаф",
    coordinates: 0,
    affiliate: "negative only",
    stats: {
      rangeOfObject: 2,
      damage: 200,
      damageType: "физический",
      rangeShape: "circle",
    },
    zoneEffect: (affectedChars) => {
      affectedChars.forEach((ch) => {
        if (ch.name !== "Голиаф") {
          if (ch.currentArmor == 0) {
            ch.currentHP -= 200;
          } else {
            ch.currentArmor -= 1;
          }
        }
      });
    },
  },

  // ──────────────── Гигант ────────────────
  giant_boulder_throw: {
    name: "Бросок валуна (7 клеток, 150 dmg)",
    coolDown: 10,
    type: "Точечная атака",
    putBy: "Гигант",
    coordinates: 7,
    affiliate: "negative only",
    stats: {
      damage: 150,
      damageType: "физический",
    },
    effect: (caster, target) => {
      target.currentHP -= 150;
    },
  },

  giant_ground_slam: {
    name: "Оглушающий удар по земле (3 радиуса, 300 dmg)",
    coolDown: 12,
    type: "Мгновенная область способности",
    putBy: "Гигант",
    coordinates: 0,
    affiliate: "negative only",
    stats: {
      rangeOfObject: 3,
      damage: 300,
      damageType: "физический",
    },
    zoneEffect: (affectedChars) => {
      affectedChars.forEach((ch) => {
        if (ch.name !== "Гигант") {
          if (ch.currentArmor == 0) {
            ch.currentHP -= 300;
          } else {
            ch.currentArmor -= 1;
          }
        }
      });
    },
  },

  // ──────────────── Страж ────────────────
  guard_flashbang: {
    name: "Свето-шумовая граната (5 радиус, 25 сквозь броню + стан)",
    coolDown: 7,
    type: "Мгновенная область способности",
    putBy: "Страж",
    coordinates: 0,
    affiliate: "negative only",
    stats: {
      rangeOfObject: 5,
      damage: 25,
      damageType: "физический",
      ignoreArmor: true,
    },
    zoneEffect: (affectedEnemies) => {
      // Все получают 25, игнорируя броню, + стан на 1 ход
      affectedEnemies.forEach((ch) => {
        ch.currentHP -= 25; // игнор брони
        ch.functions.actionAbility = false;
        ch.effects.push({
          name: "Оглушение",
          effectType: "negative",
          turnsRemain: 1,
          consequence: (char) => {
            char.functions.actionAbility = true;
          },
        });
      });
    },
  },

  guard_shield_build: {
    name: "Постройка/наложение щита",
    coolDown: 10,
    type: "Точечное действие",
    putBy: "Страж",
    coordinates: 1,
    affiliate: "neutral",
    // Ставит нейтральную постройку "Щит" (300 HP, 3 брони) навсегда
    // Или вешает щит на союзника: +300 HP, +3 брони на 10 ходов
    effect: (guard, target, matchState) => {
      // Если target - "земля" => создаём постройку
      // Если target - союзник => даём эффект
      // условный пример:
      if (target.type === "tile") {
        // Создаём объект
        const shieldObj = {
          id: `Shield_${Date.now()}`,
          type: "building",
          coordinates: target.position,
          name: "Щит (постройка)",
          stats: {
            HP: 300,
            Броня: 3,
          },
        };
        matchState.objectsOnMap.push(shieldObj);
      } else {
        // Вешаем эффект на союзника
        target.stats.current.HP += 300;
        target.stats.current.Броня += 3;
        target.effects.push({
          name: "Щит Стража",
          effectType: "positive",
          turnsRemain: 10,
          consequence: (ch) => {
            ch.stats.current.HP -= 300;
            ch.stats.current.Броня -= 3;
          },
        });
      }
    },
  },

  // ──────────────── Сиехилд ────────────────
  siehild_build_tower: {
    name: "Постройка башни",
    // Перезагружается с начала игры (coolDown = 10),
    // но можно дополнительно учесть флаг "startOverCooldown: true"
    coolDown: 10,
    type: "Размещение постройки",
    putBy: "Сиехилд",
    coordinates: 1,
    affiliate: "neutral",
    buildingStats: {
      name: "Башня Сиехилда",
      HP: 400,
      damage: 75, // маг.
      damageRange: 1,
    },
    effect: (siehild, targetCoord, matchState) => {
      // Ставим башню в targetCoord
      const towerObj = {
        id: `Tower_${Date.now()}`,
        type: "building",
        coordinates: targetCoord,
        stats: {
          HP: 400,
          damage: 75, // маг
          range: 1,
        },
        name: "Башня Сиехилда",
      };
      matchState.objectsOnMap.push(towerObj);
    },
  },

  siehild_upgrade_tower: {
    name: "Улучшение башни",
    coolDown: 10,
    type: "Точечное действие",
    putBy: "Сиехилд",
    coordinates: 1,
    affiliate: "neutral",
    // Улучшает уже построенную башню:
    // HP:400->600, Урон:75->150, Область:1->5x5, Стан:раз в 2 хода
    effect: (siehild, tower, matchState) => {
      if (tower && tower.name === "Башня Сиехилда") {
        tower.stats.HP = 600;
        tower.stats.damage = 150;
        // Условное расширение области (сделаем range=2,
        // или площадь 5x5 - смотря как логика устроена)
        tower.stats.range = 2;
        // Стан (раз в 2 хода) — можно хранить флаг
        tower.stats.stunEvery2 = true;
      }
    },
  },

  // ──────────────── Панцир 3 ────────────────
  panzir3_passive_check_enemies: {
    name: "Пассивная ловкость +2 при 3+ врагах (6 радиус)",
    coolDown: 0, // пассивка
    type: "Пассивная способность",
    putBy: "Панцир 3",
    affiliate: "neutral",
    effect: (panzir) => {
      panzir.effects.push({
        name: "Панцир(3) - пассивка",
        effectType: "passive",
        permanent: true,
        onTurnStart: (ch, matchState) => {
          // Считаем врагов в радиусе 6
          const enemies = []; // Считаем matchState и дистанцию
          if (enemies.length >= 3) {
            ch.stats.current.Ловкость = ch.stats.Ловкость + 2;
          } else {
            ch.stats.current.Ловкость = ch.stats.Ловкость;
          }
        },
      });
    },
  },

  panzir3_repair: {
    name: "Ремонт (до +120 HP, +1 броня)",
    coolDown: 7,
    type: "Точечное действие",
    putBy: "Панцир 3",
    coordinates: 1,
    affiliate: "neutral",
    effect: (panzir) => {
      // +120 HP, если ≤230 HP, +1 броня, если ≤4
      if (panzir.currentHP <= 230) {
        panzir.currentHP = Math.min(panzir.stats.HP, panzir.currentHP + 120);
      }
      if (panzir.currentArmor <= 4) {
        panzir.currentArmor += 1;
      }
    },
  },

  panzir3_burst_shot: {
    name: "Очередь из 5 патронов (50 dmg each) в радиусе 4",
    coolDown: 9,
    type: "Заряды по области",
    putBy: "Панцир 3",
    coordinates: 0,
    affiliate: "negative only",
    stats: {
      rangeOfObject: 4,
      damagePerShot: 50,
      shotsAmount: 5,
      damageType: "физический",
    },
    effectPerAttack: ({ affectedCharacters, addActionLog }) => {
      affectedCharacters.forEach(({ ch, amount }) => {
        if (ch.currentArmor >= 1) {
          ch.currentArmor -= 1;
        } else {
          ch.currentHP -= 50 * amount;
        }
      });
      addActionLog(
        `Способность "Очередь" нанесла урон: ${affectedCharacters
          .map((ac) => ac.ch.name)
          .join(", ")}`
      );
    },
  },

  // ──────────────── Сталевар ────────────────
  stalevar_plasma_shot: {
    name: "Плазменный выстрел (7 клеток, 150 dmg)",
    coolDown: 7,
    type: "Точечная атака",
    putBy: "Сталевар",
    coordinates: 7,
    affiliate: "negative only",
    stats: {
      damage: 150,
      damageType: "технический",
    },
    effect: (caster, target) => {
      target.currentHP -= 150;
    },
  },

  stalevar_regen4x50: {
    name: "Восстановление (4 хода, +50 HP/ход)",
    coolDown: 12,
    type: "Точечное наложение эффекта",
    putBy: "Сталевар",
    coordinates: 1,
    affiliate: "positive only",
    turnsRemain: 4,
    effect: (stalevar) => {
      // +50 HP/ход, 4 хода
      stalevar.effects.push({
        name: "Ремонт Сталевара",
        effectType: "positive",
        turnsRemain: 4,
        onTick: (ch) => {
          ch.currentHP = Math.min(ch.stats.HP, ch.currentHP + 50);
        },
      });
    },
  },

  stalevar_beam_7_200: {
    name: "Луч на 7 клеток, 200 урона",
    coolDown: 11,
    type: "Луч",
    putBy: "Сталевар",
    coordinates: 7,
    affiliate: "negative only",
    stats: {
      damage: 200,
      damageType: "технический",
    },
    beamEffect: function(targets) {
      multiAttack(this, targets);
    },
  },

  // ──────────────── МК-10 ────────────────
  mk10_ignore_dodge: {
    name: "Игнор уворота (3 хода)",
    coolDown: 7,
    type: "Эффект на себя",
    putBy: "МК-10",
    coordinates: 1,
    affiliate: "positive only",
    turnsRemain: 3,
    effect: (mk10) => {
      mk10.effects.push({
        name: "Игнор уворота",
        effectType: "positive",
        turnsRemain: 3,
        onAttack: (char, target) => {
          // Обычный уворот не работает
          target.advancedSettings.dodgeDisabled = true;
        },
        consequence: (ch) => {
          // Снимаем флаг
          // (Если храним dodgeDisabled там — убираем)
        },
      });
    },
  },

  mk10_3_missiles_75each: {
    name: "Залп из 3 ракет (75 dmg each), радиус 9",
    coolDown: 9,
    type: "Заряды по области",
    putBy: "МК-10",
    coordinates: 0,
    affiliate: "negative only",
    stats: {
      rangeOfObject: 9,
      shotsAmount: 3,
      damagePerRocket: 75,
      damageType: "технический",
    },
    effectPerAttack: ({ affectedCharacters, addActionLog }) => {
      affectedCharacters.forEach(({ ch, amount }) => {
        if (ch.currentArmor >= 1) {
          ch.currentArmor -= 1;
        } else {
          ch.currentHP -= 75 * amount;
        }
      });
      addActionLog(
        `Способность "Ракетный залп" нанесла урон: ${affectedCharacters
          .map((ac) => ac.ch.name)
          .join(", ")}`
      );
    },
  },

  mk10_big_missile: {
    name: "Большая ракета (250 центр, +100 вокруг 1)",
    coolDown: 12,
    type: "Атака на дальность + область",
    putBy: "МК-10",
    coordinates: 7,
    affiliate: "negative only",
    stats: {
      centerDamage: 250,
      splashDamage: 100,
      splashRadius: 1,
      damageType: "физический",
    },
    effect: (caster, centerTarget, matchState) => {
      // 250 центру
      centerTarget.currentHP -= 250;
      // всем в radius=1 от centerTarget => 100 урона
      // ...
    },
  },

  // ──────────────── Алебардист ────────────────
  halberdier_aoe_3cells_150: {
    name: "Удар по области (3 радиуса, 150 dmg)",
    coolDown: 4,
    type: "Мгновенная область способности",
    putBy: "Алебардист",
    coordinates: 0, // вокруг себя
    affiliate: "negative only",
    stats: {
      rangeOfObject: 3,
      damage: 150,
      damageType: "физический",
    },
    zoneEffect: (affectedEnemies) => {
      // Все противники в радиусе 3 получают 150 урона
      affectedEnemies.forEach((ch) => {
        if (ch.name !== "Алебардист") {
          if (ch.currentArmor == 0) {
            ch.currentHP -= 150;
          } else {
            ch.currentArmor -= 1;
          }
        }
        // Учитывайте шанс 25% "выталкивания" варежек (features) — можно тут или в onHit
      });
    },
  },

  halberdier_thrust_stun: {
    name: "Выпад (3 клетки, 175 dmg, 50% стан)",
    coolDown: 5,
    type: "Луч",
    putBy: "Алебардист",
    coordinates: 3,
    affiliate: "negative only",
    stats: {
      damage: 175,
      damageType: "физический",
      stunChance: 50, // 50%
    },
    beamEffect: (affectedCharacters) => {
      // Наносим 175 по всем в луче, 50% шанс стана
      affectedCharacters.forEach((ch) => {
        ch.currentHP -= 175;
        if (Math.random() * 100 < 50) {
          // Стан 1 ход
          ch.functions.actionAbility = false;
          ch.effects.push({
            name: "Стан от выпадa",
            effectType: "negative",
            turnsRemain: 1,
            consequence: (ch) => {
              ch.functions.actionAbility = true;
            },
          });
        }
      });
    },
  },

  halberdier_heavy_strike: {
    name: "Усиленная атака (2 клетки, 200 dmg)",
    coolDown: 4,
    type: "Точечная атака",
    putBy: "Алебардист",
    coordinates: 2,
    affiliate: "negative only",
    stats: {
      damage: 200,
      damageType: "физический",
    },
    effect: (attacker, target) => {
      target.currentHP -= 200;
    },
  },

  // ──────────────── Йети ────────────────
  yeti_flexibility_buff_debuff: {
    name: "Изменение ловкости (4 хода)",
    coolDown: 4,
    type: "Точечное наложение эффекта",
    putBy: "Йети",
    coordinates: 1,
    turnsRemain: 4,
    affiliate: "neutral",
    // Если союзник — +2 ловкости, если враг — -1/2
    effect: (yeti, target) => {
      const sameTeam = yeti.team === target.team;
      if (sameTeam) {
        // +2 ловкости
        target.stats.current.Ловкость += 2;
        target.effects.push({
          name: "Бафф ловкости (Йети)",
          effectType: "positive",
          turnsRemain: 4,
          consequence: (ch) => {
            ch.stats.current.Ловкость -= 2;
          },
        });
      } else {
        // -1/2 ловкости
        const lostAgi = Math.floor(target.stats.current.Ловкость / 2);
        target.stats.current.Ловкость -= lostAgi;
        target.effects.push({
          name: "Порча ловкости (Йети)",
          effectType: "negative",
          turnsRemain: 4,
          consequence: (ch) => {
            ch.stats.current.Ловкость += lostAgi;
          },
        });
      }
    },
  },

  yeti_freeze_area: {
    name: "Область заморозки (2 радиус, 5 ходов)",
    coolDown: 7,
    type: "Размещение области с эффектом зоны",
    putBy: "Йети",
    coordinates: 0,
    turnsRemain: 5,
    affiliate: "negative only",
    stats: {
      rangeOfObject: 2,
      damageType: "физический",
      effectStage: 1, // можно отслеживать ход внутри зоны
    },
    // 1 ход: 25 урона, 2 ход: 50 урона, с 3-го: заморозка (ловкость=1) до конца
    zoneEffect: (affectedEnemies, zoneCenter, turnInZone) => {
      affectedEnemies.forEach((ch) => {
        if (turnInZone === 1) {
          ch.currentHP -= 25;
        } else if (turnInZone === 2) {
          ch.currentHP -= 50;
        } else {
          // 3-й и далее: заморозка, ловкость=1
          ch.stats.current.Ловкость = 1;
          // Можно повесить эффект:
          ch.effects.push({
            name: "Глубокая заморозка",
            effectType: "negative",
            turnsRemain: 1, // обновляется каждый ход?
            consequence: (char) => {
              // Снимаем, возвращая ловкость?
              // Зависит от механики
            },
          });
        }
      });
    },
  },
};
