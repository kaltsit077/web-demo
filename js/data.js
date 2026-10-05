/* Game data: skills, parts, routes, enemies, nodes */
var GameData = (() => {
  const PART_SLOTS = ["head", "torso", "arms", "legs"];

  const SLOT_LABEL = {
    head: "头",
    torso: "躯干",
    arms: "手臂",
    legs: "腿",
  };

  const SKILLS = {
    strike: {
      id: "strike",
      name: "挥击",
      basePower: 8,
      baseHits: 1,
      kind: "melee",
      target: "enemy",
    },
    shoot: {
      id: "shoot",
      name: "投射",
      basePower: 6,
      baseHits: 1,
      kind: "ranged",
      target: "enemy",
    },
    roar: {
      id: "roar",
      name: "威吓撕咬",
      basePower: 10,
      baseHits: 1,
      kind: "melee",
      target: "enemy",
    },
    mend: {
      id: "mend",
      name: "包扎",
      basePower: 7,
      baseHits: 1,
      kind: "support",
      target: "ally",
    },
  };

  /** @type {Record<string, object>} */
  const PARTS = {
    // Human-leaning / weaken (monster route potion bias)
    human_ears: {
      id: "human_ears",
      label: "人耳",
      slot: "head",
      bias: "human",
      mods: [{ skillId: "roar", power: -3 }, { skillId: "strike", power: -1 }],
      initiative: 0,
    },
    soft_skin: {
      id: "soft_skin",
      label: "软肤躯干",
      slot: "torso",
      bias: "human",
      mods: [{ skillId: "strike", power: -2 }, { skillId: "roar", power: -2 }],
      hpBonus: -8,
      initiative: 0,
    },
    two_hands: {
      id: "two_hands",
      label: "常人手",
      slot: "arms",
      bias: "human",
      mods: [{ skillId: "strike", hits: 0, power: 0 }],
      initiative: 0,
    },
    steady_legs: {
      id: "steady_legs",
      label: "稳健双腿",
      slot: "legs",
      bias: "human",
      mods: [],
      initiative: 1,
    },

    // Mutant / strengthen (human route potion bias)
    triple_arms: {
      id: "triple_arms",
      label: "三臂",
      slot: "arms",
      bias: "mutant",
      mods: [{ skillId: "strike", hits: 2, power: 2 }],
      initiative: 0,
    },
    beast_claws: {
      id: "beast_claws",
      label: "兽爪",
      slot: "arms",
      bias: "mutant",
      mods: [{ skillId: "strike", power: 5 }, { skillId: "roar", power: 3 }],
      initiative: 0,
    },
    shell_torso: {
      id: "shell_torso",
      label: "甲壳躯干",
      slot: "torso",
      bias: "mutant",
      mods: [],
      hpBonus: 18,
      initiative: -1,
    },
    single_leg: {
      id: "single_leg",
      label: "单腿",
      slot: "legs",
      bias: "mutant",
      mods: [{ skillId: "strike", power: -2 }],
      initiative: -3,
    },
    compound_eyes: {
      id: "compound_eyes",
      label: "复眼",
      slot: "head",
      bias: "mutant",
      mods: [{ skillId: "shoot", power: 4, hits: 1 }],
      initiative: 1,
    },
    horned_skull: {
      id: "horned_skull",
      label: "犄角颅",
      slot: "head",
      bias: "mutant",
      mods: [{ skillId: "roar", power: 4 }, { skillId: "strike", power: 2 }],
      initiative: 0,
    },
    tentacle_legs: {
      id: "tentacle_legs",
      label: "触肢",
      slot: "legs",
      bias: "mutant",
      mods: [{ skillId: "shoot", power: 2 }],
      initiative: 2,
    },
    iron_ribs: {
      id: "iron_ribs",
      label: "铁肋",
      slot: "torso",
      bias: "mutant",
      mods: [{ skillId: "mend", power: 2 }],
      hpBonus: 12,
      initiative: 0,
    },

    // Neutral / starter
    chitin_head: {
      id: "chitin_head",
      label: "甲壳头",
      slot: "head",
      bias: "mutant",
      mods: [{ skillId: "roar", power: 3 }],
      initiative: 0,
    },
    plain_head: {
      id: "plain_head",
      label: "常人颅",
      slot: "head",
      bias: "human",
      mods: [],
      initiative: 0,
    },
    plain_torso: {
      id: "plain_torso",
      label: "常人躯干",
      slot: "torso",
      bias: "human",
      mods: [],
      hpBonus: 0,
      initiative: 0,
    },
    plain_arms: {
      id: "plain_arms",
      label: "常人手臂",
      slot: "arms",
      bias: "human",
      mods: [{ skillId: "strike", power: 1 }],
      initiative: 0,
    },
    plain_legs: {
      id: "plain_legs",
      label: "常人腿",
      slot: "legs",
      bias: "human",
      mods: [],
      initiative: 0,
    },
    monster_torso: {
      id: "monster_torso",
      label: "厚皮躯干",
      slot: "torso",
      bias: "mutant",
      mods: [],
      hpBonus: 22,
      initiative: 0,
    },
    monster_arms: {
      id: "monster_arms",
      label: "巨臂",
      slot: "arms",
      bias: "mutant",
      mods: [{ skillId: "strike", hits: 1, power: 4 }, { skillId: "roar", power: 2 }],
      initiative: 0,
    },
    monster_legs: {
      id: "monster_legs",
      label: "奔袭兽腿",
      slot: "legs",
      bias: "mutant",
      mods: [],
      initiative: 3,
    },
  };

  const POTION_POOLS = {
    monster: ["human_ears", "soft_skin", "two_hands", "steady_legs", "plain_head", "plain_arms"],
    human: [
      "triple_arms",
      "beast_claws",
      "shell_torso",
      "single_leg",
      "compound_eyes",
      "horned_skull",
      "tentacle_legs",
      "iron_ribs",
    ],
  };

  const NODES = [
    { id: 0, type: "battle", label: "遭遇", enemySet: "weak" },
    { id: 1, type: "battle", label: "遭遇", enemySet: "weak" },
    { id: 2, type: "battle", label: "强敌", enemySet: "mid" },
    { id: 3, type: "key", label: "关键" },
    { id: 4, type: "battle", label: "遭遇", enemySet: "mid" },
    { id: 5, type: "battle", label: "遭遇", enemySet: "mid" },
    { id: 6, type: "battle", label: "强敌", enemySet: "hard" },
    { id: 7, type: "battle", label: "终局战", enemySet: "boss" },
    { id: 8, type: "end", label: "终点" },
  ];

  const TARGET_YEAR = NODES.length;

  function cloneParts(partIds) {
    const parts = {};
    for (const slot of PART_SLOTS) {
      const id = partIds[slot];
      parts[slot] = structuredClone(PARTS[id]);
    }
    return parts;
  }

  function makeCharacter(template) {
    const parts = cloneParts(template.partIds);
    const hpBonus = Object.values(parts).reduce((s, p) => s + (p.hpBonus || 0), 0);
    const maxHp = template.baseHp + hpBonus;
    return {
      id: template.id || `c_${Math.random().toString(36).slice(2, 8)}`,
      name: template.name,
      role: template.role || "ally",
      age: template.age ?? 0,
      matureAge: template.matureAge ?? 4,
      routeBias: template.routeBias || "human",
      skillIds: [...template.skillIds],
      parts,
      slotIndex: template.slotIndex ?? 0,
      maxHp,
      hp: maxHp,
      color: template.color || "#7a5a3a",
    };
  }

  function routeTemplates(route) {
    if (route === "monster") {
      return {
        hero: {
          name: "原初兽",
          role: "hero",
          age: 3,
          matureAge: 4,
          routeBias: "monster",
          skillIds: ["roar", "strike"],
          partIds: {
            head: "chitin_head",
            torso: "monster_torso",
            arms: "monster_arms",
            legs: "monster_legs",
          },
          baseHp: 52,
          slotIndex: 0,
          color: "#8a4a2a",
        },
        ally: {
          name: "随行猎手",
          role: "ally",
          age: 5,
          matureAge: 4,
          routeBias: "human",
          skillIds: ["shoot", "mend"],
          partIds: {
            head: "plain_head",
            torso: "plain_torso",
            arms: "plain_arms",
            legs: "plain_legs",
          },
          baseHp: 40,
          slotIndex: 2,
          color: "#4a6a5a",
        },
      };
    }
    return {
      hero: {
        name: "旅人",
        role: "hero",
        age: 2,
        matureAge: 4,
        routeBias: "human",
        skillIds: ["strike", "mend"],
        partIds: {
          head: "plain_head",
          torso: "plain_torso",
          arms: "plain_arms",
          legs: "plain_legs",
        },
          baseHp: 44,
          slotIndex: 0,
          color: "#5a6a7a",
        },
        ally: {
          name: "流浪医士",
          role: "ally",
          age: 6,
          matureAge: 4,
          routeBias: "human",
          skillIds: ["shoot", "mend"],
          partIds: {
            head: "plain_head",
            torso: "iron_ribs",
            arms: "plain_arms",
            legs: "steady_legs",
          },
          baseHp: 38,
        slotIndex: 2,
        color: "#6a7a5a",
      },
    };
  }

  function enemyTemplates(setId) {
    const sets = {
      weak: [
        {
          name: "腐犬",
          skillIds: ["strike"],
          partIds: {
            head: "plain_head",
            torso: "soft_skin",
            arms: "beast_claws",
            legs: "plain_legs",
          },
          baseHp: 22,
          slotIndex: 0,
          color: "#6a3030",
        },
      ],
      mid: [
        {
          name: "甲虫兵",
          skillIds: ["strike", "shoot"],
          partIds: {
            head: "compound_eyes",
            torso: "shell_torso",
            arms: "plain_arms",
            legs: "single_leg",
          },
          baseHp: 28,
          slotIndex: 0,
          color: "#5a3a20",
        },
        {
          name: "影射手",
          skillIds: ["shoot"],
          partIds: {
            head: "plain_head",
            torso: "plain_torso",
            arms: "plain_arms",
            legs: "tentacle_legs",
          },
          baseHp: 20,
          slotIndex: 1,
          color: "#403050",
        },
      ],
      hard: [
        {
          name: "裂角兽",
          skillIds: ["strike"],
          partIds: {
            head: "horned_skull",
            torso: "plain_torso",
            arms: "plain_arms",
            legs: "monster_legs",
          },
          baseHp: 28,
          slotIndex: 0,
          color: "#7a2020",
        },
      ],
      boss: [
        {
          name: "百年残影",
          skillIds: ["strike"],
          partIds: {
            head: "horned_skull",
            torso: "shell_torso",
            arms: "plain_arms",
            legs: "tentacle_legs",
          },
          baseHp: 32,
          slotIndex: 0,
          color: "#902010",
        },
      ],
    };
    return (sets[setId] || sets.weak).map((t, i) =>
      makeCharacter({
        ...t,
        id: `enemy_${setId}_${i}`,
        role: "enemy",
        age: 99,
        matureAge: 99,
        routeBias: "mutant",
      })
    );
  }

  function pickPotionPartId(route) {
    const pool = POTION_POOLS[route] || POTION_POOLS.human;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function randomPartForSlot(slot, preferredBias) {
    const candidates = Object.values(PARTS).filter((p) => p.slot === slot);
    const biased = candidates.filter((p) => p.bias === preferredBias);
    const pool = biased.length ? biased : candidates;
    return structuredClone(pool[Math.floor(Math.random() * pool.length)]);
  }

  function describePart(part) {
    if (!part) return "无";
    const bits = [];
    for (const m of part.mods || []) {
      const sk = SKILLS[m.skillId];
      const name = sk ? sk.name : m.skillId;
      if (m.hits) bits.push(`${name} +${m.hits}段`);
      if (m.power) bits.push(`${name} 威力${m.power > 0 ? "+" : ""}${m.power}`);
    }
    if (part.hpBonus) bits.push(`生命${part.hpBonus > 0 ? "+" : ""}${part.hpBonus}`);
    if (part.initiative) bits.push(`先攻${part.initiative > 0 ? "+" : ""}${part.initiative}`);
    return bits.length ? bits.join(" · ") : "无战斗修正";
  }

  function recomputeHp(char) {
    const ratio = char.maxHp > 0 ? char.hp / char.maxHp : 1;
    const base = 30;
    // recover base from current max minus bonuses is messy; store baseHp if present
    const hpBonus = Object.values(char.parts).reduce((s, p) => s + (p.hpBonus || 0), 0);
    const baseHp = char.baseHp != null ? char.baseHp : Math.max(20, char.maxHp - hpBonus);
    char.baseHp = baseHp;
    char.maxHp = baseHp + hpBonus;
    char.hp = Math.max(1, Math.min(char.maxHp, Math.round(char.maxHp * ratio)));
  }

  return {
    PART_SLOTS,
    SLOT_LABEL,
    SKILLS,
    PARTS,
    NODES,
    TARGET_YEAR,
    makeCharacter,
    routeTemplates,
    enemyTemplates,
    pickPotionPartId,
    randomPartForSlot,
    describePart,
    recomputeHp,
    cloneParts,
  };
})();
