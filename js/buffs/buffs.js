/** Phase 1 Buff stub — 预留扩展 */

export const BUFF_POOL = [
  {
    id: 'focus',
    name: '专注',
    desc: '下一波起伤害 ×1.2',
    apply(state) {
      state.modifiers.multiplier *= 1.2;
    },
  },
  {
    id: 'steady',
    name: '稳态',
    desc: '恢复 1 点生命',
    apply(state) {
      const maxHp = state.levelDef?.playerHp ?? 5;
      state.playerHp = Math.min(maxHp, state.playerHp + 1);
    },
  },
  {
    id: 'prep',
    name: '预习',
    desc: '后续伤害 +3 平伤',
    apply(state) {
      state.modifiers.flatBonus += 3;
    },
  },
];

/** @param {import('../core/state.js').GameState} state */
export function rollBuffChoices(state) {
  const shuffled = [...BUFF_POOL].sort(() => Math.random() - 0.5);
  state.buffChoices = shuffled.slice(0, 3);
  state.phase = 'waveBuff';
}

/** @param {import('../core/state.js').GameState} state @param {string} buffId */
export function selectBuff(state, buffId) {
  const buff = state.buffChoices.find((b) => b.id === buffId);
  if (buff) {
    buff.apply(state);
  }
  state.buffChoices = [];
}
