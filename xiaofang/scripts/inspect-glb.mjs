/**
 * 一次性 GLB 结构检查脚本
 * node scripts/inspect-glb.mjs [path]
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const glbPath = process.argv[2] || join(__dirname, '../public/models/scene/indoor-scene.glb');

const buf = readFileSync(glbPath);
const magic = buf.readUInt32LE(0);
if (magic !== 0x46546c67) {
  console.error('Not a GLB file');
  process.exit(1);
}

const jsonLen = buf.readUInt32LE(12);
const jsonStr = buf.slice(20, 20 + jsonLen).toString('utf8');
const gltf = JSON.parse(jsonStr);

const nodes = gltf.nodes || [];
const meshes = gltf.meshes || [];
const skins = gltf.skins || [];
const animations = gltf.animations || [];
const scenes = gltf.scenes || [];

console.log('=== GLB Summary ===');
console.log('File:', glbPath);
console.log('Nodes:', nodes.length);
console.log('Meshes:', meshes.length);
console.log('Skins:', skins.length);
console.log('Animations:', animations.length);
console.log('Scenes:', scenes.length);

if (animations.length) {
  console.log('\n=== Animations ===');
  animations.forEach((a, i) => console.log(`  [${i}] ${a.name || '(unnamed)'}`));
}

if (skins.length) {
  console.log('\n=== Skins (rigged characters) ===');
  skins.forEach((s, i) => {
    const jointNames = (s.joints || []).map((j) => nodes[j]?.name || `node_${j}`);
    console.log(`  Skin ${i}: joints=${s.joints?.length}, root=${nodes[s.skeleton]?.name || s.skeleton}`);
    console.log(`    Sample joints: ${jointNames.slice(0, 8).join(', ')}${jointNames.length > 8 ? '...' : ''}`);
  });
}

const keywords = /fire|fighter|character|player|human|person|消防|员|人|hero|avatar|rig|body|armature|骨骼/i;

console.log('\n=== Character-like nodes ===');
nodes.forEach((n, i) => {
  const name = n.name || '';
  const mesh = n.mesh != null ? meshes[n.mesh] : null;
  const hasSkin = n.skin != null;
  const isSkinned = hasSkin || (mesh && mesh.primitives?.some((p) => p.attributes?.JOINTS_0));
  if (keywords.test(name) || hasSkin || isSkinned) {
    console.log(`  [${i}] "${name}" mesh=${n.mesh ?? '-'} skin=${n.skin ?? '-'} children=${JSON.stringify(n.children || [])}`);
  }
});

console.log('\n=== All root scene children ===');
const rootNodes = scenes[0]?.nodes || [];
rootNodes.forEach((idx) => {
  const n = nodes[idx];
  console.log(`  [${idx}] "${n?.name || '(unnamed)'}" children=${n?.children?.length || 0}`);
});

console.log('\n=== Full node tree (depth 3) ===');
function printTree(nodeIdx, depth = 0, maxDepth = 4) {
  if (depth > maxDepth || nodeIdx == null) return;
  const n = nodes[nodeIdx];
  if (!n) return;
  const indent = '  '.repeat(depth);
  const flags = [];
  if (n.mesh != null) flags.push('Mesh');
  if (n.skin != null) flags.push('Skin');
  if (n.children?.length) flags.push(`children:${n.children.length}`);
  console.log(`${indent}[${nodeIdx}] ${n.name || '(unnamed)'} ${flags.length ? '(' + flags.join(', ') + ')' : ''}`);
  (n.children || []).forEach((c) => printTree(c, depth + 1, maxDepth));
}
rootNodes.forEach((idx) => printTree(idx, 0, 5));

console.log('\n=== All node names (flat) ===');
nodes.forEach((n, i) => {
  const parts = [];
  if (n.mesh != null) parts.push('M');
  if (n.skin != null) parts.push('S');
  console.log(`  ${String(i).padStart(4)} ${(n.name || '').padEnd(50)} ${parts.join('')}`);
});
