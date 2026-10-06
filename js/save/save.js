import { SAVE_KEY } from '../core/constants.js';

/**
 * @typedef {{
 *   unlockedLevels: string[],
 *   unlockedOperators: string[],
 *   unlockedDepartments: string[],
 *   rewardedLevels: string[],
 *   settings: { bgmEnabled: boolean, bgmVolume: number }
 * }} SaveData
 */

const DEFAULT_SAVE = {
  unlockedLevels: ['primary-1'],
  unlockedOperators: ['amiya'],
  unlockedDepartments: ['primary'],
  rewardedLevels: [],
  settings: { bgmEnabled: false, bgmVolume: 0.35 },
};

/** @returns {SaveData} */
export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return cloneDefault();
    }
    const data = JSON.parse(raw);
    return {
      unlockedLevels: Array.isArray(data.unlockedLevels) ? data.unlockedLevels : ['primary-1'],
      unlockedOperators: Array.isArray(data.unlockedOperators) ? data.unlockedOperators : ['amiya'],
      unlockedDepartments: Array.isArray(data.unlockedDepartments) ? data.unlockedDepartments : ['primary'],
      rewardedLevels: Array.isArray(data.rewardedLevels) ? data.rewardedLevels : [],
      settings: {
        bgmEnabled: Boolean(data.settings?.bgmEnabled),
        bgmVolume: typeof data.settings?.bgmVolume === 'number' ? data.settings.bgmVolume : 0.35,
      },
    };
  } catch {
    return cloneDefault();
  }
}

function cloneDefault() {
  return {
    unlockedLevels: [...DEFAULT_SAVE.unlockedLevels],
    unlockedOperators: [...DEFAULT_SAVE.unlockedOperators],
    unlockedDepartments: [...DEFAULT_SAVE.unlockedDepartments],
    rewardedLevels: [...DEFAULT_SAVE.rewardedLevels],
    settings: { ...DEFAULT_SAVE.settings },
  };
}

/** @param {SaveData} data */
export function writeSave(data) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

/** @param {import('../core/state.js').GameState} state */
export function persistAll(state) {
  writeSave({
    unlockedLevels: state.unlockedLevels,
    unlockedOperators: state.unlockedOperators,
    unlockedDepartments: state.unlockedDepartments,
    rewardedLevels: state.rewardedLevels ?? [],
    settings: state.settings,
  });
}

/** @param {import('../core/state.js').GameState} state */
export function unlockNextLevel(state) {
  const order = ['primary-1', 'primary-2', 'primary-3'];
  const idx = order.indexOf(state.levelId ?? '');
  if (idx === -1 || idx >= order.length - 1) {
    return;
  }
  const next = order[idx + 1];
  if (!state.unlockedLevels.includes(next)) {
    state.unlockedLevels.push(next);
  }
  persistAll(state);
}

/**
 * 从未解锁干员中随机抽最多 3 名，供通关三选一。
 * @param {Record<string, object>} operatorDefs
 * @param {string[]} unlockedOperators
 * @returns {{ id: string, def: object }[]}
 */
export function rollOperatorUnlockChoices(operatorDefs, unlockedOperators) {
  const unlocked = new Set(unlockedOperators ?? []);
  const pool = Object.keys(operatorDefs ?? {}).filter((id) => !unlocked.has(id));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map((id) => ({ id, def: operatorDefs[id] }));
}

/**
 * @param {import('../core/state.js').GameState} state
 * @param {string} operatorId
 */
export function unlockOperator(state, operatorId) {
  if (!operatorId || state.unlockedOperators.includes(operatorId)) {
    return false;
  }
  state.unlockedOperators.push(operatorId);
  persistAll(state);
  return true;
}

/**
 * 本关是否已发放过通关干员奖励（防重刷）。
 * @param {import('../core/state.js').GameState} state
 */
export function hasLevelReward(state) {
  const id = state.levelId ?? '';
  return Boolean(id) && (state.rewardedLevels ?? []).includes(id);
}

/** @param {import('../core/state.js').GameState} state */
export function markLevelRewarded(state) {
  const id = state.levelId ?? '';
  if (!id) {
    return;
  }
  if (!state.rewardedLevels) {
    state.rewardedLevels = [];
  }
  if (!state.rewardedLevels.includes(id)) {
    state.rewardedLevels.push(id);
  }
  if (id === 'primary-3' && !state.unlockedDepartments.includes('junior')) {
    state.unlockedDepartments.push('junior');
  }
  persistAll(state);
}

/**
 * 出战池 = 已解锁干员（通关三选一才有意义）。
 * @param {import('../core/state.js').GameState} state
 * @returns {string[]}
 */
export function getBattleOperatorPool(state) {
  return (state.unlockedOperators ?? []).filter((id) => state.operatorDefs?.[id]);
}

/** @returns {string} */
export function exportSaveText(state) {
  return JSON.stringify(
    {
      unlockedLevels: state.unlockedLevels,
      unlockedOperators: state.unlockedOperators,
      unlockedDepartments: state.unlockedDepartments,
      rewardedLevels: state.rewardedLevels ?? [],
      settings: state.settings,
      exportedAt: new Date().toISOString(),
    },
    null,
    2,
  );
}

/** @param {string} raw @returns {SaveData|null} */
export function parseSaveText(raw) {
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') {
      return null;
    }
    return {
      unlockedLevels: Array.isArray(data.unlockedLevels) ? data.unlockedLevels : ['primary-1'],
      unlockedOperators: Array.isArray(data.unlockedOperators) ? data.unlockedOperators : ['amiya'],
      unlockedDepartments: Array.isArray(data.unlockedDepartments) ? data.unlockedDepartments : ['primary'],
      rewardedLevels: Array.isArray(data.rewardedLevels) ? data.rewardedLevels : [],
      settings: {
        bgmEnabled: Boolean(data.settings?.bgmEnabled),
        bgmVolume: typeof data.settings?.bgmVolume === 'number' ? data.settings.bgmVolume : 0.35,
      },
    };
  } catch {
    return null;
  }
}

export function clearSaveStorage() {
  localStorage.removeItem(SAVE_KEY);
}

/** @param {import('../core/state.js').GameState} state @param {SaveData} data */
export function applySaveToState(state, data) {
  state.unlockedLevels = [...data.unlockedLevels];
  state.unlockedOperators = [...data.unlockedOperators];
  state.unlockedDepartments = [...data.unlockedDepartments];
  state.rewardedLevels = [...(data.rewardedLevels ?? [])];
  state.settings = { ...data.settings };
  persistAll(state);
}

/** @returns {SaveData} */
export function createDefaultSave() {
  return cloneDefault();
}
