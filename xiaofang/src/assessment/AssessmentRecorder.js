import { bus, Events } from '../core/EventBus.js';
import { RouteDeviationTracker } from '../routes/RouteDeviationTracker.js';

/**
 * 逃生考核数据统计模块
 */
export class AssessmentRecorder {
  constructor(config) {
    this.config = config;
    this.deviationTracker = new RouteDeviationTracker(config.deviationThreshold ?? 1.5);
    this.reset();
  }

  reset() {
    this.running = false;
    this.startTime = 0;
    this.elapsed = 0;
    this.route = null;
    this.actionChanges = 0;
    this.completedActions = new Set();
    this.actionDurations = {};
    this.stallTime = 0;
    this.lastPosition = null;
    this.segmentTimes = [];
    this.currentSegmentStart = 0;
    this.recording = [];
    this.deviationTracker.reset();
  }

  start(route) {
    this.reset();
    this.running = true;
    this.startTime = performance.now();
    this.route = route;
    this.currentSegmentStart = 0;
  }

  update(delta, charState, routeManager) {
    if (!this.running || !charState) return;

    this.elapsed += delta;
    const route = routeManager.getActive();

    this.deviationTracker.update(charState.position, routeManager, route, this.elapsed);

    if (this.lastPosition) {
      const moved = charState.position.distanceTo(this.lastPosition);
      if (moved < 0.01) this.stallTime += delta;
    }
    this.lastPosition = charState.position.clone();

    if (charState.action && charState.action !== 'idle') {
      this.completedActions.add(charState.action);
    }

    const action = charState.action || 'idle';
    this.actionDurations[action] = (this.actionDurations[action] || 0) + delta;

    bus.emit(Events.ASSESSMENT_UPDATE, this.getLiveStats(charState, routeManager));
  }

  recordActionChange(data) {
    this.actionChanges++;
    if (data?.action) this.completedActions.add(data.action);
  }

  recordFrame(state) {
    if (!this.running || !state) return;
    this.recording.push({
      t: this.elapsed,
      position: state.position.toArray(),
      rotation: state.rotation,
      action: state.action,
    });
  }

  recordDeviation() {
    // counted in deviationTracker
  }

  getLiveStats(charState, routeManager) {
    const segmentIdx = routeManager.getCurrentSegmentIndex(charState.position, this.route);
    return {
      elapsed: this.elapsed,
      action: charState.action,
      segment: segmentIdx,
      deviations: this.deviationTracker.deviationCount,
      stallTime: this.stallTime,
      runTime: this.actionDurations.run || 0,
      crawlTime: (this.actionDurations.crawl || 0) + (this.actionDurations.crouch || 0),
    };
  }

  finish(charState) {
    this.running = false;
    const result = this._evaluate(charState);
    return result;
  }

  _evaluate(charState) {
    const timeOk = this.elapsed <= this.config.timeLimitSeconds;
    const deviationOk = this.deviationTracker.deviationCount <= this.config.maxDeviationCount;

    const required = this.route?.requiredActions || this.config.requiredActions || [];
    const missingActions = required.filter((a) => !this.completedActions.has(a));

    let reachedExit = false;
    if (charState && this.route?.nodes?.length) {
      const last = this.route.nodes[this.route.nodes.length - 1];
      const dist = Math.hypot(charState.position.x - last.x, charState.position.z - last.z);
      reachedExit = dist < 2;
    }

    const passed = timeOk && deviationOk && missingActions.length === 0 && reachedExit;
    let score = 100;
    if (!timeOk) score -= 30;
    if (!deviationOk) score -= 10 * this.deviationTracker.deviationCount;
    score -= missingActions.length * 15;
    if (!reachedExit) score = 0;

    return {
      passed,
      score: Math.max(0, score),
      elapsed: this.elapsed,
      actionChanges: this.actionChanges,
      deviationCount: this.deviationTracker.deviationCount,
      deviationTime: this.deviationTracker.totalDeviationTime,
      stallTime: this.stallTime,
      runTime: this.actionDurations.run || 0,
      crawlTime: (this.actionDurations.crawl || 0) + (this.actionDurations.crouch || 0),
      completedActions: [...this.completedActions],
      missingActions,
      reachedExit,
      timeOk,
    };
  }

  getRecording() {
    return this.recording;
  }
}
