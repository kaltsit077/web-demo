import {
  BATTLE_HEIGHT,
  DESIGN_WIDTH,
  SLINGSHOT_X,
  SLINGSHOT_Y,
  SUBJECT_LABEL,
} from '../core/constants.js';
import { getGridMetrics, getWallLineY } from '../sim/grid.js';
import { getAimLineEnd } from '../input/input.js';
import { getImage, OPERATOR_SPRITES, PAPER_SPRITES, UI_SPRITES } from '../assets/loader.js';

/** @param {HTMLCanvasElement} canvas */
export function setupCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D not supported');
  }

  function resize() {
    canvas.width = DESIGN_WIDTH;
    canvas.height = BATTLE_HEIGHT;
  }

  resize();
  window.addEventListener('resize', resize);
  return ctx;
}

/** @param {CanvasRenderingContext2D} ctx @param {import('../core/state.js').GameState} state */
export function renderFrame(ctx, state) {
  if (state.phase !== 'playing' && state.phase !== 'paused' && state.phase !== 'waveBuff') {
    return;
  }

  ctx.clearRect(0, 0, DESIGN_WIDTH, BATTLE_HEIGHT);

  drawBackground(ctx);
  drawGrid(ctx);
  drawWall(ctx);

  for (const paper of state.papers) {
    if (paper.alive) {
      drawPaper(ctx, paper);
    }
  }

  drawLauncherBase(ctx);

  if (state.loadedOperatorId && state.operatorDefs[state.loadedOperatorId]) {
    drawLoadedOperator(ctx, state.loadedOperatorId, state.operatorDefs[state.loadedOperatorId]);
  }

  if (state.aiming.active && state.phase === 'playing') {
    drawAimLine(ctx, state.aiming.angle);
  }

  if (state.projectile?.active) {
    drawProjectile(ctx, state.projectile, state.operatorDefs[state.projectile.operatorId]);
  }
}

function drawBackground(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, BATTLE_HEIGHT);
  g.addColorStop(0, '#1a2430');
  g.addColorStop(0.55, '#121820');
  g.addColorStop(1, '#0a0e12');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, DESIGN_WIDTH, BATTLE_HEIGHT);
}

function drawGrid(ctx) {
  const m = getGridMetrics();
  const gridW = m.cols * m.cellSize;
  const gridH = m.rows * m.cellSize;

  // 格区底板：让考场边界可读
  ctx.fillStyle = 'rgba(0, 229, 255, 0.035)';
  ctx.fillRect(m.offsetX, m.offsetY, gridW, gridH);
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.28)';
  ctx.lineWidth = 2;
  ctx.strokeRect(m.offsetX + 0.5, m.offsetY + 0.5, gridW - 1, gridH - 1);

  // 列/行线
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.16)';
  ctx.lineWidth = 1;
  for (let c = 1; c < m.cols; c++) {
    const x = m.offsetX + c * m.cellSize;
    ctx.beginPath();
    ctx.moveTo(x, m.offsetY);
    ctx.lineTo(x, m.offsetY + gridH);
    ctx.stroke();
  }
  for (let r = 1; r < m.rows; r++) {
    const y = m.offsetY + r * m.cellSize;
    ctx.beginPath();
    ctx.moveTo(m.offsetX, y);
    ctx.lineTo(m.offsetX + gridW, y);
    ctx.stroke();
  }

  // 列号：瞄准辅助
  ctx.fillStyle = 'rgba(138, 164, 180, 0.55)';
  ctx.font = '11px "Kenney Future Narrow", "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  for (let c = 0; c < m.cols; c++) {
    const x = m.offsetX + c * m.cellSize + m.cellSize / 2;
    ctx.fillText(String(c + 1), x, m.offsetY - 10);
  }
}

