# 789罗德岛学院

非官方同人 Web 小游戏 · **不盈利** · 版权归原作者所有（fan work only）。

弹弓塔防 + 学科克制：下方弹弓发射干员，上方试卷按回合下落；伤害达合格线即击溃，溢出计额外分。

## 技术栈

| 层 | 选型 | 原因 |
|----|------|------|
| 语言 | **原生 JavaScript（ES Modules）** | 游戏主循环 + Canvas 无需 Virtual DOM |
| 渲染 | **Canvas 2D（5×5 刷怪区）** | 战斗实体绘制 |
| UI | **HTML/CSS 组件 + 设计 Token** | 菜单/Dock/模态；方舟风切角面板 |
| 数据 | **静态 JSON** | 关卡/角色/试卷策划可直改 |
| 构建 | **无** | 打开即跑，零配置 |

> 为何不用 Vue / React？  
> 本项目的「UI」主要是 Canvas 帧绘制 + 少量 overlay 面板。框架的组件树、响应式绑定、 reconciler 对游戏 loop 是额外负担，反而把简单问题变繁琐。菜单/选关等 DOM 用原生即可。

## 运行

本地 HTTP（ES Module + fetch，不能用 `file://`）。**推荐一键启动**（默认端口 **5500**，占用则自动顺延；避开常见 8080 冲突）：

```bash
# 双击 start.bat，或：
npm start
```

浏览器会自动打开 `http://127.0.0.1:5500/`。指定端口：

```bash
npm start -- --port 5173
# 或
set RH_PORT=5173 && npm start
```

不自动开浏览器：`set RH_NO_OPEN=1` 后再 `npm start`。

备选：

```bash
python -m http.server 5500
npx serve -l 5500 .
```

## 操作

- **标题**：开始游戏 → 学部 → 课程节点
- **战斗**：在刷怪区拉方向松手发射（固定速度，无重力）
- **Dock**：点击干员圆槽换人上弓；底部道具区为占位空槽
- 切标签页自动暂停

## 目录

```
css/
  tokens.css      设计变量
  components.css  按钮/面板/槽位
  screens.css     标题/学部/战斗布局
js/core/          主循环、状态
js/sim/           模拟（唯一写实体入口）
js/ui/            屏幕路由、Dock、等比缩放
js/input/ render/ levels/ buffs/ rules/ items/ save/ audio/
levels/           关卡 JSON
data/             干员、试卷模板
assets/           素材包
docs/             策划与架构文档
```

## 文档

- [docs/UI_SYSTEM.md](docs/UI_SYSTEM.md) — UI 设计系统与屏幕流
- [docs/FLOW.md](docs/FLOW.md) — 流程策划图
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — 模块与数据流
- [docs/LEVEL_SETTING.md](docs/LEVEL_SETTING.md) — 关卡字段
- [docs/ASSETS.md](docs/ASSETS.md) — 素材约定
- [docs/DESIGN_QUESTIONS.md](docs/DESIGN_QUESTIONS.md) — 策划定稿

## 声明

本作品为《明日方舟》同人衍生，仅供学习交流，不盈利，与鹰角网络无任何关联。
