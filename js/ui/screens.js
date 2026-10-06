import { createButton, createBackButton, disclaimerHtml } from './components.js';
import { LEVEL_LIST } from '../levels/loader.js';
import { isBgmEnabled, getBgmVolume, setBgmVolume, toggleBgm, playSfx } from '../audio/audio.js';
import { SUBJECT_LABEL } from '../core/constants.js';

const DEPT_CONFIG = [
  { id: 'primary', name: '小学部', icon: '小', animDelay: 0 },
  { id: 'senior', name: '高中部', icon: '高', animDelay: 400 },
  { id: 'junior', name: '初中部', icon: '初', animDelay: 800 },
];

/** @type {HTMLElement|null} */
let screenLayer = null;

/** @type {{ showScreen: Function, showModal: Function, hideModal: Function, callbacks: object }} */
let ctx = { callbacks: {} };

export function initScreens(context) {
  ctx = context;
  screenLayer = document.getElementById('screen-layer');
}

function mountScreen(id, build) {
  screenLayer.innerHTML = '';
  const screen = document.createElement('div');
  screen.className = 'rh-screen is-active';
  screen.id = id;
  build(screen);
  screenLayer.appendChild(screen);
  if (id !== 'screen-battle') {
    document.getElementById('battle-layout')?.classList.remove('is-active');
  }
}

export function showTitleScreen() {
  mountScreen('screen-title', (el) => {
    const layout = document.createElement('div');
    layout.className = 'rh-title';

    const nav = document.createElement('nav');
    nav.className = 'rh-title__nav';
    const items = [
      { label: '开始游戏', variant: 'primary', action: () => ctx.callbacks.onStartGame(), sfx: 'confirm', primary: true },
      { label: '角色图鉴', variant: 'ghost', action: () => ctx.callbacks.onGallery(), sfx: 'open' },
      { label: '导出存档', variant: 'ghost', action: () => ctx.callbacks.onExportSave?.(), sfx: 'click' },
      { label: '读取存档', variant: 'ghost', action: () => ctx.callbacks.onImportSave?.(), sfx: 'click' },
      { label: '游戏设置', variant: 'ghost', action: () => ctx.callbacks.onSettings(), sfx: 'click' },
      { label: '联络创作者', variant: 'ghost', action: () => ctx.callbacks.onContact(), sfx: 'click' },
    ];
    items.forEach((item, i) => {
      const b = createButton(item.label, item.variant, item.action, item.sfx);
      b.style.setProperty('--rh-stagger', `${i * 70}ms`);
      b.classList.add('rh-title__nav-btn');
      if (item.primary) b.classList.add('rh-title__nav-btn--primary');
      nav.appendChild(b);
    });

    const hero = document.createElement('div');
    hero.className = 'rh-title__hero';
    hero.innerHTML = `
      <div class="rh-title__chrome">
        <span class="rh-title__chrome-id">RHODES.TERMINAL // EXAM</span>
        <span class="rh-title__chrome-status"><i></i>ONLINE</span>
      </div>
      <div class="rh-title__stage" aria-hidden="true">
        <div class="rh-title__grid"></div>
        <div class="rh-title__seal">
          <span>789</span>
        </div>
      </div>
      <div class="rh-title__brand">
        <p class="rh-title__eyebrow">非官方同人 · 考场部署模拟</p>
        <h1 class="rh-title__game-name">
          <span class="rh-title__num">789</span>
          <span class="rh-title__cn">罗德岛学院</span>
        </h1>
        <p class="rh-title__tagline">部署干员 · 击溃试卷 · 守护罗德岛</p>
        <span class="rh-tag">NON-COMMERCIAL FAN WORK</span>
      </div>
    `;

    layout.appendChild(hero);
    layout.appendChild(nav);
    el.appendChild(layout);
    el.insertAdjacentHTML('beforeend', disclaimerHtml());
  });
}

