/** 轻量音频：BGM + SFX（Kenney CC0） */

const SFX = {
  click: 'assets/audio/sfx/ui_click.ogg',
  confirm: 'assets/audio/sfx/ui_confirm.ogg',
  back: 'assets/audio/sfx/ui_back.ogg',
  error: 'assets/audio/sfx/ui_error.ogg',
  select: 'assets/audio/sfx/ui_select.ogg',
  open: 'assets/audio/sfx/ui_open.ogg',
  switch: 'assets/audio/sfx/ui_switch.ogg',
  hit: 'assets/audio/sfx/combat_hit.ogg',
  destroy: 'assets/audio/sfx/combat_destroy.ogg',
};

const BGM_SRC = 'assets/audio/bgm/main_theme.ogg';

let audio = null;
let enabled = false;
let volume = 0.35;
let sfxVolume = 0.55;
/** @type {Map<string, HTMLAudioElement>} */
const sfxCache = new Map();

export function initAudio(settings) {
  volume = settings?.bgmVolume ?? 0.35;
  enabled = settings?.bgmEnabled ?? false;
  audio = new Audio(BGM_SRC);
  audio.loop = true;
  audio.volume = volume;
  if (enabled) {
    audio.play().catch(() => {
      enabled = false;
    });
  }
}

export function getBgmVolume() {
  return volume;
}

/** @param {number} v 0-1 */
export function setBgmVolume(v) {
  volume = Math.max(0, Math.min(1, v));
  if (audio) {
    audio.volume = volume;
  }
}

export function toggleBgm() {
  enabled = !enabled;
  if (!audio) {
    initAudio({ bgmEnabled: enabled, bgmVolume: volume });
  }
  if (enabled) {
    audio.src = BGM_SRC;
    audio.play().catch(() => {
      enabled = false;
    });
  } else {
    audio.pause();
  }
  return enabled;
}

export function isBgmEnabled() {
  return enabled;
}

export function getAudioSettings() {
  return { bgmEnabled: enabled, bgmVolume: volume };
}

/** @param {keyof typeof SFX} name */
export function playSfx(name) {
  const src = SFX[name];
  if (!src) {
    return;
  }
  let el = sfxCache.get(name);
  if (!el) {
    el = new Audio(src);
    sfxCache.set(name, el);
  }
  try {
    el.volume = sfxVolume;
    el.currentTime = 0;
    el.play().catch(() => {});
  } catch {
    // ignore autoplay blocks on first gesture-less call
  }
}
