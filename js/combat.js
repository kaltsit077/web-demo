/* Turn-based combat: fixed skills + part mods + row rules */
var Combat = (() => {
  /** @type {object|null} */
  let battle = null;

  function initiativeOf(char) {
    let ini = 5;
    for (const p of Object.values(char.parts || {})) {
      ini += p.initiative || 0;
    }
    // Front rows act a bit earlier
    if (char.slotIndex <= 1) ini += 1;
    return ini;
  }

  function skillResolved(char, skillId) {
    const skill = GameData.SKILLS[skillId];
    if (!skill) return null;
    let power = skill.basePower;
    let hits = skill.baseHits;
    for (const part of Object.values(char.parts || {})) {
      for (const m of part.mods || []) {
        if (m.skillId !== skillId) continue;
        if (m.power) power += m.power;
        if (m.hits) hits += m.hits;
      }
    }
    hits = Math.max(1, hits);
    power = Math.max(1, power);

    // Row modifiers
    const front = char.slotIndex <= 1;
    if (skill.kind === "melee") {
      power = front ? power + 2 : Math.max(1, power - 3);
    } else if (skill.kind === "ranged") {
      power = front ? Math.max(1, power - 1) : power + 2;
    }

    return { ...skill, power, hits };
  }

  function living(list) {
    return list.filter((c) => c && c.hp > 0);
  }

  function start(allies, enemies, title) {
    const allySide = allies.map((c) => ({
      ...structuredClone(c),
      side: "ally",
    }));
    const enemySide = enemies.map((c) => ({
      ...structuredClone(c),
      side: "enemy",
    }));

    const order = [...allySide, ...enemySide]
      .filter((c) => c.hp > 0)
      .sort((a, b) => initiativeOf(b) - initiativeOf(a));

    battle = {
      title: title || "挑战",
      allies: allySide,
      enemies: enemySide,
      turnQueue: order.map((c) => c.id),
      turnIndex: 0,
      log: [`进入战斗：${title || "挑战"}`],
      selectedSkill: null,
      selectedActorId: null,
      status: "active", // active | won | lost
      awaitingPlayer: false,
    };

    prepareTurn();
    return battle;
  }

  function getBattle() {
    return battle;
  }

  function currentActor() {
    if (!battle || battle.status !== "active") return null;
    const id = battle.turnQueue[battle.turnIndex];
    return findById(id);
  }

  function findById(id) {
    return (
      battle.allies.find((c) => c.id === id) ||
      battle.enemies.find((c) => c.id === id) ||
      null
    );
  }

  function rebuildQueueKeepingRelative() {
    const livingAll = living([...battle.allies, ...battle.enemies]).sort(
      (a, b) => initiativeOf(b) - initiativeOf(a)
    );
    const ids = livingAll.map((c) => c.id);
    const curId = battle.turnQueue[battle.turnIndex];
    battle.turnQueue = ids;
    let idx = ids.indexOf(curId);
    if (idx < 0) idx = battle.turnIndex % Math.max(1, ids.length);
    battle.turnIndex = idx;
  }

  function prepareTurn() {
    if (!battle || battle.status !== "active") return;

    // skip dead
    let guard = 0;
    while (guard++ < 20) {
      const alliesAlive = living(battle.allies);
      const enemiesAlive = living(battle.enemies);
      if (!enemiesAlive.length) {
        battle.status = "won";
        battle.awaitingPlayer = false;
        battle.log.push("胜利！敌方全灭。");
        return;
      }
      if (!alliesAlive.length) {
        battle.status = "lost";
        battle.awaitingPlayer = false;
        battle.log.push("败北……队伍倒下。");
        return;
      }

      rebuildQueueKeepingRelative();
      const actor = currentActor();
      if (!actor || actor.hp <= 0) {
        advanceTurnIndex();
        continue;
      }

      if (actor.side === "ally") {
        battle.awaitingPlayer = true;
        battle.selectedActorId = actor.id;
        battle.selectedSkill = null;
        battle.log.push(`轮到 ${actor.name}。选择固定技能。`);
        return;
      }

      // AI
      battle.awaitingPlayer = false;
      aiAct(actor);
      if (battle.status !== "active") return;
      advanceTurnIndex();
    }
  }

  function advanceTurnIndex() {
    if (!battle.turnQueue.length) return;
    battle.turnIndex = (battle.turnIndex + 1) % battle.turnQueue.length;
  }

  function aiAct(actor) {
    const skillId = actor.skillIds[Math.floor(Math.random() * actor.skillIds.length)];
    const targets = living(battle.allies);
    if (!targets.length) return;
    // Prefer front allies for melee
    const resolved = skillResolved(actor, skillId);
    let target = targets[0];
    if (resolved.kind === "melee") {
      target = [...targets].sort((a, b) => a.slotIndex - b.slotIndex)[0];
    } else {
      target = targets[Math.floor(Math.random() * targets.length)];
    }
    resolveAttack(actor, skillId, target);
  }

  function selectSkill(skillId) {
    if (!battle || !battle.awaitingPlayer) return false;
    const actor = currentActor();
    if (!actor || !actor.skillIds.includes(skillId)) return false;
    battle.selectedSkill = skillId;
    return true;
  }

  function canTarget(target) {
    if (!battle || !battle.awaitingPlayer || !battle.selectedSkill) return false;
    const actor = currentActor();
    const skill = GameData.SKILLS[battle.selectedSkill];
    if (!actor || !skill || !target || target.hp <= 0) return false;
    if (skill.target === "enemy") return target.side === "enemy";
    if (skill.target === "ally") return target.side === "ally";
    return false;
  }

  function playerTarget(targetId) {
    if (!battle || !battle.awaitingPlayer || !battle.selectedSkill) return false;
    const actor = currentActor();
    const target = findById(targetId);
    if (!canTarget(target)) return false;
    resolveAttack(actor, battle.selectedSkill, target);
    if (battle.status !== "active") return true;
    battle.awaitingPlayer = false;
    battle.selectedSkill = null;
    advanceTurnIndex();
    prepareTurn();
    return true;
  }

  function resolveAttack(actor, skillId, target) {
    const resolved = skillResolved(actor, skillId);
    if (!resolved) return;

    if (resolved.kind === "support" || resolved.target === "ally") {
      const heal = resolved.power * resolved.hits;
      target.hp = Math.min(target.maxHp, target.hp + heal);
      battle.log.push(
        `${actor.name} 使用【${resolved.name}】治疗 ${target.name} ${heal} 点（${resolved.hits}段）。`
      );
      return;
    }

    let total = 0;
    for (let i = 0; i < resolved.hits; i++) {
      const dmg = resolved.power;
      target.hp = Math.max(0, target.hp - dmg);
      total += dmg;
      if (target.hp <= 0) break;
    }
    battle.log.push(
      `${actor.name} 使用【${resolved.name}】打击 ${target.name}，共 ${total} 伤害（${resolved.hits}段 × ${resolved.power}）。${
        target.hp <= 0 ? ` ${target.name}倒下！` : ""
      }`
    );
  }

  function syncBackToRun() {
    if (!battle) return;
    const run = GameState.getRun();
    if (!run) return;
    for (const ally of battle.allies) {
      const idx = run.slots.findIndex((c) => c && c.id === ally.id);
      if (idx >= 0) {
        run.slots[idx].hp = ally.hp;
        run.slots[idx].maxHp = ally.maxHp;
      }
    }
  }

  return {
    start,
    getBattle,
    currentActor,
    selectSkill,
    playerTarget,
    canTarget,
    skillResolved,
    initiativeOf,
    syncBackToRun,
    prepareTurn,
  };
})();
