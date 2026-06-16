import * as THREE from 'three';

/**
 * 半透明烟雾粒子 — 低配节流
 */
export class SmokeParticles {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.maxCount = config.smokeParticleCount;
    this.group = new THREE.Group();
    this.group.name = 'SmokeParticles';
    this._particles = [];
    this._accumulator = 0;
  }

  init(smokeZones = []) {
    const count = Math.min(this.maxCount, 400);
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x888888,
      size: 0.35,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geo, mat);
    this.group.add(this.points);
    this.scene.add(this.group);

    this._zones = smokeZones.length
      ? smokeZones
      : [new THREE.Box3(new THREE.Vector3(2, 0, -3), new THREE.Vector3(6, 2, -1))];

    for (let i = 0; i < count; i++) {
      this._particles.push(this._spawn(i));
    }
    this._syncBuffer();
  }

  _spawn(i) {
    const zone = this._zones[i % this._zones.length];
    const center = zone.getCenter(new THREE.Vector3());
    const size = zone.getSize(new THREE.Vector3());
    return {
      index: i,
      x: center.x + (Math.random() - 0.5) * size.x,
      y: center.y + Math.random() * size.y,
      z: center.z + (Math.random() - 0.5) * size.z,
      vy: 0.2 + Math.random() * 0.3,
      life: Math.random(),
    };
  }

  _syncBuffer() {
    const arr = this.points.geometry.attributes.position.array;
    this._particles.forEach((p) => {
      arr[p.index * 3] = p.x;
      arr[p.index * 3 + 1] = p.y;
      arr[p.index * 3 + 2] = p.z;
    });
    this.points.geometry.attributes.position.needsUpdate = true;
  }

  update(delta) {
    this._accumulator += delta;
    if (this._accumulator < 1 / 30) return;
    this._accumulator = 0;

    const zone = this._zones[0];
    const center = zone.getCenter(new THREE.Vector3());
    const size = zone.getSize(new THREE.Vector3());

    this._particles.forEach((p) => {
      p.y += p.vy * delta;
      p.life += delta;
      if (p.life > 3 || p.y > center.y + size.y) {
        Object.assign(p, this._spawn(p.index));
        p.life = 0;
      }
    });
    this._syncBuffer();
  }
}