export function showDepartmentScreen(unlockedDepartments) {
  mountScreen('screen-dept', (el) => {
    const page = document.createElement('div');
    page.className = 'rh-dept';

    page.appendChild(createBackButton(() => ctx.callbacks.onTitle()));

    const header = document.createElement('div');
    header.className = 'rh-dept__header';
    header.innerHTML = `
      <p class="rh-title__eyebrow">ACADEMY · SELECT BRANCH</p>
      <h2 class="rh-panel__title">选择学部</h2>
      <p class="rh-panel__subtitle">小学先行 · 高中 / 初中依次解锁</p>
    `;
    page.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'rh-dept__grid';

    for (const dept of DEPT_CONFIG) {
      const unlocked = unlockedDepartments.includes(dept.id);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `rh-dept-card${unlocked ? '' : ' rh-dept-card--locked'}`;
      card.style.animationDelay = `${dept.animDelay}ms`;
      card.innerHTML = `
        <div class="rh-dept-card__img">
          <span class="rh-dept-card__glyph">${dept.icon}</span>
          <span class="rh-dept-card__badge">${unlocked ? 'OPEN' : 'LOCK'}</span>
        </div>
        <div class="rh-dept-card__body">
          <div class="rh-dept-card__name">${dept.name}</div>
          ${unlocked ? '<div class="rh-dept-card__hint">点击进入课程</div>' : '<div class="rh-dept-card__lock">未解锁</div>'}
        </div>
      `;
      if (unlocked) {
        card.addEventListener('click', () => {
          playSfx('select');
          ctx.callbacks.onDepartment(dept.id);
        });
      }
      grid.appendChild(card);
      requestAnimationFrame(() => card.classList.add('is-visible'));
    }

    page.appendChild(grid);
    el.appendChild(page);
  });
}

