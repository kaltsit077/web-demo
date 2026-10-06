# 架构说明

## 技术栈决策

```
原生 JS (ESM) + Canvas 2D + 静态 JSON + localStorage
无 bundler · 无 Vue/React
```

### 为什么不用框架？

| 需求 | Vue/React | 本架构 |
|------|-----------|--------|
| 60fps Canvas 绘制 | 需 ref + 生命周期桥接 | render 直读 state 每帧 |
| 游戏主循环 | 与组件更新两套节奏 | 单一 requestAnimationFrame |
| 碰撞/回合 sim | 不应触发 DOM diff | sim 模块纯函数式写 state |
| 选关/结算 UI | 适合组件化 | 少量 DOM，原生模板字符串足够 |

结论：**框架适合 CRUD 应用；Canvas 游戏用「状态 + 系统」更清晰。**

若未来需要复杂 UI（背包、图鉴），可只对 **HUD 面板** 局部引入轻量库，sim/render 核心保持独立。

---

## 模块职责

| 模块 | 职责 | 写 state？ |
|------|------|-----------|
| `core/state.js` | 初始状态、失败判定 | 否 |
| `core/game.js` | 阶段机、UI 面板、主循环编排 | phase 切换 |
| `core/constants.js` | 分辨率、网格、常量 | 否 |
| `sim/sim.js` | 波次、发射、回合、越墙、胜负 | **是（唯一）** |
| `sim/damage.js` | 伤害公式、击溃、溢出分 | 经 sim 调用 |
| `sim/grid.js` | 格子 ↔ 世界坐标 | 经 sim 调用 |
| `sim/collision.js` | 圆碰撞 | 否 |
| `input/input.js` | 指针 → 意图 | 仅 aiming |
| `render/render.js` | Canvas 只读绘制 | 否 |
| `levels/loader.js` | fetch JSON | 否 |
| `buffs/buffs.js` | 波次 Buff | modifiers |
| `rules/rules.js` | 规则钩子（stub） | 预留 |
| `items/items.js` | 道具（stub） | 预留 |
| `save/save.js` | localStorage | 解锁列表 |

---

## 主循环

```javascript
requestAnimationFrame(loop):
  if playing && projectile.active:
    sim.updateProjectile(dt)
    if done: sim.endTurn()
  render.renderFrame(ctx, state)
  render.updateHud(...)
```

---

## 扩展点

### modifiers 管道

```javascript
state.modifiers = { flatBonus, multiplier }
// buffs / rules / items 注入，sim.computeDamage 统一消费
```

### 规则钩子（预留）

```javascript
rules.triggerRules(state, 'beforeFire' | 'afterTurn' | ...)
```

### 道具（预留）

```javascript
items.useItem(state, itemId) // 上弓后、发射前
```

---

## 运行要求

- 现代浏览器（ES2020+ Module）
- 本地 HTTP 服务
- 设计分辨率 720×1280，CSS 缩放适配
