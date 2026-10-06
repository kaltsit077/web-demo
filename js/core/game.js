import { createInitialState } from './state.js';
import { bindInput } from '../input/input.js';
import { renderFrame, setupCanvas } from '../render/render.js';
import {
  loadLevel,
  loadOperators,
  loadPaperTemplates,
  loadCodexRules,
  loadCodexItems,
} from '../levels/loader.js';
import {
  endTurn,
  initLevel,
  resetLevelRuntime,
  spawnWave,
  updateProjectile,
  updateTimedPaperDrop,
} from '../sim/sim.js';
import { rollBuffChoices, selectBuff } from '../buffs/buffs.js';
import { loadSave, unlockNextLevel, persistAll, rollOperatorUnlockChoices, unlockOperator, hasLevelReward, markLevelRewarded, exportSaveText, parseSaveText, clearSaveStorage, applySaveToState, createDefaultSave } from '../save/save.js';
import { initAudio, getAudioSettings, playSfx } from '../audio/audio.js';
import {
  initScreens,
  showTitleScreen,
  showDepartmentScreen,
  showLevelMapScreen,
  showCodexHubScreen,
  showGalleryScreen,
  showEnemyCodexScreen,
  showRulesCodexScreen,
  showItemsCodexScreen,
  showSettingsScreen,
  showContactScreen,
  showBattleLayout,
  hideBattleLayout,
  hideModal,
  showModal,
  showResultModal,
  showFailModal,
  showWaveBuffModal,
  showOperatorUnlockModal,
  showPausedModal,
} from '../ui/screens.js';
import { updateBattleDock, updateBattleHud, bindBattleHudControls } from '../ui/battle-dock.js';
import { bindAppShellFit } from '../ui/shell.js';
import { preloadImages, OPERATOR_SPRITES, PAPER_SPRITES, UI_SPRITES } from '../assets/loader.js';

/** @type {import('./state.js').GameState} */
let state;
/** @type {Record<string, object>} */
let paperTemplates;
/** @type {Record<string, object>} */
let operatorDefs;
/** @type {object[]} */
let codexRules;
/** @type {object[]} */
let codexItems;

function syncUi() {
  if (state.phase === 'playing' || state.phase === 'paused' || state.phase === 'waveBuff') {
    updateBattleHud(state);
    updateBattleDock(state);
  }
}

async function startLevel(levelId) {
  hideModal();
  state.levelId = levelId;
  state.levelDef = await loadLevel(levelId);
  state.operatorDefs = operatorDefs;
  state.phase = 'playing';
  resetLevelRuntime(state);
  initLevel(state, paperTemplates);
  showBattleLayout();
  syncUi();
}

function onProjectileDone(hitInfo) {
  if (hitInfo?.destroyed) {
    playSfx('destroy');
  } else if (hitInfo?.hit) {
    playSfx('hit');
  }
  const result = endTurn(state);
  syncUi();

  if (result === 'waveClear') {
    playSfx('open');
    rollBuffChoices(state);
    showWaveBuffModal(state.buffChoices, (buffId) => {
      selectBuff(state, buffId);
      spawnWave(state, paperTemplates);
      state.paperDropTimer = 0;
      state.phase = 'playing';
      syncUi();
    });
  } else if (result === 'win') {
    playSfx('confirm');
    state.phase = 'result';
    unlockNextLevel(state);

    const openResult = () => {
      showResultModal(
        state.lastResultScore,
        () => {
          const order = ['primary-1', 'primary-2', 'primary-3'];
          const idx = order.indexOf(state.levelId ?? '');
          if (idx >= 0 && idx < order.length - 1 && state.unlockedLevels.includes(order[idx + 1])) {
            startLevel(order[idx + 1]);
          } else {
            hideBattleLayout();
            state.phase = 'levelMap';
            showLevelMapScreen(state.departmentId ?? 'primary', state.unlockedLevels);
          }
        },
        () => startLevel(state.levelId),
        () => {
          hideBattleLayout();
          state.phase = 'levelMap';
          showLevelMapScreen(state.departmentId ?? 'primary', state.unlockedLevels);
        },
      );
    };

    // 每课首次通关：从未解锁干员里随机三选一；已领过或已全解锁则跳过
    if (!hasLevelReward(state)) {
      const choices = rollOperatorUnlockChoices(operatorDefs, state.unlockedOperators);
      if (choices.length > 0) {
        showOperatorUnlockModal(choices, (opId) => {
          unlockOperator(state, opId);
          markLevelRewarded(state);
          openResult();
        });
        return;
      }
      markLevelRewarded(state);
    }
    openResult();
  } else if (result === 'fail') {
    playSfx('error');
    state.phase = 'fail';
    showFailModal(
      () => startLevel(state.levelId),
      () => {
        hideBattleLayout();
        state.phase = 'levelMap';
        showLevelMapScreen(state.departmentId ?? 'primary', state.unlockedLevels);
      },
    );
  }
}

function navigateTitle() {
  hideModal();
  hideBattleLayout();
  state.settings = getAudioSettings();
  persistAll(state);
  state.phase = 'title';
  showTitleScreen();
}

