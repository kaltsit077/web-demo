import fs from 'fs';
import path from 'path';

const ops = JSON.parse(fs.readFileSync('data/operators.json', 'utf8'));

function darken(hex, f = 0.45) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * f);
  const g = Math.round(((n >> 8) & 255) * f);
  const b = Math.round((n & 255) * f);
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function loadedSvg(op) {
  const c = op.color;
  const d = darken(c);
  const ch = escapeXml(op.name[0]);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c}"/>
      <stop offset="100%" stop-color="${d}"/>
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="58" fill="url(#g)" stroke="#00e5ff" stroke-width="4"/>
  <circle cx="64" cy="64" r="48" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2" stroke-dasharray="4 6"/>
  <text x="64" y="78" text-anchor="middle" font-family="Noto Sans SC, Microsoft YaHei, sans-serif" font-size="42" font-weight="700" fill="#e8f4f8">${ch}</text>
</svg>
`;
}

function queueSvg(op) {
  const c = darken(op.color, 0.55);
  const ch = escapeXml(op.name[0]);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <circle cx="48" cy="48" r="44" fill="${c}" stroke="#00e5ff" stroke-width="3"/>
  <text x="48" y="58" text-anchor="middle" font-family="Noto Sans SC, Microsoft YaHei, sans-serif" font-size="28" font-weight="700" fill="#e8f4f8">${ch}</text>
</svg>
`;
}

for (const [id, op] of Object.entries(ops)) {
  fs.writeFileSync(path.join('assets/operators/loaded', `${id}.svg`), loadedSvg(op));
  fs.writeFileSync(path.join('assets/operators/queue', `${id}.svg`), queueSvg(op));
  console.log('wrote', id);
}
