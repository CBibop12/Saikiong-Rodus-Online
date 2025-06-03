// Функция для обработки покупки "Броня"
// При покупке брони списывается 500 маны и добавляется +1 к броне персонажа.
export const applyArmorEffect = (character) => {
  if (character.currentMana < 500) {
    return {
      success: false,
      message: `${character.name} не имеет достаточного количества маны для покупки Брони`,
    };
  }
  character.currentMana -= 500;
  character.currentArmor += 1;
  return {
    success: true,
    message: `${character.name} покупает Броню: +1 к броне, 500 маны списано`,
  };
};

// Функция для обработки покупки "Усиление урона"
// При покупке усиления урона весь остаток маны обнуляется, а урон увеличивается на 50.
export const useDamageBoostEffect = (character) => {
  character.currentDamage += 50;
  character.currentMana = 0;
  return {
    success: true,
    message: `${character.name} покупает Усиление урона: +50 к урону, мана обнулена`,
  };
};

// Пример функции для применения эффекта Зелья восстановления
// Восстанавливает 100 HP и 1000 маны (но не выше максимума).
export const applyRestorePotion = (character) => {
  const hpRestored = Math.min(100, character.stats.HP - character.currentHP);
  character.currentHP += hpRestored;
  const manaRestored = Math.min(
    1000,
    character.stats.Мана - character.currentMana
  );
  character.currentMana += manaRestored;
  return {
    success: true,
    message: `${character.name} применяет Зелье восстановления: +${hpRestored} HP и +${manaRestored} маны`,
  };
};

// Функции пассивных эффектов – вызываются сразу при покупке товара

// Философский камень:
// • Добавляет 25% к получаемому из врагов золоту (это можно учитывать при начислении награды)
// • Добавляет 250 к значению и лимиту маны персонажа
// • Добавляет 100 к значению и лимиту здоровья персонажа
export const applyPhilosopherStonePassive = (character) => {
  character.stats.Мана += 250;
  character.currentMana += 250;
  character.stats.HP += 100;
  // Можно добавить лимит, если хранится отдельно
  return {
    success: true,
    message: `${character.name} активирует Философский камень: +250 маны, +100 HP`,
  };
};

// Корона Ра (пассивная часть):
// При атаке носителя добавляет +50 физического урона в области (радиус 3 клетки)
export const applyCoronaRaPassive = (character) => {
  character.stats.Урон += 50;
  return {
    success: true,
    message: `${character.name} получает Корону Ра: +50 к урону (пассив)`,
  };
};
// Корона Ра (активная):
// Излучает луч, наносящий 100 урона/ход в течение 5 ходов (активировать командой "использует")
export const useCoronaRaActive = (character) => {
  // Здесь можно установить эффект (например, { name: "Корона Ра луч", remainingTurns: 5, damagePerTurn: 100, type: "луч" })
  character.effects = character.effects || [];
  character.effects.push({
    name: "Луч Короны Ра",
    remainingTurns: 5,
    damagePerTurn: 100,
  });
  return {
    success: true,
    message: `${character.name} активирует Корону Ра: луч наносит 100 урона/ход (5 ходов)`,
  };
};

// Изумруд времени (пассив):
// Снижает стоимость всех способностей персонажа на 5 (в единицах цены) – можно сохранять скидку
export const applyEmeraldTimePassive = (character) => {
  character.emeraldDiscount = (character.emeraldDiscount || 0) + 5;
  return {
    success: true,
    message: `${character.name} получает Изумруд времени: скидка 5 к цене способностей`,
  };
};
// Изумруд времени (актив):
// Обнуляет цену всех активных способностей предметов (за 10 ходов)
export const useEmeraldTimeActive = (character) => {
  // Здесь можно установить специальное состояние – например, сброс цен активных способностей
  character.resetAbilityCosts = true;
  return {
    success: true,
    message: `${character.name} активирует Изумруд времени: цены способностей обнулены`,
  };
};

// Обращатель времени (актив):
// Обнуляет цену всех способностей персонажа-носителя (за 20 ходов)
export const useTimeManipulatorActive = (character) => {
  character.resetAbilityCosts = true;
  return {
    success: true,
    message: `${character.name} активирует Обращатель времени: все способности готовы к использованию`,
  };
};

