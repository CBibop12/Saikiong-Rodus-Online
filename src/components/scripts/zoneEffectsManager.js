// zoneEffectsManager.js
// Унифицированный менеджер для зон с эффектами на карте.

import { getCellsForShape } from "./calculateCellsForZone";
import { attack } from "./attack";
import { findCharacter } from "./tools/characterStore";
import { stringFromCoord } from "./tools/mapStore";
import { applyZoneCharacterHandler } from "../../gameEngine/zones/zoneRegistry";

export default class ZoneEffectsManager {
    constructor(matchState, selectedMap, addActionLog) {
        this.state = matchState;
        this.map = selectedMap;
        this.log = addActionLog;
        this.state.zoneEffects = Array.isArray(this.state.zoneEffects)
            ? this.state.zoneEffects
            : [];
    }

    /**
     * Создать и разместить зону на карте.
     * @param {Object} cfg
     *  - name, affiliate, stats{rangeOfObject, rangeShape, rangeColor, damage, damageType, rangeWidth, rangeHeight}
     *  - turnsRemain, center ("x-y"), coordinates ("dynamic"|number), chase (string), caster (Character)
     *  - handlerKey (string), params (object)
     */
    createZone(cfg) {
        const id = cfg.id || `zone_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const shape = cfg.stats?.rangeShape || "romb";
        const color = cfg.stats?.rangeColor || cfg.color || "#9d45f5";
        const turnsRemain = typeof cfg.turnsRemain === "number" ? cfg.turnsRemain : 1;
        const center = cfg.center || this.#ensureStringCoord(cfg.caster?.position) || null;
        const dynamic = cfg.coordinates === "dynamic" || cfg.dynamic === true;
        const chase = cfg.chase || (dynamic ? "self" : null);
        const casterName = cfg.caster?.name || null;

        const zoneObj = {
            id,
            type: "zone",
            name: cfg.name,
            affiliate: cfg.affiliate || "neutral",
            stats: cfg.stats || {},
            color,
            shape,
            center,
            dynamic,
            chase,
            casterName,
            age: 0,
            turnsRemain,
            handlerKey: cfg.handlerKey || null,
            params: cfg.params || null,
        };

        // DEBUG
        console.log("[Zones][CREATE] id=", id, {
            name: zoneObj.name,
            affiliate: zoneObj.affiliate,
            center: zoneObj.center,
            turnsRemain: zoneObj.turnsRemain,
            casterName: zoneObj.casterName,
            shape: zoneObj.shape,
            stats: zoneObj.stats,
            handlerKey: zoneObj.handlerKey,
        });

        this.state.zoneEffects.push(zoneObj);
        this.log?.(`Зона «${zoneObj.name}» создана в ${zoneObj.center} на ${turnsRemain} ход(а)`, "system", "Зона");
        return zoneObj;
    }

    /**
     * Применить эффекты всех активных зон в конце хода указанной команды.
     * @param {"red"|"blue"} endedTeamKey – команда, чей ход только что закончился
     */
    applyZonesAtTurnEnd(endedTeamKey) {
        const zones = this.state.zoneEffects;
        if (!zones?.length) {
            this.log?.(`Зоны: активных зон нет`, "system", "Зона");
            return;
        }
        this.log?.(`Зоны: всего активных зон ${zones.length}`, "system", "Зона");

        for (const zone of zones) {
            console.log(`[Zones][TICK] id=${zone.id} name='${zone.name}' owner=${zone.casterName} endedTeam=${endedTeamKey} turnsRemain=${zone.turnsRemain}`);
            // Фильтруем зоны по команде владельца: "тикают" только на своих ходах
            const caster = zone.casterName ? findCharacter(zone.casterName, this.state) : null;
            const casterTeam = caster?.team || null;
            if (!casterTeam || casterTeam !== endedTeamKey) {
                this.log?.(`Зона «${zone.name}» пропущена: ход команды ${endedTeamKey}, владелец ${casterTeam ?? "unknown"}`, "system", "Зона");
                console.log(`[Zones] Skip zone '${zone.name}': endedTeam=${endedTeamKey}, owner=${casterTeam}`);
                continue; // не ход владельца — зона не срабатывает и не уменьшается
            }
            console.log(`[Zones][PASS] '${zone.name}' ownerTeam=${casterTeam} -> applying effects`);
            // 1) Обновляем центр для динамических зон (преследование)
            if (zone.dynamic && zone.chase) {
                const targetChar = this.#resolveChaseTarget(zone);
                if (targetChar?.position) {
                    zone.center = this.#ensureStringCoord(targetChar.position);
                }
            }

            // 2) Вычисляем клетки зоны
            const cells = this.#getZoneCells(zone);
            console.log(`[Zones] Zone '${zone.name}' center=${zone.center} cells=`, cells);
            if (!cells.length) {
                this.log?.(`Зона «${zone.name}»: нет клеток для применения (центр=${zone.center})`, "system", "Зона");
                console.warn(`[Zones] Zone '${zone.name}': no cells to apply`);
                continue;
            }

            // 4) Находим затронутых персонажей в зоне и фильтруем по affiliate
            const affected = this.#getCharactersInCells(cells).filter((ch) =>
                this.#isTargetAllowed(zone.affiliate, casterTeam, ch.team)
            );

            // 5) Применяем логику зоны
            this.log?.(`Зона «${zone.name}»: найдено целей ${affected.length} (центр=${zone.center})`, "system", "Зона");
            console.log(`[Zones] Zone '${zone.name}' affected:`, affected.map(a => a?.name), {
                handlerKey: zone.handlerKey,
                affiliate: zone.affiliate,
                center: zone.center,
            });
            if (affected.length) {
                if (zone.handlerKey) {
                    affected.forEach((ch) => {
                        applyZoneCharacterHandler(zone.handlerKey, {
                            character: ch,
                            matchState: this.state,
                            zone,
                            helpers: { attack, findCharacter },
                            log: this.log,
                        });
                    });
                } else if (typeof zone.stats?.damage === "number" && zone.stats.damage > 0) {
                    // Базовая модель урона зоной с учётом типа урона/брони
                    const attackerStub = {
                        caster: caster || {
                            team: casterTeam,
                            currentHP: 0,
                            stats: { HP: 0 },
                            advancedSettings: { vampirism: 0 },
                        },
                    };
                    const results = attack(
                        attackerStub,
                        zone.affiliate,
                        affected,
                        zone.stats.damage,
                        zone.stats.damageType || zone.stats.DamageType || "физический"
                    );
                    results?.forEach((res) => {
                        if (!res) return;
                        const t = res.target;
                        this.log?.(
                            `Зона «${zone.name}»: ${t.name} получает ${res.hpDamage} урона, броня=${t.currentArmor}, HP=${t.currentHP}`,
                            "system",
                            "Зона"
                        );
                        console.log(`[Zones] '${zone.name}' deals ${res.hpDamage} to ${t?.name}, armor=${t?.currentArmor}, hp=${t?.currentHP}`);
                    });
                }
                // 6) Итоговый лог по зоне за тик
                this.log?.(
                    `Зона «${zone.name}»: затронуто ${affected.length} персонаж(ов)`,
                    "system",
                    "Зона"
                );
                console.log(`[Zones] Zone '${zone.name}': affected ${affected.length} targets`);
            }

            // 7) Старение и уменьшение длительности
            zone.age += 1;
            zone.turnsRemain -= 1;
            this.log?.(`Зона «${zone.name}»: возраст=${zone.age}, осталось ходов=${zone.turnsRemain}`, "system", "Зона");
            console.log(`[Zones] Zone '${zone.name}': age=${zone.age}, turnsRemain=${zone.turnsRemain}`);
        }

        // 8) Удаляем истёкшие зоны
        const before = this.state.zoneEffects;
        const alive = before.filter((z) => z.turnsRemain > 0);
        const expired = before.filter((z) => z.turnsRemain <= 0).map(z => z.id);
        if (expired.length) {
            // Чистим связанные неподымаемые объекты (визуальные броски)
            console.log("[Zones][CLEANUP] expired zones:", expired);
            this.state.objectsOnMap = (this.state.objectsOnMap || []).filter((obj) => {
                if (!obj || obj.pickable !== false) return true;
                if (!obj.zoneId) return true;
                return !expired.includes(obj.zoneId);
            });
        }
        this.state.zoneEffects = alive;
    }

    /* ─────────────── helpers ─────────────── */
    #ensureStringCoord(coord) {
        if (!coord) return null;
        if (typeof coord === "string") return coord;
        return stringFromCoord(coord, 1);
    }

    #resolveChaseTarget(zone) {
        if (!zone.chase) return null;
        if (zone.chase === "self" && zone.casterName) {
            return findCharacter(zone.casterName, this.state);
        }
        // Иначе ищем по имени (например, "Саламандра")
        return findCharacter(zone.chase, this.state);
    }

    #getZoneCells(zone) {
        const center = zone.center;
        if (!center) return [];
        const size = this.map?.size || [40, 28];
        const shape = zone.shape || zone.stats?.rangeShape || "romb";
        return getCellsForShape(center, shape, zone.stats || {}, size);
    }

    #getCharactersInCells(cells) {
        const res = [];
        const teams = this.state.teams || {};
        ["red", "blue"].forEach((teamKey) => {
            const chars = teams[teamKey]?.characters || [];
            chars.forEach((ch) => {
                if (ch.currentHP > 0 && ch.position && cells.includes(ch.position)) {
                    res.push(ch);
                }
            });
        });
        return res;
    }

    #isTargetAllowed(affiliate, casterTeam, targetTeam) {
        const sameTeam = casterTeam && targetTeam && casterTeam === targetTeam;
        switch (affiliate) {
            case "negative only":
            case "negative neutral":
                return !sameTeam;
            case "ally":
            case "positive only":
            case "positive neutral":
                return sameTeam;
            case "neutral":
            default:
                return true;
        }
    }
}


