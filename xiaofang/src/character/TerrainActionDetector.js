/**
 * 地形动作检测 — 命名节点 + 净空探测（带节流缓存）
 */
export class TerrainActionDetector {
  constructor(collision, config = {}) {
    this.collision = collision;
    this.probeDistance = config.clearance?.probeDistance ?? 1.5;
    const perf = config.performance || {};
    this.probeInterval = perf.terrainProbeInterval ?? 0.15;
    this.probeMoveThreshold = perf.terrainProbeMoveThreshold ?? 0.35;
    this._cache = null;
    this._cacheTime = 0;
    this._lastPos = { x: 0, y: 0, z: 0 };
    this._lastDir = { x: 0, z: 0 };
  }

  detect(position, direction) {
    const now = performance.now() * 0.001;
    const dx = position.x - this._lastPos.x;
    const dy = position.y - this._lastPos.y;
    const dz = position.z - this._lastPos.z;
    const moved = Math.hypot(dx, dy, dz);

    const dirX = direction.x;
    const dirZ = direction.z;
    const dirLen = Math.hypot(dirX, dirZ) || 1;
    const dot =
      (dirX * this._lastDir.x + dirZ * this._lastDir.z) /
      (dirLen * (Math.hypot(this._lastDir.x, this._lastDir.z) || 1));

    if (
      this._cache &&
      now - this._cacheTime < this.probeInterval &&
      moved < this.probeMoveThreshold &&
      dot > 0.92
    ) {
      return this._cache;
    }

    this._cache = this.collision.probeTerrain(position, direction, this.probeDistance);
    this._cacheTime = now;
    this._lastPos.x = position.x;
    this._lastPos.y = position.y;
    this._lastPos.z = position.z;
    this._lastDir.x = dirX / dirLen;
    this._lastDir.z = dirZ / dirLen;
    return this._cache;
  }
}
