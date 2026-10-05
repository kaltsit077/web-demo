/* Run state, meta traits, breed / remix / devour */
var GameState = (() => {
  const META_KEY = "shape_evo_meta_v1";

  /** @type {object|null} */
  let run = null;

  function loadMeta() {
    try {
      const raw = localStorage.getItem(META_KEY);
      if (!raw) return { traits: [] };
      const data = JSON.parse(raw);
      return { traits: Array.isArray(data.traits) ? data.traits : [] };
    } catch {
      return { traits: [] };
    }
  }

  function saveMeta(meta) {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  }

  function clearMeta() {
    localStorage.removeItem(META_KEY);
  }

  function getMeta() {
    return loadMeta();
  }

  function applyMetaTrait(hero, trait) {
    if (!trait || !trait.part) return;
    const part = structuredClone(trait.part);
    hero.parts[part.slot] = part;
    GameData.recomputeHp(hero);
  }

  function startRun(route) {
    const tpl = GameData.routeTemplates(route);
    const hero = GameData.makeCharacter({ ...tpl.hero, id: "hero", baseHp: tpl.hero.baseHp });
    hero.baseHp = tpl.hero.baseHp;
    const ally = GameData.makeCharacter({ ...tpl.ally, id: "ally", baseHp: tpl.ally.baseHp });
    ally.baseHp = tpl.ally.baseHp;

    const meta = loadMeta();
    if (meta.traits.length) {
      applyMetaTrait(hero, meta.traits[0]);
    }

    const slots = [null, null, null, null];
    slots[hero.slotIndex] = hero;
    slots[ally.slotIndex] = ally;

    run = {
      route,
      year: 1,
      nodeIndex: 0,
      slots,
      heroId: hero.id,
      log: [`踏上${route === "monster" ? "强怪物" : "普通人"}之路。`],
      lastPotion: null,
      pendingLoot: false,
    };
    return run;
  }

  function getRun() {
    return run;
  }

  function getHero() {
    if (!run) return null;
    return run.slots.find((c) => c && c.id === run.heroId) || run.slots.find((c) => c && c.role === "hero");
  }

  function getAlliesAlive() {
    return (run?.slots || []).filter((c) => c && c.hp > 0);
  }

  function currentNode() {
    return GameData.NODES[run.nodeIndex];
  }

  function advanceYear() {
    run.year += 1;
    for (const c of run.slots) {
      if (c) c.age += 1;
    }
  }

  function completeNode() {
    advanceYear();
    run.nodeIndex += 1;
  }

  function isRunComplete() {
    const node = currentNode();
    return !node || node.type === "end";
  }

  function rollPotion() {
    const partId = GameData.pickPotionPartId(run.route);
    const part = structuredClone(GameData.PARTS[partId]);
    run.lastPotion = {
      name: run.route === "monster" ? "趋人药剂" : "畸变药剂",
      partId,
      preview: part,
    };
    return run.lastPotion;
  }

  function remixPart(slot) {
    const hero = getHero();
    if (!hero) return null;
    const preferred = run.route === "monster" ? "human" : "mutant";
    let next;
    if (run.lastPotion && run.lastPotion.preview.slot === slot) {
      next = structuredClone(run.lastPotion.preview);
    } else {
      next = GameData.randomPartForSlot(slot, preferred);
    }
    const before = hero.parts[slot];
    hero.parts[slot] = next;
    GameData.recomputeHp(hero);
    return { before, after: next, hero };
  }

  function canBreed() {
    const hero = getHero();
    return !!(hero && hero.age >= hero.matureAge);
  }

  function getSpouseCandidate() {
    return (run.slots || []).find((c) => c && c.id !== run.heroId && c.hp > 0) || null;
  }

  function breed() {
    const hero = getHero();
    const spouse = getSpouseCandidate();
    if (!hero || !spouse || !canBreed()) return { ok: false, reason: "未成熟或无配偶" };

    const childParts = {};
    for (const slot of GameData.PART_SLOTS) {
      childParts[slot] =
        Math.random() < 0.5
          ? structuredClone(hero.parts[slot])
          : structuredClone(spouse.parts[slot]);
    }

    const skillIds = [...new Set([...(hero.skillIds || []), ...(spouse.skillIds || [])])].slice(0, 3);
    const child = GameData.makeCharacter({
      id: `child_${Date.now()}`,
      name: `${hero.name}之子`,
      role: "hero",
      age: 0,
      matureAge: 4,
      routeBias: run.route,
      skillIds: skillIds.length ? skillIds : ["strike"],
      partIds: {
        head: childParts.head.id,
        torso: childParts.torso.id,
        arms: childParts.arms.id,
        legs: childParts.legs.id,
      },
      baseHp: Math.round(((hero.baseHp || 30) + (spouse.baseHp || 30)) / 2),
      slotIndex: hero.slotIndex,
      color: hero.color,
    });
    // override with mixed parts (makeCharacter clones from ids)
    child.parts = childParts;
    child.baseHp = Math.round(((hero.baseHp || 30) + (spouse.baseHp || 30)) / 2);
    GameData.recomputeHp(child);
    child.hp = child.maxHp;

    const heroSlot = run.slots.indexOf(hero);
    run.slots[heroSlot] = child;
    run.heroId = child.id;

    return {
      ok: true,
      child,
      message: `${hero.name}与${spouse.name}繁衍后死去。子嗣「${child.name}」继承混合外形；${spouse.name}仍留在队伍中。`,
    };
  }

  function devour() {
    const hero = getHero();
    const victim = getSpouseCandidate();
    if (!hero || !victim) return { ok: false, reason: "无可吞噬的队友" };

    const slots = GameData.PART_SLOTS;
    const slot = slots[Math.floor(Math.random() * slots.length)];
    const stolen = structuredClone(victim.parts[slot]);
    const before = hero.parts[slot];
    hero.parts[slot] = stolen;
    GameData.recomputeHp(hero);

    const vIdx = run.slots.indexOf(victim);
    run.slots[vIdx] = null;

    return {
      ok: true,
      message: `${hero.name}吞噬了${victim.name}，夺得「${stolen.label}」替换「${before.label}」。队友消失。`,
      before,
      after: stolen,
    };
  }

  function healPartyFull() {
    for (const c of run.slots) {
      if (c) c.hp = c.maxHp;
    }
  }

  function collectTrait(slot) {
    const hero = getHero();
    if (!hero) return;
    const part = structuredClone(hero.parts[slot]);
    saveMeta({
      traits: [
        {
          label: part.label,
          slot: part.slot,
          part,
          from: hero.name,
        },
      ],
    });
  }

  function partSummary(char) {
    if (!char) return "";
    return GameData.PART_SLOTS.map((s) => {
      const p = char.parts[s];
      return `${GameData.SLOT_LABEL[s]}:${p.label}`;
    }).join(" · ");
  }

  return {
    loadMeta,
    saveMeta,
    clearMeta,
    getMeta,
    startRun,
    getRun,
    getHero,
    getAlliesAlive,
    currentNode,
    completeNode,
    isRunComplete,
    rollPotion,
    remixPart,
    canBreed,
    getSpouseCandidate,
    breed,
    devour,
    healPartyFull,
    collectTrait,
    partSummary,
  };
})();
