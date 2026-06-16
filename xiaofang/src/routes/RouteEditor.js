import * as THREE from 'three';

/**
 * 逃生路线编辑器 — 在 3D 模型表面点击取点标注路线
 */
export class RouteEditor {
  constructor(app) {
    this.app = app;
    this.active = false;
    this.draftNodes = [];
    this.pickables = [];
    this.pickTargets = [];
    this.selectedPickTargetId = '__all__';
    this._savedOrbit = null;
    this._targetHighlight = null;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this._hitPoint = new THREE.Vector3();

    this.previewGroup = new THREE.Group();
    this.previewGroup.name = 'RouteEditorPreview';
    app.scene.add(this.previewGroup);

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._rightDownPos = null;
    this._onContextMenu = (e) => {
      if (this.active) e.preventDefault();
    };
  }

  setPickables(objects) {
    this.pickables = objects;
  }

  setPickTargets(targets) {
    this.pickTargets = targets;
    if (!targets.some((t) => t.id === this.selectedPickTargetId)) {
      this.selectedPickTargetId = '__all__';
    }
    this._updateTargetHighlight();
  }

  setSelectedPickTarget(id) {
    this.selectedPickTargetId = id;
    this._updateTargetHighlight();
  }

  getPickTargets() {
    return this.pickTargets;
  }

  start() {
    if (this.active) return;
    this.active = true;
    this.draftNodes = [];
    this._updatePreview();
    this._setOrbitForEdit(true);
    this._updateTargetHighlight();
    this.app.canvas.addEventListener('pointerdown', this._onPointerDown, true);
    this.app.canvas.addEventListener('pointerup', this._onPointerUp);
    this.app.canvas.addEventListener('contextmenu', this._onContextMenu);
    this.app.canvas.style.cursor = 'crosshair';
  }

  stop() {
    if (!this.active) return;
    this.active = false;
    this.draftNodes = [];
    this._clearPreview();
    this._clearTargetHighlight();
    this._setOrbitForEdit(false);
    this.app.canvas.removeEventListener('pointerdown', this._onPointerDown, true);
    this.app.canvas.removeEventListener('pointerup', this._onPointerUp);
    this.app.canvas.removeEventListener('contextmenu', this._onContextMenu);
    this._rightDownPos = null;
    this.app.canvas.style.cursor = '';
  }

