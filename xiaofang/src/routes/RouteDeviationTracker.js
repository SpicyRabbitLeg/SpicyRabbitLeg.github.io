import { bus, Events } from '../core/EventBus.js';

/**
 * 路线偏离检测与记录
 */
export class RouteDeviationTracker {
  constructor(threshold = 1.5) {
    this.threshold = threshold;
    this.isDeviating = false;
    this.deviationStart = 0;
    this.totalDeviationTime = 0;
    this.deviationCount = 0;
  }

  update(position, routeManager, route, elapsed) {
    const dist = routeManager.distanceToRoute(position, route);
    const deviating = dist > this.threshold;

    if (deviating && !this.isDeviating) {
      this.isDeviating = true;
      this.deviationStart = elapsed;
      this.deviationCount++;
      bus.emit(Events.ROUTE_DEVIATION, {
        type: 'start',
        distance: dist,
        count: this.deviationCount,
      });
    } else if (!deviating && this.isDeviating) {
      this.totalDeviationTime += elapsed - this.deviationStart;
      this.isDeviating = false;
      bus.emit(Events.ROUTE_DEVIATION, {
        type: 'end',
        duration: elapsed - this.deviationStart,
      });
    }

    return {
      isDeviating: this.isDeviating,
      distance: dist,
      count: this.deviationCount,
      totalTime: this.totalDeviationTime + (this.isDeviating ? elapsed - this.deviationStart : 0),
    };
  }

  reset() {
    this.isDeviating = false;
    this.deviationStart = 0;
    this.totalDeviationTime = 0;
    this.deviationCount = 0;
  }
}
