import * as THREE from 'three';
import { HumanoidBoneMap } from './HumanoidBoneMap.js';
import { applyOffsetsToBones, computeLocomotionOffsets } from './LocomotionPoses.js';

/** Mixamo 导出朝 +X；motion root 前进为 +Z */
export const MIXAMO_FORWARD_Y = -Math.PI / 2;

/**
 * 程序化动作 — 躯干起伏 + 骨骼步态（跑/走/爬）
 */
export class ProceduralMotion {
  constructor() {
    this.phase = 0;
    this._baseScale = new THREE.Vector3(1, 1, 1);
    this.boneMap = new HumanoidBoneMap();
    this._useBonePose = false;
    this._poseBlend = 12;
    /** @type {number} 模型相对 motion root 的常驻 Y 偏转（占位符为 0） */
    this.modelForwardY = 0;
  }

  setModelForwardY(radians) {
    this.modelForwardY = radians;
  }

  bindSkeleton(model) {
    const ready = this.boneMap.bind(model);
    this._useBonePose = ready;
    return ready;
  }

  captureBase(model) {
    this._baseScale.copy(model.scale);
    this.bindSkeleton(model);
  }

  advancePhase(action, delta) {
    const phaseSpeed = {
      run: 18,
      jog: 13,
      walk: 9,
      crouch: 8,
      crawl: 7,
      crouchHole: 6,
      squeezeHole: 6,
      stairUp: 10,
    }[action] ?? 10;
    this.phase += delta * phaseSpeed;
  }

  applyBoneOnly(model, action, delta) {
    const offsets = computeLocomotionOffsets(action, this.phase);
    applyOffsetsToBones(this.boneMap, offsets, this._poseBlend * delta);
  }

  resetModelOrientation(model) {
    model.rotation.set(0, this.modelForwardY, 0);
    model.position.y = 0;
  }

  reset(model) {
    this.phase = 0;
    model.position.set(0, 0, 0);
    this.resetModelOrientation(model);
    model.scale.copy(this._baseScale);
    this.boneMap.resetPose();
  }

  apply(model, action, delta) {
    const moving = [
      'run',
      'jog',
      'walk',
      'crawl',
      'crouch',
      'crouchHole',
      'squeezeHole',
      'stairUp',
    ].includes(action);

    if (!moving && action === 'idle') {
      this._applyIdle(model, delta);
      return;
    }

    const phaseSpeed = {
      run: 18,
      jog: 13,
      walk: 9,
      crouch: 8,
      crawl: 7,
      crouchHole: 6,
      squeezeHole: 6,
      stairUp: 10,
    }[action] ?? 10;

    this.phase += delta * phaseSpeed;

    if (this._useBonePose) {
      this._applyBoneLocomotion(action, delta);
      this._applyRootMotion(model, action, delta, moving);
      return;
    }

    this._applyLegacyRootMotion(model, action, delta);
  }

  _applyIdle(model, delta) {
    model.rotation.x = THREE.MathUtils.lerp(model.rotation.x, 0, 10 * delta);
    model.rotation.y = THREE.MathUtils.lerp(model.rotation.y, this.modelForwardY, 10 * delta);
    model.rotation.z = THREE.MathUtils.lerp(model.rotation.z, 0, 10 * delta);
    model.scale.y = THREE.MathUtils.lerp(model.scale.y, this._baseScale.y, 10 * delta);
    model.position.y = THREE.MathUtils.lerp(model.position.y, 0, 10 * delta);
    applyOffsetsToBones(this.boneMap, new Map(), 10 * delta);
  }

  _applyBoneLocomotion(action, delta) {
    const offsets = computeLocomotionOffsets(action, this.phase);
    applyOffsetsToBones(this.boneMap, offsets, this._poseBlend * delta);
  }

