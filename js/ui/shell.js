/** 将 #app.rh-app 等比缩放到视口内（保持 720×1280，不拉伸） */

import { DESIGN_HEIGHT, DESIGN_WIDTH } from '../core/constants.js';

export function fitAppShell() {
  const app = document.getElementById('app');
  if (!app) {
    return;
  }

  // 强制锁定设计尺寸，防止外部 CSS 把壳层拉成视口宽高比
  app.style.width = `${DESIGN_WIDTH}px`;
  app.style.height = `${DESIGN_HEIGHT}px`;

  const pad = 16;
  const scale = Math.min(
    (window.innerWidth - pad) / DESIGN_WIDTH,
    (window.innerHeight - pad) / DESIGN_HEIGHT,
    1,
  );
  app.style.transform = `scale(${scale})`;
}

/** transform:scale 下部分环境滚轮不驱动 overflow，手动桥接 */
function bindScaledWheelScroll() {
  const app = document.getElementById('app');
  if (!app || app.dataset.wheelScrollBound === '1') {
    return;
  }
  app.dataset.wheelScrollBound = '1';

  app.addEventListener(
    'wheel',
    (e) => {
      /** @type {HTMLElement|null} */
      let el = e.target instanceof HTMLElement ? e.target : null;
      while (el && el !== app) {
        const style = getComputedStyle(el);
        const canY = style.overflowY === 'auto' || style.overflowY === 'scroll';
        if (canY && el.scrollHeight > el.clientHeight + 1) {
          const before = el.scrollTop;
          el.scrollTop += e.deltaY;
          if (el.scrollTop !== before) {
            e.preventDefault();
          }
          return;
        }
        el = el.parentElement;
      }
    },
    { passive: false },
  );
}

export function bindAppShellFit() {
  fitAppShell();
  bindScaledWheelScroll();
  window.addEventListener('resize', fitAppShell);
}