// Уроборос (актив):
// Перерождает персонажа – сбрасывает эффекты, удаляет все предметы, кроме Уробороса
export const useUroborosActive = (character) => {
  character.currentHP = character.stats.HP;
  character.currentMana = character.stats.Мана;
  character.effects = [];
  // Сохраняем Уроборос, если он есть, удаляя остальные
  character.inventory = character.inventory.filter(
    (item) => item.name === "Уроборос"
  );
  return {
    success: true,
    message: `${character.name} перерождается с помощью Уробороса`,
  };
};

// Сапоги света (пассив):
// Добавляют +2 к ловкости персонажа
export const applyLightBootsPassive = (character) => {
  character.stats.Ловкость += 2;
  return {
    success: true,
    message: `${character.name} получает Сапоги света: +2 к ловкости`,
  };
};
// Сапоги света (актив):
// Телепортирует персонажа к союзному объекту – здесь просто добавляем сообщение
export const useLightBootsActive = (character) => {
  // Здесь можно реализовать выбор цели для телепортации
  return {
    success: true,
    message: `${character.name} активирует Сапоги света: телепортируется к союзной постройке`,
  };
};

// Амулет равновесия (пассив):
// Преобразует цену способностей в мана-единицы (1 ход = 100 маны) – сохраняем информацию
export const applyBalanceAmuletPassive = (character) => {
  character.balanceAmulet = true;
  return {
    success: true,
    message: `${character.name} получает Амулет равновесия: способности теперь оцениваются в мане`,
  };
};

// Рюкзак (пассив):
// Добавляет 4 дополнительных слота инвентаря (но занимает один слот)
export const applyBackpackPassive = (character) => {
  character.extraInventorySlots = (character.extraInventorySlots || 0) + 4;
  return {
    success: true,
    message: `${character.name} получает Рюкзак: +4 слота инвентаря`,
  };
};

// Перчатка повышенного урона (пассив):
// Добавляет +25 к урону от обычных атак
export const applyGlovePassive = (character) => {
  character.stats.Урон += 25;
  return {
    success: true,
    message: `${character.name} получает Перчатку повышенного урона: +25 к урону`,
  };
};
// Перчатка повышенного урона (актив):
// За 7 ходов и на 3 хода активной способности добавляет дополнительно +75 урона (итого +100)
// и блокирует использование способностей на этот период
export const useGloveActive = (character) => {
  character.effects = character.effects || [];
  character.effects.push({
    name: "Активная Перчатка",
    remainingTurns: 3,
    bonusDamage: 75,
    disableAbilities: true,
  });
  return {
    success: true,
    message: `${character.name} активирует Перчатку повышенного урона: +75 урона на 3 хода, способности заблокированы`,
  };
};

// Пространственный тетраэдр (актив):
// Добавляет 1 дополнительный слот инвентаря в текущем ходе (но сам занимает слот)
export const useSpatialTetrahedronActive = (character) => {
  character.extraInventorySlots = (character.extraInventorySlots || 0) + 1;
  return {
    success: true,
    message: `${character.name} активирует Пространственный тетраэдр: +1 слот инвентаря`,
  };
};

// Скипетр Кроноса (пассив):
// Добавляет 25% к шансу нанесения двойного урона (для мгновенных атак)
export const applyCronosScepterPassive = (character) => {
  character.doubleDamageChance = (character.doubleDamageChance || 0) + 25;
  return {
    success: true,
    message: `${character.name} получает Скипетр Кроноса: +25% к шансу двойного урона`,
  };
};

// Корона Лича (пассив):
// Добавляет 1000 к мана и к лимиту маны
export const applyLichCrownPassive = (character) => {
  character.stats.Мана += 1000;
  character.currentMana += 1000;
  return {
    success: true,
    message: `${character.name} получает Корону Лича: +1000 маны`,
  };
};
// Корона Лича (актив):
// На 4 хода дает невосприимчивость к 25% магического и 50% физического урона
export const useLichCrownActive = (character) => {
  character.effects = character.effects || [];
  character.effects.push({
    name: "Невосприимчивость Короны Лича",
    remainingTurns: 4,
    magicReduction: 25,
    physicalReduction: 50,
  });
  return {
    success: true,
    message: `${character.name} активирует Корону Лича: невосприимчивость к урону на 4 хода`,
  };
};

// Кольцо ветров (пассив):
// Даёт 10% универсального уклонения
export const applyWindRingPassive = (character) => {
  character.universalDodge = (character.universalDodge || 0) + 10;
  return {
    success: true,
    message: `${character.name} получает Кольцо ветров: +10% универсального уклонения`,
  };
};

