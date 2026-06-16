import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AnimationController } from './AnimationController.js';
import { TerrainActionDetector } from './TerrainActionDetector.js';
import { ActionSelector } from './ActionSelector.js';
import { MIXAMO_FORWARD_Y, ProceduralMotion } from './ProceduralMotion.js';
import { ProceduralClipFactory } from './ProceduralClipFactory.js';
import { createHumanoidPlaceholder } from './HumanoidPlaceholder.js';
import { bus, Events } from '../core/EventBus.js';

/**
 * 消防员人物控制器 — AI 自动 / 手动双模式
 */
export class CharacterController {
  constructor(scene, config, collision, pathFinder) {
    this.scene = scene;
    this.config = config;
    this.collision = collision;
    this.pathFinder = pathFinder;
    this.controlMode = 'ai';
    this.model = null;
    this.motionRoot = null;
    this.anim = null;
    this.terrain = new TerrainActionDetector(collision, config);
    this.actionSelector = new ActionSelector(config);
    this.procedural = new ProceduralMotion();
    this.velocity = new THREE.Vector3();
    this.waypoints = [];
    this.waypointIndex = 0;
    this.currentAction = 'idle';
    this.manualAction = null;
    this._hasSkeletonAnim = false;
    this._modelForwardY = 0;
    /** 匍匐时 model.position.y，使 mesh 底部对齐地面（root 在 foot 高度） */
    this._proneVisualY = 0.22;
  }

  /** 世界坐标根节点（移动/地面吸附用） */
  get root() {
    return this.motionRoot || this.model;
  }

  async load(spatialData = {}) {
    const source = this.config.characterSource || 'embedded';
    const embedded = spatialData.embeddedCharacter;

    if (source === 'separate') {
      const loaded = await this._loadSeparateModel();
      if (loaded) return;
      console.warn('[Character] 独立模型不可用，尝试内嵌/占位符');
    }

    if ((source === 'embedded' || source === 'separate') && embedded) {
      this._useEmbeddedModel(embedded, spatialData.gltfAnimations || []);
      return;
    }

    if (source === 'embedded' && !embedded) {
      console.warn('[Character] 场景内未找到可分离的人物，使用占位符');
    }

    this._createPlaceholder();
  }

  async _loadSeparateModel() {
    try {
      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(this.config.models.character);
      this.model = gltf.scene;
      this.model.name = 'Firefighter';
      this._wrapWithMotionRoot();
      this._initAnimation(gltf.animations || [], 'separate');
      return true;
    } catch (err) {
      console.warn('[Character] 独立模型加载失败:', err.message);
      return false;
    }
  }

  _useEmbeddedModel(embedded, animations) {
    this.model = embedded;
    this.model.name = 'Firefighter';
    this._wrapWithMotionRoot();
    this._initAnimation(animations, 'embedded');
    console.info(
      `[Character] 使用场景内分离的消防员${this._hasSkeletonAnim ? '（含骨骼动画）' : '（静态模型，程序化跑步/弯腰）'}`
    );
  }

  _wrapWithMotionRoot() {
    this.motionRoot = new THREE.Group();
    this.motionRoot.name = 'CharacterMotionRoot';

    const parent = this.model.parent;
    if (parent) parent.remove(this.model);

    this.scene.add(this.motionRoot);
    this.motionRoot.add(this.model);
    this.model.position.set(0, 0, 0);
    this.procedural.captureBase(this.model);
  }

  _initAnimation(clips, source) {
    const boneReady = this.procedural.bindSkeleton(this.model);
    const allClips = this._resolveAnimationClips(clips, boneReady);

    this.anim = new AnimationController(this.model, allClips, this.config.animations);
    this._hasSkeletonAnim = allClips.length > 0 && Object.keys(this.anim.actions).length > 0;

    if (this._hasSkeletonAnim) {
      this.procedural._useBonePose = false;
      this.anim.play('idle');
    }

    this._lowPoseActions = new Set(['crawl', 'crouch', 'crouchHole', 'squeezeHole']);
    this._applyModelForwardOffset();

    bus.emit(Events.CHARACTER_READY, {
      source,
      animated: this._hasSkeletonAnim,
      clips: Object.keys(this.anim.actions),
      procedural: !this._hasSkeletonAnim,
      boneRig: boneReady,
    });
  }

  /** 模型无 clip 时根据骨骼自动生成跑/爬等动作 */
  _resolveAnimationClips(clips, boneReady) {
    if (!boneReady) return clips;

    const generated = ProceduralClipFactory.createClips(this.procedural.boneMap);
    if (!generated.length) return clips;

    if (!clips.length) {
      console.info(
        '[Character] 已生成程序化骨骼动画:',
        generated.map((c) => c.name).join(', ')
      );
      return generated;
    }

    const existing = new Set(clips.map((c) => c.name.toLowerCase()));
    const missing = generated.filter((g) => !existing.has(g.name.toLowerCase()));
    if (missing.length) {
      console.info('[Character] 补充缺失动画 clip:', missing.map((c) => c.name).join(', '));
    }
    return [...clips, ...missing];
  }

