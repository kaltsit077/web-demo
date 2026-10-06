import { SUBJECTS } from '../core/constants.js';

/**
 * @param {object} operator
 * @param {import('../core/state.js').PaperEntity} paper
 * @param {import('../core/state.js').Modifiers} modifiers
 */
export function computeDamage(operator, paper, modifiers) {
  const stat = operator[paper.subject] ?? 0;
  if (stat <= 0) {
    return 0;
  }

  const base = stat * (paper.resistance ?? 1);
  const flat = modifiers.flatBonus ?? 0;
  const mult = modifiers.multiplier ?? 1;
  return Math.max(0, Math.round((base + flat) * mult));
}

/**
 * @param {import('../core/state.js').PaperEntity} paper
 * @param {number} damage
 */
export function applyDamageToPaper(paper, damage) {
  if (!paper.alive || damage <= 0) {
    return { destroyed: false, overflow: 0, gained: 0 };
  }

  const before = paper.damageDealt;
  paper.damageDealt += damage;

  if (paper.damageDealt < paper.passLine) {
    return { destroyed: false, overflow: 0, gained: 0 };
  }

  const overflowCap = Math.max(0, paper.maxScore - paper.passLine);
  const overflow = Math.min(Math.max(0, paper.damageDealt - paper.passLine), overflowCap);
  const gained = paper.passLine + overflow - before;

  paper.alive = false;
  return { destroyed: true, overflow, gained: Math.max(gained, 0) };
}

/** @param {string} subject */
export function isValidSubject(subject) {
  return SUBJECTS.includes(subject);
}
