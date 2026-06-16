import { bus, Events } from '../core/EventBus.js';

/**
 * UI 交互面板
 */
export class UIPanel {
  constructor(root, app) {
    this.root = root;
    this.app = app;
    this.ready = false;
    this._render();
    this._bindAssessment();
  }

  _render() {
    this.root.innerHTML = `
      <div class="panel">
        <h1>消防逃生模拟系统</h1>
        <div class="section">
          <label>控制模式</label>
          <select id="mode-select">
            <option value="ai">AI 自动模拟</option>
            <option value="manual">手动操控</option>
          </select>
        </div>
        <div class="section">
          <label>逃生路线</label>
          <select id="route-select"></select>
          <label class="checkbox"><input type="checkbox" id="show-routes" checked /> 显示全部路线</label>
        </div>
        <div class="section route-editor" id="route-editor-section">
          <label class="checkbox"><input type="checkbox" id="route-edit-mode" /> 编辑逃生路线</label>
          <div id="route-editor-panel" class="route-editor-panel hidden">
            <input type="text" id="route-name" placeholder="路线名称" />
            <select id="route-tag">
              <option value="simple">简单 [simple]</option>
              <option value="complex">复杂 [complex]</option>
              <option value="narrow">狭窄 [narrow]</option>
            </select>
            <label>标注目标模型</label>
            <select id="route-pick-target"></select>
            <div class="route-editor-status">已标注 <span id="route-node-count">0</span> 个节点</div>
            <div class="route-editor-actions">
              <button type="button" id="btn-undo-node">撤销上一点</button>
              <button type="button" id="btn-finish-route">完成路线</button>
            </div>
            <div class="route-editor-io">
              <button type="button" id="btn-export-routes">导出 JSON</button>
              <label class="btn-import">
                导入 JSON
                <input type="file" id="route-import-file" accept=".json" hidden />
              </label>
              <button type="button" id="btn-delete-route" class="danger">删除当前路线</button>
            </div>
            <p class="route-editor-hint">左键添加节点 · 右键拖拽旋转视角 · 右键单击撤销 · 滚轮缩放</p>
            <div id="route-editor-msg" class="route-editor-msg hidden"></div>
          </div>
        </div>
        <div class="section actions">
          <button id="btn-start" disabled>开始演练</button>
          <button id="btn-stop" disabled>结束考核</button>
        </div>
        <div class="section stats" id="stats">
          <div>耗时: <span id="stat-time">0.0s</span></div>
          <div>当前动作: <span id="stat-action">-</span></div>
          <div>跑步时长: <span id="stat-run">0.0s</span></div>
          <div>低姿时长: <span id="stat-crawl">0.0s</span></div>
          <div>路线偏离: <span id="stat-deviation">0</span></div>
        </div>
        <div class="section help">
          <p>手动模式: WASD 移动 | Shift 奔跑 | Ctrl 慢走</p>
          <p>C 匍匐 | 空格 跳跃 | E 楼梯 | F 钻洞</p>
        </div>
        <div id="result" class="result hidden"></div>
        <div id="error" class="error hidden"></div>
      </div>
    `;

    this.el = {
      mode: this.root.querySelector('#mode-select'),
      route: this.root.querySelector('#route-select'),
      showRoutes: this.root.querySelector('#show-routes'),
      start: this.root.querySelector('#btn-start'),
      stop: this.root.querySelector('#btn-stop'),
      time: this.root.querySelector('#stat-time'),
      action: this.root.querySelector('#stat-action'),
      run: this.root.querySelector('#stat-run'),
      crawl: this.root.querySelector('#stat-crawl'),
      deviation: this.root.querySelector('#stat-deviation'),
      result: this.root.querySelector('#result'),
      error: this.root.querySelector('#error'),
      routeEditMode: this.root.querySelector('#route-edit-mode'),
      routeEditorPanel: this.root.querySelector('#route-editor-panel'),
      routeName: this.root.querySelector('#route-name'),
      routeTag: this.root.querySelector('#route-tag'),
      routePickTarget: this.root.querySelector('#route-pick-target'),
      routeNodeCount: this.root.querySelector('#route-node-count'),
      undoNode: this.root.querySelector('#btn-undo-node'),
      finishRoute: this.root.querySelector('#btn-finish-route'),
      exportRoutes: this.root.querySelector('#btn-export-routes'),
      importFile: this.root.querySelector('#route-import-file'),
      deleteRoute: this.root.querySelector('#btn-delete-route'),
      routeEditorMsg: this.root.querySelector('#route-editor-msg'),
    };

    this.el.mode.addEventListener('change', () => this.onSetMode?.(this.el.mode.value));
    this.el.route.addEventListener('change', () => this.onSelectRoute?.(this.el.route.value));
    this.el.showRoutes.addEventListener('change', () =>
      this.onToggleRoutes?.(this.el.showRoutes.checked)
    );
    this.el.start.addEventListener('click', () => {
      this.el.start.disabled = true;
      this.el.stop.disabled = false;
      this.onStartSimulation?.();
    });
    this.el.stop.addEventListener('click', () => {
      this.el.start.disabled = false;
      this.el.stop.disabled = true;
      this.onStopSimulation?.();
    });

    this.el.routeEditMode.addEventListener('change', () => {
      const enabled = this.el.routeEditMode.checked;
      this.el.routeEditorPanel.classList.toggle('hidden', !enabled);
      this.el.start.disabled = enabled || !this.ready;
      this.onToggleRouteEdit?.(enabled);
    });
    this.el.routePickTarget.addEventListener('change', () => {
      this.onSelectPickTarget?.(this.el.routePickTarget.value);
    });
    this.el.undoNode.addEventListener('click', () => this.onUndoRouteNode?.());
    this.el.finishRoute.addEventListener('click', () => {
      this.onFinishRoute?.({
        name: this.el.routeName.value.trim(),
        tag: this.el.routeTag.value,
      });
    });
    this.el.exportRoutes.addEventListener('click', () => this.onExportRoutes?.());
    this.el.importFile.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file) this.onImportRoutes?.(file);
      e.target.value = '';
    });
    this.el.deleteRoute.addEventListener('click', () => {
      const id = this.el.route.value;
      if (id && confirm('确定删除当前选中的路线？')) {
        this.onDeleteRoute?.(id);
      }
    });
  }

  _bindAssessment() {
    bus.on(Events.ASSESSMENT_UPDATE, (stats) => {
      this.el.time.textContent = `${stats.elapsed.toFixed(1)}s`;
      this.el.action.textContent = stats.action;
      this.el.run.textContent = `${(stats.runTime || 0).toFixed(1)}s`;
      this.el.crawl.textContent = `${(stats.crawlTime || 0).toFixed(1)}s`;
      this.el.deviation.textContent = String(stats.deviations);
    });
  }

  setReady(ready) {
    this.ready = ready;
    this.el.start.disabled = !ready || this.el.routeEditMode.checked;
    this.refreshRoutes();
  }

  refreshRoutes(selectId) {
    const routes = this.app.routes.getAll();
    const current = selectId || this.el.route.value;
    this.el.route.innerHTML = routes
      .map((r) => `<option value="${r.id}">${r.name} [${r.tag}]</option>`)
      .join('');
    if (current && routes.some((r) => r.id === current)) {
      this.el.route.value = current;
    }
    this.onSelectRoute?.(this.el.route.value);
  }

  refreshPickTargets(targets, selectedId) {
    const current = selectedId || this.el.routePickTarget.value;
    this.el.routePickTarget.innerHTML = targets
      .map((t) => `<option value="${t.id}">${t.name}</option>`)
      .join('');
    if (current && targets.some((t) => t.id === current)) {
      this.el.routePickTarget.value = current;
    }
    this.onSelectPickTarget?.(this.el.routePickTarget.value);
  }

  updateRouteEditorState(state) {
    this.el.routeNodeCount.textContent = String(state.nodeCount);
  }

  showRouteEditorMessage(msg, isError) {
    this.el.routeEditorMsg.textContent = msg;
    this.el.routeEditorMsg.className = `route-editor-msg ${isError ? 'error-msg' : 'ok-msg'}`;
  }

  showAssessmentResult(result) {
    const cls = result.passed ? 'pass' : 'fail';
    this.el.result.className = `result ${cls}`;
    this.el.result.innerHTML = `
      <h3>${result.passed ? '考核通过' : '考核未通过'}</h3>
      <p>得分: ${result.score}</p>
      <p>总耗时: ${result.elapsed.toFixed(1)}s</p>
      <p>跑步时长: ${(result.runTime || 0).toFixed(1)}s</p>
      <p>低姿时长: ${(result.crawlTime || 0).toFixed(1)}s</p>
      <p>动作切换: ${result.actionChanges} 次</p>
      <p>偏离次数: ${result.deviationCount}</p>
      <p>停滞时长: ${result.stallTime.toFixed(1)}s</p>
      ${result.missingActions.length ? `<p>缺失动作: ${result.missingActions.join(', ')}</p>` : ''}
    `;
  }

  showError(msg) {
    this.el.error.className = 'error';
    this.el.error.textContent = msg;
  }
}
