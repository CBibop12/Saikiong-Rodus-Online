import { items as availableItems } from "../../data";
import { abilities as abilitiesMap } from "../../abilities";
import { dispatchCommand } from "./dispatchCommand";
import { findCharacter } from "../state/characterStore";
import { attack, attackBuilding as attackBuildingScript, attackBase as attackBaseScript } from "../../components/scripts/attack";
import { build } from "../../components/scripts/building";
import { generateId } from "../../components/scripts/tools/simplifierStore";
import ZoneEffectsManager from "../../components/scripts/zoneEffectsManager";
import { prepareAbility } from "../abilities/abilityManager";

export function createCommandHandlers() {
    return {
        buy: (cmd, ctx) => {
            const { matchState, addActionLog, setTeam1Gold, setTeam2Gold, updateMatchState } = ctx;
            const { characterName } = cmd;
            const { item } = cmd.commandObject || {};
            const charObj = findCharacter(characterName, matchState);
            if (!charObj) return addActionLog(`Ошибка: персонаж ${characterName} не найден`);
            const itemData = availableItems.find((it) => it.name.toLowerCase() === String(item || "").toLowerCase());
            if (!itemData) return addActionLog(`Товар "${item}" не найден в магазине`);

            let requiredCurrency;
            if (itemData.shopType === "Магический") requiredCurrency = "золото";
            else if (itemData.shopType === "Лаборатория" || itemData.shopType === "Оружейная") requiredCurrency = itemData.currency === "HP" ? "HP" : "маны";
            else requiredCurrency = itemData.currency === "HP" ? "HP" : "маны";

            const costValue = typeof itemData.price === "number" ? itemData.price : 0;

            if (requiredCurrency === "маны") {
                if (item === "Усиление урона") {
                    const required = charObj.stats?.Мана || 0;
                    if ((charObj.currentMana || 0) < required) return addActionLog(`Недостаточно маны у ${charObj.name} для покупки Усиления урона (нужно: ${required})`);
                    charObj.currentMana -= required;
                } else {
                    if ((charObj.currentMana || 0) < costValue) return addActionLog(`Недостаточно маны у ${charObj.name} для покупки ${item}`);
                    if (costValue > 0 && item !== "Броня") charObj.currentMana -= costValue;
                }
            } else if (requiredCurrency === "HP") {
                const minHpAfterPurchase = 1;
                if ((charObj.currentHP || 0) - costValue < minHpAfterPurchase) return addActionLog(`Недостаточно HP у ${charObj.name} для покупки ${item} (нужно: ${costValue})`);
                charObj.currentHP -= costValue;
            } else {
                const teamKey = charObj.team;
                if ((matchState.teams?.[teamKey]?.gold || 0) < costValue) {
                    addActionLog(`Недостаточно золота у команды ${teamKey} для покупки ${item}`);
                    matchState.teams[teamKey].remain.actions -= 1;
                    return;
                }
                matchState.teams[teamKey].gold -= costValue;
                if (teamKey === "red") setTeam1Gold(matchState.teams.red.gold);
                else setTeam2Gold(matchState.teams.blue.gold);
            }

            if (charObj.inventory.length >= 3 && item !== "Броня" && item !== "Усиление урона") {
                return addActionLog(`${characterName} не имеет свободного места для покупки ${item}`);
            }

            // special items (оставляем как было)
            if (itemData.onWear) {
                // добавляем в инвентарь и применяем onWear
                if (charObj.inventory.length < 3 && item !== "Броня" && item !== "Усиление урона") {
                    charObj.inventory.push({ ...itemData, left: item === "Стена (х3)" ? 3 : undefined, id: generateId() });
                    itemData.onWear(charObj);
                }
            } else {
                if (charObj.inventory.length < 3 && item !== "Броня" && item !== "Усиление урона") {
                    charObj.inventory.push({ ...itemData, left: item === "Стена (х3)" ? 3 : undefined, id: generateId() });
                }
            }

            if (itemData.shopType !== "Магический") {
                matchState.teams[charObj.team].remain.actions -= 1;
                // КД магазина (фиксировано 6, как раньше в ChatConsole)
                if (itemData.shopType === "Лаборатория") charObj.labCooldown = 6;
                if (itemData.shopType === "Оружейная") charObj.armoryCooldown = 6;
            }
            updateMatchState();
        },

        setGold: (cmd, ctx) => {
            const { matchState, addActionLog, setTeam1Gold, setTeam2Gold, updateMatchState } = ctx;
            const { team, gold } = cmd.commandObject || {};
            if (team === "red") {
                matchState.teams.red.gold = gold;
                addActionLog(`Золото красной команды обновлено до ${gold}`);
                setTeam1Gold(gold);
            } else {
                matchState.teams.blue.gold = gold;
                addActionLog(`Золото синей команды обновлено до ${gold}`);
                setTeam2Gold(gold);
            }
            updateMatchState();
        },

        setBaseHP: (cmd, ctx) => {
            const { matchState, addActionLog, updateMatchState } = ctx;
            const { team, hp } = cmd.commandObject || {};
            if (team === "red") {
                matchState.teams.red.baseHP = hp;
                addActionLog(`HP красной базы = ${hp}`);
            } else {
                matchState.teams.blue.baseHP = hp;
                addActionLog(`HP синей базы = ${hp}`);
            }
            updateMatchState();
        },

        attackBase: (cmd, ctx) => {
            const { matchState, addActionLog, updateMatchState } = ctx;
            const attacker = findCharacter(cmd.characterName, matchState);
            if (!attacker) return addActionLog(`Ошибка: персонаж ${cmd.characterName} не найден`);
            const { damage, team } = cmd.commandObject || {};
            const result = attackBaseScript(team, damage, matchState);
            addActionLog(`HP ${team === "red" ? "красной" : "синей"} базы = ${matchState.teams[team].baseHP}`);
            if (result?.status?.teamWon) {
                matchState.status = team === "red" ? "red_base_destroyed" : "blue_base_destroyed";
            }
            matchState.teams[attacker.team].remain.actions -= 1;
            updateMatchState();
            return result;
        },

        attack: (cmd, ctx) => {
            const { matchState, addActionLog, updateMatchState, turn, setTeam1Gold, setTeam2Gold } = ctx;
            const attacker = findCharacter(cmd.characterName, matchState);
            if (!attacker) return addActionLog(`Ошибка: персонаж ${cmd.characterName} не найден`);
            const { target } = cmd.commandObject || {};
            const targetChar = findCharacter(target, matchState);
            if (!targetChar) return addActionLog(`Ошибка: цель ${target} не найдена`);
            const dmg = attacker.currentDamage ?? 0;
            const dmgType = attacker?.advancedSettings?.damageType || "физический";
            const result = attack({ caster: attacker }, "neutral", targetChar, dmg, dmgType)[0];
            if (result?.currentHP <= 0) {
                targetChar.position = "0-0";
                const winnerTeam = attacker.team;
                matchState.teams[winnerTeam].gold += 500;
                if (winnerTeam === "red") setTeam1Gold(matchState.teams.red.gold);
                else setTeam2Gold(matchState.teams.blue.gold);
            }
            matchState.actions.push({
                type: "attack",
                attacker: attacker.name,
                target,
                damage: dmg,
                damageType: dmgType,
                turn,
                timestamp: new Date().toISOString(),
            });
            matchState.teams[attacker.team].remain.actions -= 1;
            updateMatchState();
        },

        move: (cmd, ctx) => {
            const { matchState, addActionLog, updateMatchState } = ctx;
            const { coords } = cmd.commandObject || {};
            const ch = findCharacter(cmd.characterName, matchState);
            if (!ch) return addActionLog(`Ошибка: персонаж ${cmd.characterName} не найден`);
            ch.position = coords;
            addActionLog(`${cmd.characterName} перемещается на ${coords}`);
            updateMatchState();
        },

        pickup: (cmd, ctx) => {
            const { matchState, addActionLog, updateMatchState } = ctx;
            const { item } = cmd.commandObject || {};
            const ch = findCharacter(cmd.characterName, matchState);
            if (!ch) return addActionLog(`Ошибка: персонаж ${cmd.characterName} не найден`);
            ch.inventory.push({ name: item });
            addActionLog(`${cmd.characterName} подбирает ${item}`);
            matchState.teams[ch.team].remain.actions -= 1;
            updateMatchState();
        },

        discard: (cmd, ctx) => {
            const { matchState, addActionLog, updateMatchState, turn } = ctx;
            const { item, coords } = cmd.commandObject || {};
            const ch = findCharacter(cmd.characterName, matchState);
            if (!ch) return addActionLog(`Ошибка: персонаж ${cmd.characterName} не найден`);
            const idx = ch.inventory.findIndex((it) => it.name.toLowerCase() === String(item || "").toLowerCase());
            if (idx === -1) return addActionLog(`${ch.name} не имеет предмета ${item}`);
            ch.inventory.splice(idx, 1);
            matchState.actions.push({ type: "discard", character: ch.name, item, coords, turn, timestamp: new Date().toISOString() });
            matchState.teams[ch.team].remain.actions -= 1;
            updateMatchState();
        },

        assign: (cmd, ctx) => {
            const { matchState, addActionLog, updateMatchState } = ctx;
            const { attribute, value } = cmd.commandObject || {};
            const ch = findCharacter(cmd.characterName, matchState);
            if (!ch) return addActionLog(`Ошибка: персонаж ${cmd.characterName} не найден`);
            ch[attribute] = parseInt(value);
            addActionLog(`${ch.name} получает ${attribute} = ${value}`);
            updateMatchState();
        },

        useAbility: (cmd, ctx) => {
            const { matchState, addActionLog, selectedMap } = ctx;
            const { spellKey } = cmd.commandObject || {};
            const caster = findCharacter(cmd.characterName, matchState);
            if (!caster) return addActionLog(`Ошибка: персонаж ${cmd.characterName} не найден`);
            const abilityObj = abilitiesMap[spellKey];
            const prep = prepareAbility({
                spellKey,
                caster,
                abilityObj,
                matchState,
                selectedMap,
                addActionLog,
                services: ctx.services,
            });
            // UI side-effects делаем в adapter слое (executeCommand wrapper), здесь возвращаем prep
            return { ok: true, prep };
        },

        build: (cmd, ctx) => {
            const { matchState } = ctx;
            const ch = findCharacter(cmd.characterName, matchState);
            build(ch, matchState, {
                position: cmd.commandObject.position,
                affiliate: "neutral",
                image: cmd.commandObject.image,
                initial: cmd.commandObject.initial,
                name: cmd.commandObject.name || "Постройка",
                description: cmd.commandObject.description || "Конструкция былых времен",
                type: "building",
                stats: {
                    HP: cmd.commandObject.stats?.HP || 0,
                    Урон: cmd.commandObject.stats?.Урон || 0,
                    Мана: cmd.commandObject.stats?.Мана || 0,
                    Ловкость: cmd.commandObject.stats?.Ловкость || 0,
                    Броня: cmd.commandObject.stats?.Броня || 0,
                    Дальность: cmd.commandObject.stats?.Дальность || 0,
                },
                currentHP: cmd.commandObject.currentHP || 0,
                currentMana: cmd.commandObject.currentMana || 0,
                currentDamage: cmd.commandObject.currentDamage || 0,
                currentAgility: cmd.commandObject.currentAgility || 0,
                currentArmor: cmd.commandObject.currentArmor || 0,
                currentRange: cmd.commandObject.currentRange || 0,
                onBuild: cmd.commandObject.onBuild || (() => { }),
                onFinishTurn: cmd.commandObject.onFinishTurn || (() => { }),
                onCharactersInZone: cmd.commandObject.onCharactersInZone || (() => { }),
                onHit: cmd.commandObject.onHit || (() => { }),
                onDestroy: cmd.commandObject.onDestroy || (() => { }),
            });
            ctx.updateMatchState();
        },

        buildBatch: (cmd, ctx) => {
            const { matchState, updateMatchState } = ctx;
            const ch = findCharacter(cmd.characterName, matchState);
            const { positions, building } = cmd.commandObject || {};
            if (!ch) return ctx.addActionLog?.(`Ошибка: персонаж ${cmd.characterName} не найден`);
            const list = Array.isArray(positions) ? positions : [];
            list.forEach((position) => {
                build(ch, matchState, { ...building, position });
            });
            matchState.teams[ch.team].remain.actions -= 1;
            updateMatchState();
            return { ok: true, built: list.length };
        },

        attackBuilding: (cmd, ctx) => {
            const { matchState, updateMatchState, addActionLog } = ctx;
            const attacker = findCharacter(cmd.characterName, matchState);
            if (!attacker) return addActionLog?.(`Ошибка: персонаж ${cmd.characterName} не найден`);
            const { buildingId, damage, damageType } = cmd.commandObject || {};
            const building = (matchState.objectsOnMap || []).find((o) => o?.id === buildingId) || null;
            if (!building) return addActionLog?.(`Ошибка: постройка не найдена`);
            const result = attackBuildingScript(building, { damage, damageType }, matchState);
            matchState.teams[attacker.team].remain.actions -= 1;
            if (result?.isDestroyed && building?.bounty) {
                matchState.teams[attacker.team].gold += building.bounty;
            }
            updateMatchState();
            return result;
        },

        throwZoneItem: (cmd, ctx) => {
            const { matchState, updateMatchState, addActionLog, selectedMap } = ctx;
            const { itemId, itemName, targetCoord } = cmd.commandObject || {};
            const thrower = findCharacter(cmd.characterName, matchState);
            if (!thrower) return addActionLog?.(`Ошибка: персонаж ${cmd.characterName} не найден`);

            // Находим предмет в инвентаре (по id -> по name)
            let idx = (thrower.inventory || []).findIndex((it) => it.id === itemId);
            if (idx === -1) idx = (thrower.inventory || []).findIndex((it) => it.name === itemName);
            if (idx === -1) return addActionLog?.(`Ошибка: предмет ${itemName} не найден в инвентаре`);

            const invItem = thrower.inventory[idx];
            const def = availableItems.find((it) => it.name === invItem.name) || null;
            const effectFn = invItem?.stats?.effect || def?.stats?.effect;
            if (typeof effectFn !== "function") return addActionLog?.(`Ошибка: у предмета нет зонального эффекта`);

            if (!Array.isArray(matchState.zoneEffects)) matchState.zoneEffects = [];
            const zoneConfig = effectFn({ usedBy: thrower, targetCoord });
            const manager = new ZoneEffectsManager(matchState, selectedMap, addActionLog);
            const createdZone = manager.createZone({
                name: zoneConfig.name,
                affiliate: zoneConfig.affiliate || invItem?.stats?.affiliation || "neutral",
                stats: zoneConfig.stats || {},
                turnsRemain: zoneConfig.turnsRemain || 3,
                coordinates: zoneConfig.coordinates || 0,
                chase: zoneConfig.chase || null,
                caster: thrower,
                center: zoneConfig.center || targetCoord,
                handlerKey: zoneConfig.handlerKey || null,
                params: zoneConfig.params || null,
            });

            // Списываем предмет
            thrower.inventory.splice(idx, 1);

            // Визуальный объект в центре зоны (неподбираемый)
            const zoneCenter = zoneConfig.center || targetCoord;
            matchState.objectsOnMap = matchState.objectsOnMap || [];
            matchState.objectsOnMap.push({
                id: invItem.id || `drop_${Date.now()}`,
                type: "item",
                name: invItem.name,
                image: invItem.image,
                description: invItem.description || "Брошенный предмет",
                position: zoneCenter,
                team: thrower.team,
                pickable: false,
                zoneId: createdZone?.id || null,
            });

            matchState.teams[thrower.team].remain.actions -= 1;
            updateMatchState({ zoneEffects: matchState.zoneEffects, teams: matchState.teams, objectsOnMap: matchState.objectsOnMap }, "partial");
            return { ok: true, zoneId: createdZone?.id };
        },

        useItem: (cmd, ctx) => {
            const { matchState, updateMatchState, addActionLog } = ctx;
            const ch = findCharacter(cmd.characterName, matchState);
            if (!ch) return addActionLog?.(`Ошибка: персонаж ${cmd.characterName} не найден`);
            const { itemId, itemName } = cmd.commandObject || {};
            let idx = (ch.inventory || []).findIndex((it) => it.id === itemId);
            if (idx === -1) idx = (ch.inventory || []).findIndex((it) => it.name === itemName);
            if (idx === -1) return addActionLog?.(`${ch.name} не имеет предмета ${itemName} для использования`);

            const invItem = ch.inventory[idx];
            if (typeof invItem?.effect === "function") {
                invItem.effect(ch, matchState);
            } else {
                return addActionLog?.(`Активная функция для ${invItem?.name || itemName} не определена`);
            }

            if (invItem?.isSingleUse) {
                ch.inventory.splice(idx, 1);
            }

            matchState.teams[ch.team].remain.actions -= 1;
            updateMatchState();
            return { ok: true };
        },
    };
}

// helper for tests/usage: dispatch with default handlers
export function dispatchWithDefaultHandlers(command, ctx) {
    return dispatchCommand(command, { ...ctx, handlers: createCommandHandlers() });
}


