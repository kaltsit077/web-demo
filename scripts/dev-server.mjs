#!/usr/bin/env node
/**
 * 零依赖本地静态服务：ESM / JSON / 音视频 / 字体。
 * 默认端口 5500（避开 Steam 等占用的 8080），启动后自动打开浏览器。
 *
 * 用法：
 *   npm start
 *   node scripts/dev-server.mjs
 *   node scripts/dev-server.mjs --port 5173
 *   RH_PORT=5173 npm start
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.map': 'application/json',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

function parsePort() {
  const argIdx = process.argv.indexOf('--port');
  if (argIdx >= 0 && process.argv[argIdx + 1]) {
    return Number(process.argv[argIdx + 1]);
  }
  if (process.env.RH_PORT) return Number(process.env.RH_PORT);
  if (process.env.PORT) return Number(process.env.PORT);
  return 5500;
}

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent((urlPath || '/').split('?')[0]);
  const rel = decoded.replace(/^\/+/, '');
  const full = path.normalize(path.join(root, rel || 'index.html'));
  if (!full.startsWith(root)) return null;
  return full;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(body);
}

function openBrowser(url) {
  const platform = process.platform;
  try {
    if (platform === 'win32') {
      spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
    } else if (platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch {
    /* ignore */
  }
}

function lanAddresses() {
  const nets = networkInterfaces();
  const list = [];
  for (const entries of Object.values(nets)) {
    for (const e of entries || []) {
      if (e.family === 'IPv4' && !e.internal) list.push(e.address);
    }
  }
  return list;
}

function createServer() {
  return http.createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      send(res, 405, 'Method Not Allowed');
      return;
    }

    let filePath = safeJoin(ROOT, req.url === '/' ? '/index.html' : req.url);
    if (!filePath) {
      send(res, 403, 'Forbidden');
      return;
    }

    fs.stat(filePath, (err, st) => {
      if (!err && st.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      fs.readFile(filePath, (readErr, data) => {
        if (readErr) {
          send(res, 404, 'Not Found');
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const type = MIME[ext] || 'application/octet-stream';
        if (req.method === 'HEAD') {
          res.writeHead(200, { 'Content-Type': type, 'Content-Length': data.length, 'Cache-Control': 'no-store' });
          res.end();
          return;
        }
        send(res, 200, data, { 'Content-Type': type, 'Content-Length': data.length });
      });
    });
  });
}

function listen(port, attemptsLeft = 12) {
  const server = createServer();
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && attemptsLeft > 0) {
      console.log(`[dev] 端口 ${port} 占用，尝试 ${port + 1} …`);
      listen(port + 1, attemptsLeft - 1);
      return;
    }
    console.error('[dev] 启动失败:', err.message);
    process.exit(1);
  });

  server.listen(port, '0.0.0.0', () => {
    const url = `http://127.0.0.1:${port}/`;
    console.log('');
    console.log('  789罗德岛学院 · 本地预览');
    console.log('  ────────────────────────');
    console.log(`  Local   ${url}`);
    for (const ip of lanAddresses()) {
      console.log(`  LAN     http://${ip}:${port}/`);
    }
    console.log('  按 Ctrl+C 停止');
    console.log('');
    if (!process.env.RH_NO_OPEN) openBrowser(url);
  });
}

listen(parsePort());
