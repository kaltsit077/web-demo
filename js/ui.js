/* UI screens and bindings */
var UI = (() => {
  const screens = {
    title: "screen-title",
    route: "screen-route",
    map: "screen-map",
    battle: "screen-battle",
    loot: "screen-loot",
    key: "screen-key",
    end: "screen-end",
  };

  function $(id) {
    return document.getElementById(id);
  }

  function show(name) {
    for (const id of Object.values(screens)) {
      $(id).classList.toggle("active", id === screens[name]);
    }
  }

  function refreshMetaHud() {
    const meta = GameState.getMeta();
    const hud = $("hud-meta");
    const preview = $("meta-preview");
    const clearBtn = $("btn-clear-meta");
    if (meta.traits.length) {
      const t = meta.traits[0];
      const text = `跨周目特征：${t.label}（${GameData.SLOT_LABEL[t.slot]}）· 来自 ${t.from}`;
      hud.hidden = false;
      hud.textContent = text;
      preview.hidden = false;
      preview.textContent = `下一局开场将把「${t.label}」叠到主角对应部位。`;
      clearBtn.hidden = false;
    } else {
      hud.hidden = true;
      preview.hidden = true;
      clearBtn.hidden = true;
    }
  }

  function renderCharCard(char, opts = {}) {
    const el = document.createElement("div");
    el.className = `char-card ${char.slotIndex <= 1 ? "front" : "back"} ${
      char.side === "enemy" || opts.enemy ? "enemy" : ""
    }`;
    if (char.hp <= 0) el.classList.add("dead");
    if (opts.selectable) el.classList.add("selectable");
    if (opts.selected) el.classList.add("selected");
    el.dataset.id = char.id;

    const pct = Math.max(0, Math.round((char.hp / char.maxHp) * 100));
    el.innerHTML = `
      <div class="portrait" style="background:linear-gradient(135deg, ${char.color}, #1a1410)"></div>
      <div class="name">${char.name}${char.role === "hero" ? " ·主角" : ""}</div>
      <div class="meta">槽${char.slotIndex} · ${char.age}岁${
      char.age >= char.matureAge ? " ·成熟" : ""
    } · 先攻${Combat.initiativeOf(char)}</div>
      <div class="hp">HP ${char.hp}/${char.maxHp}
        <div class="hp-bar"><span style="width:${pct}%"></span></div>
      </div>
      <div class="parts">${GameState.partSummary(char)}</div>
    `;
    return el;
  }

  function renderTeamSlots() {
    const box = $("team-slots");
    box.innerHTML = "";
    const run = GameState.getRun();
    for (let i = 0; i < 4; i++) {
      const c = run.slots[i];
      if (!c) {
        const empty = document.createElement("div");
        empty.className = `char-card ${i <= 1 ? "front" : "back"}`;
        empty.innerHTML = `<div class="name">空槽 ${i}</div><div class="meta">${
          i <= 1 ? "前排" : "后排"
        }</div>`;
        box.appendChild(empty);
      } else {
        box.appendChild(renderCharCard(c));
      }
    }
  }

  function renderNodeTrack() {
    const track = $("node-track");
    track.innerHTML = "";
    const run = GameState.getRun();
    GameData.NODES.forEach((n, i) => {
      const pill = document.createElement("div");
      pill.className = "node-pill";
      if (i < run.nodeIndex) pill.classList.add("done");
      if (i === run.nodeIndex) pill.classList.add("current");
      pill.innerHTML = `年${i + 1}<span class="node-type">${n.label}</span>`;
      track.appendChild(pill);
    });
    $("year-label").textContent = `第 ${run.year} 年 / 目标 ${GameData.TARGET_YEAR} 年 · 节点 ${
      run.nodeIndex + 1
    }/${GameData.NODES.length}`;
  }

  function renderMap() {
    renderNodeTrack();
    renderTeamSlots();
    const log = $("map-log");
    const run = GameState.getRun();
    log.innerHTML = run.log.slice(-8).map((l) => `<p>${l}</p>`).join("");
    const node = GameState.currentNode();
    const btn = $("btn-advance");
    if (!node || node.type === "end") {
      btn.textContent = "抵达终点";
    } else if (node.type === "key") {
      btn.textContent = "进入关键节点";
    } else {
      btn.textContent = "进入挑战";
    }
  }

  function renderBattle() {
    const b = Combat.getBattle();
    if (!b) return;
    $("battle-title").textContent = b.title;
    const actor = Combat.currentActor();
    $("battle-turn").textContent =
      b.status !== "active"
        ? b.status === "won"
          ? "战斗结束 · 胜利"
          : "战斗结束 · 失败"
        : b.awaitingPlayer
          ? `行动中：${actor?.name || ""}`
          : "敌方行动中…";

    const allies = $("ally-slots");
    const enemies = $("enemy-slots");
    allies.innerHTML = "";
    enemies.innerHTML = "";

    // Display ally slots right-to-left visually: back ... front → show slot 3..0
    [...b.allies]
      .sort((a, c) => c.slotIndex - a.slotIndex)
      .forEach((c) => {
        const card = renderCharCard(c, {
          selectable: Combat.canTarget(c),
          selected: false,
        });
        if (Combat.canTarget(c)) {
          card.addEventListener("click", () => onBattleTarget(c.id));
        }
        allies.appendChild(card);
      });

    [...b.enemies]
      .sort((a, c) => a.slotIndex - c.slotIndex)
      .forEach((c) => {
        const card = renderCharCard(c, {
          enemy: true,
          selectable: Combat.canTarget(c),
        });
        if (Combat.canTarget(c)) {
          card.addEventListener("click", () => onBattleTarget(c.id));
        }
        enemies.appendChild(card);
      });

    const skillBar = $("skill-bar");
    skillBar.innerHTML = "";
    const hint = $("target-hint");
    if (b.status === "active" && b.awaitingPlayer && actor) {
      actor.skillIds.forEach((sid) => {
        const resolved = Combat.skillResolved(actor, sid);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `skill-btn${b.selectedSkill === sid ? " active" : ""}`;
        btn.innerHTML = `${resolved.name}<span class="sub">${resolved.hits}段 × ${resolved.power} · ${
          resolved.kind
        }</span>`;
        btn.addEventListener("click", () => {
          Combat.selectSkill(sid);
          renderBattle();
        });
        skillBar.appendChild(btn);
      });
      hint.textContent = b.selectedSkill
        ? GameData.SKILLS[b.selectedSkill].target === "ally"
          ? "点击我方目标"
          : "点击敌方目标"
        : "选择固定技能（部位已叠加到数值上）";
    } else {
      hint.textContent = "";
    }

    $("battle-log").innerHTML = b.log.slice(-12).map((l) => `<p>${l}</p>`).join("");

    const endBox = $("battle-end");
    const retry = $("btn-battle-retry");
    if (b.status === "won" || b.status === "lost") {
      endBox.hidden = false;
      $("battle-result").textContent = b.status === "won" ? "挑战成功，获得药剂。" : "全员倒下。可重试本节点。";
      $("btn-battle-continue").hidden = b.status !== "won";
      retry.hidden = b.status !== "lost";
    } else {
      endBox.hidden = true;
    }
  }

  function onBattleTarget(id) {
    if (Combat.playerTarget(id)) {
      renderBattle();
    }
  }

  function renderLoot() {
    const potion = GameState.getRun().lastPotion;
    $("potion-card").innerHTML = `
      <strong>${potion.name}</strong>
      <div>暗示部位倾向：${potion.preview.label}（${GameData.SLOT_LABEL[potion.preview.slot]}）</div>
      <div class="hint" style="margin-top:6px">${GameData.describePart(potion.preview)}</div>
    `;
    const hero = GameState.getHero();
    const box = $("remix-parts");
    box.innerHTML = "";
    $("remix-result").hidden = true;
    $("btn-loot-done").hidden = true;

    for (const slot of GameData.PART_SLOTS) {
      const part = hero.parts[slot];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "part-btn";
      btn.innerHTML = `<span class="slot">${GameData.SLOT_LABEL[slot]}</span><strong>${part.label}</strong><div class="hint">${GameData.describePart(
        part
      )}</div>`;
      btn.addEventListener("click", () => {
        const result = GameState.remixPart(slot);
        box.querySelectorAll(".part-btn").forEach((b) => (b.disabled = true));
        const out = $("remix-result");
        out.hidden = false;
        out.innerHTML = `重组完成：${GameData.SLOT_LABEL[slot]}「${result.before.label}」→「${
          result.after.label
        }」<br/>${GameData.describePart(result.after)}`;
        $("btn-loot-done").hidden = false;
        GameState.getRun().log.push(
          `基因重组：${GameData.SLOT_LABEL[slot]} ${result.before.label} → ${result.after.label}`
        );
      });
      box.appendChild(btn);
    }
  }

  function renderKey() {
    const hero = GameState.getHero();
    const spouse = GameState.getSpouseCandidate();
    const mature = GameState.canBreed();
    $("key-desc").textContent = mature
      ? `${hero.name}已成熟（${hero.age}/${hero.matureAge}）。可繁衍或吞噬。`
      : `${hero.name}尚未成熟（${hero.age}/${hero.matureAge}）。只能吞噬队友。`;

    $("btn-breed").disabled = !mature || !spouse;
    $("btn-devour").disabled = !spouse;

    const detail = $("key-detail");
    detail.innerHTML = spouse
      ? `可选队友：${spouse.name}<br/>你：${GameState.partSummary(hero)}<br/>对方：${GameState.partSummary(
          spouse
        )}`
      : "没有可交互的队友。";

    $("key-result").hidden = true;
    $("btn-key-done").hidden = true;
    $("btn-breed").hidden = false;
    $("btn-devour").hidden = false;
  }

  function renderEnd() {
    const hero = GameState.getHero();
    const box = $("trait-pick");
    box.innerHTML = "";
    $("btn-save-trait").disabled = true;
    let selected = null;

    for (const slot of GameData.PART_SLOTS) {
      const part = hero.parts[slot];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "part-btn";
      btn.innerHTML = `<span class="slot">${GameData.SLOT_LABEL[slot]}</span><strong>${part.label}</strong><div class="hint">${GameData.describePart(
        part
      )}</div>`;
      btn.addEventListener("click", () => {
        selected = slot;
        box.querySelectorAll(".part-btn").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        $("btn-save-trait").disabled = false;
        $("btn-save-trait").dataset.slot = slot;
      });
      box.appendChild(btn);
    }
  }

  function goTitle() {
    refreshMetaHud();
    show("title");
  }

  function goRoute() {
    show("route");
  }

  function goMap() {
    show("map");
    renderMap();
  }

  function startBattleForNode(node) {
    const run = GameState.getRun();
    const allies = run.slots.filter((c) => c && c.hp > 0).map((c) => structuredClone(c));
    if (!allies.length) {
      run.log.push("无人可战，请检查队伍。");
      renderMap();
      return;
    }
    const enemies = GameData.enemyTemplates(node.enemySet || "weak");
    Combat.start(allies, enemies, node.label);
    show("battle");
    renderBattle();
  }

  function afterBattleWin() {
    Combat.syncBackToRun();
    GameState.healPartyFull();
    GameState.rollPotion();
    show("loot");
    renderLoot();
  }

  function afterLootOrKey() {
    GameState.completeNode();
    const node = GameState.currentNode();
    if (!node || node.type === "end" || GameState.isRunComplete()) {
      // Move to end screen if at end node
      if (node && node.type === "end") {
        GameState.getRun().log.push("抵达终点。选择带走的特征。");
      }
      show("end");
      renderEnd();
      return;
    }
    goMap();
  }

  function enterCurrentNode() {
    const node = GameState.currentNode();
    if (!node || node.type === "end") {
      show("end");
      renderEnd();
      return;
    }
    if (node.type === "key") {
      show("key");
      renderKey();
      return;
    }
    if (node.type === "battle") {
      startBattleForNode(node);
    }
  }

  function bind() {
    $("btn-new-game").addEventListener("click", () => goRoute());
    $("btn-route-back").addEventListener("click", () => goTitle());
    $("btn-clear-meta").addEventListener("click", () => {
      GameState.clearMeta();
      refreshMetaHud();
    });

    document.querySelectorAll(".route-card").forEach((card) => {
      card.addEventListener("click", () => {
        const route = card.dataset.route;
        GameState.startRun(route);
        goMap();
      });
    });

    $("btn-advance").addEventListener("click", () => enterCurrentNode());

    $("btn-battle-continue").addEventListener("click", () => afterBattleWin());
    $("btn-battle-retry").addEventListener("click", () => {
      const node = GameState.currentNode();
      GameState.healPartyFull();
      startBattleForNode(node);
    });

    $("btn-loot-done").addEventListener("click", () => afterLootOrKey());

    $("btn-breed").addEventListener("click", () => {
      const res = GameState.breed();
      const out = $("key-result");
      out.hidden = false;
      out.textContent = res.ok ? res.message : res.reason;
      if (res.ok) {
        GameState.getRun().log.push(res.message);
        $("btn-breed").hidden = true;
        $("btn-devour").hidden = true;
        $("btn-key-done").hidden = false;
      }
    });

    $("btn-devour").addEventListener("click", () => {
      const res = GameState.devour();
      const out = $("key-result");
      out.hidden = false;
      out.textContent = res.ok ? res.message : res.reason;
      if (res.ok) {
        GameState.getRun().log.push(res.message);
        $("btn-breed").hidden = true;
        $("btn-devour").hidden = true;
        $("btn-key-done").hidden = false;
      }
    });

    $("btn-key-done").addEventListener("click", () => afterLootOrKey());

    $("btn-save-trait").addEventListener("click", () => {
      const slot = $("btn-save-trait").dataset.slot;
      if (!slot) return;
      GameState.collectTrait(slot);
      goTitle();
    });
  }

  return {
    bind,
    goTitle,
    refreshMetaHud,
  };
})();
