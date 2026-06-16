/**
 * 分析 GLB 空间节点世界坐标（用于校准路线）
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const glbPath = join(__dirname, '../public/models/scene/indoor-scene.glb');

const buf = readFileSync(glbPath);
const jsonLen = buf.readUInt32LE(12);
const gltf = JSON.parse(buf.slice(20, 20 + jsonLen).toString('utf8'));

const nodes = gltf.nodes;
const scenes = gltf.scenes;

const naming = {
  wall: ['立方体', '柱体', '边框', '网格'],
  ground: ['平面'],
  stair: ['斜梯'],
  exit: ['电磁门'],
  obstacle: ['绳子'],
};

function matchType(name) {
  for (const [type, kws] of Object.entries(naming)) {
    if (kws.some((k) => name.includes(k))) return type;
  }
  return null;
}

function mat4FromNode(node, parent = null) {
  const t = node.translation || [0, 0, 0];
  const r = node.rotation || [0, 0, 0, 1];
  const s = node.scale || [1, 1, 1];
  // simplified: just use translation for root-level nodes (most in this glb are root meshes)
  return { t, r, s };
}

const classified = { wall: [], ground: [], stair: [], exit: [], obstacle: [], other: [] };
const rootIndices = scenes[0].nodes;

rootIndices.forEach((idx) => {
  const n = nodes[idx];
  if (!n?.name || n.name.includes('Group-836488') || n.name.includes('Obj3d66')) return;
  const type = matchType(n.name) || 'other';
  const t = n.translation || [0, 0, 0];
  classified[type].push({ name: n.name, pos: t });
});

console.log('Counts:', Object.fromEntries(Object.entries(classified).map(([k, v]) => [k, v.length])));

['ground', 'stair', 'exit'].forEach((type) => {
  console.log(`\n=== ${type} ===`);
  classified[type].slice(0, 8).forEach((e) =>
    console.log(`  ${e.name}: [${e.pos.map((v) => v.toFixed(2)).join(', ')}]`)
  );
});

const allPos = rootIndices
  .map((i) => nodes[i]?.translation)
  .filter(Boolean)
  .flat();
if (allPos.length) {
  const xs = rootIndices.map((i) => nodes[i]?.translation?.[0] ?? 0);
  const ys = rootIndices.map((i) => nodes[i]?.translation?.[1] ?? 0);
  const zs = rootIndices.map((i) => nodes[i]?.translation?.[2] ?? 0);
  console.log('\n=== Scene translation bounds (root nodes only) ===');
  console.log('X:', Math.min(...xs).toFixed(2), '->', Math.max(...xs).toFixed(2));
  console.log('Y:', Math.min(...ys).toFixed(2), '->', Math.max(...ys).toFixed(2));
  console.log('Z:', Math.min(...zs).toFixed(2), '->', Math.max(...zs).toFixed(2));
}
