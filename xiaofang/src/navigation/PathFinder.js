import * as THREE from 'three';

/**
 * 基于地面网格 + A* 的室内寻路（支持多层 floor）
 */
export class PathFinder {
  constructor(config = {}) {
    this.nodes = [];
    this.edges = new Map();
    this.gridSize = config.cellSize || 0.5;
    this.maxFloorDelta = config.maxFloorDelta ?? 0.45;
  }

  buildNavGraph(spatialData, collision) {
    this.collision = collision;
    this.bounds = spatialData.bounds;
    this._buildGridNodes(spatialData);
    this._connectNodes();
    console.info(`[PathFinder] 导航网格: ${this.nodes.length} 节点, 间距 ${this.gridSize}m`);
  }

  _buildGridNodes(spatialData) {
    this.nodes = [];
    const surfaces = [
      ...(spatialData.navZones || []),
      ...(spatialData.grounds || []),
      ...(spatialData.stairs || []),
    ];

    if (surfaces.length) {
      for (const surf of surfaces) {
        this._sampleSurfaceGrid(surf);
      }
    } else {
      this._sampleBoundsGrid(spatialData.bounds);
    }

    spatialData.exits?.forEach((exit, i) => {
      const snapped = this.collision.snapToWalkable(exit.center.x, exit.center.z, exit.center.y);
      if (!snapped) return;
      this.nodes.push({
        id: `exit_${i}_${snapped.y.toFixed(2)}`,
        x: snapped.x,
        y: snapped.y,
        z: snapped.z,
        isExit: true,
      });
    });

    this._dedupeNodes();
  }

  _isNavSurface(surf) {
    const size = surf.box.getSize(new THREE.Vector3());
    const name = surf.name || '';
    const xzMax = Math.max(size.x, size.z);
    if (/外网格|外边框\.002|内边框\.002/.test(name)) return false;
    if (/^平面|plane|floor|ground/i.test(name)) return true;
    if (surf.type === 'stair' || surf.layer === 'stair') return true;
    if (size.y <= 1.2 && xzMax > 1.2 && size.y < xzMax * 0.35) return true;
    return size.y <= 0.35;
  }

  _sampleSurfaceGrid(surf) {
    if (!this._isNavSurface(surf)) return;

    const b = surf.box;

    const floorY = b.max.y;
    const step = this.gridSize;
    const pad = step * 0.5;

    for (let x = b.min.x + pad; x <= b.max.x - pad; x += step) {
      for (let z = b.min.z + pad; z <= b.max.z - pad; z += step) {
        if (!this.collision.isWalkable(x, z, floorY)) continue;
        const y = this.collision.getGroundHeightNear(x, z, floorY) ?? floorY;
        this.nodes.push({
          id: `${x.toFixed(2)}_${y.toFixed(2)}_${z.toFixed(2)}`,
          x,
          y,
          z,
        });
      }
    }
  }

  _sampleBoundsGrid(bounds) {
    const min = bounds.min;
    const max = bounds.max;
    const step = this.gridSize;

    for (let x = min.x + step; x < max.x; x += step) {
      for (let z = min.z + step; z < max.z; z += step) {
        const surfaces = this.collision.getWalkableHeightsAt(x, z);
        for (const floorY of surfaces) {
          if (!this.collision.isWalkable(x, z, floorY)) continue;
          const y = this.collision.getGroundHeightNear(x, z, floorY) ?? floorY;
          this.nodes.push({
            id: `${x.toFixed(2)}_${y.toFixed(2)}_${z.toFixed(2)}`,
            x,
            y,
            z,
          });
        }
      }
    }
  }

  _dedupeNodes() {
    const seen = new Map();
    this.nodes = this.nodes.filter((n) => {
      const key = n.id;
      if (seen.has(key)) return false;
      seen.set(key, true);
      return true;
    });
  }

  _connectNodes() {
    this.edges.clear();
    const maxDist = this.gridSize * 1.75;

    this.nodes.forEach((a) => {
      const neighbors = [];
      this.nodes.forEach((b) => {
        if (a.id === b.id) return;
        if (Math.abs(a.y - b.y) > this.maxFloorDelta) return;
        const dist = Math.hypot(a.x - b.x, a.z - b.z);
        if (dist <= maxDist && this._segmentClear(a, b)) {
          neighbors.push({ node: b, cost: dist + Math.abs(a.y - b.y) * 2 });
        }
      });
      this.edges.set(a.id, neighbors);
    });
  }

