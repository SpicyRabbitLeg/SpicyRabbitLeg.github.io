import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import config from '../config/simulation.config.js';
import { bus, Events } from './EventBus.js';
import { SceneLoader } from '../scene/SceneLoader.js';
import { EnvironmentSetup } from '../scene/EnvironmentSetup.js';
import { SmokeParticles } from '../scene/SmokeParticles.js';
import { CollisionSystem } from '../physics/CollisionSystem.js';
import { EscapeRouteManager } from '../routes/EscapeRouteManager.js';
import { RouteGenerator } from '../routes/RouteGenerator.js';
import { PathFinder } from '../navigation/PathFinder.js';
import { RouteVisualizer } from '../navigation/RouteVisualizer.js';
import { RouteEditor } from '../routes/RouteEditor.js';
import { CharacterController } from '../character/CharacterController.js';
import { AssessmentRecorder } from '../assessment/AssessmentRecorder.js';
import { ReplaySystem } from '../assessment/ReplaySystem.js';
import { InputManager } from '../input/InputManager.js';
import { UIPanel } from '../ui/UIPanel.js';

export class App {
  constructor(canvas) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this.mode = 'ai'; // 'ai' | 'manual' | 'replay'

    this._initRenderer();
    this._initScene();
    this._initCamera();
    this._initControls();

    this.collision = new CollisionSystem(this.scene);
    this.routes = new EscapeRouteManager([]);
    this.pathFinder = new PathFinder(config.navigation);
    this.routeVisualizer = new RouteVisualizer(this.scene);
    this.routeEditor = new RouteEditor(this);
    this.assessment = new AssessmentRecorder(config.assessment);
    this.replay = new ReplaySystem(this.scene);
    this.input = new InputManager(window);
    this.ui = new UIPanel(document.getElementById('ui-root'), this);

    this.character = null;
    this.sceneLoader = new SceneLoader(this.scene, config);
    this.environment = new EnvironmentSetup(this.scene, config.environment);
    this.smoke = null;
    this._recordAccum = 0;

