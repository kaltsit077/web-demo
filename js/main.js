import { bootstrap } from './core/game.js';

bootstrap().catch((err) => {
  console.error(err);
  document.body.innerHTML = `<pre style="color:#fff;padding:24px">加载失败：${err.message}\n请使用本地 HTTP 服务打开（见 README）。</pre>`;
});