// Кристалл маны (пассив):
// Добавляет 2000 к мане и лимиту маны
export const applyManaCrystalPassive = (character) => {
  character.stats.Мана += 2000;
  character.currentMana += 2000;
  return {
    success: true,
    message: `${character.name} получает Кристалл маны: +2000 маны`,
  };
};
// Кристалл маны (актив):
// За 5 ходов добавляет 400 к текущей маны (но не лимиту)
export const useManaCrystalActive = (character) => {
  character.currentMana += 400;
  return {
    success: true,
    message: `${character.name} активирует Кристалл маны: +400 маны`,
  };
};

// Эльфийский плащ (пассив):
// Добавляет 25% к шансу обычного уклонения
export const applyElvenCloakPassive = (character) => {
  character.normalDodge = (character.normalDodge || 0) + 25;
  return {
    success: true,
    message: `${character.name} получает Эльфийский плащ: +25% обычного уклонения`,
  };
};
// Эльфийский плащ (актив):
// На 2 хода позволяет входить в невидимость
export const useElvenCloakActive = (character) => {
  character.effects = character.effects || [];
  character.effects.push({ name: "Невидимость", remainingTurns: 2 });
  return {
    success: true,
    message: `${character.name} активирует Эльфийский плащ: невидимость на 2 хода`,
  };
};

// Катана (пассив):
// Добавляет +50 к урону, но только для персонажей типа "Иной" и "Рыцарь"
export const applyKatanaPassive = (character) => {
  if (["Иной", "Рыцарь"].includes(character.type)) {
    character.stats.Урон += 50;
    return {
      success: true,
      message: `${character.name} получает Катану: +50 к урону`,
    };
  }
  return {
    success: false,
    message: `${character.name} не может использовать Катану`,
  };
};

// Перчатка Мидаса (пассив):
// Добавляет 50% к золоту, получаемому за убийство (это нужно учитывать при начислении золота)
export const applyMidasGlovePassive = (character) => {
  character.midasBonus = true;
  return {
    success: true,
    message: `${character.name} получает Перчатку Мидаса: +50% к золоту за убийства`,
  };
};
// Перчатка Мидаса (актив):
// За 5 ходов превращает 500 маны в 50 золота
export const useMidasGloveActive = (character) => {
  if (character.currentMana < 500) {
    return {
      success: false,
      message: `${character.name} не имеет 500 маны для активации Перчатки Мидаса`,
    };
  }
  character.currentMana -= 500;
  // Добавляем золото команде – здесь нужно определить, к какой команде принадлежит персонаж
  return {
    success: true,
    message: `${character.name} активирует Перчатку Мидаса: 500 маны превращены в 50 золота`,
  };
};

// Телескоп (пассив):
// Добавляет 3 к дальности персонажа, и +2 к дальности способностей для Стрелок и Меха
export const applyTelescopePassive = (character) => {
  if (["Стрелок", "Меха"].includes(character.type)) {
    character.stats.Дальность += 3;
    // Можно отдельно учитывать бонус для способностей
    return {
      success: true,
      message: `${character.name} получает Телескоп: +3 к дальности`,
    };
  }
  return {
    success: false,
    message: `${character.name} не получает бонус от Телескопа`,
  };
};

// Алый бокал (пассив):
// Добавляет вампиризм: при атаке восстанавливает определённый процент HP (здесь просто метка)
export const applyScarletGobletPassive = (character) => {
  character.vampirism = character.vampirism || { physical: 50, magical: 25 };
  return {
    success: true,
    message: `${character.name} получает Алый бокал: вампиризм активирован`,
  };
};

// Сумеречный плащ (пассив):
// Добавляет 150 к HP и лимиту HP
export const applyTwilightCloakPassive = (character) => {
  character.stats.HP += 150;
  character.currentHP += 150;
  return {
    success: true,
    message: `${character.name} получает Сумеречный плащ: +150 HP`,
  };
};
// Сумеречный плащ (актив):
// За 6 ходов спасает от смертельного удара, затем добавляет 25% от лимита HP в виде восстановления
export const useTwilightCloakActive = (character) => {
  character.effects = character.effects || [];
  character.effects.push({
    name: "Сумеречный плащ спасения",
    remainingTurns: 6,
    shield: true,
  });
  return {
    success: true,
    message: `${character.name} активирует Сумеречный плащ: спасение от смертельного удара`,
  };
};

