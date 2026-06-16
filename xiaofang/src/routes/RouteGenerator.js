import * as THREE from 'three';

/**
 * 根据场景空间数据生成逃生路线 — 所有节点必须在可行走区域内
 */
export class RouteGenerator {
  static generate(spatialData, pathFinder, collision) {
    const spawnVec = this._resolveSpawn(spatialData, collision);
    const anchors = this._buildMultiFloorAnchors(spatialData, collision, spawnVec);

    const mainRoute = this._makeRouteFromAnchors({
      id: 'route-main',
      name: '1F→2F→3F综合逃生',
      tag: 'complex',
      anchors,
      pathFinder,
      collision,
      bounds: spatialData.bounds,
      requiredActions: ['run', 'crawl', 'stairUp', 'crouchHole'],
    });

    if (mainRoute) return [mainRoute];

    console.warn('[RouteGenerator] 多层路线生成失败，使用备用路线');
    return [this._fallbackRoute(spatialData.bounds, spawnVec, pathFinder, collision)];
  }

  /**
   * 1F 跑步 → 匍匐 → 钻洞 → 西侧楼梯 → 2F → 匍匐 → 钻洞 → 内部楼梯 → 3F
   */
  static _buildMultiFloorAnchors(spatialData, collision, spawn) {
    const p = (x, z, yHint) => this._snapWalk(collision, x, z, yHint);

    const crawl1 = this._pickNearest(spatialData.lowPassages, { x: 0, z: 0 }, 0.5);
    const crawl2 = this._pickNearest(spatialData.lowPassages, { x: 5, z: -1 }, 1.35);
    const hole1 = this._pickNearest(spatialData.holes, { x: -6.5, z: 0.8 }, 0.5);
    const hole2 = this._pickNearest(spatialData.holes, { x: -2.5, z: 1.8 }, 2.12);
    const stairChain = this._buildStairAnchors(collision);
    const exit3 = this._pick3FGoal(collision);

    const anchors = [
      spawn,
      p(0, 0, 0.5),
      crawl1 ? p(crawl1.center.x, crawl1.center.z, 0.5) : p(0.1, 0, 0.5),
      p(-2, 0, 0.5),
      hole1 ? p(hole1.center.x, hole1.center.z, 0.5) : p(-6.5, 0.8, 0.5),
      ...stairChain,
      p(-2, 0, 2.12),
      crawl2 ? p(crawl2.center.x, crawl2.center.z, 1.35) : p(5.1, -1, 1.35),
      p(0, 0, 2.12),
      hole2 ? p(hole2.center.x, hole2.center.z, 2.12) : p(-2.5, 0.8, 2.12),
      p(-2.5, 1.9, 2.12),
      exit3,
    ];

    return anchors.filter(Boolean);
  }

  /** 西侧主楼梯 — 沿 z≈-1.5 可行走侧上行 */
  static _buildStairAnchors(collision) {
    const specs = [
      [-7.3, -1.5, 0.5],
      [-7.5, -1.5, 0.62],
      [-7.5, -1.5, 2.09],
      [-7.5, -1.0, 2.09],
      [-7.5, -0.5, 2.13],
      [-7.5, 0, 2.13],
    ];
    return specs.map(([x, z, y]) => this._snapWalk(collision, x, z, y)).filter(Boolean);
  }

  /** 3F 终点 — 场景内 2F→3F 内部楼梯口 (-2, 1.9) */
  static _pick3FGoal(collision) {
    return (
      this._snapWalk(collision, -2, 1.9, 3.09) ||
      this._snapWalk(collision, -2.5, 1.9, 3.09) ||
      this._snapWalk(collision, -1.5, 1.9, 3.09)
    );
  }

  static _pickNearest(entries, target) {
    if (!entries?.length) return null;
    let best = entries[0];
    let bestDist = Infinity;
    entries.forEach((e) => {
      const d = Math.hypot(e.center.x - target.x, e.center.z - target.z);
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    });
    return best;
  }

  static _resolveSpawn(spatialData, collision) {
    const cfg = spatialData.spawnPoint?.clone() || new THREE.Vector3(0, 0.5, 0);
    return this._snapWalk(collision, cfg.x, cfg.z, cfg.y > 0 ? cfg.y : 0.5) || cfg;
  }

  static _snapWalk(collision, x, z, yHint = 0.5) {
    const snapped = collision.snapToWalkable(x, z, yHint);
    if (snapped && collision.isWalkable(snapped.x, snapped.z, snapped.y)) {
      return new THREE.Vector3(snapped.x, snapped.y, snapped.z);
    }
    return null;
  }

  static _vecFromCenter(c) {
    return c instanceof THREE.Vector3 ? c.clone() : new THREE.Vector3(c.x, c.y, c.z);
  }

