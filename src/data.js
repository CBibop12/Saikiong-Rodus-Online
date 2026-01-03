import { addEffect, agilityBoost, removeEffect } from "./effects";

export const characters = [
  // ──────────────── Саламандра ────────────────
  {
    name: "Саламандра",
    type: "Иной",
    // image: "salamandra.jpg",
    image: "salamandra_alternative.png",
    stats: {
      HP: 300,
      Урон: 125,
      Мана: 3500,
      Ловкость: 8,
      Броня: 4,
      Дальность: 1,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 300,
    currentMana: 3500,
    currentDamage: 125,
    currentAgility: 8,
    currentArmor: 4,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "salamandra_fire_shots",
        image: "salamandra1.png",
        description:
          "В радиусе 5 клеток от себя может выпустить 4 огненных выстрела, каждый из которых наносит по 50 урона.",
        coolDown: 10,
        currentCooldown: 0,
      },
      {
        key: "salamandra_transformation",
        image: "salamandra2.png",
        description:
          "На 3 хода может превратиться в настоящую саламандру. В этой форме его ловкость +2, урон = 0, а также появляется шанс уворота 50%.",
        coolDown: 9,
        currentCooldown: 0,
      },
      {
        key: "salamandra_hot_ground",
        image: "salamandra3.png",
        description:
          "Нагревает область с радиусом 1 вокруг себя на 3 хода. Каждый, кто войдёт в неё, получит урон 50.",
        coolDown: 8,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Юань-ти ────────────────
  {
    name: "Юань-ти",
    type: "Иной",
    // image: "yuanTi.jpg",
    image: "yuanTi_alternative.png",
    stats: {
      HP: 300,
      Урон: 175,
      Мана: 2000,
      Ловкость: 7,
      Броня: 1,
      Дальность: 1,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 300,
    currentMana: 2000,
    currentDamage: 175,
    currentAgility: 7,
    currentArmor: 1,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],

    abilities: [
      {
        key: "yuanti_binding",
        image: "yuanTi1.png",
        description: "Окутывает противника (стан) на 2 хода.",
        coolDown: 8,
        currentCooldown: 0,
      },
      {
        key: "yuanti_snake_bite",
        image: "yuanTi2.png",
        description: "Отравляет противника на 2 хода, по 50 урона за ход.",
        coolDown: 7,
        currentCooldown: 0,
      },
      {
        key: "yuanti_cobra_dash",
        image: "yuanTi3.png",
        description: "Ускоряет себя на +3 ловкости на 2 хода.",
        coolDown: 7,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Вендиго ────────────────
  {
    name: "Вендиго",
    type: "Иной",
    image: "vendigo_alternative.png",
    stats: {
      HP: 300,
      Урон: 160,
      Мана: 2500,
      Ловкость: 9,
      Броня: 3,
      Дальность: 1,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 300,
    currentMana: 2500,
    currentDamage: 160,
    currentAgility: 9,
    currentArmor: 3,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],

    abilities: [
      {
        key: "wendigo_pull",
        image: "vendigo1.png",
        description:
          "Притягивает врага (до 6 клеток) к себе. Противник не может двигаться, но может действовать следующие 4 хода.",
        coolDown: 10,
        currentCooldown: 0,
      },
      {
        key: "wendigo_possession",
        image: "vendigo2.png",
        description:
          "Если HP противника ≤25%, Вендиго может вселиться в него на 4 хода, контролируя его.",
        coolDown: 12,
        currentCooldown: 0,
      },
      {
        key: "wendigo_vampirism",
        image: "vendigo3.png",
        description:
          "На 4 хода удары Вендиго наносят 50 урона, но при этом восстанавливают ему 50 HP.",
        coolDown: 6,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Повар ────────────────
  {
    name: "Повар",
    type: "Иной",
    image: "orcPovar_alternative.png",
    stats: {
      HP: 450,
      Урон: 125,
      Мана: 3000,
      Ловкость: 5,
      Броня: 2,
      Дальность: 1,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 450,
    currentMana: 3000,
    currentDamage: 125,
    currentAgility: 5,
    currentArmor: 2,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],

    abilities: [
      {
        key: "cook_poisoning",
        image: "orcPovar1.png",
        description:
          "Наносит 50 магического урона. На следующий ход весь урон по цели удваивается.",
        coolDown: 6,
        currentCooldown: 0,
      },
      {
        key: "cook_caldron",
        image: "orcPovar2.png",
        description:
          "Ставит Казан (выключен) с 200 HP и 2 Броней на 4 хода. Радиус 5 клеток.",
        coolDown: 10,
        currentCooldown: 0,
      },
      {
        key: "cook_random_effect",
        image: "orcPovar3.png",
        description:
          "При включенном Казане накладывает случайный положительный эффект на цель (мана +500, или ловкость +2, или броня +1).",
        coolDown: 2,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Скелет ────────────────
  {
    name: "Скелет",
    type: "Иной",
    image: "skelet_alternative.png",
    stats: {
      HP: 300,
      Урон: 150,
      Мана: 4000,
      Ловкость: 5,
      Броня: 2,
      Дальность: 1,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 300,
    currentMana: 4000,
    currentDamage: 150,
    currentAgility: 5,
    currentArmor: 2,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],

    abilities: [
      {
        key: "skeleton_scare",
        image: "skelet1.png",
        description:
          "Отпугивает противников в радиусе 3 клеток. Те вынуждены отступить и не могут заходить обратно 3 хода.",
        coolDown: 8,
        currentCooldown: 0,
      },
      {
        key: "skeleton_shield",
        image: "skelet2.png",
        description:
          "Ставит щит (300 HP). Если щит не сломают, он исчезнет через 7 ходов.",
        coolDown: 10,
        currentCooldown: 0,
      },
      {
        key: "skeleton_bow_shot",
        image: "skelet3.png",
        description:
          "Выстрел из лука на дальность 6 клеток с уроном 150. Нельзя использовать вместе со щитом.",
        coolDown: 1,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Гоблин ────────────────
  {
    name: "Гоблин",
    type: "Иной",
    image: "goblin_alternative.png",
    stats: {
      HP: 275,
      Урон: 125,
      Мана: 2500,
      Ловкость: 7,
      Броня: 1,
      Дальность: 2,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 275,
    currentMana: 2500,
    currentDamage: 125,
    currentAgility: 7,
    currentArmor: 1,
    currentRange: 2,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],

    abilities: [
      {
        key: "goblin_ranged_shot",
        description: "Стреляет на 6 клеток с уроном 150.",
        image: "goblin1.png",
        coolDown: 4,
        currentCooldown: 0,
      },
      {
        key: "goblin_regeneration",
        description: "Регенерация по 50 HP за ход, длится 3 хода.",
        image: "goblin2.png",
        coolDown: 8,
        currentCooldown: 0,
      },
      {
        key: "goblin_sniper_mode",
        description:
          "Переходит в режим стрелка (5 зарядов). Каждый выстрел на 7 клеток и бьёт по 125 технического урона.",
        image: "goblin3.png",
        coolDown: 10,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Кобольд ────────────────
  {
    name: "Кобольд",
    type: "Иной",
    image: "kobold_alternative.png",
    stats: {
      HP: 300,
      Урон: 125,
      Мана: 2000,
      Ловкость: 5,
      Броня: 2,
      Дальность: 1,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 300,
    currentMana: 2000,
    currentDamage: 125,
    currentAgility: 5,
    currentArmor: 2,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "kobold_digging",
        description:
          "Пассивно: зарывшись под землю, может копать туннели обычным действием.",
        image: "kobold1.png",
        coolDown: 0,
        currentCooldown: 0,
      },
      {
        key: "kobold_explosion",
        description:
          "Подрывает область 4x2 с уроном 200. Если под землёй, эффект усиливается.",
        image: "kobold2.png",
        coolDown: 10,
        currentCooldown: 0,
      },
      {
        key: "kobold_ladder",
        description:
          "Ставит лестницу (HP 300). Можно залезать/слезать за действие/перемещение.",
        image: "kobold3.png",
        coolDown: 8,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Подсолнух ────────────────
  {
    name: "Подсолнух",
    type: "Иной",
    image: "podsolnuh_alternative.png",
    stats: {
      HP: 200,
      Урон: 150,
      Мана: 2500,
      Ловкость: 5,
      Броня: 4,
      Дальность: 3,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 200,
    currentMana: 2500,
    currentDamage: 150,
    currentAgility: 5,
    currentArmor: 4,
    currentRange: 3,
    position: null,
    inventory: [],
    inventoryLimit: 1,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "podsolnuh_bind",
        description:
          "Окутывает противника на дальности 6 на 2 хода, нанося 100 урона в первый ход.",
        image: "podsolnuh1.png",
        coolDown: 12,
        currentCooldown: 0,
      },
      {
        key: "podsolnuh_teleport",
        image: "podsolnuh2.png",
        description:
          "Цветик может переместиться в любую точку на своей половине карты.",
        coolDown: 10,
        currentCooldown: 0,
      },
      {
        key: "podsolnuh_absorb",
        image: "podsolnuh3.png",
        description: "Поглощает любой тех. и маг. урон в течение 3 ходов.",
        coolDown: 10,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Слизень ────────────────
  {
    name: "Слизень",
    type: "Иной",
    image: "slizen_alternative.png",
    stats: {
      HP: 400,
      Урон: 150,
      Мана: 2500,
      Ловкость: 6,
      Броня: 1,
      Дальность: 1,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 400,
    currentMana: 2500,
    currentDamage: 150,
    currentAgility: 6,
    currentArmor: 1,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "slizen_acid_area",
        image: "slizen1.png",
        description:
          "В радиусе 3 вокруг себя создаёт кислотную область, наносящую 125 магического урона.",
        coolDown: 7,
        currentCooldown: 0,
      },
      {
        key: "slizen_absorb_half",
        image: "slizen2.png",
        description: "Поглощает 50% входящего урона в течение 5 ходов.",
        coolDown: 7,
        currentCooldown: 0,
      },
      {
        key: "slizen_passive_wall",
        image: "slizen3.png",
        description:
          "Пассивно может проходить сквозь стены. Если останется в стене, его вытолкнет на ближайшую клетку.",
        // Пассивная способность — coolDown: 0, или не указываем вовсе
        coolDown: 0,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Подрывница ────────────────
  {
    name: "Подрывница",
    type: "Иной",
    image: "podrivnicsa_alternative.png",
    stats: {
      HP: 400,
      Урон: 150,
      Мана: 2000,
      Ловкость: 6,
      Броня: 2,
      Дальность: 3,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 400,
    currentMana: 2000,
    currentDamage: 150,
    currentAgility: 6,
    currentArmor: 2,
    currentRange: 3,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "bombgirl_flying_stun",
        image: "podrivnica1.png",
        description:
          "Пролетает 8 клеток вперёд, оглушая тех, кто задет на 1 ход (луч шириной 3 клетки).",
        coolDown: 7,
        currentCooldown: 0,
      },
      {
        key: "bombgirl_bomb",
        image: "podrivnica2.png",
        description:
          "На дальности 4 прилепляет бомбу с таймером 3 хода. Взрыв наносит 200 урона носителю.",
        coolDown: 10,
        currentCooldown: 0,
      },
      {
        key: "bombgirl_molotov",
        image: "podrivnica3.png",
        description:
          "На дальности 3 создаёт огненную зону радиусом 3 клеток на 3 хода, нанося 75 урона/ход.",
        coolDown: 10,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Амудсиас ────────────────
  {
    name: "Амудсиас",
    type: "Иной",
    image: "amudsias_alternative.png",
    stats: {
      HP: 250,
      Урон: 75,
      Мана: 5000,
      Ловкость: 5,
      Броня: 2, // в описании не было Брони, можно указать 0 или удалить
      Дальность: 2,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 250,
    currentMana: 5000,
    currentDamage: 75,
    currentAgility: 5,
    currentArmor: 2,
    currentRange: 2,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    features:
      "Может проходить сквозь персонажей. Не может покупать броню и подбирать предметы.",
    abilities: [
      {
        key: "amudsius_possession",
        image: "amudsias1.png",
        description:
          "Вселяется в персонажа на 10 ходов, складывая его HP, урон, броню и ману со своими.",
        coolDown: 13,
        currentCooldown: 0,
      },
      {
        key: "amudsius_scare",
        image: "amudsias2.png",
        description:
          'Отпугивает противников в радиусе 5 клеток (аналогично другим "страхам").',
        coolDown: 5,
        currentCooldown: 0,
      },
      {
        key: "amudsius_shot",
        image: "amudsias3.png",
        description:
          "Тратит 750 маны и наносит 75 урона по цели на дальности 5, игнорируя броню. Не сбрасывает остальные перезарядки.",
        coolDown: 0, // или особая логика без перезарядки
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Заклинатель рун ────────────────
  {
    name: "Заклинатель рун",
    type: "Иной",
    image: "zaklinatelRun_alternative.png",
    stats: {
      HP: 250,
      Урон: 125,
      Мана: 2000,
      Ловкость: 5,
      Броня: 4,
      Дальность: 1,
    },
    passiveAbilities: [],
    features:
      "Его способности вставляют 3 руны разного типа в соответственные ячейки. Все способности Заклинателя рун перезагружаются с начала игры.",
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 250,
    currentMana: 2000,
    currentDamage: 125,
    currentAgility: 5,
    currentArmor: 4,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "runecaster_hp_rune",
        image: "runecaster1.png",
        description: "Руна НР. Добавляет 75 НР.",
        coolDown: 5,
        currentCooldown: 0,
      },
      {
        key: "runecaster_damage_rune",
        image: "runecaster2.png",
        description: "Руна урона. Добавляет 25 урона.",
        coolDown: 5,
        currentCooldown: 0,
      },
      {
        key: "runecaster_mana_rune",
        image: "runecaster3.png",
        description: "Руна маны. Добавляет 1000 маны.",
        coolDown: 5,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Ночной охотник ────────────────
  {
    name: "Ночной охотник",
    type: "Иной",
    image: "nochnoi_ohotnik_alternative.png",
    stats: {
      HP: 300,
      Урон: 175,
      Мана: 3000,
      Ловкость: 6,
      Броня: 2,
      Дальность: 1,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 300,
    currentMana: 3000,
    currentDamage: 175,
    currentAgility: 6,
    currentArmor: 2,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "night_hunter_bat_beam",
        image: "nochnoi1.png",
        description:
          "Выпускает луч летучих мышей (урон 150 на 8 клеток, пробивает стены).",
        coolDown: 8,
        currentCooldown: 0,
      },
      {
        key: "night_hunter_silence_area",
        image: "nochnoi2.png",
        description:
          "В радиусе 3 клетки вокруг охотника персонажи не могут использовать способности 3 хода.",
        coolDown: 7,
        currentCooldown: 0,
      },
      {
        key: "night_hunter_vampire_strike",
        image: "nochnoi3.png",
        description:
          "На 5 ходов при ударе восстанавливает себе 100 HP, добив врага — +100 к макс. HP.",
        coolDown: 12,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Дейви Джонс ────────────────
  {
    name: "Дейви Джонс",
    type: "Рыцарь",
    image: "deivy_jons_alternative.png",
    stats: {
      HP: 250,
      Урон: 150,
      Мана: 3000,
      Ловкость: 5,
      Броня: 2,
      Дальность: 1,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      immortal: false, // включается при создании сундука
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 250,
    currentMana: 3000,
    currentDamage: 150,
    currentAgility: 5,
    currentArmor: 2,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "davyjones_teleport",
        image: "davvy1.png",
        description: "Телепорт к выбранному врагу в радиусе 6 клеток.",
        coolDown: 8,
        currentCooldown: 0,
      },
      {
        key: "davyjones_strangle",
        image: "davvy2.png",
        description:
          "На 2 хода душит противника (50 урона/ход), отключая перемещение/действие.",
        coolDown: 6,
        currentCooldown: 0,
      },
      {
        key: "davyjones_chest",
        image: "davvy3.png",
        description:
          "Сундук с сердцем (1 HP, 3 брони). Пока сундук цел, Дейви бессмертен. Если сундук разрушат, он погибает.",
        coolDown: 15, // перезагружается с начала партии
        currentCooldown: 15,
      },
    ],
  },

  // ──────────────── Варвар ────────────────
  {
    name: "Варвар",
    type: "Рыцарь",
    image: "barbarian_alternative.png",
    stats: {
      HP: 450,
      Урон: 150,
      Мана: 2000,
      Ловкость: 5,
      Броня: 2,
      Дальность: 1,
    },
    features:
      'Может накапливать "Ярость Варвара", атакуя противника (макс.3). При 3 зарядах - урон x1.5.',
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      rageStacks: 0, // здесь будет копиться "Ярость"
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 450,
    currentMana: 2000,
    currentDamage: 150,
    currentAgility: 5,
    currentArmor: 2,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "barbarian_axe_throw",
        image: "barbarian1.png",
        description: "Метает топор на 5 клеток (175 урона, 10% промах).",
        coolDown: 7,
        currentCooldown: 0,
      },
      {
        key: "barbarian_ally_pull",
        image: "barbarian2.png",
        description: "Перемещает союзника к себе с любой точки карты.",
        coolDown: 10,
        currentCooldown: 0,
      },
      {
        key: "barbarian_rage_strike",
        image: "barbarian3.png",
        description: "Пассивно: при накоплении 3 ярости — удар x1.5 урон.",
        coolDown: 0, // пассивка
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Плут ────────────────
  {
    name: "Плут",
    type: "Рыцарь",
    image: "plut_alternative.png",
    stats: {
      HP: 300,
      Урон: 125,
      Мана: 6000,
      Ловкость: 7,
      Броня: 2,
      Дальность: 1,
    },
    features:
      "хотя изначально 2500 маны, лимит = 6000 маны. Пассивно: Может получать ману из вражеского храма. 10% уворот.",
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 10, // 10% обычный уворот
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 300,
    currentMana: 2500,
    currentDamage: 125,
    currentAgility: 7,
    currentArmor: 2,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "plut_double_agility",
        image: "plut1.png",
        description: "На 2 хода удваивает свою ловкость.",
        coolDown: 6,
        currentCooldown: 0,
      },
      {
        key: "plut_climb_wall",
        image: "plut2.png",
        description: "Залезает на стену. Спуск = перемещение.",
        coolDown: 4,
        currentCooldown: 0,
      },
      {
        key: "plut_steal_item",
        image: "plut3.png",
        description:
          "Крадёт предмет у врага за 1/2 стоимости. Не сбрасывает другие перезарядки.",
        coolDown: 0,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Зелос ────────────────
  {
    name: "Зелос",
    type: "Рыцарь",
    image: "zelos_alternative.png",
    stats: {
      HP: 400,
      Урон: 125,
      Мана: 3000,
      Ловкость: 7,
      Броня: 2,
      Дальность: 1,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 400,
    currentMana: 3000,
    currentDamage: 125,
    currentAgility: 7,
    currentArmor: 2,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "zelos_meteor",
        image: "zelos1.png",
        description: "Кидает метеор на 10 клеток, 50 (маг.) урона.",
        coolDown: 5,
        currentCooldown: 0,
      },
      {
        key: "zelos_absorb_magic",
        image: "zelos2.png",
        description:
          "На 3 хода поглощает маг. урон, а физический урон конвертирует в ману x2.",
        coolDown: 6,
        currentCooldown: 0,
      },
      {
        key: "zelos_return_damage",
        image: "zelos3.png",
        description:
          "В течение 5 ходов копит входящий урон, затем возвращает сквозь броню.",
        coolDown: 6,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Легионер ────────────────
  {
    name: "Легионер",
    type: "Рыцарь",
    image: "legioner_alternative.png",
    stats: {
      HP: 350,
      Урон: 175,
      Мана: 2000,
      Ловкость: 6,
      Броня: 3,
      Дальность: 1,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      hitStreak: 0, // для пассивки
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 350,
    currentMana: 2000,
    currentDamage: 175,
    currentAgility: 6,
    currentArmor: 3,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "legionnaire_mana_strike",
        image: "legionnaire1.png",
        description:
          "Бьёт по мане цели: чем меньше маны, тем больше урон (макс 175).",
        coolDown: 6,
        currentCooldown: 0,
      },
      {
        key: "legionnaire_line_formation",
        image: "legionnaire2.png",
        description: "Создаёт линию (5х1) легионеров с общим HP 400.",
        coolDown: 8,
        currentCooldown: 0,
      },
      {
        key: "legionnaire_agility_stack",
        image: "legionnaire3.png",
        description:
          "Пассивно: каждый последовательный удар даёт +1 ловкости (макс 10). Если пропустить ход атаки – сброс.",
        coolDown: 0,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Палладин ────────────────
  {
    name: "Палладин",
    type: "Рыцарь",
    image: "paladin_alternative.png",
    stats: {
      HP: 450,
      Урон: 150,
      Мана: 2000,
      Ловкость: 5,
      Броня: 3,
      Дальность: 1,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 450,
    currentMana: 2000,
    currentDamage: 150,
    currentAgility: 5,
    currentArmor: 3,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "paladin_divine_area",
        image: "paladin1.png",
        description:
          "Наносит 150 (маг.) урона по области радиусом 5 вокруг себя.",
        coolDown: 9,
        currentCooldown: 0,
      },
      {
        key: "paladin_hammer_throw",
        image: "paladin2.png",
        description: "На 6 клеток бросает молот, 125 урона.",
        coolDown: 8,
        currentCooldown: 0,
      },
      {
        key: "paladin_holy_explosion",
        image: "paladin3.png",
        description: "На 4 клетки вокруг себя наносит 200 (маг.) урона.",
        coolDown: 12,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Минотавр ────────────────
  {
    name: "Минотавр",
    type: "Рыцарь",
    image: "minotaur_alternative.png",
    stats: {
      HP: 350,
      Урон: 175,
      Мана: 3000,
      Ловкость: 5,
      Броня: 2,
      Дальность: 1,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 350,
    currentMana: 3000,
    currentDamage: 175,
    currentAgility: 5,
    currentArmor: 2,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "minotaur_charge_beam",
        image: "minotaur1.png",
        description:
          "Луч на 4 клетки (200 урона), сдвигает врагов и перемещает Минотавра.",
        coolDown: 4,
        currentCooldown: 0,
      },
      {
        key: "minotaur_hammer_legs",
        image: "minotaur2.png",
        description: "2 хода по 75 урона/ход, -1/2 ловкости на период.",
        coolDown: 4,
        currentCooldown: 0,
      },
      {
        key: "minotaur_aoe_strike",
        image: "minotaur3.png",
        description: "Удар по радиусу 3 вокруг, 150 урона всем.",
        coolDown: 3,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Мститель ────────────────
  {
    name: "Мститель",
    type: "Рыцарь",
    image: "mstitel_alternative.png",
    stats: {
      HP: 300,
      Урон: 150,
      Мана: 2000,
      Ловкость: 7,
      Броня: 2,
      Дальность: 2,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 300,
    currentMana: 2000,
    currentDamage: 150,
    currentAgility: 7,
    currentArmor: 2,
    currentRange: 2,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "avenger_random_effect",
        image: "mstitel1.png",
        description:
          "Случайный эффект (по врагу) – может нанести урон, снизить ловкость и т.д.",
        coolDown: 10,
        currentCooldown: 0,
      },
      {
        key: "avenger_punish_effect",
        image: "mstitel2.png",
        description:
          "На 4 хода цель не может бить Мстителя, получает +50% входящего урона.",
        coolDown: 10,
        currentCooldown: 0,
      },
      {
        key: "avenger_remove_effects",
        image: "mstitel3.png",
        description: "Снимает все эффекты, наложенные персонажем (или все?)",
        coolDown: 7, // было упомянуто "7 ходов" в тексте
        currentCooldown: 0,
      }
    ],
  },

  // ──────────────── Крестоносец ────────────────
  {
    name: "Крестоносец",
    type: "Рыцарь",
    // image: "krestonosec.jpg",
    image: "crusader_alternative.png",
    stats: {
      HP: 500,
      Урон: 150,
      Мана: 3000,
      Ловкость: 4,
      Броня: 4,
      Дальность: 1,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 500,
    currentMana: 3000,
    currentDamage: 150,
    currentAgility: 4,
    currentArmor: 4,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "crusader_heal_allies",
        image: "crusader1.png",
        description: "Восстанавливает 150 HP всем союзникам (и себе).",
        coolDown: 10,
        currentCooldown: 0,
      },
      {
        key: "crusader_shield_ally",
        image: "crusader2.png",
        description:
          "На 3 хода ставит щит (400 HP) на себя или союзника в 5 клетках.",
        coolDown: 7,
        currentCooldown: 0,
      },
      {
        key: "crusader_global_beam",
        image: "crusader3.png",
        description: "Луч по всей карте, 150 урона всем на линии.",
        coolDown: 12,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Воздушный монах ────────────────
  {
    name: "Воздушный монах",
    type: "Маг",
    // image: "vozdushniyMonah.jpg",
    image: "monah_alternative.png",
    stats: {
      HP: 350,
      Урон: 150,
      Мана: 4000,
      Ловкость: 6,
      Броня: 1,
      Дальность: 4,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "магический",
    },
    currentHP: 350,
    currentMana: 4000,
    currentDamage: 150,
    currentAgility: 6,
    currentArmor: 1,
    currentRange: 4,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "wind_monk_wind_dome",
        image: "monah1.png",
        description: "3 хода: +2 ловкости, купол (200 HP), не может атаковать.",
        coolDown: 4,
        currentCooldown: 0,
      },
      {
        key: "wind_monk_hurricane",
        image: "monah2.png",
        description:
          "Ураган (радиус 7), притягивает и наносит 25/ход, держится 2 хода.",
        coolDown: 7,
        currentCooldown: 0,
      },
      {
        key: "wind_monk_bloody_fog",
        image: "monah3.png",
        description:
          "Кровавый туман (5 радиус, 5 ходов), 75/ход и -1/2 ловкости.",
        coolDown: 12,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Древний ────────────────
  {
    name: "Древний",
    type: "Маг",
    // image: "drevniy.jpg",
    image: "drevniy_alternative.png",
    stats: {
      HP: 350,
      Урон: 140,
      Мана: 5000,
      Ловкость: 5,
      Броня: 3,
      Дальность: 5,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "магический",
    },
    currentHP: 350,
    currentMana: 5000,
    currentDamage: 140,
    currentAgility: 5,
    currentArmor: 3,
    currentRange: 5,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "drevniy_wall_square",
        image: "drevniy1.png",
        description: "Создаёт 3x3 неразрушимые стены на 7 ходов.",
        coolDown: 10,
        currentCooldown: 0,
      },
      {
        key: "drevniy_mud_wave",
        image: "drevniy2.png",
        description: "Грязевая волна (5x3), 175 урона.",
        coolDown: 8,
        currentCooldown: 0,
      },
      {
        key: "drevniy_remove_negative",
        image: "drevniy3.png",
        description: "Снимает негативные эффекты + 5 ходов иммунитет к ним.",
        coolDown: 10,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Леприкон ────────────────
  {
    name: "Леприкон",
    type: "Маг",
    image: "lepricon_alternative.png",
    stats: {
      HP: 325,
      Урон: 110,
      Мана: 5000,
      Ловкость: 4,
      Броня: 3,
      Дальность: 4,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "магический",
    },
    currentHP: 325,
    currentMana: 5000,
    currentDamage: 110,
    currentAgility: 4,
    currentArmor: 3,
    currentRange: 4,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "leprechaun_area_4_150",
        image: "lepricon1.png",
        description: "Область (4 радиус), 150 урона.",
        coolDown: 8,
        currentCooldown: 0,
      },
      {
        key: "leprechaun_global_teleport",
        image: "lepricon2.png",
        description: "Телепорт в любую точку карты.",
        coolDown: 12,
        currentCooldown: 0,
      },
      {
        key: "leprechaun_area_5_200",
        image: "lepricon3.png",
        description: "Область (5 радиус), 200 урона.",
        coolDown: 10,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Дракула ────────────────
  {
    name: "Дракула",
    type: "Маг",
    image: "dracula_alternative.png",
    stats: {
      HP: 375,
      Урон: 125,
      Мана: 4000,
      Ловкость: 6,
      Броня: 2,
      Дальность: 5,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0, // могли бы присвоить > 0, раз это Дракула
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "магический",
    },
    currentHP: 375,
    currentMana: 4000,
    currentDamage: 125,
    currentAgility: 6,
    currentArmor: 2,
    currentRange: 5,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "dracula_move_8",
        image: "dracula1.png",
        description: "Перемещается в радиусе 8 клеток.",
        coolDown: 8,
        currentCooldown: 0,
      },
      {
        key: "dracula_drain_100",
        image: "dracula2.png",
        description: "Вытягивает 100 HP (можно у врага или союзника).",
        coolDown: 8,
        currentCooldown: 0,
      },
      {
        key: "dracula_area_3_75x2",
        image: "dracula3.png",
        description: "Радиус 3 на 2 хода, наносит 75/ход.",
        coolDown: 10,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Пламенный шаман ────────────────
  {
    name: "Пламенный шаман",
    type: "Маг",
    image: "plamenniy_shaman_alternative.png",
    stats: {
      HP: 350,
      Урон: 140,
      Мана: 5000,
      Ловкость: 5,
      Броня: 1,
      Дальность: 5,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "магический",
    },
    currentHP: 350,
    currentMana: 5000,
    currentDamage: 140,
    currentAgility: 5,
    currentArmor: 1,
    currentRange: 5,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "flame_shaman_damage_boost_area",
        image: "shaman1.png",
        description: "Область (радиус 4, 2 хода): союзники +100 к урону.",
        coolDown: 10,
        currentCooldown: 0,
      },
      {
        key: "flame_shaman_meteor",
        image: "shaman2.png",
        description: "На 4 клетки, 250 урона (маг.).",
        coolDown: 10,
        currentCooldown: 0,
      },
      {
        key: "flame_shaman_phoenix",
        image: "shaman3.png",
        description: "Призыв Феникса (10 ходов), бьёт 125/ход в радиусе 4.",
        coolDown: 10,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Пикси-целитель ────────────────
  {
    name: "Пикси-целитель",
    type: "Маг",
    image: "pixie_alternative.png",
    stats: {
      HP: 275,
      Урон: 125,
      Мана: 4500,
      Ловкость: 7,
      Броня: 2,
      Дальность: 3,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "магический",
    },
    currentHP: 275,
    currentMana: 4500,
    currentDamage: 125,
    currentAgility: 7,
    currentArmor: 2,
    currentRange: 3,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "pixie_agility_up",
        image: "pixie1.png",
        description: "На 2 хода ловкость +2 Пикси.",
        coolDown: 8,
        currentCooldown: 0,
      },
      {
        key: "pixie_healing_on_hit",
        image: "pixie2.png",
        description:
          "На 2 хода: при ударе противника Пикси лечит выбранного союзника.",
        coolDown: 8,
        currentCooldown: 0,
      },
      {
        key: "pixie_area_regen",
        image: "pixie3.png",
        description: "В радиусе 2 клетки восстанавливает 75 НР/ход (4 хода).",
        coolDown: 10,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Кровавый маг ────────────────
  {
    name: "Кровавый маг",
    type: "Маг",
    image: "krovaviyMag_alternative.png",
    stats: {
      HP: 500,
      Урон: 125,
      Мана: 4000,
      Ловкость: 5,
      Броня: 5,
      Дальность: 3,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      healTimes: 0, // счётчик для возр. восстановления
      characterLayer: 1,
      damageType: "магический",
    },
    currentHP: 500,
    currentMana: 4000,
    currentDamage: 125,
    currentAgility: 5,
    currentArmor: 5,
    currentRange: 3,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "bloodmage_maxhp10p",
        image: "blood1.png",
        description: "Платит 100 НР, снимает 10% макс.HP у врага (радиус 3).",
        coolDown: 0,
        currentCooldown: 0,
      },
      {
        key: "bloodmage_dot1percent10",
        image: "blood2.png",
        description: "Платит 50 НР, вешает дот на 10 ходов (1% HP/ход).",
        coolDown: 0,
        currentCooldown: 0,
      },
      {
        key: "bloodmage_heal_increasing",
        image: "blood3.png",
        description:
          "Восстанавливает HP по возр. шкале: 5%→10%→20%→40%→80%. (перезарядка 6 ходов)",
        coolDown: 6,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Бомбардировщик ────────────────
  {
    name: "Бомбардировщик",
    type: "Меха",
    image: "bomber_alternative.png",
    stats: {
      HP: 250,
      Урон: 100,
      Мана: 0,
      Ловкость: 5,
      Броня: 3,
      Дальность: 5,
    },
    features: "Урон от 2 и 3 способностей наносится только целям на земле.",
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      canFly: false,
      characterLayer: 1,
      damageType: "технический",
    },
    currentHP: 250,
    currentMana: 0,
    currentDamage: 100,
    currentAgility: 5,
    currentArmor: 3,
    currentRange: 5,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "bomber_fly8",
        image: "bomber1.png",
        description: "Пролетает 8 клеток, после получает полёт на 10 ходов.",
        coolDown: 5,
        currentCooldown: 0,
      },
      {
        key: "bomber_drop_bomb",
        image: "bomber2.png",
        description:
          "Сбрасывает бомбу (радиус 2, 150 урона) по целям на земле.",
        coolDown: 5,
        currentCooldown: 0,
      },
      {
        key: "bomber_line_damage",
        image: "bomber3.png",
        description: "Пролет 5 клеток (ширина 3), урон 100 по земле.",
        coolDown: 5,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Риот ────────────────
  {
    name: "Риот",
    type: "Стрелок",
    image: "riot_alternative.png",
    stats: {
      HP: 350,
      Урон: 150,
      Мана: 3000,
      Ловкость: 7,
      Броня: 2,
      Дальность: 4,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "технический",
    },
    currentHP: 350,
    currentMana: 3000,
    currentDamage: 150,
    currentAgility: 7,
    currentArmor: 2,
    currentRange: 4,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "riot_shot150",
        image: "riot1.png",
        description: "Выстрел на 7 клеток, 150 урона.",
        coolDown: 3,
        currentCooldown: 0,
      },
      {
        key: "riot_pull50",
        image: "riot2.png",
        description: "Притягивает цель (8 клеток), наносит 50 урона.",
        coolDown: 5,
        currentCooldown: 0,
      },
      {
        key: "riot_cross_explosion",
        image: "riot3.png",
        description: "Крест 2х2 (150 урона). За добивание +50% золота.",
        coolDown: 6,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Мушкетёр ────────────────
  {
    name: "Мушкетёр",
    type: "Стрелок",
    image: "musketer_alternative.png",
    stats: {
      HP: 200,
      Урон: 100,
      Мана: 2000,
      Ловкость: 9,
      Броня: 1,
      Дальность: 7,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "технический",
    },
    currentHP: 200,
    currentMana: 2000,
    currentDamage: 100,
    currentAgility: 9,
    currentArmor: 1,
    currentRange: 7,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "musketeer_big_shot",
        image: "musketer1.png",
        description: "Лучи на 6 клеток, 150 урона.",
        coolDown: 7,
        currentCooldown: 0,
      },
      {
        key: "musketeer_wall_pierce",
        image: "musketer2.png",
        description: "Выстрел на 5 клеток (80 урона) игнорирует стены.",
        coolDown: 4,
        currentCooldown: 0,
      },
      {
        key: "musketeer_area_10_200",
        image: "musketer3.png",
        description: "Радиус 10, 200 урона всем в зоне.",
        coolDown: 12,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Снайпер ────────────────
  {
    name: "Снайпер",
    type: "Стрелок",
    image: "sniper_alternative.png",
    stats: {
      HP: 250,
      Урон: 75,
      Мана: 3000,
      Ловкость: 8,
      Броня: 2,
      Dальность: 7,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "технический",
    },
    currentHP: 250,
    currentMana: 3000,
    currentDamage: 75,
    currentAgility: 8,
    currentArmor: 2,
    currentRange: 7,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "sniper_bomb_halfmap",
        image: "sniper1.png",
        description: "Скидывает бомбу (100 урона) на своей половине карты.",
        coolDown: 15,
        currentCooldown: 0,
      },
      {
        key: "sniper_invisibility",
        image: "sniper2.png",
        description: "Уходит в невидимость (до 3 ходов). Атака развеивает.",
        coolDown: 15,
        currentCooldown: 0,
      },
      {
        key: "sniper_25percent_shot",
        image: "sniper3.png",
        description:
          "Выстрел на 10 клеток: 25% от макс.HP цели. Требует 1 ход подготовки (без движения).",
        coolDown: 10,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Лесной брат ────────────────
  {
    name: "Лесной брат",
    type: "Стрелок",
    image: "lesnoy_brat_alternative.png",
    stats: {
      HP: 225,
      Урон: 100,
      Мана: 2000,
      Ловкость: 10,
      Броня: 1,
      Дальность: 7,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "технический",
    },
    currentHP: 225,
    currentMana: 2000,
    currentDamage: 100,
    currentAgility: 10,
    currentArmor: 1,
    currentRange: 7,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "forest_melee_blade",
        image: "brat1.png",
        description: "Пассивно: если враг в 1 клетке — клинок 125 (физ.).",
        coolDown: 0,
        currentCooldown: 0,
      },
      {
        key: "forest_poison_arrow",
        image: "brat2.png",
        description: "Отравленная стрела: 100 урона сразу, через 1 ход 75.",
        coolDown: 5,
        currentCooldown: 0,
      },
      {
        key: "forest_area_fire",
        image: "brat3.png",
        description:
          "Область радиус 4, 1-й ход: 150 (тех.), след.3 хода: 50 (физ.).",
        coolDown: 12,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Палач ────────────────
  {
    name: "Палач",
    type: "Некромант",
    image: "palach_alternative.png",
    stats: {
      HP: 350,
      Урон: 125,
      Мана: 3000,
      Ловкость: 4,
      Броня: 3,
      Дальность: 1,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 350,
    currentMana: 3000,
    currentDamage: 125,
    currentAgility: 4,
    currentArmor: 3,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "palach_absorb_hit",
        image: "palach1.png",
        description: "Поглощает 50% урона (1 раз).",
        coolDown: 5,
        currentCooldown: 0,
      },
      {
        key: "palach_axe_legs",
        image: "palach2.png",
        description: "50 dmg + -50% ловкости на 3 хода.",
        coolDown: 7,
        currentCooldown: 0,
      },
      {
        key: "palach_forced_taunt",
        image: "palach3.png",
        description:
          "2 хода: враги могут атаковать только Палача (кроме зелий/построек).",
        coolDown: 12,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Жнец ────────────────
  {
    name: "Жнец",
    type: "Некромант",
    image: "zhnec_alternative.png",
    stats: {
      HP: 300,
      Урон: 125,
      Мана: 3000,
      Ловкость: 5,
      Броня: 2,
      Дальность: 2,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "магический",
    },
    currentHP: 300,
    currentMana: 3000,
    currentDamage: 125,
    currentAgility: 5,
    currentArmor: 2,
    currentRange: 2,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "reaper_finisher",
        image: "zhnec1.png",
        description: "Телепорт к цели с ≤50% HP + 150 физ.урона.",
        coolDown: 8,
        currentCooldown: 0,
      },
      {
        key: "reaper_drain_life",
        image: "zhnec2.png",
        description: "100 маг. урона сквозь броню (радиус 2).",
        coolDown: 4,
        currentCooldown: 0,
      },
      {
        key: "reaper_save_ally",
        image: "zhnec3.png",
        description:
          "Пассивно: тратит 100 HP, спасая союзника от смерти (даёт 100 HP).",
        coolDown: 0,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Рыцарь тьмы ────────────────
  {
    name: "Рыцарь тьмы",
    type: "Некромант",
    image: "ricarTmi_alternative.png",
    stats: {
      HP: 300,
      Урон: 150,
      Мана: 3000,
      Ловкость: 5,
      Броня: 2,
      Дальность: 1,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 300,
    currentMana: 3000,
    currentDamage: 150,
    currentAgility: 5,
    currentArmor: 2,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "dark_knight_armorbreak150",
        image: "ricarTmi1.png",
        description: "Снос 3 брони или 150 урона.",
        coolDown: 6,
        currentCooldown: 0,
      },
      {
        key: "dark_knight_damage_aura",
        image: "ricarTmi2.png",
        description: "На 5 ходов, в радиусе 3, союзники получают +50 урона.",
        coolDown: 10,
        currentCooldown: 0,
      },
      {
        key: "dark_knight_strike_crit50",
        image: "ricarTmi3.png",
        description: "150 урона с 50% шансом на двойной урон.",
        coolDown: 8,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Балрок ────────────────
  {
    name: "Балрок",
    type: "Некромант",
    image: "balrog_alternative.png",
    stats: {
      HP: 300,
      Урон: 150,
      Мана: 4000,
      Ловкость: 4,
      Броня: 4,
      Дальность: 1,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "магический",
    },
    currentHP: 300,
    currentMana: 4000,
    currentDamage: 150,
    currentAgility: 4,
    currentArmor: 4,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "balrog_absorb_magic",
        image: "balrog1.png",
        description: "2 хода поглощает 50% маг.урона.",
        coolDown: 9,
        currentCooldown: 0,
      },
      {
        key: "balrog_dispel_negative",
        image: "balrog2.png",
        description: "Развеять негативные эффекты (радиус 3).",
        coolDown: 13,
        currentCooldown: 0,
      },
      {
        key: "balrog_dark_flame",
        image: "balrog3.png",
        description: "Тёмное пламя: 200 маг.урона (6 клеток).",
        coolDown: 7,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Король некромантов ────────────────
  {
    name: "Король некромантов",
    type: "Некромант",
    image: "korolNecromantov_alternative.png",
    stats: {
      HP: 500,
      Урон: 150,
      Мана: 3500,
      Ловкость: 5,
      Броня: 2,
      Дальность: 1,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 500,
    currentMana: 3500,
    currentDamage: 150,
    currentAgility: 5,
    currentArmor: 2,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "necroking_absorb_phys_tech",
        description: "3 хода: поглощает весь физ./тех. урон, маг. x1.5",
        image: "korol1.png",
        coolDown: 8,
        currentCooldown: 0,
      },
      {
        key: "necroking_area_5_damage_per_count",
        description:
          "Радиус 5, каждому врагу наносится 75 * кол-во врагов в зоне.",
        image: "korol2.png",
        coolDown: 5,
        currentCooldown: 0,
      },
      {
        key: "necroking_mana_drain",
        description: "До 5 ходов: -50/100/150/200/250 маны у врага.",
        image: "korol3.png",
        coolDown: 10,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Броненосец Тао ────────────────
  {
    name: "Броненосец Тао",
    type: "Танк",
    image: "bronenosecTao_alternative.png",
    stats: {
      HP: 650,
      Урон: 175,
      Мана: 2000,
      Ловкость: 3,
      Броня: 4,
      Дальность: 1,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 650,
    currentMana: 2000,
    currentDamage: 175,
    currentAgility: 3,
    currentArmor: 4,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0],
    abilities: [
      {
        key: "tao_jump_smash",
        image: "tao1.png",
        description:
          "Прыгает на 8 клеток, в точке приземления 200 урона по радиусу 4.",
        coolDown: 10,
        currentCooldown: 0,
      },
      {
        key: "tao_charge_beam",
        image: "tao2.png",
        description: "Рывок на 6 клеток, наносит 200 урона.",
        coolDown: 7,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Голиаф ────────────────
  {
    name: "Голиаф",
    type: "Танк",
    image: "goliath_alternative.png",
    stats: {
      HP: 550,
      Урон: 175,
      Мана: 2000,
      Ловкость: 3,
      Броня: 5,
      Дальность: 1,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 550,
    currentMana: 2000,
    currentDamage: 175,
    currentAgility: 3,
    currentArmor: 5,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0],
    abilities: [
      {
        key: "goliath_stone_skin",
        image: "goliath1.png",
        description: "Щит (300 HP) на 10 ходов (сам себе).",
        coolDown: 10,
        currentCooldown: 0,
      },
      {
        key: "goliath_aoe_slam",
        image: "goliath2.png",
        description: "Радиус 2 вокруг, 200 урона.",
        coolDown: 7,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Гигант ────────────────
  {
    name: "Гигант",
    type: "Танк",
    image: "giant_alternative.png",
    stats: {
      HP: 1000,
      Урон: 200,
      Мана: 1000,
      Ловкость: 3,
      Броня: 2,
      Дальность: 1,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 1000,
    currentMana: 1000,
    currentDamage: 200,
    currentAgility: 3,
    currentArmor: 2,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0],
    abilities: [
      {
        key: "giant_boulder_throw",
        image: "giant1.png",
        description: "Бросок валуна (7 клеток), 150 урона.",
        coolDown: 10,
        currentCooldown: 0,
      },
      {
        key: "giant_ground_slam",
        image: "giant2.png",
        description: "Радиус 3, 300 урона всем врагам.",
        coolDown: 12,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Страж ────────────────
  {
    name: "Страж",
    type: "Танк",
    image: "strazh_alternative.png",
    stats: {
      HP: 550,
      Урон: 150,
      Мана: 2500,
      Ловкость: 4,
      Броня: 5,
      Дальность: 1,
    },
    features:
      "Союзный (тех.) урон проходит сквозь Стража. Вражеский (тех.) урон с 10% шансом рикошетит.",
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      deflectChance: 10, // 10% рикошета вражеского тех.урона
      characterLayer: 1,
      damageType: "технический",
    },
    currentHP: 550,
    currentMana: 2500,
    currentDamage: 150,
    currentAgility: 4,
    currentArmor: 5,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0],
    abilities: [
      {
        key: "guard_flashbang",
        image: "guard1.png",
        description: "Радиус 5, 25 урона игнор брони, стан 1 ход.",
        coolDown: 7,
        currentCooldown: 0,
      },
      {
        key: "guard_shield_build",
        image: "guard2.png",
        description:
          "Ставит постройку-щит (300HP,3бр) или даёт союзнику на 10 ходов.",
        coolDown: 10,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Сиехилд ────────────────
  {
    name: "Сиехилд",
    type: "Танк",
    image: "siehild_alternative.png",
    stats: {
      HP: 700,
      Урон: 200,
      Мана: 2000,
      Ловкость: 3,
      Броня: 2,
      Дальность: 1,
    },
    features: "Все способности перезагружаются с начала игры.",
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 700,
    currentMana: 2000,
    currentDamage: 200,
    currentAgility: 3,
    currentArmor: 2,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    // если нужно 2 способности, только два currentCooldown
    currentCooldowns: [0, 0],
    abilities: [
      {
        key: "siehild_build_tower",
        image: "siehild1.png",
        description: "Строит башню (400 HP, 75 маг.урона в радиусе 1).",
        coolDown: 10,
        currentCooldown: 10,
      },
      {
        key: "siehild_upgrade_tower",
        image: "siehild2.png",
        description:
          "Улучшает башню до 600 HP, 150 ур., площадь 5x5, стан раз в 2 хода.",
        coolDown: 10,
        currentCooldown: 10,
      },
    ],
  },

  // ──────────────── Панцир 3 ────────────────
  {
    name: "Панцир 3",
    type: "Меха",
    image: "panzir3_alternative.png",
    stats: {
      HP: 350,
      Урон: 150,
      Мана: 0,
      Ловкость: 7,
      Броня: 3,
      Дальность: 5,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "технический",
    },
    currentHP: 350,
    currentMana: 0,
    currentDamage: 150,
    currentAgility: 7,
    currentArmor: 3,
    currentRange: 5,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "panzir3_passive_check_enemies",
        image: "panzir1.png",
        description: "Пассивно: если в радиусе 6 есть 3+ врагов, ловкость +2.",
        coolDown: 0,
        currentCooldown: 0,
      },
      {
        key: "panzir3_repair",
        image: "panzir2.png",
        description: "+120 HP (если ≤230), +1 броня (если ≤4).",
        coolDown: 7,
        currentCooldown: 0,
      },
      {
        key: "panzir3_burst_shot",
        image: "panzir3.png",
        description: "В области 4 вокруг, 5*50 урона (в сумме 250).",
        coolDown: 9,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Сталевар ────────────────
  {
    name: "Сталевар",
    type: "Меха",
    image: "stalevar_alternative.png",
    stats: {
      HP: 400,
      Урон: 150,
      Мана: 0,
      Ловкость: 4,
      Броня: 3,
      Дальность: 1,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "технический",
    },
    currentHP: 400,
    currentMana: 0,
    currentDamage: 150,
    currentAgility: 4,
    currentArmor: 3,
    currentRange: 1,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "stalevar_plasma_shot",
        image: "stalevar1.png",
        description: "Плазменный снаряд (7 клеток), 150 урона.",
        coolDown: 7,
        currentCooldown: 0,
      },
      {
        key: "stalevar_regen4x50",
        image: "stalevar2.png",
        description: "4 хода по +50 HP/ход.",
        coolDown: 12,
        currentCooldown: 0,
      },
      {
        key: "stalevar_beam_7_200",
        image: "stalevar3.png",
        description: "Луч 7 клеток, 200 урона.",
        coolDown: 11,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── МК-10 ────────────────
  {
    name: "МК-10",
    type: "Меха",
    image: "mk10_alternative.png",
    stats: {
      HP: 400,
      Урон: 150,
      Мана: 0,
      Ловкость: 4,
      Броня: 3,
      Дальность: 4,
    },
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "технический",
    },
    currentHP: 400,
    currentMana: 0,
    currentDamage: 150,
    currentAgility: 4,
    currentArmor: 3,
    currentRange: 4,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "mk10_ignore_dodge",
        image: "mk101.png",
        description: "3 хода: игнор обычного уворота при атаках.",
        coolDown: 7,
        currentCooldown: 0,
      },
      {
        key: "mk10_3_missiles_75each",
        image: "mk102.png",
        description: "В радиусе 9 выпускает 3 ракеты по 75 урона (итого 225).",
        coolDown: 9,
        currentCooldown: 0,
      },
      {
        key: "mk10_big_missile",
        image: "mk103.png",
        description: "Ракета на 7 клеток (250 в точку, 100 вокруг 1).",
        coolDown: 12,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Алебардист ────────────────
  {
    name: "Алебардист",
    type: "Наёмник",
    image: "alebardist_alternative.png",
    stats: {
      HP: 350,
      Урон: 150,
      Мана: 1500,
      Ловкость: 6,
      Броня: 2,
      Дальность: 2,
    },
    features: "Тёплые варежки: 25% шанс вытолкнуть при первой способности.",
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 350,
    currentMana: 1500,
    currentDamage: 150,
    currentAgility: 6,
    currentArmor: 2,
    currentRange: 2,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    currentCooldowns: [0, 0, 0],
    abilities: [
      {
        key: "halberdier_aoe_3cells_150",
        image: "alebardist1.png",
        description:
          "Создаёт область радиус 3 вокруг себя, 150 урона по врагам.",
        coolDown: 4,
        currentCooldown: 0,
      },
      {
        key: "halberdier_thrust_stun",
        image: "alebardist2.png",
        description: "Луч 3 клетки, 175 урона, 50% шанс стана 1 ход.",
        coolDown: 5,
        currentCooldown: 0,
      },
      {
        key: "halberdier_heavy_strike",
        image: "alebardist3.png",
        description: "Усиленная атака на 2 клетки (200 урона).",
        coolDown: 4,
        currentCooldown: 0,
      },
    ],
  },

  // ──────────────── Йети ────────────────
  {
    name: "Йети",
    type: "Танк",
    image: "jeti_alternative.png",
    stats: {
      HP: 600,
      Урон: 100,
      Мана: 2000,
      Ловкость: 4,
      Броня: 1,
      Дальность: 3,
    },
    features:
      "Станит враж. постройку на 1 ход, если бьёт её (эффект постройки не действует следующий ход).",
    passiveAbilities: [],
    functions: {
      movementAbility: true,
      actionAbility: true,
      abilityUsability: true,
      itemUsability: true,
    },
    advancedSettings: {
      appliedDamageMultiplier: 1,
      damageMultiplier: 1,
      vampirism: 0,
      basicDodge: 0,
      advancedDodge: 0,
      characterLayer: 1,
      damageType: "физический",
    },
    currentHP: 600,
    currentMana: 2000,
    currentDamage: 100,
    currentAgility: 4,
    currentArmor: 1,
    currentRange: 3,
    position: null,
    inventory: [],
    inventoryLimit: 3,
    effects: [],
    // Йети имеет 2 способности
    currentCooldowns: [0, 0],
    abilities: [
      {
        key: "yeti_flexibility_buff_debuff",
        image: "jeti1.png",
        description: "На 4 хода: +2 ловкости союзнику или -1/2 ловкости врагу.",
        coolDown: 4,
        currentCooldown: 0,
      },
      {
        key: "yeti_freeze_area",
        image: "jeti2.png",
        description:
          "Радиус 2 на 5 ходов: 1й ход 25 dmg, 2й 50 dmg, с 3го заморозка (ловкость=1).",
        coolDown: 7,
        currentCooldown: 0,
      },
    ],
  },
];

export const items = [
  {
    name: "Философский камень",
    image: "filosofskiiKamen.png",
    shopType: "Магический",
    price: 300,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility:
        "Добавляет 25% к получаемому из врагов золоту. Добавляет 250 к значению и лимиту маны персонажа. Добавляет 100 к значению и лимиту здоровья персонажа. Увеличение золота: [500 => (+25%) => 625]",
      activeAbility: null,
      availability:
        "В инвентаре одного персонажа, может находиться не более одного Философского камня.",
    },
    onWear: (character) => {
      character.stats.HP += 100;
      character.currentMana += 250;
      character.currentHP = Math.min(character.currentHP + 100, character.stats.HP);
    },
    onRemove: (character) => {
      character.stats.HP = Math.max(character.stats.HP - 100, 0);
      character.currentMana -= 250;
      character.currentHP = Math.min(character.currentHP, character.stats.HP);
    },
  },
  {
    name: "Корона Ра",
    image: "koronaRa.png",
    shopType: "Магический",
    price: 500,
    currency: "gold",
    type: "item",
    cooldown: {
      initial: 10,
      current: 0,
    },
    description: {
      passiveAbility:
        "Атака (пассивная): Урон: 50 (физ.) Тип: область Радиус: 3 клетки.",
      activeAbility:
        "Цена: 10 ходов. Урон: 100 урона/ход. Тип: луч Дальность: 4 клетки. Длительность: 5 ходов. Описание: Из Короны исходит луч света, испепеляющий врагов на своём пути. Наносит 100 урона/ход в течении 5 ходов длинной 4 клетки, при этом хозяин не может поворачивать, двигаться и как-либо действовать, кроме как выключить луч.",
      availability:
        "В инвентаре одного персонажа, может находиться не более одной Короны Ра .",
    },
  },
  {
    name: "Изумруд времени",
    image: "izumrudVremeni.png",
    shopType: "Магический",
    price: 500,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility:
        "Отнимает -5 от цены всех способностей персонажа. Если перед использованием, способность перезагружается 1-5 ходов, то при одевании Изумруда времени, способность будет доступна к использованию каждый ход.",
      activeAbility:
        "Цена: 10 ходов. Обнуляет цену всех активных способностей всех предметов в инвентаре (если такие имеются) кроме этой способности.",
      availability:
        "В инвентаре одного персонажа, может находиться не более одного",
    },
    onWear: (character) => {
      for (const ability of character.abilities) {
        ability.cooldown = Math.max(ability.cooldown - 5, 0);
        ability.currentCooldown = Math.max(ability.currentCooldown - 5, 0);
      }
    },
    onRemove: (character) => {
      for (const ability of character.abilities) {
        ability.cooldown = characters.find(ch => ch.name === character.name).abilities.find(ab => ab.key === ability.key).cooldown;
        ability.currentCooldown = Math.min(ability.currentCooldown + 5, ability.cooldown);
      }
    },
  },
  {
    name: "Обращатель времени",
    image: "obrashatelVremeni.png",
    shopType: "Магический",
    price: 500,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility: null,
      activeAbility:
        "Цена: 20 ходов Обнуляет цену всех способностей персонажа-носителя.",
      availability:
        "В инвентаре одного персонажа, может находиться сколько угодно Обращателей времени, но активная способность может быть активирована только на первом.",
    },
  },
  {
    name: "Уроборос",
    image: "uroboros.png",
    shopType: "Магический",
    price: 350,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility: null,
      activeAbility:
        "Цена: 15 ходов Перерождает персонажа-носителя. По сути, он обновляет персонажа, откатывая его состояние к началу игры. Все эффекты на персонаже сбрасываются. В случае с Энтом, его превращение также сбрасывается, ведь является пассивной способностью с положительным эффектом. Все предметы, кроме Уробороса, удаляются из инвентаря. Тем не менее, персонаж остаётся на своём месте.",
      availability:
        "В инвентаре одного персонажа, может находиться сколько угодно Уроборосов, но при перезарядке одного, пользоваться другим нельзя.",
    },
  },
  {
    name: "Сапоги света",
    image: "lightBoots.png",
    shopType: "Магический",
    price: 500,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility: "Добавляет +2 к ловкости персонажа-носителя.",
      activeAbility:
        'Цена: 12 ходов Телепортирует к союзнику или союзному сооружению (Турель, Башня лучников, прочие строения).  Примечание: Постройки не наносящие негативный эффект противнику/не улучшающие вашу игру не являются союзными.  Пример:  Башня Сиехилда => вредит только противнику => союзная постройка. Стены Древнего => не вредят никому => нейтральная постройка. Исключение: Храм. Тем не менее, храм, захваченный вашей командой, является союзной постройкой. Примечание 1.5: Вторая способность Легионера это "Призванное существо". Призванное существо, является постройкой принадлежащей команде призывателя. Примечание 2: В случае со вселением Вендиго, при вселении, персонаж стаёт вражеским. Следовательно телепорт к нему невозможен.  Примечание 3: Телепорт не может осуществляться в красный квадрат.',
      availability:
        "В инвентаре одного персонажа, может находиться не более одних Сапог света.",
    },
    onWear: (character) => {
      character.currentAgility += 2;
    },
    onRemove: (character) => {
      character.currentAgility -= 2;
    },
  },
  {
    name: "Амулет равновесия",
    image: "amuletRavnovesya.png",
    shopType: "Магический",
    price: 500,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility:
        'Преобразует цену всех способностей в ману. Соотношение: 1 ход = 100 маны. Примечание: Распространяется только на способности использующие в качестве цены ходы. Примечание 2: На способности, с ценой "Пассивно" Амулет не распространяется. Примечание 3: Если, при надетом Амулете равновесия использовать хотя бы одну способность использующую ходы, при снятии, все способности уйдут в перезагрузку.',
      activeAbility: null,
      availability:
        "В инвентаре одного персонажа, может находиться сколько угодно Амулетов равновесия.",
    },
    onWear: (character) => {
      for (const ability of character.abilities) {
        ability.cooldown = 0;
        ability.currentCooldown = 0;
      }
      addEffect(character, {
        name: "Амулет равновесия",
        description: 'Превращает цену всех способностей в ману. Соотношение: 1 ход = 100 маны. Примечание: Распространяется только на способности использующие в качестве цены ходы. Примечание 2: На способности, с ценой "Пассивно" Амулет не распространяется. Примечание 3: Если, при надетом Амулете равновесия использовать хотя бы одну способность использующую ходы, при снятии, все способности уйдут в перезагрузку.',
        effectType: "neutral",
        canCancel: true,
        typeOfEffect: "on ability use",
        turnsRemain: Infinity,
        effect: () => {

        },
        consequence: () => {
        },
      });
    },
    onRemove: (character) => {
      removeEffect(character, "amuletRavnovesya");
      for (const ability of character.abilities) {
        ability.cooldown = characters.find(ch => ch.name === character.name).abilities.find(ab => ab.key === ability.key).cooldown;
        ability.currentCooldown = ability.cooldown;
      }
    }
  },
  {
    name: "Рюкзак",
    image: "backpack.png",
    shopType: "Магический",
    price: 500,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility:
        "Добавляет 4 единицы инвентаря. При этом сам занимает одну в вашем.",
      activeAbility: null,
      availability:
        "В инвентаре одного персонажа, может находиться сколько угодно Рюкзаков. Также в инвентаре Рюкзака, может находиться сколько угодно Рюкзаков.",
    },
    onWear: (character) => {
      character.inventoryLimit += 4;
    },
    onRemove: (character) => {
      character.inventoryLimit -= 4;
    },
  },
  {
    name: "Перчатка повышенного урона",
    image: "damageGloves.png",
    shopType: "Магический",
    price: 250,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility: "Атаки Перчаткой повышенного урона наносят +25 урона.",
      activeAbility:
        "Цена: 7 ходов Длительность: 3 хода Добавляет хозяину 75 урона (в сумме +100 урона) на 3 хода. При этом, со включённой активной способностью Перчатки повышенного урона, хозяин не может использовать способности (не распространяется на способности предметов).",
      availability:
        "В инвентаре одного персонажа, может находиться не более одной Перчатки повышенного урона.",
    },
    onWear: (character) => {
      character.currentDamage += 25;
    },
    onRemove: (character) => {
      character.currentDamage -= 25;
    },
  },
  {
    name: "Пространственный тетраэдр",
    image: "spaceTetraedr.png",
    shopType: "Магический",
    price: 100,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility: null,
      activeAbility:
        'Цена: 0 (после использования исчезает) Добавляет 1 ячейку инвентаря. При этом, перед активацией сам занимает одну в вашем. После активации, вы должны в этот же ход "положить" в него предмет. В противном случае 4-я ячейка инвентаря пропадёт, через 1 ход. Также после доставания из тетраэдра предмета когда угодно, пространство в котором он лежал исчезает.',
      availability:
        "В инвентаре одного персонажа, может находиться сколько угодно Пространственных тетраэдров .",
    },
  },
  {
    name: "Скипетр Кроноса",
    image: "skipitrHronosa.png",
    shopType: "Магический",
    price: 400,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility:
        "Добавляет 25% к шансу нанесения двойного урона. Распространяется как на обычные атаки, так и на способности. Но только на способности с мгновенным уроном. Примечание: 3-я способность Лесного брата и подобные ему (где урон написан (n;n*n). Например (100; 50*2)), работают следующим образом: Первый удар в них, является мгновенным уроном. Таким образом, шанс удвоенного урона будет распространяться только на него. Примечание 2: При атаке персонажа в кустах, либо с шансом уклона: Сначала бросается шанс удвоенного урона, после, шанс уклона. Примечание 3: Не распространяется на урон возведённых построек и брошенных зелий (Например, 2-я и 3-я спсобности Подрывницы) Примечание 4: Может удвоить только числовой (или процентный) урон. Не распространяется на стан (Не может удвоить его длительность) и т.п.",
      activeAbility: null,
      availability:
        "В инвентаре одного персонажа, может находиться не более одного Скипетра Кроноса.",
    },
  },
  {
    name: "Корона Лича",
    image: "koronaLicha.png",
    shopType: "Магический",
    price: 350,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility:
        "Добавляет 1000 к значению и лимиту маны персонажа-носителя.",
      activeAbility:
        "Цена: 10 ходов Длительность: 4 хода Даёт хозяину невосприимчивость к 25% магического урона и  50% физического урона. Примечание: Распространяется на обычный урон, урон от способностей, построек и зелий.",
      availability:
        "В инвентаре одного персонажа, может находиться не более одной Короны Лича.",
    },
    onWear: (character) => {
      character.currentMana += 1000;
      character.stats.Mana += 1000;
    },
    onRemove: (character) => {
      character.currentMana = Math.max(character.currentMana - 1000, 0);
      character.stats.Mana -= 1000;
    },
  },
  {
    name: "Кольцо ветров",
    image: "kolcoVetrov.png",
    shopType: "Магический",
    price: 400,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility:
        "Даёт 10% универсального уклонения. Универсальное уклонение позволяет избегать не только урон от обычных атак, но также и мгновенный урон от способностей (а также автоматические атаки построек).",
      activeAbility: null,
      availability:
        "В инвентаре одного персонажа, может находиться сколько угодно Колец ветров.",
    },
    onWear: (character) => {
      character.advancedSettings.advancedDodge += 10;
    },
    onRemove: (character) => {
      character.advancedSettings.advancedDodge -= 10;
    },
  },
  {
    name: "Кристалл маны",
    image: "manaCrystall.png",
    shopType: "Магический",
    price: 400,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility: "Добавляет 2000 к значению и лимиту маны носителя.",
      activeAbility:
        "Цена: 5 ходов Добавляет 400 к значению (но не к лимиту) маны хозяина.",
      availability:
        "В инвентаре одного персонажа, может находиться не более одного Кристалла маны.",
    },
    onWear: (character) => {
      character.currentMana += 2000;
      character.stats.Mana += 2000;
    },
    onRemove: (character) => {
      character.currentMana = Math.max(character.currentMana - 2000, 0);
      character.stats.Mana -= 2000;
    },
  },
  {
    name: "Эльфийский плащ",
    image: "elvishCloak.png",
    shopType: "Магический",
    price: 400,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility:
        "Добавляет 25% к шансу обычного уклонения. Обычное уклонение позволяет избежать только обычных атак.",
      activeAbility:
        "Цена: 8 ходов Длительность: 2 хода Позволяет входить в невидимость на 2 хода.",
      availability:
        "В инвентаре одного персонажа, может находиться не более одного Эльфийского плаща.",
    },
    onWear: (character) => {
      character.advancedSettings.basicDodge += 25;
    },
    onRemove: (character) => {
      character.advancedSettings.basicDodge -= 25;
    },
  },
  {
    name: "Зелье восстановления",
    image: "potionOfRecovery.png",
    shopType: "Магический",
    price: 100,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility: null,
      activeAbility:
        "Цена: 0 (после использования исчезает) Добавляет хозяину: +150 к значению НР. +1500 к значению маны.",
      availability:
        "В инвентаре одного персонажа, может находиться сколько угодно Зелий восстановления.",
    },
  },
  {
    name: "Свиток телепортации",
    image: "teleportScroll.png",
    shopType: "Магический",
    price: 50,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility: null,
      activeAbility:
        "Цена: 0 (после использования исчезает) Телепортирует к союзным постройкам. Не телепортирует к союзникам.",
      availability:
        "В инвентаре одного персонажа, может находиться сколько угодно Свитков телепортации.",
    },
  },
  {
    name: "Катана",
    image: "katana.png",
    shopType: "Магический",
    price: 300,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility:
        "Добавляет 50 к значению урона персонажа-носителя. Бонус работает только на персонажах с типом: Иной и Рыцарь.",
      activeAbility: null,
      availability:
        "В инвентаре одного персонажа, может находиться не более одной Катаны.",
    },
    onWear: (character) => {
      if (character.type === "Иной" || character.type === "Рыцарь") {
        character.currentDamage += 50;
      }
    },
    onRemove: (character) => {
      if (character.type === "Иной" || character.type === "Рыцарь") {
        character.currentDamage -= 50;
      }
    },
  },
  {
    name: "Перчатка Мидаса",
    image: "perchatkaMidasa.png",
    shopType: "Магический",
    price: 500,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility:
        "Добавляет 50% к получаемому за убийство золоту. Причём, даже просто существование у одного из персонажей Перчатки Мидаса позволяет получать +50% с любого убийства любым персонажем.  [500 =>(+50%)=>750]",
      activeAbility: "Цена: 5 ходов Превращает 500 маны хозяина в 50 золота.",
      availability:
        "В инвентаре одного персонажа, может находиться сколько угодно Перчаток Мидаса, но эффекты складываться не будут.",
    },
  },
  {
    name: "Телескоп",
    image: "telescope.png",
    shopType: "Магический",
    price: 400,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility:
        "Добавляет 3 к значению дальности персонажа. Добавляет 2 к значению дальности на способностях. Примечание: Это не распространяется на размер области, длительность эффекта и т.д. Примечание 2: Не распространяется на дальность взаимодействия с магазинами и т.д. Влияет именно на дальность атаки. Примечание 3: Бонус добавляется только персонажам с типом: Стрелок, Меха.",
      activeAbility: null,
      availability:
        "В инвентаре одного персонажа, может находиться не более одного Телескопа.",
    },
    onWear: (character) => {
      if (character.type === "Стрелок" || character.type === "Меха") {
        character.currentRange += 3;
      }
    },
    onRemove: (character) => {
      if (character.type === "Стрелок" || character.type === "Меха") {
        character.currentRange -= 3;
      }
    },
  },
  {
    name: "Алый бокал",
    image: "aliyBokal.png",
    shopType: "Магический",
    price: 500,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility:
        "Добавляет вампиризм с атак персонажу-носителю.  Физический урон = 50%. [100 (физ.) урона => (50%) => +50 НР] Магический = 25% [100 (маг.) урона => (25%) => +25 НР] Примечание: Вампиризм распространяется на урон от обычных атак, а также мгновенный урон у способностей.",
      activeAbility: null,
      availability:
        "В инвентаре одного персонажа, может находиться не более одного Алого бокала.",
    },
  },
  {
    name: "Сумеречный плащ",
    image: "twilightCloak.png",
    shopType: "Магический",
    price: 500,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility:
        "Добавляет 150 к значению и лимиту НР персонажа-носителя.",
      activeAbility:
        "Цена: 6 ходов (Активируется самостоятельно) Спасает хозяина от смертельного удара. Распространяется на любой вид наносимого урона, вплоть до урона от зелий. После спасения добавляет хозяину 25% от лимита НР. 25% высчитывается и от всех бонусов на лимит НР. Например: Кровавый маг: 500 НР [500HP + 150НР от плаща + 100НР от ф.камня = 750НР => (25%) => 188HP] После спасения, Сумеречный плащ уходит в перезагрузку.",
      availability:
        "В инвентаре одного персонажа, может находиться не более одного Сумеречного плаща.",
    },
    onWear: (character) => {
      character.stats.HP += 150;
      character.currentHP += 150;
    },
    onRemove: (character) => {
      character.stats.HP = Math.max(character.stats.HP - 150, 0);
      character.currentHP = Math.max(character.currentHP - 150, 0);
    },
  },
  {
    name: "Кирка кобольда",
    image: "kirkaKobolda.png",
    shopType: "Магический",
    price: 300,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility:
        'Урон по постройкам +25% урона. Золото за убийство персонажем-носителем +20% Таким образом: Урон по постройкам: [100 урона => (+25%) => 125 урона] Золото за убийство: [500 => (+20%) => 600] Примечание: Бонус на урон по постройкам не распространяется на "Призванное существо".',
      activeAbility: null,
      availability:
        "В инвентаре одного персонажа, может находиться не более одной Кирки кобольда.",
    },
  },
  {
    name: "Двойной тессеракт",
    image: "doubleTesserakt.png",
    shopType: "Магический",
    price: 400,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility: null,
      activeAbility:
        "Цена: 10 ходов Позволяет меняться местами с обладателем второй части пары Двойного тессеракта. Даже если этим обладателем будет противник. Если один из тессерактов будет разрушен, оставшийся будет перемещать к союзным телепортам.",
      availability:
        "В инвентаре одного персонажа, может находиться не более одного Двойного тессеракта.",
    },
  },
  {
    name: "Ртутные сапоги",
    image: "rtutnieSapogi.png",
    shopType: "Магический",
    price: 400,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility: "Добавляет 3 к значению ловкости персонажа-носителя.",
      activeAbility:
        "Цена: 10 ходов Длительность: 3 хода Удваивает значение ловкости хозяина. Бонусы к ловкости учитываются.  Например: Лесной брат: 10 ловкости [10 => +3 от Ртутных сапог +2 от Сапог света x2 от зелья ускорения = 30 ловкости => (x2) => 60 ловкости] Во время активной способности, этот предмет нельзя сбрасывать или воровать.",
      availability:
        "В инвентаре одного персонажа, может находиться не более одних Ртутных сапог.",
    },
    onWear: (character) => {
      character.currentAgility += 3;
    },
    onRemove: (character) => {
      character.currentAgility -= 3;
    },
  },
  {
    name: "Зелье здоровья",
    image: "healingPotion.png",
    shopType: "Лаборатория",
    price: 3000,
    currency: "mana",
    type: "item",
    description: "При использовании восстанавливает 300 НР обладателю зелья.",
  },
  {
    name: "Зелье ускорения",
    image: "speedPotion.png",
    shopType: "Лаборатория",
    price: 2000,
    currency: "mana",
    type: "item",
    isSingleUse: true,
    effect: (character) => agilityBoost(character, {
      amount: character.currentAgility,
      duration: 3,
      name: "Зелье ускорения",
      description: "Увеличивает ловкость персонажа в два раза на 3 хода",
    }),
    description:
      "Длительность: 3 хода При использовании удваивает ловкость обладателя зелья. После использования эффект нельзя отменить.",
  },
  {
    name: "Зелье отравления",
    image: "poison.png",
    shopType: "Лаборатория",
    price: 3000,
    throwable: true,
    currency: "mana",
    type: "item",
    stats: {
      range: 3,
      zoneColor: "#2ecc71",
      affiliation: "negative only",
      // Функция-обработчик броска: возвращает конфиг зоны
      effect: ({ usedBy, targetCoord }) => ({
        name: "Ядовитое облако",
        affiliate: "negative only",
        turnsRemain: 6,
        stats: {
          rangeOfObject: 2,
          rangeShape: "romb",
          rangeColor: "#2ecc71",
        },
        center: targetCoord,
        coordinates: 0,
        handlerKey: 'poison_potion',
        usedBy: usedBy ? { name: usedBy.name, team: usedBy.team } : null,
      }),
    },
    description:
      "Атака: Урон: 100*3 Тип: область Радиус: 2 клетки Длительность: 3 хода/6 ходов. Дальность: дальность персонажа. Описание: При использовании выкидывается на дальность персонажа и на 6 ходов создаёт ядовитую область попав в которую получишь необратимый эффект яда, наносящий 100 урона/ход в течении 3 ходов. Примечание: не работает на летающие объекты. Примечание 2: однажды получивший урон от зелья отравления персонаж, получает иммунитет от этого зелья до конца игры (при воскрешении или перерождении - сбрасывается)",
  },
  {
    name: "Зелье маны",
    image: "manaPotion.png",
    shopType: "Лаборатория",
    price: 100,
    currency: "HP",
    type: "item",
    description:
      "При использовании добавляет: 3000 маны (Долина красных рек) 1000 маны (Поля Пикси, Руины города Артафен) Может превышать лимит. Например: Гигант: 1000 маны (играет на Поле Пикси) Гигант использует зелье маны => Мана: 2000/1000 => Гигант покупает стены (1500 маны) => Мана: 500/1000.",
  },
  {
    name: "Зелье магического удара молнии",
    image: "potionOfMagicStrike.png",
    shopType: "Лаборатория",
    price: 7000,
    currency: "mana",
    type: "item",
    description:
      "Атака: Урон: 1/2 от Макс.НР жертвы Тип: точка Дальность: дальность персонажа Описание: При использовании бьёт по клетке на которую бросили и снимает 50% от максимального НР существа или вражеской постройки на этой клетке. Работает на базе. При наличии брони, снимает 2 брони, как магический урон.",
  },
  {
    name: "Зелье воскрешения",
    image: "potionOfRevival.png",
    shopType: "Лаборатория",
    price: 7000,
    currency: "mana",
    type: "item",
    description:
      "При использовании воскрешает последнего убитого союзника и отправляет его на союзную базу.",
  },
  {
    name: "Броня",
    image: "armor.png",
    shopType: "Оружейная",
    price: 500,
    currency: "mana",
    type: "wearable",
    description:
      "При покупке добавляет +1 к значению брони покупателя. Максимум брони на персонаже 5. Если у персонажа 5 брони, новую броню нельзя купить.",
  },
  {
    name: "Турель",
    image: "tourel.png",
    shopType: "Оружейная",
    price: 6000,
    currency: "mana",
    type: "building",
    description:
      'При использовании создаёт союзную постройку "Турель": НР: ∞ Урон (пассив.): 100 (тех.) Тип: область Примечание: Как обычно, постройку можно возводить в любой точке на союзной половине карты кроме синего квадрата, область может заходить на вражескую территорию но не может в красный квадрат. Эта постройка не наносит урон другим постройкам.',
  },
  {
    name: "Башня лучников",
    image: "archersTower.png",
    shopType: "Оружейная",
    price: 4000,
    currency: "mana",
    type: "building",
    description:
      'При использовании ставит союзную постройку "Башня лучников": НР: 750 Урон (пассив.): 75/150. (тех.) Тип: точка Примечание: так как на башне находятся 2 лучника, каждый из которых наносит урон 75 (тех.), то, если в радиусе действия башни лучников есть 2 противника, каждому нанесётся по 75 (тех.) урона, если 1 противник, ему нанесётся 150 (тех.) урона (75*2), если же 3+ то игрок выбирает каким двум персонажам нанести урон. Примечание 2: Башня лучников заменяет собой стену, будь она изначальная или купленная, за неимением возможности снимать с поля изначальные стены мы обычно принебрегаем этим фактом. И тем не менее, если башня лучников была поставлена на покупную стену, то, после её уничтожения убирайте стену поставленную под башней. Примечание 3: Как обычно, постройку можно возводить на союзной половине карты кроме синего квадрата, область может заходить на вражескую территорию но не в красный квадрат. Постройка не наносит урон другим постройкам.',
  },
  {
    name: "Стена (х3)",
    image: "wall.png",
    shopType: "Оружейная",
    price: 1500,
    currency: "mana",
    type: "building",
    stats: {
      HP: 750,
      Урон: 0,
      Мана: 0,
      Ловкость: 0,
      Броня: 0,
      Дальность: 0,
    },
    currentHP: 750,
    description:
      "НР: 750 После покупки добавляет в один слот инвентаря покупателя 3 стены. Примечание: При использовании на своей территории можно ставить на любую дальность, в пределах синего квадрата. При использовании на вражеской территории, можно ставить только на свою дальность. За раз можно поставить все стены. Примечание 2: Стена - нейтральная постройка.",
  },
  {
    name: "Усиление урона",
    image: "damageBoost.png",
    shopType: "Оружейная",
    price: "100%",
    currency: "mana",
    type: "wearable",
    description: "При покупке повышает значение урона покупателя на 50.",
  },
  {
    name: "Повозка",
    image: "povozka.png",
    shopType: "Оружейная",
    price: 3000,
    currency: "mana",
    type: "building",
    description:
      'Создаёт нейтральную постройку "Повозка": НР: 100 Броня: 2 Ловкость: 6 Можно перемещать по наличии персонажа сидящего на "коне". Перемещение телеги считается за перемещение. Залезть на коня или телегу: действие. Слезть - перемещение.',
  },
  {
    name: "Лазарет",
    image: "lazaret.png",
    shopType: "Оружейная",
    price: 3000,
    currency: "mana",
    type: "building",
    description:
      'При использовании ставит нейтральную постройку "Лазарет": НР: 500 Броня: 1 Лечит персонажей обеих команд находящихся в радиусе 1 от Лазарета. 50НР/ход. Восстановление Лазарета не снимает негативные эффекты. Можно разобрать, при действии два хода подряд (можно разными персонажами). На лазарет нельзя становиться. Примечание: Если при последнем действии в радиусе только союзники, то игрок сам выбирает кому в инвентарь отправится Лазарет. Если же союзник и враг, то Лазарет отправляется последнему кто действовал на Лазарет. Примечание 2: При разборке Лазарета, его эффект не работает.',
  },
  {
    name: "Шахта",
    image: "mine.png",
    shopType: "Оружейная",
    price: 3000,
    currency: "mana",
    type: "building",
    description:
      'При использовании ставит нейтральную постройку "Шахта": НР: 750 Броня: 0 Добавляет команде поставившей шахту, 10 золота/ход. Шахту можно ставить только на своей территории, вне синего квадрата. На шахту нельзя становиться. Примечание: Золото, добытое шахтой, автоматически отправляется на "счёт" команды.',
  },
  {
    name: "Зелье заморозки",
    image: "potionOfFrost.png",
    shopType: "Лаборатория",
    price: 3000,
    currency: "mana",
    throwable: true,
    stats: {
      range: 3,
      zoneColor: "rgb(76, 248, 243)",
      affiliation: "negative only",
      effect: () => { },
    },
    type: "item",
    description:
      "При разбитии мгновенно поражает область с радиусом 3 клетки вокруг себя. В этой области, вражеские персонажи и вражеские постройки замерзают на 3 хода (Невозможно перемещаться и действовать). Вражеским персонажам при этом наносится 50 (физ.) урона/ход (сквозь броню), в течении 3 ходов. Это считается за негативный эффект, который можно развеять.",
  },
  {
    name: "Дымовая шашка",
    image: "smoke.png",
    shopType: "Оружейная",
    price: 1000,
    currency: "mana",
    throwable: true,
    type: "item",
    description:
      "Дымовая шашка бросается на свою дальность. Но если Ваша дальность меньше 5, Вы можете бросить шашку на дальность больше или равна 5. Образует вокруг себя область с радиусом 4 клетки, в которой плотный дым отнимает половину от ловкости всех персонажей, делает дальность всех персонажей = 1, обычный промах = 50%. Действует дымовая шашка в течении 3-х ходов. Примечание: Промах бросается атакующим персонажем если хотя бы один из участников битвы находится в дыму. Примечание 2: Эффект дыма - негативный, но не может быть развеян способностью или зельями. Примечание 3: На дымовой шашке можно стоять.",
  },
  {
    name: "Таран",
    image: "taran.png",
    shopType: "Оружейная",
    price: 2000,
    currency: "mana",
    type: "building",
    description:
      'Ставит нейтральную постройку "Таран": НР: 500 Броня: 0. Таран - постройка 2х1 клетки, наносящая повышенный урон постройкам. Можно двигать только персонажами "Танками". Для управления тараном, танк должен подойти на расстояние 1 клетка и действовать на него. К тарану могут прикрепиться несколько танков одной команды. В таком случае, ловкость тарана = минимальная начальная ловкость среди группы танков, управляющей тараном. Урон по постройкам от тарана = сумма урона всех участников группы х 1.5. Не може быть использована на призываемых существах и телеге.',
  },
  {
    name: "Сфера маны",
    image: "sferaMani.png",
    shopType: "Магический",
    price: 400,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility:
        "Сфера маны восстанавливает персонажу-носителю 100 маны/ход. Больше лимита восстановить не может.",
      activeAbility:
        "Цена: 10 ходов. В течении 5 ходов, Сфера маны восстанавливает хозяину 250 маны/ход. Больше лимита не восстанавливает. Пока активная способность действует, сбросить или украсть Сферу нельзя.",
      availability:
        "В инвентаре одного персонажа может находиться не более одной Сферы маны.",
    },
  },
  {
    name: "Молот огра",
    image: "molotOgra.png",
    shopType: "Магический",
    price: 300,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility:
        'Урон обычных атак персонажа ближнего боя (изначальная дальность = от 1 до 3) +50. При этом, при ношении в инвентаре Молота огра, от тяжести, у персонажа-носителя отнимается 1 ловкость. Негативный эффект не распространяется на персонажей с типом "Танк". Примечание: Атаки с эффектом Молота огра всегда наносят физический урон.',
      activeAbility: null,
      availability:
        "В инвентаре одного персонажа может находиться не более одного Молота огра.",
    },
  },
  {
    name: "Пространственная перчатка",
    image: "prostranstvennayaPerchatka.png",
    shopType: "Магический",
    price: 400,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility: null,
      activeAbility:
        "Цена: 10 ходов. Пространственная перчатка позволяет переместить предмет из инвентаря персонажа-носителя в инвентарь любого союзника на карте. Примечание: Себя, пространственная перчатка переместить не может. Примечание 2: Можно переместить только один предмет за раз (или же все предметы из одной ячейки). Примечание 3: Нельзя переместить предметы из рюкзака, но можно переместить рюкзак с предметами.",
      availability:
        "В инвентаре одного персонажа может находиться сколько угодно Пространственных перчаток.",
    },
  },
  {
    name: "Тёмный пакт",
    image: "darkPakt.png",
    shopType: "Магический",
    price: 300,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility: null,
      activeAbility:
        'Цена: единоразовая активация предмета. После покупки Тёмного пакта, между носителем и предметом образуется связь "Тёмный пакт". Таким образом, если связь Тёмного пакта выполнена и предмет находится в инвентаре персонажа с кем был заключён "Тёмный пакт" персонажу даётся сила предмета: Теперь каждая обычная атака персонажа-носителя может быть усилена за счёт его НР (-2 НР = +1 урон). Так, чтобы выполнить усиленную атаку (повышенную на 50 урона), персонажу придётся отдать свои собственные 100 НР. Имейте ввиду, усиление даётся не навсегда, а лишь на следующую атаку. Такое усиление не считается за действие. После смерти персонажа, с которым был подписан "Тёмный пакт", предмет уничтожается. Одновременно не может существовать более одного контракта подписанного с конкретным персонажем.',
      availability: null,
    },
  },
  {
    name: "Свиток пиромантии",
    image: "pyroScroll.png",
    shopType: "Магический",
    price: 200,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility: null,
      activeAbility:
        "Атака: Цена: одноразовая. Урон: 200 (физ.) Тип: область. Радиус: 3 клетки. Можно кидать на свою дальность. Поджигает область с радиусом 3 вокруг себя и наносит мгновенный урон: 200 (физ.) урона.",
      availability:
        "В инвентаре одного персонажа может находиться сколько угодно Свитков пиромантии.",
    },
  },
  {
    name: "Свиток чар",
    image: "charScroll.png",
    shopType: "Магический",
    price: 200,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility: null,
      activeAbility:
        "Атака: Цена: одноразовая. Урон: 150 (маг.) Тип: точка. Дальность: 7 клеток.",
      availability:
        "В инвентаре одного персонажа может находиться сколько угодно Свитков чар.",
    },
  },
  {
    name: "Свиток чудес",
    image: "wonderScroll.png",
    shopType: "Магический",
    price: 200,
    currency: "gold",
    type: "item",
    description: {
      passiveAbility: null,
      activeAbility:
        "Цена: одноразовая. Можно использовать на свою дальность. В области с радиусом 3 вокруг себя, Свиток чудес мгновенно восстанавливает союзникам по 200 НР. Только союзным персонажам. После использования исчезает.",
      availability:
        "В инвентаре одного персонажа может находиться сколько угодно Свитков чудес.",
    },
  },
];