// Кирка кобольда (пассив):
// Добавляет +25% к урону по постройкам и +20% золота за убийство (учитывать при расчёте)
export const applyKoboldPickaxePassive = (character) => {
  character.pickaxeBonus = true;
  return {
    success: true,
    message: `${character.name} получает Кирку кобольда: бонус к урону по постройкам`,
  };
};

// Двойной тессеракт (актив):
// Позволяет обменяться местами с другим персонажем (даже противником)
export const useDoubleTesseractActive = (character, otherCharacter) => {
  if (!otherCharacter)
    return { success: false, message: `Нет цели для обмена местами` };
  const temp = character.position;
  character.position = otherCharacter.position;
  otherCharacter.position = temp;
  return {
    success: true,
    message: `${character.name} меняется местами с ${otherCharacter.name} при помощи Двойного тессеракта`,
  };
};

// Ртутные сапоги (пассив):
// Добавляют +3 к ловкости
export const applyMercuryBootsPassive = (character) => {
  character.stats.Ловкость += 3;
  return {
    success: true,
    message: `${character.name} получает Ртутные сапоги: +3 к ловкости`,
  };
};
// Ртутные сапоги (актив):
// За 10 ходов, на 3 хода активного эффекта удваивают ловкость
export const useMercuryBootsActive = (character) => {
  character.effects = character.effects || [];
  character.effects.push({
    name: "Активные Ртутные сапоги",
    remainingTurns: 3,
    multiplier: 2,
  });
  return {
    success: true,
    message: `${character.name} активирует Ртутные сапоги: ловкость удвоена на 3 хода`,
  };
};

// Зелье здоровья (актив):
// Восстанавливает 300 HP, не превышая максимум
export const useHealthPotionActive = (character) => {
  const healed = Math.min(300, character.stats.HP - character.currentHP);
  character.currentHP += healed;
  return {
    success: true,
    message: `${character.name} использует Зелье здоровья: +${healed} HP`,
  };
};

// Зелье ускорения (актив):
// На 3 хода удваивает ловкость
export const useAccelerationPotionActive = (character) => {
  character.effects = character.effects || [];
  character.effects.push({
    name: "Зелье ускорения",
    remainingTurns: 3,
    multiplier: 2,
    affectedStat: "Ловкость",
  });
  return {
    success: true,
    message: `${character.name} использует Зелье ускорения: ловкость удвоена на 3 хода`,
  };
};

// Зелье отравления (актив):
// Создает ядовитую область с уроном 100/ход на 3 хода; затем персонаж получает иммунитет к отравлению
export const usePoisonPotionActive = (character) => {
  // Здесь необходимо добавить логику создания ядовитой области – для примера просто лог
  return {
    success: true,
    message: `${character.name} использует Зелье отравления: ядовитая область создана`,
  };
};

// Зелье маны (актив):
// Добавляет определенное количество маны в зависимости от местности (например, 3000 или 1000)
export const useManaPotionActive = (character, amount) => {
  const manaToAdd = amount || 3000;
  character.currentMana = Math.min(
    character.currentMana + manaToAdd,
    character.stats.Мана
  );
  return {
    success: true,
    message: `${character.name} использует Зелье маны: +${manaToAdd} маны`,
  };
};

// Зелье магического удара молнии (актив):
// Бьет по клетке, снимая 50% от максимального HP цели и 2 брони (если есть)
export const useLightningPotionActive = (character, target) => {
  // Здесь target – объект цели; для примера просто лог
  return {
    success: true,
    message: `${character.name} использует Зелье магического удара молнии на ${target.name}`,
  };
};

// Зелье воскрешения (актив):
// Воскрешает последнего убитого союзника и отправляет его на союзную базу
export const useResurrectionPotionActive = (
  character,
  resurrectedCharacter
) => {
  if (!resurrectedCharacter)
    return { success: false, message: `Нет союзника для воскрешения` };
  resurrectedCharacter.currentHP = resurrectedCharacter.stats.HP;
  // Можно установить позицию на базу
  resurrectedCharacter.position = "база";
  return {
    success: true,
    message: `${character.name} использует Зелье воскрешения: ${resurrectedCharacter.name} возвращен в бой`,
  };
};

