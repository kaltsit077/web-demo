# 素材约定

Phase 1 已导入 **Kenney CC0** UI / 音效 / 字体，以及 **yd · Out There**（CC0）BGM。详见 [`assets/ATTRIBUTION.md`](../assets/ATTRIBUTION.md)。

## 目录

```
assets/
├── ATTRIBUTION.md
├── manifest.json
├── fonts/               # Kenney Future
├── ui/                  # Sci-Fi UI PNG
├── papers/              # 试卷（待自填）
├── operators/
│   ├── queue/
│   └── loaded/
├── slingshot/
├── audio/
│   ├── bgm/main_theme.ogg
│   └── sfx/*.ogg
└── user/bgm/            # 用户自定义 BGM 预留
```

## 已接入代码

| 资源 | 接入点 |
|------|--------|
| 按钮贴图 | `css/components.css` `.rh-btn*` |
| 字体 | `@font-face` → `--rh-font-display` |
| BGM | `js/audio/audio.js` · 设置页开关 |
| SFX | `playSfx()` · 按钮 / 选关 / 命中 / 胜负 |

## 替换流程

1. 放入 PNG/OGG  
2. 更新 `manifest.json`  
3. 改 CSS/`audio.js` 路径（或后续做 manifest 加载器）
