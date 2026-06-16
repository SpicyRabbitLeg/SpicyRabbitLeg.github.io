import * as THREE from 'three';
import { BoneRole } from './HumanoidBoneMap.js';

const _euler = new THREE.Euler();
const _offset = new THREE.Quaternion();

/**
 * 人体工学步态参数 — 角度单位：弧度
 * 参考：步行髋屈伸 ~30°，跑步 ~45-55°，膝关节摆动期峰值 ~110-130°
 */
const GAIT = {
  walk: {
    hipSwing: 0.32,
    hipSpread: 0.04,
    kneeLift: 0.55,
    kneeStance: 0.08,
    armSwing: 0.28,
    elbowBend: 0.45,
    trunkLean: 0.04,
    trunkBob: 0.03,
  },
  jog: {
    hipSwing: 0.48,
    hipSpread: 0.07,
    kneeLift: 0.95,
    kneeStance: 0.12,
    armSwing: 0.42,
    elbowBend: 0.65,
    trunkLean: 0.08,
    trunkBob: 0.06,
  },
  run: {
    hipSwing: 0.72,
    hipSpread: 0.14,
    kneeLift: 1.35,
    kneeStance: 0.15,
    armSwing: 0.58,
    elbowBend: 0.85,
    trunkLean: 0.12,
    trunkBob: 0.09,
  },
  crawl: {
    hipFlex: 0.42,
    kneeFlex: 0.85,
    armReach: 0.48,
    elbowBend: 0.95,
  },
  crouch: {
    trunkPitch: 0.55,
    hipSpread: 0.12,
    kneeFlex: 1.05,
    armSwing: 0.18,
    elbowBend: 0.55,
  },
};

function legPhase(phase, side) {
  return side === 'left' ? phase : phase + Math.PI;
}

function swingEnvelope(t) {
  return Math.max(0, Math.sin(t));
}

function stanceFlex(t, stanceFlex) {
  const c = Math.cos(t);
  return stanceFlex * Math.max(0, c);
}

/**
 * 计算单帧骨骼局部旋转偏移（相对 rest pose）
 * @returns {Map<string, { x: number, y: number, z: number }>}
 */
export function computeLocomotionOffsets(action, phase) {
  const offsets = new Map();

  switch (action) {
    case 'walk':
    case 'jog':
    case 'run':
    case 'stairUp':
      applyBipedGait(offsets, GAIT[action === 'stairUp' ? 'walk' : action] || GAIT.jog, phase);
      break;
    case 'crawl':
      applyQuadrupedCrawl(offsets, GAIT.crawl, phase, action);
      break;
    case 'crouchHole':
      applyCrouchHole(offsets, GAIT.crouch, phase);
      break;
    case 'squeezeHole':
      applyQuadrupedCrawl(offsets, GAIT.crawl, phase, action);
      break;
    case 'crouch':
      applyCrouchWalk(offsets, GAIT.crouch, phase);
      break;
    default:
      break;
  }

  return offsets;
}

function applyBipedGait(offsets, params, phase) {
  const { hipSwing, hipSpread, kneeLift, kneeStance, armSwing, elbowBend, trunkLean } = params;

  for (const side of ['left', 'right']) {
    const p = legPhase(phase, side);
    const isLeft = side === 'left';
    const sign = isLeft ? 1 : -1;

    const hipX = Math.sin(p) * hipSwing;
    const hipZ = sign * Math.abs(Math.sin(p)) * hipSpread;
    const kneeX = stanceFlex(p, kneeStance) + swingEnvelope(p + Math.PI * 0.5) * kneeLift;

    setOffset(offsets, isLeft ? BoneRole.LEFT_UP_LEG : BoneRole.RIGHT_UP_LEG, hipX, 0, hipZ);
    setOffset(offsets, isLeft ? BoneRole.LEFT_LEG : BoneRole.RIGHT_LEG, kneeX, 0, 0);

    const armP = p + Math.PI;
    const armX = Math.sin(armP) * armSwing;
    const elbowX = elbowBend + swingEnvelope(armP) * 0.25;

    setOffset(offsets, isLeft ? BoneRole.LEFT_ARM : BoneRole.RIGHT_ARM, armX, 0, 0);
    setOffset(offsets, isLeft ? BoneRole.LEFT_FORE_ARM : BoneRole.RIGHT_FORE_ARM, elbowX, 0, 0);
  }

  setOffset(offsets, BoneRole.SPINE, trunkLean, 0, 0);
  setOffset(offsets, BoneRole.CHEST, trunkLean * 0.35, 0, 0);
  setOffset(offsets, BoneRole.HIPS, trunkLean * 0.2, 0, Math.sin(phase * 0.5) * (params.trunkBob || 0));
}

