# 789罗德岛学院 · 流程策划图

> 与 [DESIGN_QUESTIONS.md](./DESIGN_QUESTIONS.md) 定稿一致 · Phase 1 实现范围

---

## 1. 产品总流程

```mermaid
flowchart TD
  START([打开游戏]) --> TITLE[标题页]
  TITLE -->|开始游戏| DEPT[学部选择]
  TITLE --> GALLERY[干员图鉴]
  TITLE --> SETTINGS[游戏设置]
  TITLE --> CONTACT[联创创作者]
  DEPT -->|小学部| MAP[关卡地图]
  MAP -->|第N课| PLAY[战斗]
  PLAY -->|全部波次清空| RESULT[结算模态]
  PLAY -->|越线≥3 或 HP≤0| FAIL[失败模态]
  RESULT -->|下一关/重试| PLAY
  RESULT -->|返回| MAP
  FAIL -->|重试| PLAY
  FAIL -->|返回| MAP
```

---

## 2. 单关战斗主路径

```mermaid
flowchart TD
  A[加载关卡 JSON] --> B[初始化干员队列]
  B --> C[生成当前波次试卷]
  C --> D[自动上弓队首干员]
  D --> E{玩家操作}
  E -->|点击 chip| F[换人上弓]
  F --> D
  E -->|拉方向松手| G[发射 = 1 回合]
  G --> H[直线弹道飞行]
  H --> I{命中试卷?}
  I -->|是| J[学科伤害结算]
  I -->|否| K[回合结束]
  J --> L{伤害≥合格线?}
  L -->|是| M[击溃 + 溢出加分]
  L -->|否| K
  M --> K
  K --> N[试卷按 moveRule 下落]
  N --> O{越墙?}
  O -->|是| P[扣 HP + 越线计数]
  O -->|否| Q[候选区补 1 干员]
  P --> Q
  Q --> R{失败?}
  R -->|是| FAIL([失败])
  R -->|否| S{本波清空?}
  S -->|否| D
  S -->|是| T{还有下一波?}
  T -->|是| U[三选一 Buff]
  U --> C
  T -->|否| WIN([过关结算])
```

---

## 3. 数据流（工程）

```mermaid
flowchart LR
  JSON[(levels/*.json\ndata/*.json)] --> LOADER[levels/loader]
  LOADER --> STATE[(GameState 真相源)]
  INPUT[input/] -->|意图| STATE
  SIM[sim/ 唯一模拟写者] -->|更新| STATE
  BUFFS[buffs/ stub] -->|modifiers| SIM
  RULES[rules/ stub] -->|hooks| SIM
  ITEMS[items/ stub] -->|hooks| SIM
  STATE --> RENDER[render/ Canvas]
  STATE --> HUD[DOM HUD]
  SIM --> SAVE[save/localStorage]
```

---

## 4. 阶段机（phase）

```mermaid
stateDiagram-v2
  [*] --> title
  title --> levelSelect : 开始
  title --> about : 关于
  about --> title
  levelSelect --> playing : 选关
  playing --> paused : 切后台
  paused --> playing : 继续
  playing --> waveBuff : 波次清空
  waveBuff --> playing : 选 Buff
  playing --> result : 全波完成
  playing --> fail : 失败条件
  result --> levelSelect : 返回
  fail --> levelSelect : 返回
  result --> playing : 下一关/重试
  fail --> playing : 重试
```

---

## 5. 伤害与击溃

```mermaid
flowchart LR
  A[干员学科值] --> B{对应学科>0?}
  B -->|否| Z[0 伤害]
  B -->|是| C[× 试卷 resistance]
  C --> D[+ flatBonus × multiplier]
  D --> E[累计 damageDealt]
  E --> F{damageDealt ≥ passLine?}
  F -->|否| G[继续存活]
  F -->|是| H[击溃]
  H --> I[overflow = min超额, maxScore-passLine]
  I --> J[score += passLine + overflow 增量]
```

---

## 6. Phase 1 vs 愿景

| 系统 | Phase 1 | 后续 |
|------|---------|------|
| 关卡 | 小学 3 关 | 初中/高中/无尽 |
| 机制 | 学科克制 | 道具/规则怪谈 |
| Buff | 3 选 1 stub | 完整 Buff 池 |
| 美术 | 几何占位 | assets/ 真图 |
| BGM | 开关 + 占位路径 | 用户上传 user/bgm |
| 失败续关 | 无 | 随机规则续命 |
