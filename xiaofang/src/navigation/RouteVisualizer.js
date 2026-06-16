import * as THREE from 'three';

/**
 * 逃生路线 3D 可视化 — 发光箭头 + 分段标记
 */
export class RouteVisualizer {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'RouteVisualizer';
    this.scene.add(this.group);
    this.routes = new Map();
  }

  build(routes) {
    this.group.clear();
    this.routes.clear();
    routes.forEach((route) => this.addRoute(route));
  }

  addRoute(route) {
    if (this.routes.has(route.id)) this.removeRoute(route.id);

    const g = new THREE.Group();
    g.name = `Route_${route.id}`;

    const color = this._tagColor(route.tag);
    const points = route.nodes.map((n) => new THREE.Vector3(n.x, n.y + 0.15, n.z));

    if (points.length >= 2) {
      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, points.length * 8, 0.08, 6, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.85,
      });
      g.add(new THREE.Mesh(tubeGeo, tubeMat));

      for (let i = 0; i < points.length - 1; i++) {
        const arrow = this._createArrow(points[i], points[i + 1], color);
        g.add(arrow);
      }
    }

    points.forEach((p, i) => {
      const marker = this._createMarker(p, i, color);
      g.add(marker);
    });

    this.group.add(g);
    this.routes.set(route.id, g);
  }

  removeRoute(routeId) {
    const g = this.routes.get(routeId);
    if (g) {
      this.group.remove(g);
      g.traverse((c) => {
        c.geometry?.dispose();
        c.material?.dispose();
      });
      this.routes.delete(routeId);
    }
  }

  _tagColor(tag) {
    const map = {
      simple: 0x00ff88,
      complex: 0xffaa00,
      narrow: 0xff4444,
    };
    return map[tag] || 0x00ccff;
  }

  _createArrow(from, to, color) {
    const dir = to.clone().sub(from).normalize();
    const mid = from.clone().add(to).multiplyScalar(0.5);
    mid.y += 0.2;

    const geo = new THREE.ConeGeometry(0.15, 0.4, 4);
    const mat = new THREE.MeshBasicMaterial({ color });
    const cone = new THREE.Mesh(geo, mat);
    cone.position.copy(mid);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    cone.rotateX(Math.PI / 2);
    return cone;
  }

  _createMarker(pos, index, color) {
    const geo = new THREE.SphereGeometry(0.12, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.position.y += 0.25;
    mesh.userData.nodeIndex = index;
    return mesh;
  }

  highlight(routeId) {
    this.routes.forEach((g, id) => {
      g.visible = true;
      g.traverse((c) => {
        if (c.material) {
          c.material.opacity = id === routeId ? 1 : 0.25;
        }
      });
    });
  }

  setVisible(visible) {
    this.group.visible = visible;
  }
}
