/**
 * 从 indoor-scene.glb 分离人物，输出：
 *   public/models/character/firefighter.glb  — 人物
 *   public/models/scene/indoor-scene.glb     — 纯场景（覆盖原文件，先备份）
 *
 * 用法: npm run split-scene
 */
import { Document, NodeIO } from '@gltf-transform/core';
import { KHRMaterialsSpecular, KHRTextureTransform } from '@gltf-transform/extensions';
import { copyToDocument, getBounds, prune } from '@gltf-transform/functions';
import { copyFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SCENE_PATH = join(ROOT, 'public/models/scene/indoor-scene.glb');
const BACKUP_PATH = join(ROOT, 'public/models/scene/indoor-scene.backup.glb');
const CHARACTER_PATH = join(ROOT, 'public/models/character/firefighter.glb');

const CHARACTER_PATTERNS = ['Group-836488', 'Obj3d66', 'firefighter', 'character', '消防'];

function matches(name = '') {
  const lower = name.toLowerCase();
  return CHARACTER_PATTERNS.some((p) => lower.includes(p.toLowerCase()));
}

function findCharacterRoots(scene) {
  return scene.listChildren().filter((node) => matches(node.getName()));
}

function normalizeFeetPivot(rootNode) {
  const bounds = getBounds(rootNode);
  const feetY = bounds.min[1];
  const centerX = (bounds.min[0] + bounds.max[0]) / 2;
  const centerZ = (bounds.min[2] + bounds.max[2]) / 2;

  const offset = [-centerX, -feetY, -centerZ];
  rootNode.setTranslation([
    rootNode.getTranslation()[0] + offset[0],
    rootNode.getTranslation()[1] + offset[1],
    rootNode.getTranslation()[2] + offset[2],
  ]);

  for (const child of rootNode.listChildren()) {
    const t = child.getTranslation();
    child.setTranslation([t[0] + offset[0], t[1] + offset[1], t[2] + offset[2]]);
  }

  return { x: centerX, y: feetY, z: centerZ };
}

async function main() {
  if (!existsSync(SCENE_PATH)) {
    console.error(`找不到场景文件: ${SCENE_PATH}`);
    process.exit(1);
  }

  const io = new NodeIO().registerExtensions([KHRTextureTransform, KHRMaterialsSpecular]);

  console.log('读取场景...');
  const sceneDoc = await io.read(SCENE_PATH);
  const scene = sceneDoc.getRoot().listScenes()[0];
  const charRoots = findCharacterRoots(scene);

  if (!charRoots.length) {
    console.error('未找到人物节点，请检查命名规则:', CHARACTER_PATTERNS.join(', '));
    process.exit(1);
  }

  console.log(`找到 ${charRoots.length} 个人物根节点:`, charRoots.map((n) => n.getName()).join(', '));

  // 备份原场景（若已有 backup 则跳过）
  if (!existsSync(BACKUP_PATH)) {
    copyFileSync(SCENE_PATH, BACKUP_PATH);
    console.log(`已备份: ${BACKUP_PATH}`);
  } else {
    console.log(`备份已存在，跳过: ${BACKUP_PATH}`);
  }

  // --- 导出人物 ---
  const charDoc = new Document();
  charDoc.createScene('Firefighter');
  const charScene = charDoc.getRoot().listScenes()[0];

  const propertyMap = copyToDocument(charDoc, sceneDoc, charRoots);
  const copiedRoots = charRoots.map((n) => propertyMap.get(n));

  const wrapper = charDoc.createNode('Firefighter');
  wrapper.setName('Firefighter');
  for (const node of copiedRoots) {
    wrapper.addChild(node);
  }
  charScene.addChild(wrapper);

  const spawn = normalizeFeetPivot(wrapper);
  console.log(`人物出生点（分离前世界坐标）: (${spawn.x.toFixed(3)}, ${spawn.y.toFixed(3)}, ${spawn.z.toFixed(3)})`);

  await charDoc.transform(prune());
  await io.write(CHARACTER_PATH, charDoc);
  console.log(`已导出人物: ${CHARACTER_PATH}`);

  // --- 从场景中移除人物 ---
  for (const node of charRoots) {
    scene.removeChild(node);
    node.dispose();
  }

  await sceneDoc.transform(prune());
  await io.write(SCENE_PATH, sceneDoc);
  console.log(`已更新纯场景: ${SCENE_PATH}`);

  console.log('\n完成。');
  console.log(`  人物: ${CHARACTER_PATH}`);
  console.log(`  场景: ${SCENE_PATH}`);
  console.log(`  出生点: (${spawn.x.toFixed(3)}, ${spawn.y.toFixed(3)}, ${spawn.z.toFixed(3)})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
