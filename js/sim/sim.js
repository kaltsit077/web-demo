import {
  BATTLE_HEIGHT,
  DESIGN_WIDTH,
  PAPER_DROP_INTERVAL_SEC,
  PROJECTILE_RADIUS,
  PROJECTILE_SPEED,
  SLINGSHOT_X,
  SLINGSHOT_Y,
} from '../core/constants.js';
import { isFail } from '../core/state.js';
import { getBattleOperatorPool } from '../save/save.js';
import { applyDamageToPaper, computeDamage } from './damage.js';
import { isPaperPastWall, syncPaperWorld } from './grid.js';

let paperIdSeq = 0;

/** @param {import('../core/state.js').GameState} state @param {object} spawn @param {Record<string, object>} templates */
function spawnPaper(state, spawn, templates) {
  const tpl = templates[spawn.template];
  if (!tpl) {
    return;
  }

  /** @type {import('../core/state.js').PaperEntity} */
  const paper = {
    id: `paper-${++paperIdSeq}`,
    templateId: spawn.template,
    name: tpl.name,
    subject: tpl.subject,
    passLine: tpl.passLine,
    maxScore: tpl.maxScore,
    damageDealt: 0,
    radius: tpl.radius,
    resistance: tpl.resistance ?? 1,
    moveDown: tpl.moveDown ?? 1,
    gridCol: spawn.gridCol,
    gridRow: spawn.gridRow,
    color: tpl.color,
    alive: true,
    crossedWall: false,
  };
  syncPaperWorld(paper);
  state.papers.push(paper);
}

/** @param {import('../core/state.js').GameState} state @param {Record<string, object>} templates */
export function spawnWave(state, templates) {
  const wave = state.levelDef?.waves?.[state.waveIndex];
  if (!wave) {
    return;
  }
  for (const spawn of wave.papers ?? []) {
    spawnPaper(state, spawn, templates);
  }
}

/** @param {import('../core/state.js').GameState} state @param {number} angle */
export function fireProjectile(state, angle) {
  if (state.turnBusy || state.projectile?.active) {
    return false;
  }
  if (!state.loadedOperatorId) {
    return false;
  }

  state.projectile = {
    x: SLINGSHOT_X,
    y: SLINGSHOT_Y,
    vx: Math.cos(angle) * PROJECTILE_SPEED,
    vy: Math.sin(angle) * PROJECTILE_SPEED,
    operatorId: state.loadedOperatorId,
    active: true,
    hitResolved: false,
  };
  state.turnBusy = true;
  state.loadedOperatorId = null;
  return true;
}

/** @param {import('../core/state.js').GameState} state @param {number} dt
 *  @returns {{ done: boolean, hit: boolean, destroyed: boolean }}
 */
export function updateProjectile(state, dt) {
  const proj = state.projectile;
  if (!proj?.active) {
    return { done: false, hit: false, destroyed: false };
  }

  const prevX = proj.x;
  const prevY = proj.y;
  proj.x += proj.vx * dt;
  proj.y += proj.vy * dt;

  for (const paper of state.papers) {
    if (!paper.alive) {
      continue;
    }
    const px = paper.x ?? 0;
    const py = paper.y ?? 0;
    const dx = proj.x - prevX;
    const dy = proj.y - prevY;
    const dist = Math.hypot(dx, dy);
    if (dist > 0) {
      const steps = Math.ceil(dist / 8);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const sx = prevX + dx * t;
        const sy = prevY + dy * t;
        if (Math.hypot(sx - px, sy - py) <= paper.radius + PROJECTILE_RADIUS) {
          let destroyed = false;
          const operator = state.operatorDefs[proj.operatorId];
          if (operator) {
            const damage = computeDamage(operator, paper, state.modifiers);
            const result = applyDamageToPaper(paper, damage);
            if (result.gained > 0) {
              state.score += result.gained;
              state.levelBonusScore += result.gained;
            }
            destroyed = result.destroyed;
          }
          proj.active = false;
          proj.hitResolved = true;
          return { done: true, hit: true, destroyed };
        }
      }
    }
  }

  if (
    proj.x < -40 ||
    proj.x > DESIGN_WIDTH + 40 ||
    proj.y < -40 ||
    proj.y > BATTLE_HEIGHT + 40
  ) {
    proj.active = false;
    proj.hitResolved = true;
    return { done: true, hit: false, destroyed: false };
  }

  return { done: false, hit: false, destroyed: false };
}

