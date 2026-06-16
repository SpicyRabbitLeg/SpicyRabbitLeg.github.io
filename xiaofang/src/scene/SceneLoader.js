import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { SpatialNodeParser } from './SpatialNodeParser.js';
import { DemoSceneBuilder } from './DemoSceneBuilder.js';
import { EmbeddedCharacterExtractor } from './EmbeddedCharacterExtractor.js';

/**
 * 场景加载模块 — GLB/GLTF 解析 + 空间节点自动标记 + 内嵌人物分离
 */
export class SceneLoader {
  constructor(scene, config) {
    this.scene = scene;
    this.config = config;
    this.parser = new SpatialNodeParser(config.spatialNaming);
    this.loader = new GLTFLoader();
    this.draco = new DRACOLoader();
    this.draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    this.loader.setDRACOLoader(this.draco);
    this.embeddedCharacter = null;
    this.spawnPoint = null;
  }

  async load() {
    if (this.config.useDemoScene) {
      const demo = new DemoSceneBuilder(this.scene);
      return demo.build();
    }

    try {
      const gltf = await this.loader.loadAsync(this.config.models.scene);

      let environmentRoot = gltf.scene;
      let extraction = null;

      if (this.config.embeddedCharacter?.enabled !== false) {
        const extractor = new EmbeddedCharacterExtractor(this.config.embeddedCharacter);
        extraction = extractor.extract(gltf.scene);
        environmentRoot = extraction.environment;
        this.embeddedCharacter = extraction.embeddedCharacter;
        this.spawnPoint = extraction.spawnPoint;
      }

      this.scene.add(environmentRoot);
      environmentRoot.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) child.material.side = THREE.FrontSide;
        }
      });

      const spatialData = this.parser.parse(environmentRoot);

      if (this.spawnPoint && this.config.embeddedCharacter?.enabled !== false) {
        spatialData.spawnPoint = this.spawnPoint.clone();
      } else if (this.config.characterSpawn) {
        const s = this.config.characterSpawn;
        spatialData.spawnPoint = new THREE.Vector3(s.x, s.y, s.z);
      }

      spatialData.embeddedCharacter = this.embeddedCharacter;
      spatialData.gltfAnimations = gltf.animations || [];
      spatialData.environmentRoot = environmentRoot;

      if (extraction?.characterNodeNames?.length) {
        console.info('[SceneLoader] 已从场景中分离内嵌人物:', extraction.characterNodeNames.join(', '));
      }

      return spatialData;
    } catch (err) {
      throw new Error(`场景模型加载失败 (${this.config.models.scene}): ${err.message}`);
    }
  }

  getEmbeddedCharacter() {
    return this.embeddedCharacter;
  }
}
