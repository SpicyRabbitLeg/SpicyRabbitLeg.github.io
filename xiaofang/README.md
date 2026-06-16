# 消防逃生数字模拟仿真系统

基于 Three.js 的室内封闭空间消防员逃生路线考核与多地形动作模拟系统。

## 快速开始

```bash
npm install
npm run dev
```

默认使用**内置演示场景**（无需外部模型），浏览器打开 `http://localhost:5173`。

## 功能概览

- 封闭室内场景 GLB 加载 + 空间节点自动解析
- 应急灯光、烟雾粒子、地面路径标线
- 分层碰撞（墙体/障碍/地面/楼梯/孔洞）
- 多路线规划 + 3D 可视化 + 偏离预警
- 消防员骨骼动画调度（跑/爬/跳/楼梯/钻洞）
- AI 自动 / 手动操控双模式
- 考核统计 + 轨迹录制回放

## 项目结构

```
├── index.html
├── package.json
├── docs/
│   ├── ARCHITECTURE.md    # 系统架构
│   ├── MODEL_IMPORT.md    # 模型导入教程
│   └── EXTENSION.md       # 扩展方案
├── public/models/
│   ├── scene/             # 放置场景 GLB
│   └── character/         # 放置人物 GLB
└── src/
    ├── main.js
    ├── config/simulation.config.js
    ├── core/              # App 入口 + EventBus
    ├── scene/             # 场景加载/环境/烟雾
    ├── physics/           # 碰撞系统
    ├── navigation/        # 寻路 + 路线可视化
    ├── routes/            # 路线管理 + 偏离检测
    ├── character/         # 人物控制 + 动画
    ├── assessment/        # 考核 + 回放
    ├── input/             # 键盘输入
    └── ui/                # 控制面板
```

## 场景内嵌人物（与场景同 GLB）

若场景 GLB 里包含静态消防员（如 `Group-836488` / `Obj3d66`），系统会**自动分离**：

- 人物从场景结构中拆出，不再作为墙体/障碍参与碰撞
- 作为可操控角色整体移动（静态模型无骨骼动画）
- 出生点自动取人物原始位置

配置项 `src/config/simulation.config.js`：

```js
characterSource: 'embedded',  // embedded | separate | placeholder
embeddedCharacter: {
  enabled: true,
  patterns: ['Group-836488', 'Obj3d66'],
},
```

若后续提供**独立带骨骼动画**的 `firefighter.glb`，改为：

```js
characterSource: 'separate',
```

## 导入自有模型

1. 将 GLB 放入 `public/models/scene/` 和 `public/models/character/`
2. 修改 `src/config/simulation.config.js` 中 `useDemoScene: false`
3. 按 [docs/MODEL_IMPORT.md](docs/MODEL_IMPORT.md) 配置命名与动画映射

## 操作说明

| 模式 | 操作 |
|------|------|
| AI 自动 | 选择路线 → 开始演练 |
| 手动 | WASD 移动, Shift 跑, Ctrl 慢走, C 匍匐, 空格 跳, E 楼梯, F 钻洞 |

## 文档

- [系统架构](docs/ARCHITECTURE.md)
- [模型导入配置](docs/MODEL_IMPORT.md)
- [扩展方案](docs/EXTENSION.md)

## 技术栈

- Three.js r170
- Vite 6
- three-pathfinding（预留 NavMesh 扩展）

## 构建

```bash
npm run build
npm run preview
```
