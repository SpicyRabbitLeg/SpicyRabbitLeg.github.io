import * as THREE from 'three';
import { CollisionLayer } from './CollisionLayers.js';

/**
 * Raycaster + AABB 轻量碰撞系统
 */
export class CollisionSystem {
  constructor(scene) {
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    this._groundHit = new THREE.Vector3();
    this._tempVec = new THREE.Vector3();
    this._tempDir = new THREE.Vector3();
    this._noGround = Symbol('noGround');
    this.bounds = new THREE.Box3();
    this.layers = {
      [CollisionLayer.WALL]: [],
      [CollisionLayer.OBSTACLE]: [],
      [CollisionLayer.GROUND]: [],
      [CollisionLayer.STAIR]: [],
      [CollisionLayer.HOLE]: [],
      [CollisionLayer.LOW_PASSAGE]: [],
    };
    this.allColliders = [];
    this._envMeshes = [];
    this.useMeshClearance = false;
    this.maxFloorDelta = 0.55;
  }

  setNavigationOptions(options = {}) {
    this.maxFloorDelta = options.maxFloorDelta ?? this.maxFloorDelta;
  }

  setPerformanceOptions(options = {}) {
    this.useMeshClearance = options.useMeshClearance ?? false;
  }

  setEnvironmentMeshes(root, excludeNames = ['Firefighter', 'EmbeddedFirefighter', 'CharacterMotionRoot']) {
    this._envMeshes = [];
    const skip = new Set(excludeNames);
    root.traverse((obj) => {
      if (!obj.isMesh || this._isUnderName(obj, skip)) return;
      this._envMeshes.push(obj);
    });
  }

  _isUnderName(obj, names) {
    let node = obj;
    while (node) {
      if (names.has(node.name)) return true;
      node = node.parent;
    }
    return false;
  }

  buildFromSpatialData(data) {
    this.bounds = data.bounds?.clone() || new THREE.Box3();
    this._addLayer(CollisionLayer.WALL, data.walls);
    this._addLayer(CollisionLayer.OBSTACLE, data.obstacles);
    this._addLayer(CollisionLayer.GROUND, data.grounds);
    this._addLayer(CollisionLayer.STAIR, data.stairs);
    this._addLayer(CollisionLayer.HOLE, data.holes);
    this._addLayer(CollisionLayer.LOW_PASSAGE, data.lowPassages);

    if (data.navZones?.length) {
      this._addLayer(CollisionLayer.GROUND, data.navZones);
    }
  }

  _addLayer(layer, entries) {
    entries.forEach((e) => {
      const collider = { layer, box: e.box.clone(), object: e.object, meta: e };
      this.layers[layer].push(collider);
      this.allColliders.push(collider);
    });
  }

  moveWithCollision(from, to, radius = 0.35, height = 1.75) {
    const refY = from.y;
    let result = new THREE.Vector3(to.x, from.y, to.z);

    // 分轴滑动，减少穿墙
    for (const axis of ['x', 'z']) {
      const trial = result.clone();
      trial[axis] = to[axis];
      result = this._resolveCollision(from, trial, radius, height, refY);
    }

    if (!this.isWalkable(result.x, result.z, refY)) {
      const groundAt =
        this.getGroundHeightNear(result.x, result.z, refY) ?? refY;
      if (!this.isWalkable(result.x, result.z, groundAt)) {
        return from.clone();
      }
    }
    return result;
  }

  /** 将陷入墙体的角色沿最小穿透轴推出 */
  resolvePenetration(x, z, refY, radius = 0.35, height = 1.75) {
    let px = x;
    let pz = z;
    let moved = false;

    for (let iter = 0; iter < 6; iter++) {
      let pushed = false;
      const footY = this.getGroundHeightNear(px, pz, refY) ?? refY;
      const charBox = new THREE.Box3(
        new THREE.Vector3(px - radius, footY, pz - radius),
        new THREE.Vector3(px + radius, footY + height, pz + radius)
      );

      for (const layer of [CollisionLayer.WALL, CollisionLayer.OBSTACLE]) {
        for (const c of this.layers[layer]) {
          if (!this._isBlockingCollider(c)) continue;
          if (!charBox.intersectsBox(c.box)) continue;

          const dx = this._penetrationPush(charBox, c.box, 'x');
          const dz = this._penetrationPush(charBox, c.box, 'z');
          if (Math.abs(dx) <= Math.abs(dz)) {
            px += dx;
          } else {
            pz += dz;
          }
          pushed = true;
          moved = true;
          break;
        }
        if (pushed) break;
      }
      if (!pushed) break;
    }

    return { x: px, z: pz, moved };
  }