  _createPlaceholder() {
    this.model = createHumanoidPlaceholder();
    this._wrapWithMotionRoot();
    this._initAnimation([], 'placeholder');
  }

  /** Mixamo 模型默认朝 +X，需对齐 motion root 的前进方向 +Z */
  _applyModelForwardOffset() {
    const useMixamoOffset = this.procedural.boneMap.ready;
    this._modelForwardY = useMixamoOffset ? MIXAMO_FORWARD_Y : 0;
    this.procedural.setModelForwardY(this._modelForwardY);
    if (this.model) {
      this.model.rotation.y = this._modelForwardY;
      this._proneVisualY = this._measureProneVisualOffset();
    }
  }

  /** 匍匐旋转后 mesh 会低于 root，需上移 model 以免穿地 */
  _measureProneVisualOffset() {
    if (!this.model) return 0.22;

    const savedRot = this.model.rotation.clone();
    const savedPos = this.model.position.clone();

    this.model.rotation.set(0, this._modelForwardY, -Math.PI / 2);
    this.model.position.set(0, 0, 0);
    this.model.updateMatrixWorld(true);

    const minY = new THREE.Box3().setFromObject(this.model).min.y;
    const lift = Math.max(0, -minY + 0.02);

    this.model.rotation.copy(savedRot);
    this.model.position.copy(savedPos);

    return lift;
  }

  setControlMode(mode) {
    this.controlMode = mode;
  }

  reset(spawn) {
    const p = spawn || { x: 0, y: 0, z: 0 };
    const refY = p.y > 0 ? p.y : 0.5;

    if (this.collision.isWalkable(p.x, p.z, refY)) {
      const y = this.collision.getGroundHeightNear(p.x, p.z, refY) ?? refY;
      this.root.position.set(p.x, y, p.z);
    } else {
      const snapped = this.collision.snapToWalkable(p.x, p.z, refY);
      const y = snapped?.y ?? this.collision.getGroundHeightNear(p.x, p.z, refY) ?? p.y ?? 0;
      const x = snapped?.x ?? p.x;
      const z = snapped?.z ?? p.z;
      this.root.position.set(x, y, z);
    }

    this.waypoints = [];
    this.waypointIndex = 0;
    this._stuckTime = 0;
    this.procedural.reset(this.model);
    this._setAction('idle');
  }

  followRoute(route, auto = true) {
    this.waypoints = this.pathFinder.expandRoute(route.nodes);
    this.waypointIndex = 0;
    this._autoMove = auto;
    this.activeRoute = route;
    this._stuckTime = 0;

    if (this.waypoints.length < 2) {
      console.warn(`[Character] 路线 ${route.name} 路径点不足 (${this.waypoints.length})，请检查导航网格`);
    } else {
      console.info(
        `[Character] 路线 ${route.name}: ${this.waypoints.length} 个路径点 (与可视化路线一致)`
      );
    }
  }

  update(delta, inputState) {
    if (!this.model) return;

    if (this.controlMode === 'manual' && inputState) {
      this._updateManual(delta, inputState);
    } else {
      this._updateAI(delta);
    }

    this._updateGroundSnap();
    this._updateFacing(delta);
    this._updatePoseOffset(delta);
    this._updateMotion(delta);
    if (!this._usesPronePose(this.currentAction)) {
      this.anim?.update(delta);
    }
  }

  _updateAI(delta) {
    if (!this.waypoints.length) return;

    const target = this.waypoints[this.waypointIndex];
    const pos = this.root.position;
    const toTarget = target.clone().sub(pos);
    toTarget.y = 0;
    const dist = toTarget.length();

    const yDelta = Math.abs(pos.y - target.y);
    const reached = dist < 0.35 && yDelta < 0.3;

    if (reached) {
      this.waypointIndex = Math.min(this.waypointIndex + 1, this.waypoints.length - 1);
      const end = this.waypoints[this.waypoints.length - 1];
      const atEnd =
        Math.hypot(pos.x - end.x, pos.z - end.z) < 0.35 &&
        Math.abs(pos.y - end.y) < 0.15;
      if (atEnd) {
        this._setAction('idle');
        return;
      }
      return;
    }

    const moveDir = toTarget.normalize();
    const terrain = this.terrain.detect(pos, moveDir);
    const endPoint = this.waypoints[this.waypoints.length - 1];
    const distToEnd = Math.hypot(pos.x - endPoint.x, pos.z - endPoint.z);

    let action = this.actionSelector.resolveAIAction(terrain, dist, distToEnd);
    action = this.actionSelector.applyHysteresis(this.currentAction, action, delta);
    this._setAction(action);

    const spd = this.actionSelector.getSpeedMap()[action] ?? 2.5;
    if (spd > 0) {
      this._moveInDirection(moveDir, spd, delta);
    }

    if (this._stuckTime > 0.6) {
      if (this._tryRecoverFromStuck(moveDir)) {
        this._stuckTime = 0;
      } else if (this._stuckTime > 1.8) {
        this.waypointIndex = Math.min(this.waypointIndex + 1, this.waypoints.length - 1);
        this._stuckTime = 0;
        console.warn('[Character] 移动受阻，跳过当前路径点');
      }
    }
  }

