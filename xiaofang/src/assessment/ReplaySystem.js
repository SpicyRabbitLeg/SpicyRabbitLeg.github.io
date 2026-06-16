import * as THREE from 'three';
import { bus, Events } from '../core/EventBus.js';

/**
 * 仿真回放 — 轨迹 + 动作时序录制与倍速回放
 */
export class ReplaySystem {
  constructor(scene) {
    this.scene = scene;
    this.frames = [];
    this.playing = false;
    this.speed = 1;
    this.index = 0;
    this.ghost = null;
  }

  recordFrame(state, delta) {
    if (!state) return;
    this.frames.push({
      t: this.frames.length * delta,
      position: state.position.toArray(),
      rotation: state.rotation,
      action: state.action,
    });
  }

  loadFrames(frames) {
    this.frames = frames || [];
    this.index = 0;
  }

  clear() {
    this.frames = [];
    this.index = 0;
    this.playing = false;
    this._removeGhost();
  }

  control({ action, speed }) {
    if (action === 'play') {
      this.playing = true;
      this.speed = speed || 1;
      bus.emit(Events.REPLAY_STATE, { playing: true });
    } else if (action === 'pause') {
      this.playing = false;
      bus.emit(Events.REPLAY_STATE, { playing: false });
    } else if (action === 'seek') {
      this.index = Math.floor(speed * this.frames.length);
    }
  }

  update(delta, onApply) {
    if (!this.playing || !this.frames.length) return;

    this.index += delta * 30 * this.speed;
    const idx = Math.min(Math.floor(this.index), this.frames.length - 1);
    const frame = this.frames[idx];
    onApply?.(frame);
  }

  _removeGhost() {
    if (this.ghost) {
      this.scene.remove(this.ghost);
      this.ghost = null;
    }
  }
}