    this._bindEvents();
    this._bindUI();
  }

  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 20, 80);
  }

  _initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
    this.camera.position.set(8, 6, 12);
  }

  _initControls() {
    this.orbit = new OrbitControls(this.camera, this.canvas);
    this.orbit.enableDamping = true;
    this.orbit.target.set(5, 1, 0);
  }

  _bindEvents() {
    window.addEventListener('resize', () => this._onResize());

    bus.on(Events.ROUTE_DEVIATION, (data) => {
      this.assessment.recordDeviation(data);
    });

    bus.on(Events.ACTION_CHANGED, (data) => {
      this.assessment.recordActionChange(data);
    });

    bus.on(Events.ASSESSMENT_COMPLETE, (result) => {
      this.ui.showAssessmentResult(result);
    });
  }

  _bindUI() {
    this.ui.onStartSimulation = () => this.startSimulation();
    this.ui.onStopSimulation = () => this.stopSimulation();
    this.ui.onSelectRoute = (id) => this.selectRoute(id);
    this.ui.onToggleRoutes = (visible) => this.routeVisualizer.setVisible(visible);
    this.ui.onSetMode = (mode) => this.setMode(mode);
    this.ui.onReplay = (opts) => this.replay.control(opts);
    this.ui.onToggleRouteEdit = (enabled) => this.toggleRouteEdit(enabled);
    this.ui.onFinishRoute = (opts) => this.finishCustomRoute(opts);
    this.ui.onUndoRouteNode = () => this.routeEditor.undoLast();
    this.ui.onExportRoutes = () => this.routeEditor.exportAllRoutes();
    this.ui.onImportRoutes = (file) => this.importRoutes(file);
    this.ui.onDeleteRoute = (id) => this.deleteRoute(id);
    this.ui.onSelectPickTarget = (id) => this.routeEditor.setSelectedPickTarget(id);
  }

  async init() {
    try {
      const spatialData = await this.sceneLoader.load();
      this.collision.buildFromSpatialData(spatialData);
      this.collision.setPerformanceOptions(config.performance);
      this.collision.setNavigationOptions(config.navigation);
      if (spatialData.environmentRoot) {
        this.collision.setEnvironmentMeshes(spatialData.environmentRoot);
      }
      this.pathFinder.buildNavGraph(spatialData, this.collision);

      const routes =
        config.autoGenerateRoutes !== false
          ? RouteGenerator.generate(spatialData, this.pathFinder, this.collision)
          : config.routes;
      this.routes = new EscapeRouteManager(routes);

      this.environment.setup(spatialData.bounds);
      this.smoke = new SmokeParticles(this.scene, config.environment);
      this.smoke.init(spatialData.smokeZones);

      this.routeVisualizer.build(this.routes.getAll());
      this.routes.setActive(this.routes.getAll()[0]?.id);

      this.character = new CharacterController(
        this.scene,
        config,
        this.collision,
        this.pathFinder
      );
      await this.character.load(spatialData);

      if (spatialData.spawnPoint) {
        this.character.reset({
          x: spatialData.spawnPoint.x,
          y: spatialData.spawnPoint.y,
          z: spatialData.spawnPoint.z,
        });
      }

      const center = spatialData.bounds.getCenter(new THREE.Vector3());
      const size = spatialData.bounds.getSize(new THREE.Vector3());
      const dist = Math.max(size.x, size.z) * 1.2;
      this.camera.position.set(center.x + dist * 0.6, center.y + dist * 0.5, center.z + dist * 0.6);
      this.orbit.target.copy(center);

      const fogFar = Math.max(size.x, size.z) * 3;
      this.scene.fog = new THREE.Fog(0x1a1a2e, fogFar * 0.2, fogFar);

      bus.emit(Events.SCENE_LOADED, spatialData);
      this.spatialData = spatialData;
      this._collectPickables();
      this._collectPickTargets();
      this.ui.setReady(true);
    } catch (err) {
      console.error('[App] 初始化失败:', err);
      bus.emit(Events.SCENE_ERROR, { message: err.message });
      this.ui.showError(err.message);
    }
  }

  selectRoute(routeId) {
    this.routes.setActive(routeId);
    bus.emit(Events.ROUTE_SELECTED, this.routes.getActive());
    this.routeVisualizer.highlight(routeId);
  }

  _collectPickables() {
    const skip = new Set([
      'RouteVisualizer',
      'RouteEditorPreview',
      'PathMarkers',
      'SmokeParticles',
      'Firefighter',
      'FirefighterPlaceholder',
      'CharacterMotionRoot',
      'EmbeddedFirefighter',
    ]);
    const pickables = [];
    this.scene.traverse((obj) => {
      if (obj.isMesh && !this._isUnderSkippedGroup(obj, skip)) {
        pickables.push(obj);
      }
    });
    this.routeEditor.setPickables(pickables);
  }

  _collectPickTargets() {
    const targets = [{ id: '__all__', name: '全部模型', root: null }];
    const seen = new Set(['__all__']);
    const root = this.spatialData?.environmentRoot;

    if (root) {
      const candidates = root.children.length ? root.children : [root];
      for (const child of candidates) {
        if (!this._hasMesh(child)) continue;
        const id = child.uuid;
        if (seen.has(id)) continue;
        seen.add(id);
        targets.push({
          id,
          name: child.name?.trim() || `未命名模型 ${targets.length}`,
          root: child,
        });
      }
    }

    const spatialLists = [
      this.spatialData?.grounds,
      this.spatialData?.stairs,
      this.spatialData?.walls,
      this.spatialData?.navZones,
    ];
    for (const list of spatialLists) {
      for (const entry of list || []) {
        const obj = entry?.object;
        if (!obj || seen.has(obj.uuid)) continue;
        seen.add(obj.uuid);
        targets.push({
          id: obj.uuid,
          name: entry.name?.trim() || obj.name?.trim() || `节点 ${targets.length}`,
          root: obj,
        });
      }
    }

    this.routeEditor.setPickTargets(targets);
    this.ui?.refreshPickTargets?.(targets, this.routeEditor.selectedPickTargetId);
  }

  _hasMesh(obj) {
    let found = false;
    obj.traverse((child) => {
      if (child.isMesh) found = true;
    });
    return found;
  }

  _isUnderSkippedGroup(obj, skipNames) {
    let node = obj;
    while (node) {
      if (skipNames.has(node.name)) return true;
      node = node.parent;
    }
    return false;
  }

  toggleRouteEdit(enabled) {
    if (enabled) {
      if (this._running) return;
      this.routeEditor.start();
    } else {
      this.routeEditor.stop();
    }
  }

  finishCustomRoute({ name, tag }) {
    const result = this.routeEditor.finishRoute({ name, tag });
    if (!result.ok) {
      this.ui.showRouteEditorMessage(result.error, true);
      return;
    }
    this.selectRoute(result.route.id);
    this.ui.showRouteEditorMessage(`已保存路线「${result.route.name}」`, false);
  }

  async importRoutes(file) {
    try {
      const count = await this.routeEditor.importRoutes(file);
      this.ui.showRouteEditorMessage(`已导入 ${count} 条路线`, false);
    } catch (err) {
      this.ui.showRouteEditorMessage(err.message, true);
    }
  }

  deleteRoute(routeId) {
    this.routes.removeRoute(routeId);
    this.routeVisualizer.removeRoute(routeId);
    this.ui.refreshRoutes(this.routes.getAll()[0]?.id);
  }

  setMode(mode) {
    this.mode = mode;
    this.character?.setControlMode(mode === 'manual' ? 'manual' : 'ai');
    bus.emit(Events.MODE_CHANGED, mode);
  }

  startSimulation() {
    const route = this.routes.getActive();
    if (!route) return;

    this.assessment.start(route);
    this.replay.clear();

    const node0 = route.nodes[0];
    const start =
      this.collision.resolveRouteSpawn(node0) ||
      this.pathFinder.snapToWalkable(node0);
    this.character.reset({ x: start.x, y: start.y, z: start.z });
    this.character.followRoute(route, this.mode === 'ai');
    this._running = true;
  }

  stopSimulation() {
    this._running = false;
    const result = this.assessment.finish(this.character?.getState());
    this.replay.loadFrames(this.assessment.getRecording());
    bus.emit(Events.ASSESSMENT_COMPLETE, result);
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  update() {
    const delta = this.clock.getDelta();

    if (this._running && this.mode !== 'replay') {
      const inputState = this.mode === 'manual' ? this.input.getState() : null;
      this.character?.update(delta, inputState);
      const state = this.character?.getState();
      this.assessment.update(delta, state, this.routes);
      this._recordAccum += delta;
      const interval = config.performance?.recordFrameInterval ?? 0.05;
      if (this._recordAccum >= interval) {
        this.assessment.recordFrame(state);
        this._recordAccum = 0;
      }
    }

    this.smoke?.update(delta);
    this.orbit.update();
    this.renderer.render(this.scene, this.camera);
  }

  run() {
    const loop = () => {
      requestAnimationFrame(loop);
      this.update();
    };
    loop();
  }
}