/** @param {import('../core/state.js').GameState} state */
function advancePapers(state) {
  for (const paper of state.papers) {
    if (!paper.alive) {
      continue;
    }
    // 定时下落：每次固定下降 1 格
    paper.gridRow += 1;
    syncPaperWorld(paper);
    if (isPaperPastWall(paper) && !paper.crossedWall) {
      paper.crossedWall = true;
      state.wallCrossCount += 1;
      state.playerHp -= 1;
    }
  }
}

/**
 * 按时间推进试卷下落（每 PAPER_DROP_INTERVAL_SEC 秒降 1 格）
 * @param {import('../core/state.js').GameState} state
 * @param {number} dt
 * @returns {'fail'|'dropped'|null}
 */
export function updateTimedPaperDrop(state, dt) {
  if (state.phase !== 'playing' || state.paused) {
    return null;
  }

  state.paperDropTimer = (state.paperDropTimer ?? 0) + dt;
  if (state.paperDropTimer < PAPER_DROP_INTERVAL_SEC) {
    return null;
  }

  state.paperDropTimer -= PAPER_DROP_INTERVAL_SEC;
  advancePapers(state);

  if (isFail(state)) {
    state.phase = 'fail';
    return 'fail';
  }

  return 'dropped';
}

/** @param {import('../core/state.js').GameState} state */
function replenishQueue(state) {
  const pool = getBattleOperatorPool(state);
  if (pool.length === 0) {
    return;
  }
  const pick = pool[Math.floor(Math.random() * pool.length)];
  state.queue.push(pick);
}

/** @param {import('../core/state.js').GameState} state */
function autoLoadOperator(state) {
  if (state.loadedOperatorId) {
    return;
  }
  if (state.queue.length > 0) {
    state.loadedOperatorId = state.queue.shift() ?? null;
  }
}

/** @param {import('../core/state.js').GameState} state */
export function endTurn(state) {
  state.turn += 1;
  state.projectile = null;
  state.turnBusy = false;

  replenishQueue(state);
  autoLoadOperator(state);

  state.papers = state.papers.filter((p) => p.alive);

  if (isFail(state)) {
    state.phase = 'fail';
    return 'fail';
  }

  const alive = state.papers.filter((p) => p.alive);
  if (alive.length === 0) {
    const nextWave = state.waveIndex + 1;
    const totalWaves = state.levelDef?.waves?.length ?? 0;
    if (nextWave < totalWaves) {
      state.waveIndex = nextWave;
      return 'waveClear';
    }
    state.lastResultScore = state.levelBonusScore;
    state.phase = 'result';
    return 'win';
  }

  return 'continue';
}

/** @param {import('../core/state.js').GameState} state @param {string} operatorId */
export function swapLoadedOperator(state, operatorId) {
  if (state.turnBusy || state.projectile?.active) {
    return false;
  }
  const idx = state.queue.indexOf(operatorId);
  if (idx === -1 && state.loadedOperatorId !== operatorId) {
    return false;
  }

  if (state.loadedOperatorId && idx !== -1) {
    state.queue[idx] = state.loadedOperatorId;
    state.loadedOperatorId = operatorId;
    return true;
  }

  if (idx !== -1) {
    state.loadedOperatorId = state.queue.splice(idx, 1)[0];
    return true;
  }

  return false;
}

/** @param {import('../core/state.js').GameState} state @param {Record<string, object>} templates */
export function initLevel(state, templates) {
  resetRuntime(state);
  state.phase = 'playing';
  spawnWave(state, templates);
  autoLoadOperator(state);
}

function resetRuntime(state) {
  state.waveIndex = 0;
  state.turn = 0;
  state.playerHp = state.levelDef?.playerHp ?? 5;
  state.wallCrossCount = 0;
  state.score = 0;
  state.levelBonusScore = 0;
  state.papers = [];
  state.projectile = null;
  state.modifiers = { flatBonus: 0, multiplier: 1 };
  state.buffChoices = [];
  state.aiming = { active: false, angle: 0 };
  state.turnBusy = false;
  state.paperDropTimer = 0;
  state.aimHintDismissed = false;

  const pool = getBattleOperatorPool(state);
  const pickCount = Math.min(state.levelDef?.pickCount ?? 2, Math.max(1, pool.length));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  state.rosterIds = shuffled.slice(0, pickCount);
  state.queue = [...state.rosterIds];
  state.loadedOperatorId = null;
}

export { resetRuntime as resetLevelRuntime };