  _updateManual(delta, input) {
    const move = new THREE.Vector3(input.moveX, 0, input.moveZ);
    if (move.lengthSq() > 0) {
      move.normalize();
      const terrain = this.terrain.detect(this.root.position, move);
      let action = this.actionSelector.resolveManualAction(input, terrain);
      action = this.actionSelector.applyHysteresis(this.currentAction, action, delta);
      this._setAction(action);

      const spd = this.actionSelector.getSpeedMap()[action] ?? 2.5;
      this._moveInDirection(move, spd, delta);
    } else {
      this._setAction('idle');
    }
  }

  _getCollisionProfile() {
    const physics = this.config.physics;
    if (this._lowPoseActions?.has(this.currentAction)) {
      return {
        radius: physics.crawlRadius ?? 0.28,
        height: physics.crawlHeight ?? 0.42,
      };
    }
    return {
      radius: physics.characterRadius ?? 0.35,
      height: physics.characterHeight ?? 1.75,
    };
  }

  _moveInDirection(dir, spd, delta) {
    const pos = this.root.position;
    const before = pos.clone();
    const next = pos.clone().add(dir.clone().multiplyScalar(spd * delta));
    const { radius, height } = this._getCollisionProfile();
    const corrected = this.collision.moveWithCollision(
      pos,
      next,
      radius,
      height
    );
    this.root.position.x = corrected.x;
    this.root.position.z = corrected.z;

    const moved = Math.hypot(corrected.x - before.x, corrected.z - before.z);
    if (moved < 0.001) {
      this._stuckTime = (this._stuckTime || 0) + delta;
    } else {
      this._stuckTime = 0;
    }
  }

  _tryRecoverFromStuck(moveDir) {
    const pos = this.root.position;
    const { radius, height } = this._getCollisionProfile();
    const refY = pos.y;

    const resolved = this.collision.resolvePenetration(
      pos.x,
      pos.z,
      refY,
      radius,
      height
    );
    if (resolved.moved) {
      this.root.position.x = resolved.x;
      this.root.position.z = resolved.z;
      return true;
    }

    const perpX = -moveDir.z;
    const perpZ = moveDir.x;
    for (const sign of [1, -1]) {
      const trial = pos.clone();
      trial.x += perpX * sign * 0.45;
      trial.z += perpZ * sign * 0.45;
      const corrected = this.collision.moveWithCollision(
        pos,
        trial,
        radius,
        height
      );
      if (Math.hypot(corrected.x - pos.x, corrected.z - pos.z) > 0.02) {
        this.root.position.x = corrected.x;
        this.root.position.z = corrected.z;
        return true;
      }
    }

    const snapped = this.collision.snapToWalkable(pos.x, pos.z, refY);
    if (
      snapped &&
      Math.hypot(snapped.x - pos.x, snapped.z - pos.z) > 0.05 &&
      Math.hypot(snapped.x - pos.x, snapped.z - pos.z) < 1.2
    ) {
      this.root.position.x = snapped.x;
      this.root.position.z = snapped.z;
      this.root.position.y = snapped.y;
      return true;
    }

    return false;
  }

  _setAction(name) {
    if (this.currentAction === name) return;

    const animName = this.actionSelector.getAnimationFallback(name);
    const fade = this.actionSelector.getCrossFadeDuration(this.currentAction, name);
    const isProne = name === 'crawl' || name === 'squeezeHole';
    const leavingLow =
      this._lowPoseActions?.has(this.currentAction) && !this._lowPoseActions.has(name);

    if (leavingLow) {
      this.procedural.boneMap.resetPose();
      this.procedural.resetModelOrientation(this.model);
    }

    if (isProne) {
      this.anim?.stopAll(fade);
    } else if (this._shouldUseProcedural(name)) {
      // 程序化动作不依赖 clip
    } else {
      const played = this.anim?.crossFadeTo(animName, fade);
      if (!played) {
        for (const fb of ['run', 'jog', 'walk', 'idle']) {
          if (this.anim?.crossFadeTo(fb, fade)) break;
        }
      }
      this._syncAnimTimeScale(name);
    }

    this.currentAction = name;
    bus.emit(Events.ACTION_CHANGED, { action: name, time: performance.now() });
  }

