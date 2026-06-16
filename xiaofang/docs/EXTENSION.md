# 系统扩展方案

## 1. 新增逃生动作

### Step 1 — 配置映射

`src/config/simulation.config.js`：

```js
animations: {
  roll: ['Roll', 'roll', '翻滚'],
},
```

### Step 2 — 地形触发（可选）

`src/character/TerrainActionDetector.js`：

```js
resolveAction(terrain, defaultMove) {
  if (terrain.needsRoll) return 'roll';
  // ...existing logic
}
```

### Step 3 — 速度表

`src/character/CharacterController.js` 的 `speedMap` 添加 `roll: 2.0`。

### Step 4 — 考核规则

```js
requiredActions: ['roll'],
```

---

## 2. 新增逃生路线

```js
import config from './config/simulation.config.js';

config.routes.push({
  id: 'route-roof',
  name: '屋顶备用通道',
  tag: 'complex',
  nodes: [
    { x: 0, y: 3, z: 0 },
    { x: 5, y: 3, z: 2 },
    { x: 10, y: 0, z: 5 },
  ],
  requiredActions: ['vault'],
});

// 重建可视化
app.routes.addRoute(config.routes.at(-1));
app.routeVisualizer.build(app.routes.getAll());
```

**编辑器扩展**：可开发 Three.js 点击取点工具，导出 JSON 节点序列。

---

## 3. 新增考核规则

`src/assessment/AssessmentRecorder.js` → `_evaluate()`：

```js
// 示例：最大停滞时间
if (this.stallTime > 30) score -= 20;

// 示例：动作顺序校验
const order = ['jog', 'crawl', 'stairUp'];
// 对比 this.actionHistory
```

扩展 EventBus 事件供外部订阅：

```js
bus.on(Events.ASSESSMENT_COMPLETE, (result) => {
  // 上报后端 API
});
```

---

## 4. 升级 Recast NavMesh

替换 `PathFinder.buildNavGraph()`：

```js
import { NavMeshHelper } from '@recast-navigation/three';

async buildNavMesh(scene, spatialData) {
  const helper = new NavMeshHelper();
  const navMesh = await helper.fromScene(scene, {
    cellSize: 0.3,
    cellHeight: 0.2,
    agentRadius: 0.4,
    agentMaxSlope: 45,
  });
  this.navMesh = navMesh;
}
```

---

## 5. 多人物同场景

- 克隆 `CharacterController` 实例
- 共用 `CollisionSystem` / `PathFinder`
- `AssessmentRecorder` 改为 Map\<characterId, stats\>

---

## 6. 后端对接

推荐 REST API：

| 接口 | 用途 |
|------|------|
| `POST /api/routes` | 上传路线 JSON |
| `POST /api/assessment` | 提交考核结果 |
| `GET /api/replay/:id` | 获取回放帧数据 |

考核结果 schema：

```json
{
  "routeId": "route-main",
  "passed": true,
  "score": 85,
  "elapsed": 142.5,
  "deviationCount": 1,
  "completedActions": ["jog", "crawl", "stairUp"],
  "recording": [{ "t": 0, "position": [1,0,0], "action": "jog" }]
}
```