  _penetrationPush(charBox, wallBox, axis) {
    if (axis === 'x') {
      const overlapLeft = charBox.max.x - wallBox.min.x;
      const overlapRight = wallBox.max.x - charBox.min.x;
      if (overlapLeft <= 0 || overlapRight <= 0) return 0;
      const charCenter = (charBox.min.x + charBox.max.x) * 0.5;
      const wallCenter = (wallBox.min.x + wallBox.max.x) * 0.5;
      const overlap = Math.min(overlapLeft, overlapRight);
      return charCenter < wallCenter ? -(overlap + 0.03) : overlap + 0.03;
    }

    const overlapFront = charBox.max.z - wallBox.min.z;
    const overlapBack = wallBox.max.z - charBox.min.z;
    if (overlapFront <= 0 || overlapBack <= 0) return 0;
    const charCenter = (charBox.min.z + charBox.max.z) * 0.5;
    const wallCenter = (wallBox.min.z + wallBox.max.z) * 0.5;
    const overlap = Math.min(overlapFront, overlapBack);
    return charCenter < wallCenter ? -(overlap + 0.03) : overlap + 0.03;
  }

  _resolveCollision(from, to, radius, height, refY) {
    let result = to.clone();

    for (const layer of [CollisionLayer.WALL, CollisionLayer.OBSTACLE]) {
      for (const c of this.layers[layer]) {
        if (!this._isBlockingCollider(c)) continue;
        if (this._capsuleIntersectsBox(from, result, radius, height, c.box, refY)) {
          result.copy(this._slideAlongBox(from, to, c.box, radius));
        }
      }
    }
    return result;
  }

  /** 仅对竖向结构做移动阻挡，避免地板/薄层立方体卡死人物 */
  _isBlockingCollider(c) {
    if (this._isHorizontalWalkTop(c)) return false;

    const size = c.box.getSize(new THREE.Vector3());
    const xzMax = Math.max(size.x, size.z);
    if (c.layer === CollisionLayer.OBSTACLE) return true;
    return size.y > 0.4 && size.y >= xzMax * 0.35;
  }

  _capsuleIntersectsBox(from, target, radius, height, box, refY) {
    const footY = this.getGroundHeightNear(target.x, target.z, refY ?? from.y) ?? refY ?? from.y;
    const charBox = new THREE.Box3(
      new THREE.Vector3(target.x - radius, footY, target.z - radius),
      new THREE.Vector3(target.x + radius, footY + height, target.z + radius)
    );
    return charBox.intersectsBox(box);
  }

  _slideAlongBox(from, to, box, radius) {
    const result = to.clone();
    const center = box.getCenter(new THREE.Vector3());
    const away = from.clone().sub(center);
    away.y = 0;
    if (away.lengthSq() < 1e-6) away.set(1, 0, 0);
    away.normalize().multiplyScalar(radius + 0.05);
    result.copy(from).add(away);
    return result;
  }

  getGroundHeight(x, z, maxY) {
    const hit = this._raycastGround(x, z, maxY);
    return hit ?? 0;
  }

  getGroundHeightOrNull(x, z, maxY) {
    return this._raycastGround(x, z, maxY);
  }

  /** 取与 referenceY 最接近的楼层地面高度（多层建筑取点用） */
  getGroundHeightNear(x, z, referenceY, tolerance = null) {
    const tops = this._collectGroundTopsAt(x, z);
    if (!tops.length) return null;
    return this._resolveFloorHeight(tops, referenceY, tolerance);
  }

  /** 按参考高度选楼层 — 避免 1F 路线误吸附到 2F 楼板 */
  _resolveFloorHeight(heights, refY, tolerance = null) {
    if (refY == null || !heights.length) return heights[0] ?? null;

    const tol = tolerance ?? this.maxFloorDelta + 0.1;
    const maxUp = this.maxFloorDelta + 0.12;
    let best = null;
    let bestDist = Infinity;

    for (const y of heights) {
      if (y > refY + maxUp) continue;
      const dist = Math.abs(y - refY);
      if (dist <= tol && dist < bestDist) {
        bestDist = dist;
        best = y;
      }
    }
    if (best !== null) return best;

    for (const y of heights) {
      const dist = Math.abs(y - refY);
      if (dist < bestDist) {
        bestDist = dist;
        best = y;
      }
    }
    return best;
  }