// Турель (актив):
// Создает союзную постройку "Турель"
export const useTurretActive = (character) => {
  // Добавляем запись о создании постройки; логика построек может быть реализована отдельно
  return { success: true, message: `${character.name} возводит Турель` };
};

// Башня лучников (актив):
// Создает союзную постройку "Башня лучников"
export const useArcherTowerActive = (character) => {
  return {
    success: true,
    message: `${character.name} возводит Башню лучников`,
  };
};

// Стена (х3) (актив):
// Добавляет 3 стены в один слот инвентаря (если возможно)
export const useWallActive = (character) => {
  // Для примера – добавляем запись в лог
  return { success: true, message: `${character.name} возводит 3 стены` };
};

// Повозка (актив):
// Создает нейтральную постройку "Повозка"
export const useWagonActive = (character) => {
  return { success: true, message: `${character.name} возводит Повозку` };
};

// Лазарет (актив):
// Создает нейтральную постройку "Лазарет"
export const useInfirmaryActive = (character) => {
  return { success: true, message: `${character.name} возводит Лазарет` };
};

// Шахта (актив):
// Создает нейтральную постройку "Шахта"
export const useMineActive = (character) => {
  return { success: true, message: `${character.name} возводит Шахту` };
};

// Зелье заморозки (актив):
// Разбивается и замораживает область вокруг себя
export const useFreezePotionActive = (character, targetArea) => {
  return {
    success: true,
    message: `${character.name} использует Зелье заморозки: область заморожена`,
  };
};

// Дымовая шашка (актив):
// Создает область дыма, которая уменьшает ловкость и дальность
export const useSmokeBombActive = (character) => {
  return {
    success: true,
    message: `${character.name} использует Дымовую шашку: область дыма создана`,
  };
};

// Таран (актив):
// Создает постройку "Таран"
export const useBatteringRamActive = (character) => {
  return { success: true, message: `${character.name} возводит Таран` };
};

// Молот огра (пассив):
// Добавляет +50 урона для ближнего боя, но отнимается 1 ловкость (если не Танк)
export const applyOgreHammerPassive = (character) => {
  if (character.type !== "Танк") {
    character.stats.Урон += 50;
    character.stats.Ловкость = Math.max(character.stats.Ловкость - 1, 0);
    return {
      success: true,
      message: `${character.name} получает Молот огра: +50 урона, -1 ловкость`,
    };
  }
  return {
    success: false,
    message: `${character.name} (Танк) не теряет ловкость от Молота огра`,
  };
};

// Пространственная перчатка (актив):
// Перемещает предмет из инвентаря носителя в инвентарь союзника
export const useSpatialGloveActive = (character, itemName, targetCharacter) => {
  if (!targetCharacter)
    return { success: false, message: `Нет цели для перемещения предмета` };
  const itemIndex = character.inventory.findIndex((it) => it.name === itemName);
  if (itemIndex === -1)
    return {
      success: false,
      message: `${character.name} не имеет ${itemName}`,
    };
  const item = character.inventory.splice(itemIndex, 1)[0];
  targetCharacter.inventory.push(item);
  return {
    success: true,
    message: `${character.name} передает ${itemName} с помощью Пространственной перчатки ${targetCharacter.name}`,
  };
};

// Тёмный пакт (актив):
// Создает связь, которая позволяет усилить следующую атаку за счет HP (-2 HP = +1 урон)
export const useDarkPactActive = (character) => {
  character.darkPact = true;
  return {
    success: true,
    message: `${character.name} активирует Тёмный пакт: следующая атака усилена за счет HP`,
  };
};

// Свиток пиромантии (актив):
// Наносит 200 физ. урона по области с радиусом 3 клеток и поджигает ее
export const usePyromancyScrollActive = (character, targetArea) => {
  return {
    success: true,
    message: `${character.name} использует Свиток пиромантии: область подожжена`,
  };
};

// Свиток чар (актив):
// Наносит 150 маг. урона по точке на дальность 7 клеток
export const useCharmScrollActive = (character, target) => {
  return {
    success: true,
    message: `${character.name} использует Свиток чар на ${target.name}`,
  };
};

// Свиток чудес (актив):
// Восстанавливает союзникам в области с радиусом 3 клеток по 200 HP
export const useWonderScrollActive = (character, targetArea) => {
  return {
    success: true,
    message: `${character.name} использует Свиток чудес: союзники восстановлены на 200 HP`,
  };
};