export function showLevelMapScreen(departmentId, unlockedLevels) {
  const deptName = DEPT_CONFIG.find((d) => d.id === departmentId)?.name ?? departmentId;
  const levels = departmentId === 'primary' ? LEVEL_LIST : [];

  mountScreen('screen-levelmap', (el) => {
    const page = document.createElement('div');
    page.className = 'rh-levelmap';

    page.appendChild(createBackButton(() => ctx.callbacks.onDepartments()));

    const header = document.createElement('div');
    header.className = 'rh-dept__header';
    header.innerHTML = `
      <p class="rh-title__eyebrow">COURSE MAP</p>
      <h2 class="rh-panel__title">${deptName}</h2>
      <p class="rh-panel__subtitle">沿线路推进 · 完成前课解锁后课</p>
    `;
    page.appendChild(header);

    const path = document.createElement('div');
    path.className = 'rh-levelmap__path';

    if (levels.length === 0) {
      path.innerHTML = `<div class="rh-empty"><p>该学部课程筹备中</p><span>敬请期待</span></div>`;
      page.appendChild(path);
      el.appendChild(page);
      return;
    }

    levels.forEach((lv, i) => {
      if (i > 0) {
        const conn = document.createElement('div');
        conn.className = 'rh-level-connector';
        path.appendChild(conn);
      }
      const unlocked = unlockedLevels.includes(lv.id);
      const node = document.createElement('button');
      node.type = 'button';
      node.className = 'rh-level-node';
      node.disabled = !unlocked;
      node.innerHTML = `
        <span class="rh-level-node__index">0${i + 1}</span>
        <div class="rh-level-node__title">第 ${i + 1} 课</div>
        <div class="rh-level-node__desc">${lv.desc}${unlocked ? '' : ' · 锁定'}</div>
      `;
      if (unlocked) {
        node.addEventListener('click', () => {
          playSfx('confirm');
          ctx.callbacks.onLevel(lv.id);
        });
      }
      path.appendChild(node);
    });

    page.appendChild(path);
    el.appendChild(page);
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statBarsHtml(op) {
  const max = 6;
  const rows = [
    ['语', op.chinese],
    ['数', op.math],
    ['英', op.english],
  ];
  return rows
    .map(([label, value]) => {
      const pct = Math.max(0, Math.min(100, (Number(value) / max) * 100));
      return `<div class="rh-stat-bar"><span class="rh-stat-bar__label">${label}</span><span class="rh-stat-bar__track"><span class="rh-stat-bar__fill" style="width:${pct}%"></span></span><span class="rh-stat-bar__val">${value}</span></div>`;
    })
    .join('');
}

/**
 * @param {string} id
 * @param {object} op
 * @param {boolean} battleReady
 */
function openOperatorDetail(id, op, battleReady) {
  const status = battleReady
    ? '<span class="rh-gallery-detail__badge is-ready">可出战</span>'
    : '<span class="rh-gallery-detail__badge">档案收录 · 作战待解锁</span>';
  showModal(
    escapeHtml(op.name),
    `
      <div class="rh-gallery-detail">
        <div class="rh-gallery-detail__hero">
          <img src="assets/operators/loaded/${id}.svg" alt="${escapeHtml(op.name)}" />
          <div>
            <p class="rh-gallery-detail__role">${escapeHtml(op.role ?? '未定弹药')}</p>
            ${status}
          </div>
        </div>
        <p class="rh-gallery-detail__desc">${escapeHtml(op.description ?? '暂无档案。')}</p>
        <div class="rh-gallery-detail__stats">${statBarsHtml(op)}</div>
      </div>
    `,
    [{ label: '关闭', variant: 'ghost', action: () => {} }],
  );
}

const CODEX_HUB_ENTRIES = [
  { id: 'operators', name: '干员图鉴', hint: '弹药档案 · 三围与定位', glyph: '干', action: 'onCodexOperators' },
  { id: 'enemies', name: '敌方图鉴', hint: '试卷档案 · 合格线与抗性', glyph: '敌', action: 'onCodexEnemies' },
  { id: 'rules', name: '规则图鉴', hint: '考场法则 · 怪谈预告', glyph: '规', action: 'onCodexRules' },
  { id: 'items', name: '道具图鉴', hint: '装备预览 · 后续解锁', glyph: '道', action: 'onCodexItems' },
];

/** 角色图鉴 · 次级目录 */
export function showCodexHubScreen() {
  mountScreen('screen-codex-hub', (el) => {
    const page = document.createElement('div');
    page.className = 'rh-codex';

    page.appendChild(createBackButton(() => ctx.callbacks.onTitle()));

    const header = document.createElement('div');
    header.className = 'rh-dept__header';
    header.innerHTML = `
      <p class="rh-title__eyebrow">ARCHIVE · CODEX</p>
      <h2 class="rh-panel__title">角色图鉴</h2>
      <p class="rh-panel__subtitle">选择档案分册</p>
    `;
    page.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'rh-codex__grid';

    CODEX_HUB_ENTRIES.forEach((entry, i) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'rh-codex-card';
      card.style.setProperty('--rh-stagger', `${i * 60}ms`);
      card.innerHTML = `
        <div class="rh-codex-card__glyph">${entry.glyph}</div>
        <div class="rh-codex-card__name">${entry.name}</div>
        <div class="rh-codex-card__hint">${entry.hint}</div>
      `;
      card.addEventListener('click', () => {
        playSfx('open');
        ctx.callbacks[entry.action]?.();
      });
      grid.appendChild(card);
    });

    page.appendChild(grid);
    el.appendChild(page);
  });
}

/**
 * @param {HTMLElement} el
 * @param {{ onBack: Function, title: string, subtitle: string, buildBody: (scrollEl: HTMLElement) => void }} opts
 */
function mountCodexListPage(el, { onBack, title, subtitle, buildBody }) {
  const page = document.createElement('div');
  page.className = 'rh-page';

  const top = document.createElement('div');
  top.className = 'rh-page__top';
  top.appendChild(createBackButton(onBack));

  const header = document.createElement('div');
  header.className = 'rh-dept__header';
  header.innerHTML = `<h2 class="rh-panel__title">${title}</h2><p class="rh-panel__subtitle">${subtitle}</p>`;
  top.appendChild(header);
  page.appendChild(top);

  const scroll = document.createElement('div');
  scroll.className = 'rh-gallery';
  buildBody(scroll);
  page.appendChild(scroll);
  el.appendChild(page);
}

/**
 * @param {Record<string, object>} operatorDefs
 * @param {string[]} unlockedOperators
 */
export function showGalleryScreen(operatorDefs, unlockedOperators) {
  mountScreen('screen-gallery', (el) => {
    const ids = Object.keys(operatorDefs);
    const unlocked = new Set(unlockedOperators);
    const readyCount = ids.filter((id) => unlocked.has(id)).length;

    mountCodexListPage(el, {
      onBack: () => ctx.callbacks.onCodexHub(),
      title: '干员图鉴',
      subtitle: `收录 ${ids.length} 名 · 可出战 ${readyCount} 名`,
      buildBody: (scroll) => {
        if (ids.length === 0) {
          scroll.innerHTML = `<p class="rh-panel__subtitle" style="text-align:center;padding:48px">档案为空。</p>`;
          return;
        }
        const inner = document.createElement('div');
        inner.className = 'rh-gallery__grid';
        for (const id of ids) {
          const op = operatorDefs[id];
          if (!op) continue;
          const battleReady = unlocked.has(id);
          const card = document.createElement('button');
          card.type = 'button';
          card.className = `rh-gallery-card${battleReady ? ' is-ready' : ''}`;
          card.innerHTML = `
            <div class="rh-gallery-card__circle" style="border-color:${escapeHtml(op.color ?? 'var(--rh-border)')}">
              <img src="assets/operators/loaded/${id}.svg" alt="" />
            </div>
            <div class="rh-gallery-card__name">${escapeHtml(op.name)}</div>
            <div class="rh-gallery-card__role">${escapeHtml(op.role ?? '')}</div>
            <div class="rh-gallery-card__stats">语${op.chinese} · 数${op.math} · 英${op.english}</div>
          `;
          card.addEventListener('click', () => {
            playSfx('open');
            openOperatorDetail(id, op, battleReady);
          });
          inner.appendChild(card);
        }
        scroll.appendChild(inner);
      },
    });
  });
}

/**
 * @param {Record<string, object>} paperTemplates
 */
export function showEnemyCodexScreen(paperTemplates) {
  mountScreen('screen-codex-enemies', (el) => {
    const ids = Object.keys(paperTemplates ?? {});
    mountCodexListPage(el, {
      onBack: () => ctx.callbacks.onCodexHub(),
      title: '敌方图鉴',
      subtitle: `试卷档案 ${ids.length} 种`,
      buildBody: (scroll) => {
        const inner = document.createElement('div');
        inner.className = 'rh-gallery__grid';
        for (const id of ids) {
          const paper = paperTemplates[id];
          if (!paper) continue;
          const subjectLabel = SUBJECT_LABEL[paper.subject] ?? paper.subject;
          const card = document.createElement('button');
          card.type = 'button';
          card.className = 'rh-gallery-card';
          card.innerHTML = `
            <div class="rh-gallery-card__circle" style="border-color:${escapeHtml(paper.color ?? 'var(--rh-border)')}">
              <img src="assets/papers/${escapeHtml(paper.subject)}.svg" alt="" />
            </div>
            <div class="rh-gallery-card__name">${escapeHtml(paper.name)}</div>
            <div class="rh-gallery-card__role">${escapeHtml(paper.role ?? subjectLabel)}</div>
            <div class="rh-gallery-card__stats">合格 ${paper.passLine} · 抗 ${paper.resistance}</div>
          `;
          card.addEventListener('click', () => {
            playSfx('open');
            showModal(
              escapeHtml(paper.name),
              `
                <div class="rh-gallery-detail">
                  <div class="rh-gallery-detail__hero">
                    <img src="assets/papers/${escapeHtml(paper.subject)}.svg" alt="" />
                    <div>
                      <p class="rh-gallery-detail__role">${escapeHtml(paper.role ?? '试卷')}</p>
                      <span class="rh-gallery-detail__badge">${escapeHtml(subjectLabel)}</span>
                    </div>
                  </div>
                  <p class="rh-gallery-detail__desc">${escapeHtml(paper.description ?? '暂无档案。')}</p>
                  <div class="rh-gallery-detail__stats">
                    <div class="rh-stat-bar"><span class="rh-stat-bar__label">合</span><span class="rh-stat-bar__track"><span class="rh-stat-bar__fill" style="width:${Math.min(100, paper.passLine)}%"></span></span><span class="rh-stat-bar__val">${paper.passLine}</span></div>
                    <div class="rh-stat-bar"><span class="rh-stat-bar__label">满</span><span class="rh-stat-bar__track"><span class="rh-stat-bar__fill" style="width:${Math.min(100, paper.maxScore)}%"></span></span><span class="rh-stat-bar__val">${paper.maxScore}</span></div>
                    <div class="rh-stat-bar"><span class="rh-stat-bar__label">抗</span><span class="rh-stat-bar__track"><span class="rh-stat-bar__fill" style="width:${Math.min(100, (paper.resistance ?? 1) * 100)}%"></span></span><span class="rh-stat-bar__val">${paper.resistance}</span></div>
                  </div>
                </div>
              `,
              [{ label: '关闭', variant: 'ghost', action: () => {} }],
            );
          });
          inner.appendChild(card);
        }
        scroll.appendChild(inner);
      },
    });
  });
}

/**
 * @param {object[]} rules
 */
export function showRulesCodexScreen(rules) {
  mountScreen('screen-codex-rules', (el) => {
    const list = Array.isArray(rules) ? rules : [];
    const active = list.filter((r) => r.status === 'active').length;
    mountCodexListPage(el, {
      onBack: () => ctx.callbacks.onCodexHub(),
      title: '规则图鉴',
      subtitle: `生效 ${active} · 收录 ${list.length}`,
      buildBody: (scroll) => {
        const stack = document.createElement('div');
        stack.className = 'rh-codex-list';
        for (const rule of list) {
          const locked = rule.status === 'locked';
          const card = document.createElement('button');
          card.type = 'button';
          card.className = `rh-codex-entry${locked ? ' is-locked' : ''}`;
          card.innerHTML = `
            <div class="rh-codex-entry__top">
              <span class="rh-codex-entry__cat">${escapeHtml(rule.category ?? '规则')}</span>
              <span class="rh-codex-entry__status">${locked ? '待解锁' : '生效中'}</span>
            </div>
            <div class="rh-codex-entry__name">${escapeHtml(rule.name)}</div>
            <div class="rh-codex-entry__desc">${escapeHtml(rule.description)}</div>
          `;
          card.addEventListener('click', () => {
            playSfx('open');
            showModal(
              escapeHtml(rule.name),
              `<p class="rh-gallery-detail__desc" style="text-align:left">${escapeHtml(rule.description)}</p>
               <p class="rh-panel__subtitle">${locked ? '后续版本启用' : '当前版本生效'}</p>`,
              [{ label: '关闭', variant: 'ghost', action: () => {} }],
            );
          });
          stack.appendChild(card);
        }
        scroll.appendChild(stack);
      },
    });
  });
}

/**
 * @param {object[]} items
 */
export function showItemsCodexScreen(items) {
  mountScreen('screen-codex-items', (el) => {
    const list = Array.isArray(items) ? items : [];
    mountCodexListPage(el, {
      onBack: () => ctx.callbacks.onCodexHub(),
      title: '道具图鉴',
      subtitle: `预览 ${list.length} 种 · 战斗内暂未启用`,
      buildBody: (scroll) => {
        const inner = document.createElement('div');
        inner.className = 'rh-gallery__grid';
        for (const item of list) {
          const card = document.createElement('button');
          card.type = 'button';
          card.className = 'rh-gallery-card is-locked';
          card.innerHTML = `
            <div class="rh-gallery-card__circle rh-gallery-card__circle--glyph">道</div>
            <div class="rh-gallery-card__name">${escapeHtml(item.name)}</div>
            <div class="rh-gallery-card__role">${escapeHtml(item.role ?? '')}</div>
            <div class="rh-gallery-card__stats">待解锁</div>
          `;
          card.addEventListener('click', () => {
            playSfx('open');
            showModal(
              escapeHtml(item.name),
              `
                <div class="rh-gallery-detail">
                  <p class="rh-gallery-detail__role">${escapeHtml(item.role ?? '道具')}</p>
                  <span class="rh-gallery-detail__badge">档案预览 · 作战待解锁</span>
                  <p class="rh-gallery-detail__desc">${escapeHtml(item.description ?? '')}</p>
                </div>
              `,
              [{ label: '关闭', variant: 'ghost', action: () => {} }],
            );
          });
          inner.appendChild(card);
        }
        scroll.appendChild(inner);
      },
    });
  });
}

export function showSettingsScreen(state, handlers = {}) {
  mountScreen('screen-settings', (el) => {
    el.appendChild(createBackButton(() => ctx.callbacks.onTitle()));

    const panel = document.createElement('div');
    panel.className = 'rh-panel';
    panel.innerHTML = `<div class="rh-panel__inner">
      <h2 class="rh-panel__title">游戏设置</h2>
    </div>`;
    const inner = panel.querySelector('.rh-panel__inner');

    const progress = document.createElement('div');
    progress.className = 'rh-field rh-save-summary';
    progress.innerHTML = `
      <label>本地存档</label>
      <p class="rh-save-summary__line">关卡 ${state?.unlockedLevels?.length ?? 0} · 干员 ${state?.unlockedOperators?.length ?? 0} · 已领奖 ${state?.rewardedLevels?.length ?? 0}</p>
      <p class="rh-save-summary__hint">存档导出 / 读取在标题页。清站点数据会丢失进度。</p>
    `;
    inner.appendChild(progress);

    const bgmRow = document.createElement('div');
    bgmRow.className = 'rh-field';
    bgmRow.innerHTML = `<label>背景音乐</label>`;
    const bgmBtn = createButton(isBgmEnabled() ? '关闭音乐' : '开启音乐', '', () => {
      toggleBgm();
      handlers.onRefresh?.();
    });
    bgmRow.appendChild(bgmBtn);
    inner.appendChild(bgmRow);

    const volRow = document.createElement('div');
    volRow.className = 'rh-field';
    volRow.innerHTML = `<label>音量 ${Math.round(getBgmVolume() * 100)}%</label>`;
    const range = document.createElement('input');
    range.type = 'range';
    range.min = '0';
    range.max = '100';
    range.value = String(Math.round(getBgmVolume() * 100));
    range.className = 'rh-range';
    range.addEventListener('input', () => {
      setBgmVolume(Number(range.value) / 100);
      volRow.querySelector('label').textContent = `音量 ${range.value}%`;
    });
    volRow.appendChild(range);
    inner.appendChild(volRow);

    const resetRow = document.createElement('div');
    resetRow.className = 'rh-field rh-save-actions';
    resetRow.innerHTML = `<label>危险操作</label>`;
    resetRow.appendChild(
      createButton('重置进度', '', () => {
        handlers.onResetSave?.();
      }, 'error'),
    );
    inner.appendChild(resetRow);

    el.appendChild(panel);
  });
}

export function showContactScreen() {
  mountScreen('screen-contact', (el) => {
    el.appendChild(createBackButton(() => ctx.callbacks.onTitle()));

    const panel = document.createElement('div');
    panel.className = 'rh-panel';
    panel.innerHTML = `
      <div class="rh-panel__inner" style="text-align:center">
        <h2 class="rh-panel__title">联络创作者</h2>
        <p class="rh-panel__subtitle">欢迎反馈与共建</p>
        <p class="rh-panel__subtitle">
          GitHub：<a href="https://github.com/kaltsit077/web-demo" target="_blank" rel="noopener" style="color:var(--rh-accent)">kaltsit077/web-demo</a>
        </p>
        <p class="rh-panel__subtitle">本作为非盈利同人项目，仅供学习交流。</p>
      </div>
    `;
    el.appendChild(panel);
    el.insertAdjacentHTML('beforeend', disclaimerHtml());
  });
}

export function hideMenuScreens() {
  if (screenLayer) {
    screenLayer.innerHTML = '';
  }
}

export function showBattleLayout() {
  hideMenuScreens();
  document.getElementById('battle-layout')?.classList.add('is-active');
}

export function hideBattleLayout() {
  document.getElementById('battle-layout')?.classList.remove('is-active');
}

/* ── 模态 ── */

const modalBackdrop = () => document.getElementById('modal-backdrop');
const modalContent = () => document.getElementById('modal-content');

export function showModal(title, bodyHtml, actions) {
  const backdrop = modalBackdrop();
  const content = modalContent();
  content.className = 'rh-modal rh-panel';
  content.innerHTML = `
    <div class="rh-panel__inner">
      <h2 class="rh-panel__title">${title}</h2>
      ${bodyHtml}
      <div class="rh-modal__actions" id="modal-actions"></div>
    </div>
  `;
  const row = content.querySelector('#modal-actions');
  for (const { label, variant, action } of actions) {
    row.appendChild(createButton(label, variant, () => {
      hideModal();
      action();
    }));
  }
  backdrop?.classList.add('is-open');
}

export function hideModal() {
  modalBackdrop()?.classList.remove('is-open');
  if (modalContent()) {
    modalContent().innerHTML = '';
  }
}

export function showResultModal(score, onNext, onRetry, onBack) {
  showModal(
    '任务完成',
    `<p class="rh-panel__subtitle">本关作战结束</p><div class="rh-modal__score">${score}</div><p class="rh-panel__subtitle">积分已计入档案</p>`,
    [
      { label: '返回', variant: 'ghost', action: onBack },
      { label: '重试', variant: '', action: onRetry },
      { label: '下一关', variant: 'primary', action: onNext },
    ],
  );
}

export function showFailModal(onRetry, onBack) {
  showModal(
    '任务失败',
    `<p class="rh-panel__subtitle">试卷越线过多或生命值耗尽</p>`,
    [
      { label: '返回', variant: 'ghost', action: onBack },
      { label: '重试', variant: 'primary', action: onRetry },
    ],
  );
}

export function showWaveBuffModal(buffChoices, onSelect) {
  const backdrop = modalBackdrop();
  const content = modalContent();
  content.className = 'rh-modal rh-panel';
  content.innerHTML = `
    <div class="rh-panel__inner">
      <h2 class="rh-panel__title">波次间隙</h2>
      <p class="rh-panel__subtitle">选择一项增益</p>
      <div class="rh-buff-grid" id="buff-grid"></div>
    </div>
  `;
  const grid = content.querySelector('#buff-grid');
  for (const buff of buffChoices) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'rh-buff-card';
    card.innerHTML = `<strong>${buff.name}</strong><span>${buff.desc}</span>`;
    card.addEventListener('click', () => {
      hideModal();
      onSelect(buff.id);
    });
    grid.appendChild(card);
  }
  backdrop?.classList.add('is-open');
}

/**
 * 通关干员三选一
 * @param {{ id: string, def: object }[]} choices
 * @param {(operatorId: string) => void} onSelect
 */
export function showOperatorUnlockModal(choices, onSelect) {
  const backdrop = modalBackdrop();
  const content = modalContent();
  content.className = 'rh-modal rh-panel';
  content.innerHTML = `
    <div class="rh-panel__inner">
      <h2 class="rh-panel__title">干员征召</h2>
      <p class="rh-panel__subtitle">本课通过 · 从档案中随机抽出 3 名，择一解锁</p>
      <div class="rh-unlock-grid" id="unlock-grid"></div>
    </div>
  `;
  const grid = content.querySelector('#unlock-grid');
  for (const { id, def } of choices) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'rh-unlock-card';
    card.innerHTML = `
      <img class="rh-unlock-card__avatar" src="assets/operators/loaded/${id}.svg" alt="" />
      <strong>${escapeHtml(def?.name ?? id)}</strong>
      <span class="rh-unlock-card__role">${escapeHtml(def?.role ?? '')}</span>
      <span class="rh-unlock-card__stats">语${def?.chinese ?? 0} · 数${def?.math ?? 0} · 英${def?.english ?? 0}</span>
    `;
    card.addEventListener('click', () => {
      playSfx('confirm');
      hideModal();
      onSelect(id);
    });
    grid.appendChild(card);
  }
  backdrop?.classList.add('is-open');
}

export function showPausedModal(onResume) {
  showModal(
    '已暂停',
    `<p class="rh-panel__subtitle">切换标签页后游戏暂停</p>`,
    [{ label: '继续', variant: 'primary', action: onResume }],
  );
}
