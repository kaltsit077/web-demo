/** 简单图片缓存 */

/** @type {Map<string, HTMLImageElement>} */
const cache = new Map();

/** @param {string} src @returns {HTMLImageElement|null} */
export function getImage(src) {
  if (!src) {
    return null;
  }
  let img = cache.get(src);
  if (img) {
    return img.complete && img.naturalWidth > 0 ? img : null;
  }
  img = new Image();
  img.src = src;
  cache.set(src, img);
  return null;
}

/** @param {string[]} srcs */
export function preloadImages(srcs) {
  for (const src of srcs) {
    if (!src || cache.has(src)) {
      continue;
    }
    const img = new Image();
    img.src = src;
    cache.set(src, img);
  }
}

/** @type {Record<string, { queue: string, loaded: string }>} */
export const OPERATOR_SPRITES = Object.fromEntries(
  [
    'amiya',
    'savage',
    'texas',
    'lappland',
    'wisadel',
    'exusiai',
    'executor',
    'ceobe',
    'skadi',
    'blaze',
    'mostima',
    'magallan',
    'kaltsit',
    'chen',
    'silverash',
    'siege',
    'eyjafjalla',
    'saria',
    'ifrit',
    'surtr',
    'mountain',
    'phantom',
    'thorns',
    'croissant',
    'hoshiguma',
    'angelina',
  ].map((id) => [
    id,
    {
      queue: `assets/operators/queue/${id}.svg`,
      loaded: `assets/operators/loaded/${id}.svg`,
    },
  ]),
);

export const PAPER_SPRITES = {
  chinese: 'assets/papers/chinese.svg',
  math: 'assets/papers/math.svg',
  english: 'assets/papers/english.svg',
};

export const UI_SPRITES = {
  crosshair: 'assets/ui/crosshair_color_a.png',
};
