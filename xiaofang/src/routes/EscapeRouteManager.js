/**
 * 逃生路线管理 — 增删改查 + 考核标签
 */
export class EscapeRouteManager {
  constructor(initialRoutes = []) {
    this.routes = new Map(initialRoutes.map((r) => [r.id, { ...r }]));
    this.activeId = null;
  }

  getAll() {
    return Array.from(this.routes.values());
  }

  getActive() {
    return this.activeId ? this.routes.get(this.activeId) : null;
  }

  setActive(id) {
    if (this.routes.has(id)) this.activeId = id;
  }

  addRoute(route) {
    this.routes.set(route.id, { ...route });
  }

  updateRoute(id, patch) {
    const r = this.routes.get(id);
    if (r) Object.assign(r, patch);
  }

  removeRoute(id) {
    this.routes.delete(id);
    if (this.activeId === id) this.activeId = null;
  }

  /** 计算当前位置到路线的最近距离 */
  distanceToRoute(position, route) {
    if (!route?.nodes?.length) return Infinity;
    let min = Infinity;
    for (let i = 0; i < route.nodes.length - 1; i++) {
      const a = route.nodes[i];
      const b = route.nodes[i + 1];
      const d = this._pointToSegmentDistance(position, a, b);
      if (d < min) min = d;
    }
    return min;
  }

  _pointToSegmentDistance(p, a, b) {
    const px = p.x ?? p.x;
    const pz = p.z ?? p.z;
    const ax = a.x;
    const az = a.z;
    const bx = b.x;
    const bz = b.z;
    const dx = bx - ax;
    const dz = bz - az;
    const lenSq = dx * dx + dz * dz;
    if (lenSq < 1e-6) return Math.hypot(px - ax, pz - az);
    let t = ((px - ax) * dx + (pz - az) * dz) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + t * dx;
    const cz = az + t * dz;
    return Math.hypot(px - cx, pz - cz);
  }

  getCurrentSegmentIndex(position, route) {
    let bestIdx = 0;
    let bestDist = Infinity;
    route.nodes.forEach((node, i) => {
      const d = Math.hypot(position.x - node.x, position.z - node.z);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    return bestIdx;
  }
}
