/** 可复用 UI 组件工厂 */

import { playSfx } from '../audio/audio.js';

/**
 * @param {string} label
 * @param {string} [variant] primary | ghost | danger
 * @param {() => void} [onClick]
 * @param {'click'|'confirm'|'back'|'select'} [sfx]
 */
export function createButton(label, variant = '', onClick, sfx = 'click') {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `rh-btn${variant ? ` rh-btn--${variant}` : ''}`;
  btn.textContent = label;
  if (onClick) {
    btn.addEventListener('click', () => {
      playSfx(sfx);
      onClick();
    });
  }
  return btn;
}

export function createBackButton(onClick) {
  const btn = createButton('← 返回', 'ghost', onClick, 'back');
  btn.classList.add('rh-screen__back');
  btn.style.minHeight = '48px';
  return btn;
}

/**
 * @param {object} op
 * @param {string} id
 * @param {'loaded'|'queue'|'empty'} mode
 */
export function createOperatorSlot(op, id, mode) {
  const slot = document.createElement('button');
  slot.type = 'button';
  slot.className = 'rh-op-slot';
  slot.dataset.operatorId = id;

  if (mode === 'empty') {
    slot.classList.add('rh-op-slot--empty');
    slot.disabled = true;
    slot.textContent = '—';
    return slot;
  }

  if (mode === 'loaded') {
    slot.classList.add('rh-op-slot--loaded');
  }

  const avatar = document.createElement('div');
  avatar.className = 'rh-op-slot__avatar';
  avatar.title = op.name;
  const folder = mode === 'loaded' ? 'loaded' : 'queue';
  const img = document.createElement('img');
  img.src = `assets/operators/${folder}/${id}.svg`;
  img.alt = op.name ?? id;
  img.onerror = () => {
    img.remove();
    avatar.style.background = op.color ?? '#3498db';
    avatar.textContent = op.name?.slice(0, 1) ?? '?';
  };
  avatar.appendChild(img);
  slot.appendChild(avatar);
  return slot;
}

export function disclaimerHtml() {
  return `<p class="rh-disclaimer">非官方同人作品 · 不盈利 · 版权归原作者所有 · fan work only</p>`;
}