  /** 演练起点 — 优先使用路线节点标注的楼层高度 */
  resolveRouteSpawn(node) {
    if (!node) return null;
    const refY = node.y ?? 0.5;
    if (this.isWalkable(node.x, node.z, refY)) {
      const y = this.getGroundHeightNear(node.x, node.z, refY) ?? refY;
      return { x: node.x, y, z: node.z };
    }
    return this.snapToWalkable(node.x, node.z, refY);
  }

  _isWalkSurfaceCollider(c) {
    const size = c.box.getSize(new THREE.Vector3());
    const name = c.meta?.name || '';
    if (/外网格|外边框\.002|内边框\.002/.test(name)) return false;
    if (/^平面|plane|floor|ground/i.test(name)) return true;
    if (c.layer === CollisionLayer.STAIR) return true;
    if (this._isHorizontalWalkTop(c)) return true;
    return size.y <= 0.35;
  }

  _isHorizontalWalkTop(c) {
    const size = c.box.getSize(new THREE.Vector3());
    const name = c.meta?.name || '';
    if (/外网格|外边框|内边框/.test(name)) return false;
    const xzMax = Math.max(size.x, size.z);
    return size.y <= 1.2 && xzMax > 1.2 && size.y < xzMax * 0.35;
  }

  _collectGroundTopsAt(x, z) {
    const tops = [];
    const pad = 0.15;

    for (const layer of [CollisionLayer.GROUND, CollisionLayer.STAIR, CollisionLayer.WALL]) {
      for (const c of this.layers[layer]) {
        if (layer === CollisionLayer.WALL) {
          if (!this._isHorizontalWalkTop(c)) continue;
        } else if (!this._isWalkSurfaceCollider(c)) continue;
        const b = c.box;

        if (
          x >= b.min.x - pad &&
          x <= b.max.x + pad &&
          z >= b.min.z - pad &&
          z <= b.max.z + pad
        ) {
          tops.push(b.max.y);
        }
      }
    }
    return tops;
  }

  _raycastGround(x, z, maxY) {
    const tops = this._collectGroundTopsAt(x, z);
    if (!tops.length) return null;

    if (maxY != null) {
      const below = tops.filter((y) => y <= maxY + 0.15);
      if (below.length) return Math.max(...below);
      return tops.reduce((nearest, y) =>
        Math.abs(y - maxY) < Math.abs(nearest - maxY) ? y : nearest
      );
    }

    return Math.max(...tops);
  }

  /** 点是否在可通行地面区域（refY 指定楼层） */
  isWalkable(x, z, refY = null) {
    if (!this._isOverWalkSurface(x, z, refY)) return false;

    const y =
      refY != null
        ? this.getGroundHeightNear(x, z, refY)
        : this.getGroundHeightOrNull(x, z);
    if (y === null) return false;

    return !this._blockedAt(x, y, z);
  }

  /** 某 (x,z) 上所有可行走楼层高度 */
  getWalkableHeightsAt(x, z) {
    return this._collectGroundTopsAt(x, z).sort((a, b) => a - b);
  }

  /** 将坐标吸附到最近可行走点 */
  snapToWalkable(x, z, refY = null) {
    const heights = this.getWalkableHeightsAt(x, z);
    if (!heights.length) return null;

    const targetY = this._resolveFloorHeight(heights, refY);
    if (targetY == null) return null;

    if (!this.isWalkable(x, z, targetY)) {
      const step = 0.35;
      for (const [dx, dz] of [
        [step, 0], [-step, 0], [0, step], [0, -step],
        [step, step], [-step, step], [step, -step], [-step, -step],
      ]) {
        if (this.isWalkable(x + dx, z + dz, targetY)) {
          return { x: x + dx, y: targetY, z: z + dz };
        }
      }
      return null;
    }

    return { x, y: targetY, z };
  }

  _isOverWalkSurface(x, z, refY = null) {
    const pad = 0.12;
    const maxFloorDelta = 0.6;

    const overCollider = (c) => {
      const b = c.box;
      if (x < b.min.x - pad || x > b.max.x + pad || z < b.min.z - pad || z > b.max.z + pad) {
        return false;
      }
      if (refY != null && Math.abs(b.max.y - refY) > maxFloorDelta) return false;
      return true;
    };

    for (const layer of [CollisionLayer.GROUND, CollisionLayer.STAIR]) {
      for (const c of this.layers[layer]) {
        if (this._isWalkSurfaceCollider(c) && overCollider(c)) return true;
      }
    }

    for (const c of this.layers[CollisionLayer.WALL]) {
      if (this._isHorizontalWalkTop(c) && overCollider(c)) return true;
    }

    return false;
  }

