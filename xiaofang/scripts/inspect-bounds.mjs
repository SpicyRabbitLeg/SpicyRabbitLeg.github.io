import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EmbeddedCharacterExtractor } from '../src/scene/EmbeddedCharacterExtractor.js';

import { pathToFileURL } from 'url';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const glbUrl = pathToFileURL(join(__dirname, '../public/models/scene/indoor-scene.glb')).href;

const loader = new GLTFLoader();
const gltf = await loader.loadAsync(glbUrl);

const extractor = new EmbeddedCharacterExtractor({
  patterns: ['Group-836488', 'Obj3d66'],
});
const { environment, embeddedCharacter, spawnPoint } = extractor.extract(gltf.scene);

const sceneBox = new THREE.Box3().setFromObject(environment);
const charBox = embeddedCharacter ? new THREE.Box3().setFromObject(embeddedCharacter) : null;

console.log('Scene bounds:', sceneBox.min.toArray().map(v => v.toFixed(2)), '->', sceneBox.max.toArray().map(v => v.toFixed(2)));
if (charBox) {
  const size = charBox.getSize(new THREE.Vector3());
  console.log('Character bounds:', charBox.min.toArray().map(v => v.toFixed(2)), '->', charBox.max.toArray().map(v => v.toFixed(2)));
  console.log('Character size:', size.toArray().map(v => v.toFixed(2)));
  console.log('Spawn:', spawnPoint?.toArray().map(v => v.toFixed(2)));
}
