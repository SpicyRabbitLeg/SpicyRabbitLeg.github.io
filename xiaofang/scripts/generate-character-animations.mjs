/**
 * 为 firefighter.glb 烘焙程序化跑/爬动画并写回文件
 * 用法: node scripts/generate-character-animations.mjs [path]
 */
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { Document, NodeIO } from '@gltf-transform/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { HumanoidBoneMap } from '../src/character/HumanoidBoneMap.js';
import { ProceduralClipFactory } from '../src/character/ProceduralClipFactory.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DEFAULT_PATH = join(ROOT, 'public/models/character/firefighter.glb');

async function loadGltfScene(path) {
  const loader = new GLTFLoader();
  const buf = readFileSync(path);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const gltf = await loader.parseAsync(ab, dirname(path) + '/');
  return gltf;
}

async function main() {
  const modelPath = process.argv[2] || DEFAULT_PATH;
  if (!existsSync(modelPath)) {
    console.error(`找不到模型: ${modelPath}`);
    console.error('请先将 firefighter.glb 放入 public/models/character/');
    process.exit(1);
  }

  console.log('加载模型...', modelPath);
  const gltf = await loadGltfScene(modelPath);

  const boneMap = new HumanoidBoneMap();
  const ready = boneMap.bind(gltf.scene);
  if (!ready) {
    console.error('未识别到人体骨骼，请确认模型含 Hips/LeftUpLeg 等标准命名');
    process.exit(1);
  }

  console.log('已绑定骨骼:', boneMap.getRoles().join(', '));

  const clips = ProceduralClipFactory.createClips(boneMap);
  console.log(`生成 ${clips.length} 个动画 clip:`, clips.map((c) => c.name).join(', '));

  gltf.scene.updateMatrixWorld(true);
  const merged = [...(gltf.animations || [])];
  const existing = new Set(merged.map((c) => c.name.toLowerCase()));
  for (const clip of clips) {
    if (!existing.has(clip.name.toLowerCase())) {
      merged.push(clip);
      existing.add(clip.name.toLowerCase());
    }
  }

  const io = new NodeIO();
  const doc = await io.read(modelPath);

  console.log('\n提示: 运行时也会自动生成相同 clip；');
  console.log('如需永久写入 GLB，请使用 Blender 导入上述关键帧或使用 @gltf-transform 扩展脚本。');
  console.log('当前脚本用于验证骨骼映射与 clip 生成是否正常。');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