  /** 有骨骼时仅保留轻微整体位移，避免与骨骼动画冲突 */
  _applyRootMotion(model, action, delta, moving) {
    if (!moving) return;

    let bobY = 0;
    let rotX = 0;
    let swayZ = 0;
    const skipVertical =
      this._useBonePose &&
      ['crawl', 'crouch', 'crouchHole', 'squeezeHole'].includes(action);

    switch (action) {
      case 'run':
        bobY = Math.abs(Math.sin(this.phase)) * 0.06;
        swayZ = Math.sin(this.phase * 0.5) * 0.03;
        break;
      case 'jog':
        bobY = Math.abs(Math.sin(this.phase)) * 0.04;
        swayZ = Math.sin(this.phase * 0.5) * 0.02;
        break;
      case 'walk':
        bobY = Math.abs(Math.sin(this.phase)) * 0.025;
        break;
      case 'crawl':
        rotX = 0;
        swayZ = Math.sin(this.phase) * 0.02;
        break;
      case 'crouchHole':
        rotX = 0.12;
        bobY = Math.abs(Math.sin(this.phase)) * 0.015;
        break;
      case 'squeezeHole':
        rotX = 0.28;
        bobY = Math.abs(Math.sin(this.phase)) * 0.015;
        break;
      case 'crouch':
        bobY = Math.abs(Math.sin(this.phase)) * 0.02;
        break;
      case 'stairUp':
        bobY = Math.abs(Math.sin(this.phase)) * 0.04;
        break;
      default:
        break;
    }

    if (!skipVertical) {
      model.position.y = THREE.MathUtils.lerp(model.position.y, bobY, 12 * delta);
    }
    model.rotation.x = THREE.MathUtils.lerp(model.rotation.x, rotX, 10 * delta);
    model.rotation.z = THREE.MathUtils.lerp(model.rotation.z, swayZ, 10 * delta);
    model.scale.y = THREE.MathUtils.lerp(model.scale.y, this._baseScale.y, 10 * delta);
  }

  /** 无骨骼时的旧版整体缩放/倾斜 */
  _applyLegacyRootMotion(model, action, delta) {
    let bobY = 0;
    let rotX = 0;
    let swayZ = 0;
    let scaleY = this._baseScale.y;

    switch (action) {
      case 'run':
        bobY = Math.abs(Math.sin(this.phase)) * 0.14;
        swayZ = Math.sin(this.phase * 0.5) * 0.08;
        scaleY = this._baseScale.y * 1.03;
        break;
      case 'jog':
        bobY = Math.abs(Math.sin(this.phase)) * 0.09;
        swayZ = Math.sin(this.phase * 0.5) * 0.05;
        break;
      case 'walk':
        bobY = Math.abs(Math.sin(this.phase)) * 0.05;
        break;
      case 'crouch':
        scaleY = this._baseScale.y * 0.72;
        rotX = 0.45;
        bobY = Math.abs(Math.sin(this.phase)) * 0.03;
        break;
      case 'crawl':
        scaleY = this._baseScale.y * 0.55;
        rotX = -0.55;
        bobY = -0.05 + Math.abs(Math.sin(this.phase)) * 0.02;
        swayZ = Math.sin(this.phase) * 0.03;
        break;
      case 'crouchHole':
      case 'squeezeHole':
        scaleY = this._baseScale.y * 0.48;
        rotX = 0.65;
        bobY = Math.abs(Math.sin(this.phase)) * 0.025;
        swayZ = Math.sin(this.phase) * 0.04;
        break;
      case 'stairUp':
        bobY = Math.abs(Math.sin(this.phase)) * 0.06;
        rotX = -0.08;
        break;
      default:
        break;
    }

    model.position.y = THREE.MathUtils.lerp(model.position.y, bobY, 12 * delta);
    model.rotation.x = THREE.MathUtils.lerp(model.rotation.x, rotX, 10 * delta);
    model.rotation.z = THREE.MathUtils.lerp(model.rotation.z, swayZ, 10 * delta);
    model.scale.y = THREE.MathUtils.lerp(model.scale.y, scaleY, 10 * delta);
  }
}
