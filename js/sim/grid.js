import {
  CELL_SIZE,
  GRID_COLS,
  GRID_OFFSET_X,
  GRID_OFFSET_Y,
  GRID_ROWS,
  WALL_ROW,
} from '../core/constants.js';

/** @param {number} col @param {number} row */
export function gridToWorld(col, row) {
  return {
    x: GRID_OFFSET_X + col * CELL_SIZE + CELL_SIZE / 2,
    y: GRID_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2,
  };
}

/** @param {import('../core/state.js').PaperEntity} paper */
export function syncPaperWorld(paper) {
  const { x, y } = gridToWorld(paper.gridCol, paper.gridRow);
  paper.x = x;
  paper.y = y;
}

/** @param {import('../core/state.js').PaperEntity} paper */
export function movePaperDown(paper) {
  paper.gridRow += paper.moveDown ?? 1;
  syncPaperWorld(paper);
}

/** @param {import('../core/state.js').PaperEntity} paper */
export function isPaperPastWall(paper) {
  return paper.gridRow >= WALL_ROW;
}

/** @param {number} col @param {number} row */
export function isInsideGrid(col, row) {
  return col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS;
}

export function getWallLineY() {
  return GRID_OFFSET_Y + WALL_ROW * CELL_SIZE;
}

export function getGridMetrics() {
  return {
    cols: GRID_COLS,
    rows: GRID_ROWS,
    cellSize: CELL_SIZE,
    offsetX: GRID_OFFSET_X,
    offsetY: GRID_OFFSET_Y,
    wallRow: WALL_ROW,
    wallY: getWallLineY(),
  };
}
