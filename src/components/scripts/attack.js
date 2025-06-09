// attack.js – единственная точка, где считается урон и снос брони.
// Подключайте её в abilities.js: import { attack } from "./attack.js";

import { characters } from "../../data";
import { removeBuilding } from "./building";

/**
 * Унифицированная функция атаки.
 * @param {Object}   attacker        – объект атакующего, минимум { team: string }
 * @param {string}   affiliate       – поле ability.affiliate (например, "negative only", "ally", "neutral")
 * @param {Object}   targets         – массив объектов целей, минимум { team, currentHP, currentArmor }
 * @param {number}   damage          – номинальный урон (до учёта брони)
 * @param {string}   damageType      – "physical"|"technical"|"magical"|"pure" или русские эквиваленты
 * @returns {null | { currentHP:number, currentArmor:number, hpDamage:number }[]}
 */
export function attack(attacker, affiliate, targets, damage, damageType) {
    // Проверяем, что targets - это массив
    if (!Array.isArray(targets)) {
        targets = [targets];
    }

    // Результаты атаки для каждой цели
    const results = [];

    // Для каждой цели в массиве
    targets.forEach(target => {
        // 1. Разрешено ли бить по такой цели?
        if (!canTarget(attacker, target, affiliate)) {
            results.push(null);
            return;
        }

        // 2. Нормализуем тип урона (принимаем и русские названия)
        const dt = normalizeDamageType(damageType);

        let hpDamage = 0;
        let armor = target.currentArmor ?? 0;

        switch (dt) {
            case "pure":
                hpDamage = damage; // броня игнорируется
                break;

            case "physical":
            case "technical":
                if (armor > 0) {
                    armor -= 1;              // сносим одну броню
                } else {
                    hpDamage = damage;       // без брони – полный урон
                }
                break;

            case "magical":
                if (armor >= 2) {
                    armor -= 2;              // магия сносит 2 брони
                } else if (armor === 1) {
                    armor -= 1;
                    hpDamage = Math.ceil(damage / 2); // ½ урона идёт в HP
                } else {
                    hpDamage = damage;       // брони нет – полный урон
                }
                break;

            default:
                throw new Error(`Unknown damage type: ${damageType}`);
        }

        // 3. Применяем результат к цели
        target.currentArmor = Math.max(0, armor);
        if (hpDamage > 0) {
            target.currentHP = Math.max(0, target.currentHP - hpDamage);

            if (target.currentHP === 0) {
                target.position = null;
            }
            console.log(attacker);
            
            attacker.caster.currentHP = Math.min(attacker.caster.stats.HP, attacker.caster.currentHP + attacker.caster.advancedSettings.vampirism)
        }

        results.push({
            currentHP: target.currentHP,
            currentArmor: target.currentArmor,
            hpDamage,
            target,
        });
    });

    return results;
}
  
export function attackBase(baseAffiliate, damage, matchState) {
    let baseHP = Math.max(0, matchState.teams[baseAffiliate].baseHP - damage)
    if (baseHP) {
        matchState.teams[baseAffiliate].baseHP = baseHP
        return {
            status: {
                teamWon: false
            }
        }
    }
    else {
        matchState.teams[baseAffiliate].baseHP = 0
        return {
            status: {
                description: "База разрушена",
                teamWon: baseAffiliate === "red" ? "blue" : "red"
            }
        }
    }
}

export function attackBuilding(building, {damage, damageType}, matchState) {

    if (building.currentArmor > 0) {
        if (damageType === "физический" || damageType === "технический") {
            building.currentArmor--
        }
        else if (damageType === "магический") {
            if (building.currentArmor >= 2) {
                building.currentArmor -= 2
            }
            else {
                building.currentArmor--
                building.currentHP = Math.max(building.currentHP - Math.ceil(damage / 2), 0)
            }
        }
        else if (damageType === "чистый") {
            building.currentHP = Math.max(building.currentHP - damage, 0)
        }
    }
    else {
        building.currentHP = Math.max(building.currentHP - damage, 0)
    }
    console.log(building);
    
    building.onHit? building.onHit() : ""
    
    if (building.currentHP === 0) {
        console.log("Тупо я перед тем как поломаться", building);
        removeBuilding(null, matchState, building.id)
    }
    if (building.currentHP === 0) {
        console.log("Некролог");
        return {isDestroyed: true}
    }
    else {
        return {isDestroyed: false}
    }
}

/* ────────────────────────── helpers ────────────────────────── */
  
/** Нормализуем строку damageType (принимаем RU/EN). */
function normalizeDamageType(type) {
    const map = {
        "физический": "physical",
        physical:      "physical",
        "технический": "technical",
        technical:     "technical",
        "магический": "magical",
        magical:       "magical",
        "чистый":      "pure",
        pure:          "pure",
    };
    return map[type] ?? type;
}
  
/**
 * Проверяет, разрешено ли воздействовать на target по правилу affiliate.
 * Допустимые значения affiliate такие же, как в abilities.js.
 */
function canTarget(attacker, target, affiliate) {
    console.log(attacker, target, affiliate);
    // проверяем, что оба объекта имеют поле team
    const sameTeam = attacker.caster.team && target.team && attacker.caster.team === target.team;
    
    switch (affiliate) {
        case "negative only":      // только враги
            return !sameTeam;
        case "negative neutral":   // враги + нейтральные
            return !sameTeam;
        case "positive only":      // только союзники
        case "ally":
            return sameTeam;
        case "positive neutral":   // союзники + нейтральные
            return sameTeam;
        case "neutral":            // любые цели
            return true;
        default:
            // неизвестное значение трактуем как нейтральное
            return true;
    }
}
  