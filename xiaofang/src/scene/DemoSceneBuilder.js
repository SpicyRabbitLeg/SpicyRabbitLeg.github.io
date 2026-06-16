import * as THREE from 'three';
import { SpatialNodeParser } from './SpatialNodeParser.js';

/**
 * 无外部模型时的演示封闭室内场景
 */
export class DemoSceneBuilder {
  constructor(scene) {
    this.scene = scene;
  }

  build() {
    const group = new THREE.Group();
    group.name = 'DemoIndoorScene';

    const floor = this._box(20, 0.2, 12, 0x3d3d3d, [10, -0.1, 0]);
    floor.name = 'Ground_Floor';
    group.add(floor);

    const walls = [
      { pos: [10, 2, -6], size: [20, 4, 0.3] },
      { pos: [10, 2, 6], size: [20, 4, 0.3] },
      { pos: [0, 2, 0], size: [0.3, 4, 12] },
      { pos: [20, 2, 0], size: [0.3, 4, 12] },
      { pos: [8, 2, 0], size: [0.3, 4, 4] },
    ];
    walls.forEach((w, i) => {
      const mesh = this._box(...w.size, 0x6b6b6b, w.pos);
      mesh.name = `Wall_${i}`;
      group.add(mesh);
    });

    const obstacle = this._box(1.5, 1, 1.5, 0x8b4513, [5, 0.5, 2]);
    obstacle.name = 'Obstacle_Crate';
    group.add(obstacle);

    const stairGroup = new THREE.Group();
    stairGroup.name = 'Stair_Main';
    for (let i = 0; i < 6; i++) {
      const step = this._box(2, 0.15, 0.4, 0x555555, [14 + i * 0.4, i * 0.15, -3]);
      stairGroup.add(step);
    }
    group.add(stairGroup);

    const lowPassage = this._box(3, 0.8, 1.5, 0x444466, [4, 0.4, -2]);
    lowPassage.name = 'LowPassage_Smoke';
    group.add(lowPassage);

    const hole = this._box(0.8, 1.2, 0.3, 0x333355, [8, 1, 3]);
    hole.name = 'Hole_Wall';
    group.add(hole);

    const exit = this._box(2, 3, 0.2, 0x00aa44, [19.5, 1.5, 0]);
    exit.name = 'Exit_Safe';
    group.add(exit);

    const navZone = this._box(18, 0.05, 10, 0x2a2a2a, [10, 0.02, 0]);
    navZone.name = 'NavZone_Walkable';
    navZone.visible = false;
    group.add(navZone);

    this.scene.add(group);

    const parser = new SpatialNodeParser({
      wall: ['wall'],
      obstacle: ['obstacle'],
      stair: ['stair'],
      lowPassage: ['lowpassage'],
      hole: ['hole'],
      exit: ['exit'],
      ground: ['ground', 'floor'],
      navZone: ['navzone'],
    });

    const data = parser.parse(group);
    data.spawnPoint.set(1, 0, 0);
    data.environmentRoot = group;
    return data;
  }

  _box(w, h, d, color, pos) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
}