  _usesPronePose(action) {
    return action === 'crawl' || action === 'squeezeHole';
  }

  _shouldUseProcedural(action) {
    if (!this._hasSkeletonAnim) return true;
    const animName = this.actionSelector.getAnimationFallback(action);
    return !this.anim?.actions[animName];
  }

  _syncAnimTimeScale(action) {
    if (!this.anim) return;
    const speeds = this.actionSelector.getSpeedMap();
    const base = speeds.run || 4.5;
    const spd = speeds[action] ?? base;
    if (spd > 0 && ['walk', 'jog', 'run', 'crawl', 'crouch'].includes(action)) {
      const animName = this.actionSelector.getAnimationFallback(action);
      this.anim.setTimeScale(animName, spd / base);
    }
  }

  _updateMotion(delta) {
    if (this._usesPronePose(this.currentAction)) {
      this.procedural.advancePhase(this.currentAction, delta);
      this.procedural.applyBoneOnly(this.model, this.currentAction, delta);
      return;
    }

    if (this._shouldUseProcedural(this.currentAction)) {
      this.procedural.apply(this.model, this.currentAction, delta);
    } else if (this.currentAction === 'idle') {
      this.procedural.apply(this.model, 'idle', delta);
    }
  }

  _updateGroundSnap() {
    const pos = this.root.position;
    let refY = pos.y;

    if (this.waypoints.length && this.waypointIndex < this.waypoints.length) {
      const target = this.waypoints[this.waypointIndex];
      const xzDist = Math.hypot(target.x - pos.x, target.z - pos.z);
      refY = target.y;

      const end = this.waypoints[this.waypoints.length - 1];
      const finishing =
        this.waypointIndex >= this.waypoints.length - 1 &&
        Math.hypot(end.x - pos.x, end.z - pos.z) < 0.45;

      if (finishing && Math.abs(end.y - pos.y) > 0.08) {
        this.root.position.y = THREE.MathUtils.lerp(pos.y, end.y, 0.5);
        return;
      }

      if (xzDist < 0.6 && target.y > pos.y + 0.08) {
        this.root.position.y = THREE.MathUtils.lerp(pos.y, target.y, 0.45);
        return;
      }
    }

    const y =
      this.collision.getGroundHeightNear(pos.x, pos.z, refY) ??
      this.collision.getGroundHeight(pos.x, pos.z, refY + 0.5);
    if (y != null) {
      this.root.position.y = THREE.MathUtils.lerp(pos.y, y, 0.35);
    }
  }

  _updatePoseOffset(delta) {
    if (!this.model) return;

    const blend = 10 * delta;
    const isProne = this._usesPronePose(this.currentAction);
    const isLow = this._lowPoseActions?.has(this.currentAction);

    let targetRotX = 0;
    let targetRotY = this._modelForwardY;
    let targetRotZ = 0;
    let targetY = 0;

    if (isProne) {
      // 在 Mixamo 朝向前缀基础上再绕 Z 轴 90°：胸腹朝下，头脚沿前进方向
      targetRotZ = -Math.PI / 2;
      targetY =
        this._proneVisualY + Math.abs(Math.sin(this.procedural.phase)) * 0.012;
    } else if (isLow) {
      targetY = -0.42 + Math.abs(Math.sin(this.procedural.phase)) * 0.015;
    }

    this.model.rotation.x = THREE.MathUtils.lerp(this.model.rotation.x, targetRotX, blend);
    this.model.rotation.y = THREE.MathUtils.lerp(this.model.rotation.y, targetRotY, blend);
    this.model.rotation.z = THREE.MathUtils.lerp(this.model.rotation.z, targetRotZ, blend);
    this.model.position.y = THREE.MathUtils.lerp(this.model.position.y, targetY, blend);
  }

  _updateFacing(delta) {
    if (this.waypoints.length && this.waypointIndex < this.waypoints.length) {
      const target = this.waypoints[this.waypointIndex];
      const dir = target.clone().sub(this.root.position);
      dir.y = 0;
      if (dir.lengthSq() > 0.01) {
        const angle = Math.atan2(dir.x, dir.z);
        this.root.rotation.y = THREE.MathUtils.lerp(this.root.rotation.y, angle, 8 * delta);
      }
    }
  }

  getState() {
    return {
      position: this.root.position.clone(),
      rotation: this.root.rotation.y,
      action: this.currentAction,
      waypointIndex: this.waypointIndex,
    };
  }
}
