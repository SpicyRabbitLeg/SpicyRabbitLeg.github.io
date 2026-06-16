import * as THREE from 'three';

/**
 * 解析场景模型命名节点，自动标记逃生关键点位
 * 结合命名 + 几何形状（水平面→地面，竖向→墙体）
 */
export class SpatialNodeParser {
  constructor(naming) {
    this.naming = naming;
  }

  parse(root) {
    const data = {
      walls: [],
      obstacles: [],
      stairs: [],
      lowPassages: [],
      holes: [],
      exits: [],
      grounds: [],
      navZones: [],
      smokeZones: [],
      bounds: new THREE.Box3(),
      spawnPoint: new THREE.Vector3(0, 0, 0),
    };

    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    data.bounds.copy(box);

    root.traverse((obj) => {
      const type = this._matchType(obj.name);
      if (!type) return;

      const entry = this._createEntry(obj, type);
      const refined = this._refineTypeByGeometry(entry, type);
      if (!refined) return;
      entry.type = refined;
      entry.layer = refined;

      const listKey = this._listKey(refined);
      if (data[listKey]) data[listKey].push(entry);

      if (refined === 'lowPassage') data.smokeZones.push(entry.box);
    });

    if (data.navZones.length === 0 && data.grounds.length > 0) {
      data.navZones = [...data.grounds];
    }

    if (data.exits.length > 0) {
      data.spawnPoint.copy(data.exits[0].center);
    } else {
      data.spawnPoint.set(box.min.x + 1, box.min.y + 0.1, (box.min.z + box.max.z) / 2);
    }

    console.info(
      `[SpatialParser] 墙体 ${data.walls.length}, 地面 ${data.grounds.length}, 出口 ${data.exits.length}, 楼梯 ${data.stairs.length}`
    );

    return data;
  }

  /** 水平薄板 → 地面；竖向结构 → 墙体；矮立方体 → 穿墙洞 */
  _refineTypeByGeometry(entry, type) {
    const { size } = entry;
    const name = entry.name || '';
    const xzMax = Math.max(size.x, size.z);
    const xzMin = Math.min(size.x, size.z);
    const isNamedFloor = /^平面|plane|floor|ground/i.test(name);
    const isThinSlab = size.y <= 0.35 && xzMax > 0.5;
    const isFlatWalkSurface = size.y <= 1.2 && xzMax > 1.2 && size.y < xzMax * 0.35;
    const isHorizontalSlab = isNamedFloor || isThinSlab || isFlatWalkSurface;
    const isVertical = size.y > xzMax * 0.5 && size.y > 0.8;
    const isFrameShell = /外网格|外边框|内边框/.test(name);
    const isWallHole =
      size.y >= 0.35 &&
      size.y < 0.55 &&
      xzMax < 1.2 &&
      xzMin < 1.0 &&
      entry.center.y > 0.45 &&
      entry.center.y < 1.25 &&
      !/柱体|pillar/i.test(name);

    if (type === 'ground' && (isFrameShell || size.y > 2.5)) return null;

    if (type === 'wall' && isWallHole) return 'hole';
    if (type === 'wall' && isHorizontalSlab && !isFrameShell) return 'ground';
    if (type === 'ground' && isVertical && !isNamedFloor) return 'wall';
    return type;
  }

  _listKey(type) {
    const map = {
      wall: 'walls',
      obstacle: 'obstacles',
      stair: 'stairs',
      lowPassage: 'lowPassages',
      hole: 'holes',
      exit: 'exits',
      ground: 'grounds',
      navZone: 'navZones',
      fireEquipment: 'fireEquipment',
    };
    return map[type] || `${type}s`;
  }

  _matchType(name) {
    if (!name) return null;
    const lower = name.toLowerCase();
    for (const [type, keywords] of Object.entries(this.naming)) {
      if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
        return type;
      }
    }
    return null;
  }

  _createEntry(obj, type) {
    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    return {
      name: obj.name,
      type,
      object: obj,
      box,
      center,
      size,
      layer: type,
    };
  }
}
