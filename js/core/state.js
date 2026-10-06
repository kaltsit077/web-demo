import { WALL_CROSS_FAIL } from './constants.js';

/**
 * @typedef {Object} PaperEntity
 * @property {string} id
 * @property {string} templateId
 * @property {string} name
 * @property {string} subject
 * @property {number} passLine
 * @property {number} maxScore
 * @property {number} damageDealt
 * @property {number} radius
 * @property {number} resistance
 * @property {number} moveDown
 * @property {number} gridCol
 * @property {number} gridRow
 * @property {number} [x]
 * @property {number} [y]
 * @property {string} color
 * @property {boolean} alive
 * @property {boolean} crossedWall
 */

/**
 * @typedef {Object} ProjectileEntity
 * @property {number} x
 * @property {number} y
 * @property {number} vx
 * @property {number} vy
 * @property {string} operatorId
 * @property {boolean} active
 * @property {boolean} hitResolved
 */

/**
 * @typedef {Object} Modifiers
 * @property {number} flatBonus
 * @property {number} multiplier
 */

/**
 * @typedef {Object} GameState
 * @property {import('./constants.js').GamePhase} phase
 * @property {string|null} levelId
 * @property {string|null} departmentId
 * @property {object|null} levelDef
 * @property {number} waveIndex
 * @property {number} turn
 * @property {number} playerHp
 * @property {number} wallCrossCount
 * @property {number} score
 * @property {number} levelBonusScore
 * @property {PaperEntity[]} papers
 * @property {ProjectileEntity|null} projectile
 * @property {Record<string, object>} operatorDefs
 * @property {string[]} rosterIds
 * @property {string[]} queue
 * @property {string|null} loadedOperatorId
 * @property {Modifiers} modifiers
 * @property {object[]} buffChoices
 * @property {{active: boolean, angle: number}} aiming
 * @property {string[]} unlockedLevels
 * @property {string[]} unlockedOperators
 * @property {string[]} unlockedDepartments
 * @property {string[]} rewardedLevels 已发放通关干员奖励的关卡
 * @property {{bgmEnabled: boolean, bgmVolume: number}} settings
 * @property {boolean} paused
 * @property {boolean} turnBusy
 * @property {number} lastResultScore
 * @property {number} paperDropTimer 距下次下降的累计秒数
 * @property {boolean} aimHintDismissed 是否已关闭瞄准提示
 */

/** @returns {GameState} */
export function createInitialState() {
  return {
    phase: 'title',
    levelId: null,
    departmentId: null,
    levelDef: null,
    waveIndex: 0,
    turn: 0,
    playerHp: 5,
    wallCrossCount: 0,
    score: 0,
    levelBonusScore: 0,
    papers: [],
    projectile: null,
    operatorDefs: {},
    rosterIds: [],
    queue: [],
    loadedOperatorId: null,
    modifiers: { flatBonus: 0, multiplier: 1 },
    buffChoices: [],
    aiming: { active: false, angle: 0 },
    unlockedLevels: ['primary-1'],
    unlockedOperators: ['amiya'],
    unlockedDepartments: ['primary'],
    rewardedLevels: [],
    settings: { bgmEnabled: false, bgmVolume: 0.35 },
    paused: false,
    turnBusy: false,
    lastResultScore: 0,
    paperDropTimer: 0,
    aimHintDismissed: false,
  };
}

/** @param {GameState} state */
export function isFail(state) {
  return state.wallCrossCount >= WALL_CROSS_FAIL || state.playerHp <= 0;
}