function applyQuadrupedCrawl(offsets, params, phase, action) {
  const { hipFlex, kneeFlex, armReach, elbowBend } = params;
  const squeeze = action === 'squeezeHole' ? 0.55 : 1;

  // 躯干朝向由 model.rotation.x 控制；此处仅驱动四肢交替
  for (const side of ['left', 'right']) {
    const p = legPhase(phase, side);
    const isLeft = side === 'left';
    const drive = Math.max(0, Math.sin(p));

    const hipX = drive * hipFlex * squeeze;
    const kneeX = kneeFlex * (0.45 + drive * 0.35) * squeeze;

    setOffset(offsets, isLeft ? BoneRole.LEFT_UP_LEG : BoneRole.RIGHT_UP_LEG, hipX, 0, 0);
    setOffset(offsets, isLeft ? BoneRole.LEFT_LEG : BoneRole.RIGHT_LEG, kneeX, 0, 0);

    const armP = p + Math.PI;
    const reach = Math.max(0, Math.sin(armP)) * armReach * squeeze;
    setOffset(offsets, isLeft ? BoneRole.LEFT_ARM : BoneRole.RIGHT_ARM, reach, 0, 0);
    setOffset(offsets, isLeft ? BoneRole.LEFT_FORE_ARM : BoneRole.RIGHT_FORE_ARM, elbowBend, 0, 0);
  }
}

function applyCrouchHole(offsets, params, phase) {
  const { trunkPitch, hipSpread, kneeFlex, armSwing, elbowBend } = params;

  setOffset(offsets, BoneRole.HIPS, trunkPitch * 0.85, 0, 0);
  setOffset(offsets, BoneRole.SPINE, trunkPitch * 0.35, 0, 0);

  for (const side of ['left', 'right']) {
    const p = legPhase(phase, side);
    const isLeft = side === 'left';
    const sign = isLeft ? 1 : -1;
    const hipX = Math.sin(p) * 0.28;
    const kneeX = kneeFlex * 0.75 + swingEnvelope(p + Math.PI * 0.5) * 0.2;

    setOffset(offsets, isLeft ? BoneRole.LEFT_UP_LEG : BoneRole.RIGHT_UP_LEG, hipX, 0, sign * hipSpread * 0.5);
    setOffset(offsets, isLeft ? BoneRole.LEFT_LEG : BoneRole.RIGHT_LEG, kneeX, 0, 0);

    const armP = p + Math.PI;
    setOffset(offsets, isLeft ? BoneRole.LEFT_ARM : BoneRole.RIGHT_ARM, Math.sin(armP) * armSwing * 0.6, 0, 0);
    setOffset(offsets, isLeft ? BoneRole.LEFT_FORE_ARM : BoneRole.RIGHT_FORE_ARM, elbowBend * 0.8, 0, 0);
  }
}

function applyCrouchWalk(offsets, params, phase) {
  const { trunkPitch, hipSpread, kneeFlex, armSwing, elbowBend } = params;

  setOffset(offsets, BoneRole.HIPS, trunkPitch, 0, 0);
  setOffset(offsets, BoneRole.SPINE, trunkPitch * 0.4, 0, 0);

  for (const side of ['left', 'right']) {
    const p = legPhase(phase, side);
    const isLeft = side === 'left';
    const sign = isLeft ? 1 : -1;

    const hipX = Math.sin(p) * 0.35;
    const kneeX = kneeFlex + swingEnvelope(p + Math.PI * 0.5) * 0.25;

    setOffset(offsets, isLeft ? BoneRole.LEFT_UP_LEG : BoneRole.RIGHT_UP_LEG, hipX, 0, sign * hipSpread);
    setOffset(offsets, isLeft ? BoneRole.LEFT_LEG : BoneRole.RIGHT_LEG, kneeX, 0, 0);

    const armP = p + Math.PI;
    setOffset(offsets, isLeft ? BoneRole.LEFT_ARM : BoneRole.RIGHT_ARM, Math.sin(armP) * armSwing, 0, 0);
    setOffset(offsets, isLeft ? BoneRole.LEFT_FORE_ARM : BoneRole.RIGHT_FORE_ARM, elbowBend, 0, 0);
  }
}

function setOffset(offsets, role, x, y, z) {
  offsets.set(role, { x, y, z });
}

const _applyQ = new THREE.Quaternion();

/**
 * 将偏移应用到骨骼（基于 rest pose）
 */
export function applyOffsetsToBones(boneMap, offsets, lerpFactor = 1) {
  if (!boneMap?.ready) return;

  for (const [role, bone] of boneMap.bones) {
    const rest = bone.userData.restQuaternion;
    if (!rest) continue;

    const off = offsets.get(role);
    if (!off) {
      if (lerpFactor >= 1) {
        bone.quaternion.copy(rest);
      } else {
        bone.quaternion.slerp(rest, lerpFactor);
      }
      continue;
    }

    _euler.set(off.x, off.y, off.z, 'XYZ');
    _offset.setFromEuler(_euler);
    _applyQ.copy(rest).multiply(_offset);

    if (lerpFactor >= 1) {
      bone.quaternion.copy(_applyQ);
    } else {
      bone.quaternion.slerp(_applyQ, lerpFactor);
    }
  }
}

export { GAIT };
