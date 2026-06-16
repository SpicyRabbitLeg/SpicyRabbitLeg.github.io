import * as THREE from 'three';

/**
 * AnimationMixer 统一管理 — 动作混合权重可控
 */
export class AnimationController {
  constructor(model, clips, animationMap) {
    this.mixer = clips.length ? new THREE.AnimationMixer(model) : null;
    this.actions = {};
    this.current = null;
    this._mapClips(clips, animationMap);
  }

  _mapClips(clips, animationMap) {
    if (!this.mixer) return;

    for (const [key, aliases] of Object.entries(animationMap)) {
      const clip = this._findClip(clips, aliases);
      if (clip) {
        this.actions[key] = this.mixer.clipAction(clip);
        this.actions[key].setEffectiveTimeScale(1);
      }
    }

    if (Object.keys(this.actions).length === 0 && clips.length) {
      clips.forEach((clip) => {
        const key = clip.name.replace(/\s/g, '_').toLowerCase();
        this.actions[key] = this.mixer.clipAction(clip);
      });
    }
  }

  _findClip(clips, aliases) {
    const normalized = aliases.map((a) => a.toLowerCase());

    const exact = clips.find((c) => normalized.includes(c.name.toLowerCase()));
    if (exact) return exact;

    return clips.find((c) => {
      const name = c.name.toLowerCase();
      return normalized.some((alias) => name === alias || name.includes(alias));
    });
  }

  play(name, fade = 0.2) {
    const action = this.actions[name];
    if (!action || !this.mixer) return false;

    if (this.current && this.current !== action) {
      this.current.fadeOut(fade);
    }
    action.reset().fadeIn(fade).play();
    this.current = action;
    return true;
  }

  crossFadeTo(name, duration = 0.3) {
    const next = this.actions[name];
    if (!next || !this.mixer) {
      return this.play(name, duration);
    }
    if (this.current === next) return true;

    next.reset().setEffectiveWeight(1).play();
    if (this.current) {
      this.current.crossFadeTo(next, duration, false);
    }
    this.current = next;
    return true;
  }

  stopAll(fade = 0.2) {
    if (!this.mixer) return;
    Object.values(this.actions).forEach((action) => action.fadeOut(fade));
    this.current = null;
  }

  update(delta) {
    this.mixer?.update(delta);
  }

  setTimeScale(name, scale) {
    this.actions[name]?.setEffectiveTimeScale(scale);
  }

  getAvailableActions() {
    return Object.keys(this.actions);
  }
}
