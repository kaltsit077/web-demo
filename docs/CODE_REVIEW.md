# Code Review · UI 重构（2026-10-06）

## 结论

**需改后合入** — 标题页已按 frontend-design 二次过稿；下列为仍存问题与已修项。

## 阻断项

无（可玩闭环存在）。

## 建议项（已修 / 待跟）

| # | 位置 | 依据 | 影响 | 状态 |
|---|------|------|------|------|
| 1 | 标题页 RH 圆居中 | frontend-design：品牌应是 hero | 去掉游戏名即可换品牌，品牌弱 | **已修**：789 + 中文名为主视觉 |
| 2 | 系统默认字体 | user rule + frontend-design | 模板感 | **已修**：Orbitron / Noto Sans SC / Share Tech Mono |
| 3 | 「联创」文案不一致 | 线稿写「联络」 | 入口语义含糊 | **已修** |
| 4 | CSS 硬编码 `#fff` / `#05080a` | check-style P0 | token 漂移 | **已修** 进 `--rh-*` |
| 5 | `render.js` 画布色硬编码 | check-style | 换肤难 | 待跟：映射到 token 常量 |
| 6 | 出战池空时 | 正确性 | 无解锁干员会空队列 | Phase1 默认有 amiya；建议加 fallback toast |
| 7 | Google Fonts 外网 | 性能/离线 | 国内可能慢 | 待跟：可本地 woff |
| 8 | 学部/战斗页仍偏扁 | 审美 | 与标题页完成度差距 | **已跟**：学部大卡 + 课程节点 + Dock 加大 |
| 9 | modal-layer 挡点击 | 正确性 | 标题按钮无反应 | **已修**：`pointer-events: none` |

## 赞同一处

- `sim` 仍为唯一实体写者；UI 屏路由与 Canvas 分层清晰，适合后续加 Vue 只包 HUD 而不动 sim。

## 工作流对齐（vs Codex）

本仓库可做到的闭环：

1. **定方向**（frontend-design / DESIGN_QUESTIONS）
2. **落地**（frontend-designer / design-to-ui）
3. **自审**（截图 + code-review + check-style）
4. **再改** → 文档回写

做不到的：自动从网上下载任意 skill（应用商店）；需你本地已有 skill 或显式让我用 `skill-creator` 新建。
