import * as THREE from 'three';
import { computeLocomotionOffsets } from './LocomotionPoses.js';

const PROCEDURAL_ACTIONS = [
  'idle',
  'walk',
  'jog',
  'run',
  'crawl',
  'crouch',
  'crouchHole',
  'squeezeHole',
  'stairUp',
];

const CLIP_DURATION = {
  idle: 2,
  walk: 1.2,
  jog: 0.85,
  run: 0.62,
  crawl: 1.4,
  crouch: 1.1,
  crouchHole: 1.4,
  squeezeHole: 1.5,
  stairUp: 1.2,
};

const SAMPLE_COUNT = 24;

/**
 * 为无动画 clip 的骨骼模型生成程序化 AnimationClip
 */
export class ProceduralClipFactory {
  /**
   * @param {import('./HumanoidBoneMap.js').HumanoidBoneMap} boneMap
   * @returns {THREE.AnimationClip[]}
   */
  static createClips(boneMap) {
    if (!boneMap?.ready) return [];

    const clips = [];
    for (const action of PROCEDURAL_ACTIONS) {
      const clip = this._createClip(action, boneMap);
      if (clip) clips.push(clip);
    }
    return clips;
  }

  static _createClip(action, boneMap) {
    const duration = CLIP_DURATION[action] ?? 1;
    const tracks = [];

    for (const [role, bone] of boneMap.bones) {
      const times = [];
      const values = [];
      const rest = bone.userData.restQuaternion;

      for (let i = 0; i <= SAMPLE_COUNT; i++) {
        const t = (i / SAMPLE_COUNT) * duration;
        const phase = action === 'idle' ? 0 : (i / SAMPLE_COUNT) * Math.PI * 2;

        times.push(t);

        if (action === 'idle') {
          values.push(rest.x, rest.y, rest.z, rest.w);
          continue;
        }

        const offsets = computeLocomotionOffsets(action, phase);
        const off = offsets.get(role);
        const q = rest.clone();

        if (off) {
          const euler = new THREE.Euler(off.x, off.y, off.z, 'XYZ');
          const offsetQ = new THREE.Quaternion().setFromEuler(euler);
          q.multiply(offsetQ);
        }

        values.push(q.x, q.y, q.z, q.w);
      }

      const trackName = `${bone.name}.quaternion`;
      tracks.push(new THREE.QuaternionKeyframeTrack(trackName, times, values));
    }

    const clipName = action.charAt(0).toUpperCase() + action.slice(1);
    return new THREE.AnimationClip(clipName, duration, tracks);
  }
}

export { PROCEDURAL_ACTIONS, CLIP_DURATION };
