import {
  AIM_LINE_LENGTH,
  BATTLE_HEIGHT,
  DESIGN_WIDTH,
  SLINGSHOT_X,
  SLINGSHOT_Y,
} from '../core/constants.js';
import { fireProjectile } from '../sim/sim.js';
import { dismissAimHint, updateBattleDock } from '../ui/battle-dock.js';

/**
 * @param {import('../core/state.js').GameState} state
 * @param {HTMLCanvasElement} canvas
 */
export function bindInput(state, canvas) {
  let dragging = false;

  function toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = DESIGN_WIDTH / rect.width;
    const scaleY = BATTLE_HEIGHT / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function aimAngle(x, y) {
    return Math.atan2(y - SLINGSHOT_Y, x - SLINGSHOT_X);
  }

  function onDown(e) {
    if (state.phase !== 'playing' || state.paused || state.turnBusy) {
      return;
    }
    e.preventDefault();
    const pt = 'touches' in e ? toLogical(e.touches[0].clientX, e.touches[0].clientY) : toLogical(e.clientX, e.clientY);
    dragging = true;
    state.aiming.active = true;
    state.aiming.angle = aimAngle(pt.x, pt.y);
  }

  function onMove(e) {
    if (!dragging || state.phase !== 'playing') {
      return;
    }
    e.preventDefault();
    const pt = 'touches' in e ? toLogical(e.touches[0].clientX, e.touches[0].clientY) : toLogical(e.clientX, e.clientY);
    state.aiming.angle = aimAngle(pt.x, pt.y);
  }

  function onUp(e) {
    if (!dragging) {
      return;
    }
    e.preventDefault();
    dragging = false;
    state.aiming.active = false;

    const angle = state.aiming.angle;
    if (Math.sin(angle) >= -0.05) {
      return;
    }

    dismissAimHint(state);
    if (fireProjectile(state, angle)) {
      updateBattleDock(state);
    }
  }

  canvas.addEventListener('mousedown', onDown);
  canvas.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  canvas.addEventListener('touchstart', onDown, { passive: false });
  canvas.addEventListener('touchmove', onMove, { passive: false });
  canvas.addEventListener('touchend', onUp, { passive: false });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.phase === 'playing') {
      state.paused = true;
      state.phase = 'paused';
    }
  });
}

export function getAimLineEnd(angle) {
  return {
    x: SLINGSHOT_X + Math.cos(angle) * AIM_LINE_LENGTH,
    y: SLINGSHOT_Y + Math.sin(angle) * AIM_LINE_LENGTH,
  };
}
