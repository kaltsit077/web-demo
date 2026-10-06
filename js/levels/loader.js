const levelCache = new Map();
let paperTemplates = null;
let operatorDefs = null;

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load ${url}: ${res.status}`);
  }
  return res.json();
}

export async function loadPaperTemplates() {
  if (!paperTemplates) {
    paperTemplates = await fetchJson('data/paper-templates.json');
  }
  return paperTemplates;
}

export async function loadOperators() {
  if (!operatorDefs) {
    operatorDefs = await fetchJson('data/operators.json');
  }
  return operatorDefs;
}

let codexRules = null;
let codexItems = null;

export async function loadCodexRules() {
  if (!codexRules) {
    codexRules = await fetchJson('data/codex-rules.json');
  }
  return codexRules;
}

export async function loadCodexItems() {
  if (!codexItems) {
    codexItems = await fetchJson('data/codex-items.json');
  }
  return codexItems;
}

/** @param {string} levelId */
export async function loadLevel(levelId) {
  if (!levelCache.has(levelId)) {
    levelCache.set(levelId, await fetchJson(`levels/${levelId}.json`));
  }
  return levelCache.get(levelId);
}

export const LEVEL_LIST = [
  { id: 'primary-1', name: '第1课', desc: '语文入门 · 单波次' },
  { id: 'primary-2', name: '第2课', desc: '数学入门 · 双波次' },
  { id: 'primary-3', name: '第3课', desc: '三科混合 · 三波次' },
];
