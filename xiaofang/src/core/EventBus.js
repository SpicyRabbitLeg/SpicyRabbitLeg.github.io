/**
 * 轻量事件总线 — 模块间解耦通信
 */
export class EventBus {
  constructor() {
    this._listeners = new Map();
  }

  on(event, fn) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    this._listeners.get(event)?.delete(fn);
  }

  emit(event, payload) {
    this._listeners.get(event)?.forEach((fn) => fn(payload));
  }
}

export const bus = new EventBus();

/** 全局事件名常量 */
export const Events = {
  SCENE_LOADED: 'scene:loaded',
  SCENE_ERROR: 'scene:error',
  CHARACTER_READY: 'character:ready',
  ROUTE_SELECTED: 'route:selected',
  ROUTE_DEVIATION: 'route:deviation',
  ACTION_CHANGED: 'action:changed',
  ASSESSMENT_UPDATE: 'assessment:update',
  ASSESSMENT_COMPLETE: 'assessment:complete',
  MODE_CHANGED: 'mode:changed',
  REPLAY_STATE: 'replay:state',
};