  _setOrbitForEdit(editing) {
    const orbit = this.app.orbit;
    if (editing) {
      this._savedOrbit = {
        mouseButtons: { ...orbit.mouseButtons },
        touches: { ...orbit.touches },
      };
      // 左键留给打点，右键拖拽旋转视角
      orbit.enableRotate = true;
      orbit.mouseButtons = {
        LEFT: null,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
      };
      orbit.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      };
    } else if (this._savedOrbit) {
      orbit.mouseButtons = { ...this._savedOrbit.mouseButtons };
      orbit.touches = { ...this._savedOrbit.touches };
      this._savedOrbit = null;
    }
  }

  _onPointerDown(event) {
    if (!this.active || this.app._running) return;

    if (event.button === 2) {
      this._rightDownPos = { x: event.clientX, y: event.clientY };
      return;
    }

    if (event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    const point = this._pickSurface(event);
    if (!point) return;

    this.draftNodes.push(point);
    this._updatePreview();
    this.app.ui?.updateRouteEditorState?.(this.getDraftState());
  }

  _onPointerUp(event) {
    if (!this.active || this.app._running || event.button !== 2) return;
    if (!this._rightDownPos) return;

    const dx = event.clientX - this._rightDownPos.x;
    const dy = event.clientY - this._rightDownPos.y;
    this._rightDownPos = null;

    if (Math.hypot(dx, dy) < 6) {
      this.undoLast();
    }
  }

  _getActivePickables() {
    if (!this.selectedPickTargetId || this.selectedPickTargetId === '__all__') {
      return this.pickables;
    }

    const target = this.pickTargets.find((t) => t.id === this.selectedPickTargetId);
    if (!target?.root) return this.pickables;

    const meshes = [];
    target.root.traverse((obj) => {
      if (obj.isMesh) meshes.push(obj);
    });
    return meshes.length ? meshes : this.pickables;
  }

  _pickSurface(event) {
    const rect = this.app.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.app.camera);
    const hits = this.raycaster.intersectObjects(this._getActivePickables(), true);
    if (!hits.length) return null;

    const useDirectHit =
      this.selectedPickTargetId && this.selectedPickTargetId !== '__all__';
    const hit = useDirectHit ? hits[0] : this._selectFloorHit(hits);
    const point = hit.point.clone();

    // 优先使用模型射线交点高度；仅在附近有匹配楼层地面时才微调
    const nearGround = this.app.collision.getGroundHeightNear(point.x, point.z, point.y);
    if (nearGround !== null && Math.abs(nearGround - point.y) < 1.5) {
      point.y = nearGround;
    }

    return point;
  }

  /** 优先选取朝上的水平面（地板/楼梯），避免点到墙体时落到错误楼层 */
  _selectFloorHit(hits) {
    const worldNormal = new THREE.Vector3();
    for (const hit of hits) {
      if (!hit.face) continue;
      worldNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
      if (worldNormal.y > 0.45) return hit;
    }
    return hits[0];
  }

  undoLast() {
    if (!this.draftNodes.length) return;
    this.draftNodes.pop();
    this._updatePreview();
    this.app.ui?.updateRouteEditorState?.(this.getDraftState());
  }

  getDraftState() {
    return {
      nodeCount: this.draftNodes.length,
      nodes: this.draftNodes.map((n) => ({ x: n.x, y: n.y, z: n.z })),
    };
  }

  finishRoute({ name, tag }) {
    if (this.draftNodes.length < 2) {
      return { ok: false, error: '至少需要 2 个节点才能完成路线' };
    }

    const route = {
      id: `route-custom-${Date.now()}`,
      name: name || `自定义路线 ${this.app.routes.getAll().length + 1}`,
      tag: tag || 'simple',
      nodes: this.draftNodes.map((n) => ({
        x: +n.x.toFixed(3),
        y: +n.y.toFixed(3),
        z: +n.z.toFixed(3),
      })),
      requiredActions: [],
    };

    this.app.routes.addRoute(route);
    this.app.routeVisualizer.addRoute(route);
    this.draftNodes = [];
    this._updatePreview();
    this.app.ui?.refreshRoutes?.(route.id);

    return { ok: true, route };
  }

  exportAllRoutes() {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      routes: this.app.routes.getAll(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `escape-routes-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importRoutes(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          const routes = Array.isArray(data) ? data : data.routes;
          if (!Array.isArray(routes) || !routes.length) {
            reject(new Error('文件中没有有效的路线数据'));
            return;
          }

          routes.forEach((r) => {
            if (!r.id || !r.nodes?.length) return;
            this.app.routes.addRoute(r);
            this.app.routeVisualizer.addRoute(r);
          });

          this.app.ui?.refreshRoutes?.(routes[0]?.id);
          resolve(routes.length);
        } catch (err) {
          reject(new Error(`解析失败: ${err.message}`));
        }
      };
      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsText(file);
    });
  }

  _clearPreview() {
    this.previewGroup.clear();
    if (this._targetHighlight) {
      this.previewGroup.add(this._targetHighlight);
    }
  }

  _clearTargetHighlight() {
    if (this._targetHighlight) {
      this.previewGroup.remove(this._targetHighlight);
      this._targetHighlight.geometry?.dispose();
      this._targetHighlight.material?.dispose();
      this._targetHighlight = null;
    }
  }

  _updateTargetHighlight() {
    this._clearTargetHighlight();
    if (
      !this.active ||
      !this.selectedPickTargetId ||
      this.selectedPickTargetId === '__all__'
    ) {
      return;
    }

    const target = this.pickTargets.find((t) => t.id === this.selectedPickTargetId);
    if (!target?.root) return;

    const box = new THREE.Box3().setFromObject(target.root);
    if (box.isEmpty()) return;

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffcc00,
      wireframe: true,
      transparent: true,
      opacity: 0.55,
      depthTest: false,
    });
    this._targetHighlight = new THREE.Mesh(geo, mat);
    this._targetHighlight.position.copy(center);
    this._targetHighlight.renderOrder = 999;
    this.previewGroup.add(this._targetHighlight);
  }

  _updatePreview() {
    this._clearPreview();
    if (!this.draftNodes.length) return;

    const color = 0xffcc00;

    this.draftNodes.forEach((p, i) => {
      const geo = new THREE.SphereGeometry(0.18, 10, 10);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(p);
      mesh.position.y += 0.2;
      this.previewGroup.add(mesh);

      const label = this._createLabel(String(i + 1));
      label.position.copy(mesh.position);
      label.position.y += 0.35;
      this.previewGroup.add(label);
    });

    if (this.draftNodes.length >= 2) {
      const points = this.draftNodes.map((n) => n.clone());
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const lineMat = new THREE.LineDashedMaterial({
        color,
        dashSize: 0.3,
        gapSize: 0.15,
        linewidth: 1,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances();
      this.previewGroup.add(line);

      const curve = new THREE.CatmullRomCurve3(points);
      const tubeGeo = new THREE.TubeGeometry(curve, points.length * 6, 0.06, 6, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.6,
      });
      this.previewGroup.add(new THREE.Mesh(tubeGeo, tubeMat));
    }
  }

  _createLabel(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 32, 32);

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.5, 0.5, 1);
    return sprite;
  }
}
