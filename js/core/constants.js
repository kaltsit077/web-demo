/** @typedef {'title'|'departmentSelect'|'levelMap'|'gallery'|'settings'|'contact'|'playing'|'waveBuff'|'result'|'fail'|'paused'} GamePhase */

export const DESIGN_WIDTH = 720;
export const DESIGN_HEIGHT = 1280;
export const BATTLE_HEIGHT = 760;

export const GRID_COLS = 5;
export const GRID_ROWS = 5;
export const CELL_SIZE = 120;
export const GRID_OFFSET_X = (DESIGN_WIDTH - GRID_COLS * CELL_SIZE) / 2;
export const GRID_OFFSET_Y = 72;

/** 网格行 >= WALL_ROW 视为越过墙体 */
export const WALL_ROW = 4;

export const SLINGSHOT_X = DESIGN_WIDTH / 2;
export const SLINGSHOT_Y = BATTLE_HEIGHT - 36;

export const PROJECTILE_SPEED = 880;
export const PROJECTILE_RADIUS = 10;
export const AIM_LINE_LENGTH = 280;

export const WALL_CROSS_FAIL = 3;
export const SAVE_KEY = 'rhodes789_save';

/** 试卷每隔多少秒下降 1 格 */
export const PAPER_DROP_INTERVAL_SEC = 5;

export const SUBJECTS = ['chinese', 'math', 'english'];

export const SUBJECT_LABEL = {
  chinese: '语文',
  math: '数学',
  english: '英语',
};
