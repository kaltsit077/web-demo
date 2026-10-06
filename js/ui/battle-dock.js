import { PAPER_DROP_INTERVAL_SEC } from '../core/constants.js';
import { createOperatorSlot } from './components.js';
import { swapLoadedOperator } from '../sim/sim.js';
import { playSfx } from '../audio/audio.js';

/** @param {import('../core/state.js').GameState} state */
export function updateBattleDock(state) {
  const loadedEl = document.getElementById('dock-loaded');
  const nameEl = document.getElementById('dock-loaded-name');
  const queueEl = document.getElementById('dock-ops');
  if (!loadedEl || !queueEl) return;

  loadedEl.innerHTML = '';
  queueEl.innerHTML = '';

  const loadedId = state.loadedOperatorId;
  const loadedOp = loadedId ? state.operatorDefs[loadedId] : null;

  if (loadedOp && loadedId) {
    const slot = createOperatorSlot(loadedOp, loadedId, 'loaded');
    slot.title = `${loadedOp.name} · 当前上弓`;
    loadedEl.appendChild(slot);
    if (nameEl) nameEl.textContent = loadedOp.name;
  } else if (nameEl) {
    nameEl.textContent = '未装载';
  }

  for (const id of state.queue) {
    const op = state.operatorDefs[id];
    if (!op) continue;
    const slot = createOperatorSlot(op, id, 'queue');
    slot.title = `换上：${op.name}`;
    slot.addEventListener('click', () => {
      playSfx('switch');
      swapLoadedOperator(state, id);
      updateBattleDock(state);
    });
    queueEl.appendChild(slot);
  }

  if (queueEl.childElementCount === 0) {
    const empty = document.createElement('span');
    empty.className = 'rh-dock-ops-empty';
    empty.textContent = '无待命干员';
    queueEl.appendChild(empty);
  }
}

/** @param {import('../core/state.js').GameState} state */
export function updateBattleHud(state) {
  const scoreEl = document.getElementById('hud-score');
  const dropEl = document.getElementById('hud-drop');
  const hpEl = document.getElementById('hud-hp');
  const wallEl = document.getElementById('hud-wall');
  const metaEl = document.getElementById('hud-meta');

  if (scoreEl) scoreEl.textContent = String(state.score);

  if (dropEl) {
    const remain = Math.max(0, PAPER_DROP_INTERVAL_SEC - (state.paperDropTimer ?? 0));
    dropEl.textContent = `${remain.toFixed(1)}s`;
    dropEl.classList.toggle('is-urgent', remain <= 1.5);
  }

  if (hpEl) hpEl.textContent = String(state.playerHp);
  if (wallEl) wallEl.textContent = `越线 ${state.wallCrossCount}/3`;

  if (metaEl) {
    metaEl.textContent = `${state.levelDef?.name ?? ''} · 波次 ${state.waveIndex + 1}/${state.levelDef?.waves?.length ?? 1}`;
  }

  const hint = document.getElementById('battle-aim-hint');
  if (hint) {
    hint.hidden = Boolean(state.aimHintDismissed);
  }
}

/** 绑定暂停按钮（bootstrap 调用一次） */
export function bindBattleHudControls(getState) {
  const pauseBtn = document.getElementById('hud-pause');
  pauseBtn?.addEventListener('click', () => {
    const state = getState();
    if (state.phase !== 'playing' || state.paused) return;
    playSfx('click');
    state.paused = true;
    state.phase = 'paused';
  });
}

export function dismissAimHint(state) {
  state.aimHintDismissed = true;
  const hint = document.getElementById('battle-aim-hint');
  if (hint) hint.hidden = true;
}
