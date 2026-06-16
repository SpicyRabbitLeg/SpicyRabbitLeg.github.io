import * as THREE from 'three';

/**
 * 从场景 GLB 中分离内嵌的静态人物模型
 * 常见情况：建模时把装饰用消防员和场景一起导出，但未做骨骼绑定
 */
export class EmbeddedCharacterExtractor {
  constructor(options = {}) {
    this.patterns = options.patterns || ['Group-836488', 'Obj3d66', 'firefighter', 'character'];
    this.hideInScene = options.hideInScene !== false;
  }

  /**
   * @param {THREE.Object3D} sceneRoot - GLTF scene 根节点
   * @returns {{ environment: THREE.Object3D, embeddedCharacter: THREE.Group|null, spawnPoint: THREE.Vector3|null }}
   */
  extract(sceneRoot) {
    sceneRoot.updateMatrixWorld(true);

    const characterNodes = this._findCharacterRoots(sceneRoot);
    const environment = new THREE.Group();
    environment.name = 'Environment';

    const embeddedCharacter = new THREE.Group();
    embeddedCharacter.name = 'EmbeddedFirefighter';

    characterNodes.forEach((node) => {
      const worldPos = new THREE.Vector3();
      const worldQuat = new THREE.Quaternion();
      const worldScale = new THREE.Vector3();
      node.updateMatrixWorld(true);
      node.matrixWorld.decompose(worldPos, worldQuat, worldScale);

      node.parent?.remove(node);
      node.position.copy(worldPos);
      node.quaternion.copy(worldQuat);
      node.scale.copy(worldScale);
      node.updateMatrixWorld(true);

      embeddedCharacter.add(node);
    });

    sceneRoot.children.forEach((child) => {
      environment.add(child);
    });

    embeddedCharacter.updateMatrixWorld(true);

    let spawnPoint = null;
    const hasCharacter = embeddedCharacter.children.length > 0;

    if (hasCharacter) {
      spawnPoint = this._normalizePivot(embeddedCharacter);
    }

    console.info(
      `[EmbeddedCharacter] 分离 ${characterNodes.length} 个人物节点` +
        (hasCharacter ? `，出生点: (${spawnPoint.x.toFixed(2)}, ${spawnPoint.y.toFixed(2)}, ${spawnPoint.z.toFixed(2)})` : '')
    );

    return {
      environment,
      embeddedCharacter: hasCharacter ? embeddedCharacter : null,
      spawnPoint,
      characterNodeNames: characterNodes.map((n) => n.name),
    };
  }

  _findCharacterRoots(sceneRoot) {
    const found = [];
    const seen = new Set();

    sceneRoot.traverse((obj) => {
      if (obj === sceneRoot) return;
      if (!this._matches(obj.name)) return;

      // 取最顶层匹配节点，避免把子 mesh 和父 group 各拆一遍
      let root = obj;
      while (root.parent && root.parent !== sceneRoot && this._matches(root.parent.name)) {
        root = root.parent;
      }

      if (!seen.has(root.uuid)) {
        seen.add(root.uuid);
        found.push(root);
      }
    });

    // 去掉被其他匹配节点包含的子节点
    return found.filter(
      (node) => !found.some((other) => other !== node && other !== sceneRoot && this._isDescendant(node, other))
    );
  }

  _matches(name = '') {
    const lower = name.toLowerCase();
    return this.patterns.some((p) => lower.includes(p.toLowerCase()));
  }

  _isDescendant(node, ancestor) {
    let p = node.parent;
    while (p) {
      if (p === ancestor) return true;
      p = p.parent;
    }
    return false;
  }

  /** 将人物 pivot 归到脚底中心，返回分离前的世界坐标出生点 */
  _normalizePivot(group) {
    group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(group);
    const feet = new THREE.Vector3(
      (box.min.x + box.max.x) * 0.5,
      box.min.y,
      (box.min.z + box.max.z) * 0.5
    );

    group.children.forEach((child) => {
      child.position.sub(feet);
    });
    group.updateMatrixWorld(true);
    return feet;
  }
}