function navigateDepartments() {
  hideModal();
  hideBattleLayout();
  state.phase = 'departmentSelect';
  showDepartmentScreen(state.unlockedDepartments);
}

function navigateLevelMap(deptId) {
  state.departmentId = deptId;
  state.phase = 'levelMap';
  showLevelMapScreen(deptId, state.unlockedLevels);
}

function exportSave() {
  const text = exportSaveText(state);
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rhodes789-save-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  playSfx('confirm');
}

function importSave() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    try {
      const raw = await file.text();
      const data = parseSaveText(raw);
      if (!data) {
        playSfx('error');
        showModal(
          '读取失败',
          `<p class="rh-panel__subtitle">存档文件格式无效</p>`,
          [{ label: '关闭', variant: 'ghost', action: () => {} }],
        );
        return;
      }
      applySaveToState(state, data);
      initAudio(state.settings);
      playSfx('confirm');
      showModal(
        '读取成功',
        `<p class="rh-panel__subtitle">关卡 ${data.unlockedLevels.length} · 干员 ${data.unlockedOperators.length}</p>`,
        [{ label: '好的', variant: 'primary', action: () => navigateTitle() }],
      );
    } catch {
      playSfx('error');
    }
  });
  input.click();
}

function openSettings() {
  state.phase = 'settings';
  showSettingsScreen(state, {
    onRefresh: openSettings,
    onResetSave: () => {
      showModal(
        '重置进度',
        `<p class="rh-panel__subtitle">将清空关卡、干员解锁与通关奖励记录。建议先在标题页导出存档。</p>`,
        [
          { label: '取消', variant: 'ghost', action: () => {} },
          {
            label: '确认重置',
            variant: 'primary',
            action: () => {
              clearSaveStorage();
              applySaveToState(state, createDefaultSave());
              initAudio(state.settings);
              navigateTitle();
            },
          },
        ],
      );
    },
  });
}

export async function bootstrap() {
  bindAppShellFit();

  preloadImages([
    UI_SPRITES.crosshair,
    PAPER_SPRITES.chinese,
    PAPER_SPRITES.math,
    PAPER_SPRITES.english,
    ...Object.values(OPERATOR_SPRITES).flatMap((s) => [s.queue, s.loaded]),
  ]);

  const canvas = document.getElementById('game-canvas');
  const ctx = setupCanvas(canvas);

  paperTemplates = await loadPaperTemplates();
  operatorDefs = await loadOperators();
  codexRules = await loadCodexRules();
  codexItems = await loadCodexItems();

  state = createInitialState();
  const save = loadSave();
  state.unlockedLevels = save.unlockedLevels;
  state.unlockedOperators = save.unlockedOperators;
  state.unlockedDepartments = save.unlockedDepartments;
  state.rewardedLevels = save.rewardedLevels ?? [];
  state.settings = save.settings;
  initAudio(save.settings);

  initScreens({
    callbacks: {
      onTitle: navigateTitle,
      onStartGame: navigateDepartments,
      onDepartments: navigateDepartments,
      onDepartment: navigateLevelMap,
      onLevel: startLevel,
      onGallery: () => {
        state.phase = 'gallery';
        showCodexHubScreen();
      },
      onCodexHub: () => {
        state.phase = 'gallery';
        showCodexHubScreen();
      },
      onCodexOperators: () => {
        state.phase = 'gallery';
        showGalleryScreen(operatorDefs, state.unlockedOperators);
      },
      onCodexEnemies: () => {
        state.phase = 'gallery';
        showEnemyCodexScreen(paperTemplates);
      },
      onCodexRules: () => {
        state.phase = 'gallery';
        showRulesCodexScreen(codexRules);
      },
      onCodexItems: () => {
        state.phase = 'gallery';
        showItemsCodexScreen(codexItems);
      },
      onExportSave: exportSave,
      onImportSave: importSave,
      onSettings: openSettings,
      onContact: () => {
        state.phase = 'contact';
        showContactScreen();
      },
    },
  });

  bindInput(state, canvas);
  bindBattleHudControls(() => state);

  let last = performance.now();
  let pauseModalShown = false;

  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;

    if (state.phase === 'playing' && !state.paused) {
      if (state.projectile?.active) {
        const shot = updateProjectile(state, dt);
        if (shot.done) {
          onProjectileDone(shot);
        }
      }

      if (state.phase === 'playing') {
        const dropResult = updateTimedPaperDrop(state, dt);
        if (dropResult === 'fail') {
          playSfx('error');
          showFailModal(
            () => startLevel(state.levelId),
            () => {
              hideBattleLayout();
              state.phase = 'levelMap';
              showLevelMapScreen(state.departmentId ?? 'primary', state.unlockedLevels);
            },
          );
        } else {
          updateBattleHud(state);
        }
      }
    }

    if (state.phase === 'paused' && !pauseModalShown) {
      pauseModalShown = true;
      showPausedModal(() => {
        state.paused = false;
        state.phase = 'playing';
        pauseModalShown = false;
        hideModal();
      });
    }

    if (state.phase !== 'paused') {
      pauseModalShown = false;
    }

    renderFrame(ctx, state);
    requestAnimationFrame(loop);
  }

  showTitleScreen();
  requestAnimationFrame(loop);
}