  static _makeRouteFromAnchors({ id, name, tag, anchors, pathFinder, collision, bounds, requiredActions }) {
    const nodes = [];

    for (let i = 0; i < anchors.length - 1; i++) {
      const a = this._vecFromCenter(anchors[i]);
      const b = this._vecFromCenter(anchors[i + 1]);
      const xzDist = Math.hypot(a.x - b.x, a.z - b.z);
      const yDelta = Math.abs(a.y - b.y);

      if (xzDist < 0.6 && yDelta > 0.45) {
        this._pushVerticalNodes(nodes, a, b);
        continue;
      }

      const segment = pathFinder.findPath(a, b);
      if (!segment.length) {
        if (xzDist < 0.6 && yDelta > 0.15 && yDelta < 3) {
          this._pushVerticalNodes(nodes, a, b);
          continue;
        }
        console.warn(`[RouteGenerator] ${name}: 段 ${i} 寻路失败`, a.toArray(), '->', b.toArray());
        continue;
      }

      const simplified = pathFinder.simplifyPath(segment, 0.6);
      simplified.forEach((p, idx) => {
        if (nodes.length && idx === 0) return;
        this._pushNode(nodes, p, collision);
      });
    }

    const sanitized = this._sanitizeNodes(nodes, collision, bounds);
    if (sanitized.length < 2) {
      console.warn(`[RouteGenerator] ${name}: 有效节点不足，跳过`);
      return null;
    }

    const spawn = this._vecFromCenter(anchors[0]);
    const first = sanitized[0];
    if (Math.hypot(first.x - spawn.x, first.z - spawn.z) > 0.25) {
      sanitized.unshift({ x: spawn.x, y: spawn.y, z: spawn.z });
    }

    console.info(
      `[RouteGenerator] ${name}: ${sanitized.length} 节点 (校验后)`,
      `Y ${sanitized[0].y.toFixed(2)} → ${sanitized[sanitized.length - 1].y.toFixed(2)}`
    );

    return { id, name, tag, nodes: sanitized, requiredActions };
  }

  static _pushVerticalNodes(nodes, a, b) {
    const from = this._vecFromCenter(a);
    const to = this._vecFromCenter(b);
    const steps = Math.max(2, Math.ceil(Math.abs(from.y - to.y) / 0.4));

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const pt = {
        x: THREE.MathUtils.lerp(from.x, to.x, t),
        y: THREE.MathUtils.lerp(from.y, to.y, t),
        z: THREE.MathUtils.lerp(from.z, to.z, t),
      };
      const last = nodes[nodes.length - 1];
      if (
        last &&
        Math.hypot(last.x - pt.x, last.z - pt.z) < 0.08 &&
        Math.abs(last.y - pt.y) < 0.08
      ) {
        continue;
      }
      nodes.push(pt);
    }
  }

  static _pushNode(nodes, vec, collision) {
    const snapped = collision.snapToWalkable(vec.x, vec.z, vec.y);
    if (!snapped || !collision.isWalkable(snapped.x, snapped.z, snapped.y)) return;

    const pt = { x: snapped.x, y: snapped.y, z: snapped.z };
    const last = nodes[nodes.length - 1];
    if (last && Math.hypot(last.x - pt.x, last.z - pt.z) < 0.1 && Math.abs(last.y - pt.y) < 0.1) {
      return;
    }
    nodes.push(pt);
  }

  static _sanitizeNodes(nodes, collision, bounds) {
    const pad = 0.25;
    const out = [];

    for (const n of nodes) {
      let x = n.x;
      let z = n.z;
      let y = n.y;

      if (bounds) {
        x = THREE.MathUtils.clamp(x, bounds.min.x + pad, bounds.max.x - pad);
        z = THREE.MathUtils.clamp(z, bounds.min.z + pad, bounds.max.z - pad);
      }

      const isClimb = this._isVerticalClimbNode(collision, x, z, y);

      if (isClimb) {
        const pt = { x, y, z };
        const last = out[out.length - 1];
        if (last && Math.hypot(last.x - pt.x, last.z - pt.z) < 0.12) continue;
        out.push(pt);
        continue;
      }

      const snapped = collision.snapToWalkable(x, z, y);
      if (snapped && collision.isWalkable(snapped.x, snapped.z, snapped.y)) {
        x = snapped.x;
        y = snapped.y;
        z = snapped.z;
      } else if (!this._isVerticalClimbNode(collision, x, z, y)) {
        continue;
      }

      const pt = { x, y, z };
      const last = out[out.length - 1];
      if (last && Math.hypot(last.x - pt.x, last.z - pt.z) < 0.12) continue;

      out.push(pt);
    }

    return out;
  }

  static _isVerticalClimbNode(collision, x, z, y) {
    const floors = collision.getWalkableHeightsAt(x, z);
    if (floors.length < 2) return false;
    const minY = Math.min(...floors);
    const maxY = Math.max(...floors);
    if (maxY - minY < 0.5) return false;
    return y > minY + 0.2 && y < maxY - 0.2;
  }

  static _fallbackRoute(bounds, spawn, pathFinder, collision) {
    const center = bounds.getCenter(new THREE.Vector3());
    const end = this._snapWalk(collision, center.x, center.z, center.y) || center;
    const path = pathFinder.findPath(spawn, end);
    const nodes = path.length >= 2 ? path.map((p) => ({ x: p.x, y: p.y, z: p.z })) : [
      { x: spawn.x, y: spawn.y, z: spawn.z },
      { x: end.x, y: end.y, z: end.z },
    ];

    return {
      id: 'route-main',
      name: '1F→2F→3F综合逃生',
      tag: 'complex',
      nodes: this._sanitizeNodes(nodes, collision, bounds),
      requiredActions: ['run', 'stairUp', 'crawl'],
    };
  }
}
