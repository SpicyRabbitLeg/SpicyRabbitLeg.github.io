import * as THREE from 'three';

/**
 * 环境光 + 应急逃生红光 + 地面路径标线
 */
export class EnvironmentSetup {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.pathMarkers = new THREE.Group();
    this.pathMarkers.name = 'PathMarkers';
  }

  setup(bounds) {
    const ambient = new THREE.AmbientLight(0xffffff, this.config.ambientIntensity);
    this.scene.add(ambient);

    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(10, 15, 5);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 50;
    dir.shadow.camera.left = -15;
    dir.shadow.camera.right = 15;
    dir.shadow.camera.top = 15;
    dir.shadow.camera.bottom = -15;
    this.scene.add(dir);

    const emergency = new THREE.PointLight(
      this.config.emergencyLightColor,
      this.config.emergencyLightIntensity,
      30
    );
    emergency.position.set(
      bounds.max.x * 0.8,
      bounds.max.y * 0.8,
      bounds.getCenter(new THREE.Vector3()).z
    );
    this.scene.add(emergency);

    const exitGlow = new THREE.PointLight(0x00ff66, 1.5, 8);
    exitGlow.position.set(bounds.max.x - 1, 2, bounds.getCenter(new THREE.Vector3()).z);
    this.scene.add(exitGlow);

    this._createPathStripes(bounds);
    this.scene.add(this.pathMarkers);
  }

  _createPathStripes(bounds) {
    const mat = new THREE.MeshBasicMaterial({
      color: this.config.pathLineColor,
      transparent: true,
      opacity: 0.6,
    });
    const stripeLen = 0.8;
    const gap = 0.4;
    const y = bounds.min.y + 0.03;

    for (let x = bounds.min.x + 1; x < bounds.max.x - 1; x += stripeLen + gap) {
      const geo = new THREE.PlaneGeometry(stripeLen, 0.3);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, y, bounds.getCenter(new THREE.Vector3()).z);
      this.pathMarkers.add(mesh);
    }
  }
}
