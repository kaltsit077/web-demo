# 关卡与数据字段

## 关卡文件 `levels/{id}.json`

```json
{
  "id": "primary-1",
  "name": "小学部 · 第1关",
  "stage": "primary",
  "playerHp": 5,
  "operatorPool": ["amiya", "texas", "exusiai"],
  "pickCount": 2,
  "waves": [
    {
      "papers": [
        { "template": "chinese-basic", "gridCol": 2, "gridRow": 0 }
      ]
    }
  ]
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 唯一 id，对应文件名 |
| `name` | string | 显示名 |
| `stage` | string | `primary` / `junior` / `senior`（愿景） |
| `playerHp` | number | 初始生命 |
| `operatorPool` | string[] | 本关可用干员 id |
| `pickCount` | number | 开局随机抽取进队列数量 |
| `waves` | Wave[] | **纯波次**，无增援 |
| `waves[].papers` | Spawn[] | 该波试卷生成表 |

### Spawn

| 字段 | 说明 |
|------|------|
| `template` | `paper-templates.json` 中的 key |
| `gridCol` | 格子列（0-based） |
| `gridRow` | 格子行（0-based） |

---

## 试卷模板 `data/paper-templates.json`

| 字段 | 说明 |
|------|------|
| `name` | 显示名 |
| `subject` | `chinese` / `math` / `english` |
| `passLine` | 合格线（击溃阈值） |
| `maxScore` | 满分（默认 100；初中 120；高中 150） |
| `radius` | 碰撞半径 |
| `resistance` | 伤害系数 |
| `moveDown` | 每回合下落格数 |
| `color` | 占位色 |

### 运行时字段（sim 写入）

- `damageDealt` — 累计伤害
- `alive` / `crossedWall`
- `x`, `y` — 由 `gridCol/gridRow` 派生

---

## 干员 `data/operators.json`

| 字段 | 说明 |
|------|------|
| `name` | 显示名 |
| `role` | 定位（图鉴展示，弹药隐喻） |
| `description` | 简介文案 |
| `chinese` | 语文能力 → 打语文卷 |
| `math` | 数学能力 |
| `english` | 英语能力 |
| `color` | 占位色 |

伤害：`operator[paper.subject] * resistance`；学科值为 0 → 0 伤。

---

## 胜利 / 失败闭包

- **胜利**：`waveIndex === waves.length - 1` 且最后一波清空，或所有波次已触发且场上无 alive 试卷
- **失败**：`wallCrossCount >= 3` 或 `playerHp <= 0`
- **越墙**：`gridRow >= WALL_ROW`，扣 1 HP，越线计数 +1
