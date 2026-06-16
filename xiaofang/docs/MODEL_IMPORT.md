# 模型导入配置教程

## 1. 放置模型文件

```
public/models/
├── scene/
│   └── indoor-scene.glb      ← 封闭室内场景
└── character/
    └── firefighter.glb       ← 消防员骨骼模型
```

## 2. 关闭演示场景

编辑 `src/config/simulation.config.js`：

```js
export default {
  useDemoScene: false,  // ← 改为 false
  models: {
    scene: '/models/scene/indoor-scene.glb',
    character: '/models/character/firefighter.glb',
  },
  // ...
};
```

## 3. 场景模型命名规范

建模软件中为对象设置以下命名前缀/关键词，系统自动解析：

| 类型 | 命名示例 | 解析结果 |
|------|----------|----------|
| 墙体 | `Wall_01`, `墙体_A` | 碰撞层 WALL |
| 障碍 | `Obstacle_Box` | 碰撞层 OBSTACLE |
| 楼梯 | `Stair_Main` | 碰撞层 STAIR + 上楼梯动作触发 |
| 低矮通道 | `LowPassage_Smoke` | 匍匐动作 + 烟雾区 |
| 穿墙孔洞 | `Hole_Wall_01` | 钻洞/侧身穿洞 |
| 安全出口 | `Exit_Safe_A` | 考核终点 |
| 地面 | `Ground_Floor` | 可通行地面 |
| 导航区 | `NavZone_Walkable` | 寻路网格烘焙区域 |

可在 `spatialNaming` 中扩展关键词：

```js
spatialNaming: {
  wall: ['wall', 'Wall', '墙体', 'QiangTi'],
  // 添加贵司建模规范...
},
```

## 4. 人物动画 Clip 命名

GLB 内 AnimationClip 名称需与 `animations` 映射对应：

```js
animations: {
  jog: ['Jog', 'jog', '慢跑'],
  crawl: ['Crawl', 'crawl', '匍匐'],
  stairUp: ['StairUp', 'stair_up', '上楼梯'],
  // ...
},
```

**检查方法**：浏览器控制台加载后会输出 `[CHARACTER_READY] clips: [...]`。

## 5. 逃生路线配置

### 方式 A：配置文件

```js
routes: [
  {
    id: 'route-main',
    name: '主逃生通道',
    tag: 'simple',           // simple | complex | narrow
    nodes: [
      { x: 0, y: 0, z: 0 },
      { x: 10, y: 0, z: 5 },
      { x: 20, y: 0, z: 5 },
    ],
    requiredActions: ['crawl', 'stairUp'],
  },
],
```

### 方式 B：运行时 API

```js
app.routes.addRoute({ id: 'new-route', name: '...', tag: 'complex', nodes: [...] });
app.routeVisualizer.build(app.routes.getAll());
```

### 方式 C：外部 JSON

```js
// 可扩展 RouteLoader 从 /config/routes.json 加载
```

## 6. 参数调整速查

| 参数 | 文件 | 说明 |
|------|------|------|
| 人物半径/高度 | `physics.characterRadius/Height` | 碰撞胶囊尺寸 |
| 偏离阈值 | `assessment.deviationThreshold` | 距路线超过此值触发预警 |
| 考核时限 | `assessment.timeLimitSeconds` | 超时判定 |
| 网格精度 | `navigation.cellSize` | 寻路网格间距 |
| 烟雾粒子数 | `environment.smokeParticleCount` | 低配可降至 300 |

## 7. 常见问题

| 问题 | 排查 |
|------|------|
| 人物穿墙 | 检查墙体是否正确命名为 wall 关键词 |
| 动画不播放 | 核对 GLB 内 clip 名称与 `animations` 映射 |
| 寻路失败 | 确认 NavZone 覆盖可通行区域 |
| 加载报错 | 控制台查看 `[App] 初始化失败` 详情；Draco 压缩需 CDN 可达 |

## 8. 启动项目

```bash
npm install
npm run dev
```

浏览器访问 `http://localhost:5173`
