import * as THREE from 'three';

/** 语义骨骼角色 — 用于程序化步态 */
export const BoneRole = {
  HIPS: 'hips',
  SPINE: 'spine',
  CHEST: 'chest',
  LEFT_UP_LEG: 'leftUpLeg',
  LEFT_LEG: 'leftLeg',
  RIGHT_UP_LEG: 'rightUpLeg',
  RIGHT_LEG: 'rightLeg',
  LEFT_ARM: 'leftArm',
  LEFT_FORE_ARM: 'leftForeArm',
  RIGHT_ARM: 'rightArm',
  RIGHT_FORE_ARM: 'rightForeArm',
};

const ROLE_PATTERNS = {
  [BoneRole.HIPS]: ['mixamorighips', 'hips', 'pelvis', 'root', 'hip'],
  [BoneRole.SPINE]: ['mixamorigspine', 'spine', 'spine1', 'abdomen', 'torso'],
  [BoneRole.CHEST]: ['mixamorigspine2', 'mixamorigspine1', 'chest', 'spine2', 'spine3', 'upperchest'],
  [BoneRole.LEFT_UP_LEG]: ['mixamorigleftupleg', 'leftupleg', 'left_upleg', 'l_thigh', 'leftthigh'],
  [BoneRole.LEFT_LEG]: ['mixamorigleftleg', 'leftleg', 'left_leg', 'l_calf', 'leftshin', 'leftknee'],
  [BoneRole.RIGHT_UP_LEG]: ['mixamorigrightupleg', 'rightupleg', 'right_upleg', 'r_thigh', 'rightthigh'],
  [BoneRole.RIGHT_LEG]: ['mixamorigrightleg', 'rightleg', 'right_leg', 'r_calf', 'rightshin', 'rightknee'],
  [BoneRole.LEFT_ARM]: ['mixamorigleftarm', 'leftarm', 'l_upperarm'],
  [BoneRole.LEFT_FORE_ARM]: ['mixamorigleftforearm', 'leftforearm', 'l_forearm', 'leftelbow'],
  [BoneRole.RIGHT_ARM]: ['mixamorigrightarm', 'rightarm', 'r_upperarm'],
  [BoneRole.RIGHT_FORE_ARM]: ['mixamorigrightforearm', 'rightforearm', 'r_forearm', 'rightelbow'],
};

function normalizeName(name = '') {
  return name.toLowerCase().replace(/[\s:_-]/g, '');
}

function matchesRole(name, patterns) {
  const n = normalizeName(name);
  return patterns.some((p) => {
    const key = normalizeName(p);
    return n === key || n.endsWith(key) || n.includes(key);
  });
}

/**
 * 从 SkinnedMesh 骨骼或命名层级中解析人体语义骨骼
 */
export class HumanoidBoneMap {
  constructor() {
    /** @type {Map<string, THREE.Object3D>} */
    this.bones = new Map();
    this.skeleton = null;
    this.ready = false;
  }

  bind(model) {
    this.bones.clear();
    this.skeleton = null;
    this.ready = false;

    model.traverse((obj) => {
      if (obj.isSkinnedMesh && obj.skeleton) {
        this.skeleton = obj.skeleton;
      }
    });

    const candidates = this.skeleton?.bones?.length
      ? this.skeleton.bones
      : this._collectNamedNodes(model);

    for (const [role, patterns] of Object.entries(ROLE_PATTERNS)) {
      let best = null;
      let bestScore = 0;
      for (const bone of candidates) {
        const n = normalizeName(bone.name);
        for (const p of patterns) {
          const key = normalizeName(p);
          let score = 0;
          if (n === key) score = 100;
          else if (n.endsWith(key)) score = 80;
          else if (n.includes(key)) score = 60;
          if (score > bestScore) {
            bestScore = score;
            best = bone;
          }
        }
      }
      if (best) this.bones.set(role, best);
    }

    this._captureRestPose();
    this.ready = this.bones.has(BoneRole.HIPS) && this._hasLegPair();
    return this.ready;
  }

  _collectNamedNodes(root) {
    const nodes = [];
    root.traverse((obj) => {
      if (obj !== root && obj.name) nodes.push(obj);
    });
    return nodes;
  }

  _hasLegPair() {
    return (
      this.bones.has(BoneRole.LEFT_UP_LEG) &&
      this.bones.has(BoneRole.RIGHT_UP_LEG) &&
      this.bones.has(BoneRole.LEFT_LEG) &&
      this.bones.has(BoneRole.RIGHT_LEG)
    );
  }

  _captureRestPose() {
    for (const bone of this.bones.values()) {
      if (!bone.userData.restQuaternion) {
        bone.userData.restQuaternion = bone.quaternion.clone();
      } else {
        bone.userData.restQuaternion.copy(bone.quaternion);
      }
    }
  }

  resetPose() {
    for (const bone of this.bones.values()) {
      if (bone.userData.restQuaternion) {
        bone.quaternion.copy(bone.userData.restQuaternion);
      }
    }
  }

  get(role) {
    return this.bones.get(role) || null;
  }

  getRoles() {
    return [...this.bones.keys()];
  }
}
