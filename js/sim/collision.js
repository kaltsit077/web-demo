/**
 * @param {number} x1 @param {number} y1 @param {number} r1
 * @param {number} x2 @param {number} y2 @param {number} r2
 */
export function circlesHit(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  return dist <= r1 + r2;
}

/**
 * 线段 vs 圆：用于直线弹道
 * @param {number} x0 @param {number} y0
 * @param {number} x1 @param {number} y1
 * @param {number} cx @param {number} cy @param {number} r
 */
export function segmentHitsCircle(x0, y0, x1, y1, cx, cy, r) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return circlesHit(x0, y0, 0, cx, cy, r);
  }

  let t = ((cx - x0) * dx + (cy - y0) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const px = x0 + t * dx;
  const py = y0 + t * dy;
  return circlesHit(px, py, 0, cx, cy, r);
}

/**
 * @param {import('../core/state.js').ProjectileEntity} proj
 * @param {import('../core/state.js').PaperEntity} paper
 */
export function projectileHitsPaper(proj, paper) {
  if (!paper.alive) {
    return false;
  }
  const px = paper.x ?? 0;
  const py = paper.y ?? 0;
  return circlesHit(proj.x, proj.y, 8, px, py, paper.radius);
}