function drawWall(ctx) {
  const y = getWallLineY();
  const m = getGridMetrics();

  // 危险区
  const danger = ctx.createLinearGradient(0, y, 0, BATTLE_HEIGHT);
  danger.addColorStop(0, 'rgba(255, 107, 74, 0.22)');
  danger.addColorStop(1, 'rgba(255, 107, 74, 0.06)');
  ctx.fillStyle = danger;
  ctx.fillRect(m.offsetX, y, m.cols * m.cellSize, BATTLE_HEIGHT - y);

  // 防线
  ctx.strokeStyle = '#ff6b4a';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.moveTo(m.offsetX, y);
  ctx.lineTo(m.offsetX + m.cols * m.cellSize, y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(255, 107, 74, 0.9)';
  ctx.font = 'bold 12px "Noto Sans SC", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('防线 · 越线扣血', m.offsetX + 8, y - 8);
}

/** @param {CanvasRenderingContext2D} ctx @param {import('../core/state.js').PaperEntity} paper */
function drawPaper(ctx, paper) {
  const x = paper.x ?? 0;
  const y = paper.y ?? 0;
  const r = paper.radius;
  const sprite = getImage(PAPER_SPRITES[paper.subject]);

  if (sprite) {
    const size = r * 2.2;
    ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
  } else {
    ctx.shadowColor = paper.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = paper.color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e8f4f8';
    ctx.font = 'bold 12px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(SUBJECT_LABEL[paper.subject] ?? paper.subject, x, y + 4);
  }

  const ratio = Math.min(1, paper.damageDealt / paper.passLine);
  const barW = r * 2;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(x - r, y + r + 6, barW, 6);
  ctx.fillStyle = ratio >= 1 ? '#3dffa0' : '#00e5ff';
  ctx.fillRect(x - r, y + r + 6, barW * ratio, 6);
}

function drawLauncherBase(ctx) {
  // 发射台底座
  ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
  ctx.beginPath();
  ctx.moveTo(SLINGSHOT_X, SLINGSHOT_Y - 6);
  ctx.lineTo(SLINGSHOT_X - 42, SLINGSHOT_Y + 30);
  ctx.lineTo(SLINGSHOT_X + 42, SLINGSHOT_Y + 30);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(0, 229, 255, 0.65)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = 'rgba(0, 229, 255, 0.45)';
  ctx.beginPath();
  ctx.arc(SLINGSHOT_X, SLINGSHOT_Y, 5, 0, Math.PI * 2);
  ctx.fill();
}

/** @param {CanvasRenderingContext2D} ctx @param {string} id @param {object} op */
function drawLoadedOperator(ctx, id, op) {
  const sprite = getImage(OPERATOR_SPRITES[id]?.loaded);
  if (sprite) {
    ctx.drawImage(sprite, SLINGSHOT_X - 28, SLINGSHOT_Y - 40, 56, 56);
  } else {
    ctx.fillStyle = op.color ?? '#00e5ff';
    ctx.shadowColor = op.color ?? '#00e5ff';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(SLINGSHOT_X, SLINGSHOT_Y - 8, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(op.name?.slice(0, 2) ?? '干', SLINGSHOT_X, SLINGSHOT_Y - 3);
  }

  ctx.fillStyle = 'rgba(232, 244, 248, 0.85)';
  ctx.font = '11px "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(op.name ?? id, SLINGSHOT_X, SLINGSHOT_Y + 28);
}

/** @param {CanvasRenderingContext2D} ctx @param {number} angle */
function drawAimLine(ctx, angle) {
  const end = getAimLineEnd(angle);
  ctx.strokeStyle = 'rgba(0, 229, 255, 0.85)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(SLINGSHOT_X, SLINGSHOT_Y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.setLineDash([]);

  const cross = getImage(UI_SPRITES.crosshair);
  if (cross) {
    ctx.drawImage(cross, end.x - 16, end.y - 16, 32, 32);
  } else {
    ctx.fillStyle = 'rgba(0, 229, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(end.x, end.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** @param {CanvasRenderingContext2D} ctx @param {import('../core/state.js').ProjectileEntity} proj @param {object|undefined} op */
function drawProjectile(ctx, proj, op) {
  const sprite = getImage(OPERATOR_SPRITES[proj.operatorId]?.queue);
  if (sprite) {
    ctx.drawImage(sprite, proj.x - 18, proj.y - 18, 36, 36);
    return;
  }
  ctx.fillStyle = op?.color ?? '#ffd166';
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(proj.x, proj.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  if (op?.name) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(op.name.slice(0, 1), proj.x, proj.y + 4);
  }
}