  _blockedAt(x, footY, z, radius = 0.35, height = 1.75) {
    const charBox = new THREE.Box3(
      new THREE.Vector3(x - radius, footY, z - radius),
      new THREE.Vector3(x + radius, footY + height, z + radius)
    );

    for (const layer of [CollisionLayer.WALL, CollisionLayer.OBSTACLE]) {
      for (const c of this.layers[layer]) {
        if (!this._isBlockingCollider(c)) continue;
        if (charBox.intersectsBox(c.box)) return true;
      }
    }
    return false;
  }

  probeTerrain(position, direction, distance = 1.5) {
    const dirX = direction.x;
    const dirZ = direction.z;
    const dirLen = Math.hypot(dirX, dirZ) || 1;
    const nx = dirX / dirLen;
    const nz = dirZ / dirLen;

    const forwardX = position.x + nx * distance;
    const forwardY = position.y + 0.5;
    const forwardZ = position.z + nz * distance;
    const currentY = position.y + 0.5;

    const result = {
      lowPassage: false,
      hole: false,
      stair: false,
      obstacle: false,
      ceilingHeight: 2.5,
      clearanceHeight: 2.5,
    };

    result.lowPassage = this._probeLowPassage(
      position.x,
      position.y,
      position.z,
      forwardX,
      forwardZ
    );
    result.hole = this._probeLayerAt(
      CollisionLayer.HOLE,
      position.x,
      currentY,
      position.z,
      forwardX,
      forwardY,
      forwardZ
    );
    result.stair = this._probeLayerAt(
      CollisionLayer.STAIR,
      position.x,
      currentY,
      position.z,
      forwardX,
      forwardY,
      forwardZ
    );
    result.obstacle = this._probeLayerAt(
      CollisionLayer.OBSTACLE,
      position.x,
      currentY,
      position.z,
      forwardX,
      forwardY,
      forwardZ
    );

    const clearance = this.probeClearance(position, nx, nz, distance);
    result.clearanceHeight = clearance.clearanceHeight;
    result.ceilingHeight = clearance.clearanceHeight;

    if (result.lowPassage) {
      result.ceilingHeight = Math.min(result.ceilingHeight, 0.8);
      result.clearanceHeight = Math.min(result.clearanceHeight, 0.8);
    }

    return result;
  }

  /** 检测当前位置或前方采样点是否落在指定碰撞层内 */
  _probeLayerAt(layer, cx, cy, cz, fx, fy, fz) {
    for (const c of this.layers[layer]) {
      if (c.box.containsPoint(this._tempVec.set(cx, cy, cz))) return true;
      if (c.box.containsPoint(this._tempVec.set(fx, fy, fz))) return true;
    }
    return false;
  }

  /** 低矮通道：需在 footprints 内且净空确实不足，避免 NURBS 大包围盒误触发 */
  _probeLowPassage(cx, footY, cz, fx, fz) {
    return (
      this._isInLowPassage(cx, footY, cz) || this._isInLowPassage(fx, footY, fz)
    );
  }

  _isInLowPassage(x, footY, z) {
    for (const c of this.layers[CollisionLayer.LOW_PASSAGE]) {
      const b = c.box;
      if (!this._pointInFootprint(x, z, b, 0.12)) continue;

      const clearance = b.max.y - footY;
      const aboveFloor = footY >= b.min.y - 0.25;
      if (aboveFloor && clearance >= 0.3 && clearance <= 1.35) {
        return true;
      }
    }
    return false;
  }

  /** 探测前方净空高度（头顶到天花板/障碍的距离） */
  probeClearance(position, dirX, dirZ, distance = 1.5) {
    const footY =
      this.getGroundHeightNear(position.x, position.z, position.y) ??
      this.getGroundHeight(position.x, position.z, position.y + 0.5);

    const samples = [0, 0.8, distance];
    let minVertical = Infinity;

    for (const d of samples) {
      const x = position.x + dirX * d;
      const z = position.z + dirZ * d;
      const groundY = this.getGroundHeightNear(x, z, footY) ?? footY;
      minVertical = Math.min(minVertical, this._measureClearanceAt(x, groundY, z));
    }

    const horizontal = this._probeHorizontalClearance(position, footY, dirX, dirZ, distance);
    let clearanceHeight = minVertical === Infinity ? 2.5 : minVertical;

    // 侧向矮墙不应把站立净空压成匍匐；仅当前方水平通道确实低矮时才合并
    if (horizontal !== Infinity && horizontal < 1.05 && horizontal < clearanceHeight) {
      clearanceHeight = Math.min(clearanceHeight, horizontal);
    }

    return {
      clearanceHeight,
      hasLowCeiling: clearanceHeight < 1.7,
    };
  }