  _segmentClear(a, b) {
    const steps = Math.max(4, Math.ceil(Math.hypot(a.x - b.x, a.z - b.z) / (this.gridSize * 0.5)));
    const refY = (a.y + b.y) / 2;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = THREE.MathUtils.lerp(a.x, b.x, t);
      const z = THREE.MathUtils.lerp(a.z, b.z, t);
      if (!this.collision.isWalkable(x, z, refY)) return false;
    }
    return true;
  }

  findPath(from, to) {
    const fromVec = from instanceof THREE.Vector3 ? from : new THREE.Vector3(from.x, from.y, from.z);
    const toVec = to instanceof THREE.Vector3 ? to : new THREE.Vector3(to.x, to.y, to.z);

    const start = this._nearestNode(fromVec);
    const end = this._nearestNode(toVec);

    if (!start || !end) {
      console.warn('[PathFinder] 找不到导航节点，路径为空');
      return [];
    }

    if (start.id === end.id) {
      return [new THREE.Vector3(start.x, start.y, start.z)];
    }

    const open = new Map([[start.id, { node: start, f: 0, g: 0 }]]);
    const cameFrom = new Map();
    const gScore = new Map([[start.id, 0]]);

    while (open.size > 0) {
      let current = null;
      let bestF = Infinity;
      open.forEach((v) => {
        if (v.f < bestF) {
          bestF = v.f;
          current = v.node;
        }
      });

      if (current.id === end.id) {
        return this._reconstruct(cameFrom, current).map(
          (n) => new THREE.Vector3(n.x, n.y, n.z)
        );
      }

      open.delete(current.id);
      const neighbors = this.edges.get(current.id) || [];

      for (const { node: neighbor, cost } of neighbors) {
        const tentative = (gScore.get(current.id) || 0) + cost;
        if (tentative < (gScore.get(neighbor.id) ?? Infinity)) {
          cameFrom.set(neighbor.id, current);
          gScore.set(neighbor.id, tentative);
          const h = Math.hypot(neighbor.x - end.x, neighbor.z - end.z) + Math.abs(neighbor.y - end.y) * 3;
          open.set(neighbor.id, { node: neighbor, f: tentative + h, g: tentative });
        }
      }
    }

    console.warn('[PathFinder] A* 未找到路径');
    return [];
  }

  _nearestNode(pos) {
    let best = null;
    let bestScore = Infinity;
    const p = pos instanceof THREE.Vector3 ? pos : new THREE.Vector3(pos.x, pos.y, pos.z);

    this.nodes.forEach((n) => {
      const xz = Math.hypot(n.x - p.x, n.z - p.z);
      const dy = Math.abs(n.y - p.y);
      const score = xz + dy * 4;
      if (score < bestScore) {
        bestScore = score;
        best = n;
      }
    });
    return best;
  }

  snapToWalkable(pos) {
    const p = pos instanceof THREE.Vector3 ? pos.clone() : new THREE.Vector3(pos.x, pos.y, pos.z);
    const snapped = this.collision.snapToWalkable(p.x, p.z, p.y);
    if (snapped) {
      p.x = snapped.x;
      p.y = snapped.y;
      p.z = snapped.z;
      return p;
    }
    const nearest = this._nearestNode(p);
    if (nearest) {
      p.x = nearest.x;
      p.y = nearest.y;
      p.z = nearest.z;
    }
    return p;
  }

  _reconstruct(cameFrom, current) {
    const path = [current];
    while (cameFrom.has(current.id)) {
      current = cameFrom.get(current.id);
      path.unshift(current);
    }
    return path;
  }

  simplifyPath(points, minDist = 0.8) {
    if (!points.length) return [];
    const out = [points[0].clone()];
    for (let i = 1; i < points.length; i++) {
      const last = out[out.length - 1];
      const p = points[i];
      if (last.distanceTo(p) >= minDist) out.push(p.clone());
    }
    const end = points[points.length - 1];
    if (out[out.length - 1].distanceTo(end) > 0.1) out.push(end.clone());
    return out;
  }

  /**
   * 将路线节点转为人物路径点 — 严格沿已生成的路线走，不再二次 A* 寻路
   */
  expandRoute(routeNodes) {
    if (!routeNodes?.length) return [];

    const out = [];
    for (const n of routeNodes) {
      const x = n.x;
      const y = n.y;
      const z = n.z;

      if (this.collision && !this.collision.isWalkable(x, z, y)) {
        const floors = this.collision.getWalkableHeightsAt(x, z);
        const minY = floors.length ? Math.min(...floors) : y;
        const maxY = floors.length ? Math.max(...floors) : y;
        const onVertical =
          floors.length >= 2 && y > minY + 0.2 && y < maxY - 0.2;
        if (!onVertical) continue;
      }

      out.push(new THREE.Vector3(x, y, z));
    }

    if (routeNodes.length === 1 && !out.length) {
      out.push(new THREE.Vector3(routeNodes[0].x, routeNodes[0].y, routeNodes[0].z));
    }

    return this._dedupePoints(out);
  }

  _dedupePoints(points) {
    const out = [];
    points.forEach((p) => {
      const last = out[out.length - 1];
      if (!last || last.distanceTo(p) > 0.15) out.push(p.clone());
    });
    return out;
  }
}
