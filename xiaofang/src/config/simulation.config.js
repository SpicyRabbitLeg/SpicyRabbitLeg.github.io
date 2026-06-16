/**
 * 全局仿真参数配置 — 模型导入后在此调整
 */
export default {
  models: {
    scene: '/models/scene/indoor-scene.glb',
    character: '/models/character/firefighter.glb',
  },

  /** 人物出生点 — 1F 中央（原拆分坐标 z=-4 在场景外，已校正） */
  characterSpawn: { x: 0, y: 0.5, z: 0 },

  /**
   * 人物来源优先级:
   * - 'separate'  : 使用独立 firefighter.glb（带骨骼动画）
   * - 'embedded'  : 使用场景 GLB 内分离出的静态消防员
   * - 'placeholder': 胶囊占位符
   */
  /** 优先 separate；人物已从 indoor-scene.glb 拆分到 firefighter.glb */
  characterSource: 'separate',

  /** 场景 GLB 内嵌人物分离 — 已离线拆分，运行时不再分离 */
  embeddedCharacter: {
    enabled: false,
    patterns: ['Group-836488', 'Obj3d66', 'firefighter', 'character', '消防'],
    hideInScene: true,
  },

  /** 场景模型内空对象/网格命名约定（与建模软件导出一致） */
  spatialNaming: {
    wall: ['wall', 'Wall', '墙体', '立方体', '柱体', '边框', '网格'],
    obstacle: ['obstacle', 'Obstacle', '障碍', '绳子'],
    stair: ['stair', 'Stair', '楼梯', '斜梯'],
    lowPassage: ['low_passage', 'LowPassage', '低矮通道', 'nurbs', 'NURBS', 'pipe', 'Pipe', '管道'],
    hole: ['hole', 'Hole', '孔洞', '穿墙洞'],
    exit: ['exit', 'Exit', '安全出口', '电磁门'],
    fireEquipment: ['fire_equip', 'FireEquip', '消防'],
    ground: ['ground', 'Ground', 'floor', 'Floor', '地面', '平面'],
    navZone: ['nav_zone', 'NavZone', '可通行'],
  },

  /** 骨骼动画 clip 名称映射（与模型内 AnimationClip 名称一致） */
  animations: {
    idle: ['Idle', 'idle', '待机'],
    walk: ['Walk', 'walk', '慢走'],
    jog: ['Jog', 'jog', '慢跑'],
    run: ['Run', 'run', '奔跑'],
    crawl: ['Crawl', 'crawl', '匍匐'],
    jump: ['Jump', 'jump', '跳跃'],
    vault: ['Vault', 'vault', '跨越'],
    stairUp: ['StairUp', 'stair_up', '上楼梯'],
    stairDown: ['StairDown', 'stair_down', '下楼梯'],
    crouchHole: ['CrouchHole', 'crouch_hole', '钻洞'],
    squeezeHole: ['SqueezeHole', 'squeeze_hole', '侧身穿洞'],
    crouch: ['Crouch', 'crouch', '弯腰'],
  },

  /** AI 移动与动作切换 */
  movement: {
    aiDefaultAction: 'run',
    aiSlowDistance: 2,
    aiJogDistance: 4,
    actionReleaseDelay: 0.3,
    walkSpeed: 1.5,
    jogSpeed: 2.8,
    runSpeed: 4.5,
    crawlSpeed: 1.0,
    crouchSpeed: 1.2,
    stairSpeed: 1.8,
    crouchHoleSpeed: 1.2,
    squeezeHoleSpeed: 1.0,
  },

  /** 净空高度分级（米）— 低于阈值时切换对应动作 */
  clearance: {
    crouchMax: 1.7,
    crawlMax: 1.2,
    holeMax: 0.8,
    probeDistance: 1.5,
  },

  /** 运行时性能 — 低配可进一步增大 terrainProbeInterval */
  performance: {
    /** 地形/净空探测间隔（秒），避免每帧射线检测 */
    terrainProbeInterval: 0.15,
    /** 移动超过该距离（米）才强制重新探测 */
    terrainProbeMoveThreshold: 0.35,
    /** 是否对全场景 mesh 做射线（极耗性能，默认关） */
    useMeshClearance: false,
    /** 考核录像采样间隔（秒） */
    recordFrameInterval: 0.05,
  },

  physics: {
    characterRadius: 0.35,
    characterHeight: 1.75,
    crawlRadius: 0.28,
    crawlHeight: 0.42,
    stepHeight: 0.35,
    gravity: -9.8,
    groundCheckDistance: 0.15,
  },

  navigation: {
    agentRadius: 0.4,
    maxSlope: 45,
    cellSize: 0.4,
    maxFloorDelta: 0.45,
    deviationThreshold: 1.5,
  },

  assessment: {
    timeLimitSeconds: 300,
    maxDeviationCount: 5,
    deviationThreshold: 1.5,
    requiredActions: ['run', 'stairUp', 'crawl', 'crouchHole'],
    recordFrameInterval: 0.05,
  },

  environment: {
    ambientIntensity: 0.35,
    emergencyLightColor: 0xff2200,
    emergencyLightIntensity: 2.5,
    smokeParticleCount: 800,
    pathLineColor: 0x00ff88,
  },

  /** 预设逃生路线 — autoGenerateRoutes=true 时由场景自动生成 */
  autoGenerateRoutes: true,
  routes: [],

  /** 无模型时使用内置演示场景 */
  useDemoScene: false,
};