  /** 水平方向多层高度探测 — 检测前方矮墙/低矮通道 */
  _probeHorizontalClearance(position, footY, dirX, dirZ, distance) {
    const checkDistances = [0.8, distance];
    const checkHeights = [1.5, 1.0, 0.75];
    let minPassable = Infinity;

    for (const d of checkDistances) {
      const blocked = [];
      const clear = [];

      for (const h of checkHeights) {
        if (this._isBlockedHorizontally(position.x, footY + h, position.z, dirX, dirZ, d)) {
          blocked.push(h);
        } else {
          clear.push(h);
        }
      }

      if (blocked.length === checkHeights.length) continue;
      if (blocked.length === 0) continue;

      const passable = clear.length ? Math.max(...clear) : Math.min(...blocked) - 0.15;
      minPassable = Math.min(minPassable, passable);
    }

    return minPassable;
  }

  _isBlockedHorizontally(originX, originY, originZ, dirX, dirZ, maxDist) {
    this.raycaster.set(this._tempVec.set(originX, originY, originZ), this._tempDir.set(dirX, 0, dirZ));
    this.raycaster.far = maxDist + 0.05;
    this.raycaster.near = 0.08;

    if (this.useMeshClearance && this._envMeshes.length) {
      const hits = this.raycaster.intersectObjects(this._envMeshes, false);
      for (const hit of hits) {
        if (hit.distance > maxDist) continue;
        if (this._isFloorHit(hit)) continue;
        return true;
      }
    }

    const ray = this.raycaster.ray;
    for (const layer of [CollisionLayer.WALL, CollisionLayer.OBSTACLE, CollisionLayer.LOW_PASSAGE]) {
      for (const c of this.layers[layer]) {
        const t = ray.intersectBox(c.box, this._groundHit);
        if (t !== null && t >= 0.08 && t <= maxDist) return true;
      }
    }

    return false;
  }

  _isFloorHit(hit) {
    if (!hit.face) return false;
    const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    return normal.y > 0.65;
  }

  _measureClearanceAt(x, footY, z) {
    for (const c of this.layers[CollisionLayer.LOW_PASSAGE]) {
      const b = c.box;
      if (!this._pointInFootprint(x, z, b)) continue;

      const gap = b.max.y - footY;
      const nearPassageFloor = footY >= b.min.y - 0.15 && footY <= b.min.y + 0.65;
      if (nearPassageFloor && gap < 1.1) {
        return Math.max(0.3, gap);
      }
    }

    const origin = new THREE.Vector3(x, footY + 0.1, z);
    this.raycaster.set(origin, new THREE.Vector3(0, 1, 0));
    this.raycaster.far = 50;
    let nearestCeiling = null;

    if (this.useMeshClearance && this._envMeshes.length) {
      const hits = this.raycaster.intersectObjects(this._envMeshes, false);
      if (hits.length && hits[0].point.y > footY + 0.05) {
        nearestCeiling = hits[0].point.y;
      }
    }

    for (const layer of [CollisionLayer.WALL, CollisionLayer.OBSTACLE, CollisionLayer.LOW_PASSAGE]) {
      for (const c of this.layers[layer]) {
        if (layer === CollisionLayer.WALL && this._isHorizontalWalkTop(c)) continue;

        const b = c.box;
        if (!this._pointInFootprint(x, z, b)) continue;

        const t = this.raycaster.ray.intersectBox(b, this._groundHit);
        if (t !== null && this._groundHit.y > footY + 0.05) {
          const gap = this._groundHit.y - footY;
          const size = b.getSize(new THREE.Vector3());
          // 跨层外壳（如 2F 楼板侧壁）在 1F 不应触发弯腰
          if (size.y > 1.2 && gap > 0.85 && gap < 2.4) continue;

          if (nearestCeiling === null || this._groundHit.y < nearestCeiling) {
            nearestCeiling = this._groundHit.y;
          }
        }
      }
    }

    if (nearestCeiling === null) return 2.5;
    return nearestCeiling - footY;
  }

  _pointInFootprint(x, z, box, pad = 0.05) {
    return (
      x >= box.min.x - pad &&
      x <= box.max.x + pad &&
      z >= box.min.z - pad &&
      z <= box.max.z + pad
    );
  }
}
