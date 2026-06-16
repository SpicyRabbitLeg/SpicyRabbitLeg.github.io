import * as THREE from 'three';

/**
 * 带语义骨骼层级的占位人物 — 用于演示跑/爬程序化动画
 */
export function createHumanoidPlaceholder() {
  const root = new THREE.Group();
  root.name = 'FirefighterPlaceholder';

  const matBody = new THREE.MeshStandardMaterial({ color: 0xcc3300, roughness: 0.75 });
  const matHelmet = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.5 });
  const matLimb = new THREE.MeshStandardMaterial({ color: 0x992200, roughness: 0.8 });

  const hips = new THREE.Group();
  hips.name = 'Hips';
  hips.position.y = 0.95;
  root.add(hips);

  const spine = new THREE.Group();
  spine.name = 'Spine';
  spine.position.y = 0.15;
  hips.add(spine);

  const chest = new THREE.Group();
  chest.name = 'Chest';
  chest.position.y = 0.35;
  spine.add(chest);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.24), matBody);
  torso.position.y = 0.05;
  torso.castShadow = true;
  chest.add(torso);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), matHelmet);
  head.position.y = 0.42;
  head.castShadow = true;
  chest.add(head);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), matHelmet);
  helmet.position.y = 0.48;
  helmet.rotation.x = Math.PI;
  chest.add(helmet);

  _addLeg(hips, 'LeftUpLeg', 'LeftLeg', -0.12, matLimb);
  _addLeg(hips, 'RightUpLeg', 'RightLeg', 0.12, matLimb);
  _addArm(chest, 'LeftArm', 'LeftForeArm', -0.28, matLimb);
  _addArm(chest, 'RightArm', 'RightForeArm', 0.28, matLimb);

  return root;
}

function _addLeg(parent, upperName, lowerName, xOffset, material) {
  const upper = new THREE.Group();
  upper.name = upperName;
  upper.position.set(xOffset, -0.05, 0);
  parent.add(upper);

  const upperMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.38, 4, 8), material);
  upperMesh.position.y = -0.22;
  upperMesh.castShadow = true;
  upper.add(upperMesh);

  const lower = new THREE.Group();
  lower.name = lowerName;
  lower.position.y = -0.44;
  upper.add(lower);

  const lowerMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.36, 4, 8), material);
  lowerMesh.position.y = -0.2;
  lowerMesh.castShadow = true;
  lower.add(lowerMesh);

  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.22), material);
  foot.position.set(0, -0.38, 0.05);
  foot.castShadow = true;
  lower.add(foot);
}

function _addArm(parent, upperName, lowerName, xOffset, material) {
  const upper = new THREE.Group();
  upper.name = upperName;
  upper.position.set(xOffset, 0.15, 0);
  parent.add(upper);

  const upperMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.28, 4, 8), material);
  upperMesh.position.y = -0.16;
  upperMesh.castShadow = true;
  upper.add(upperMesh);

  const lower = new THREE.Group();
  lower.name = lowerName;
  lower.position.y = -0.32;
  upper.add(lower);

  const lowerMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.26, 4, 8), material);
  lowerMesh.position.y = -0.15;
  lowerMesh.castShadow = true;
  lower.add(lowerMesh);
}
