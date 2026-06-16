/** 动作优先级 — 数值越大越不可被打断 */
const ACTION_PRIORITY = {
  vault: 10,
  jump: 10,
  crouchHole: 9,
  squeezeHole: 9,
  crawl: 8,
  stairUp: 7,
  stairDown: 7,
  run: 4,
  jog: 3,
  walk: 2,
  idle: 1,
};

const LOW_CLEARANCE_ACTIONS = new Set(['walk', 'crouch', 'crawl', 'crouchHole', 'squeezeHole']);

/**
 * 移动动作决策 — AI / 手动模式共用
 */
export class ActionSelector {
  constructor(config) {
    this.movement = config.movement || {};
    this.clearance = config.clearance || {};
    this._releaseTimer = 0;
  }

  getSpeedMap() {
    const m = this.movement;
    return {
      idle: 0,
      walk: m.walkSpeed ?? 1.5,
      jog: m.jogSpeed ?? 2.8,
      run: m.runSpeed ?? 4.5,
      crawl: m.crawlSpeed ?? 1.0,
      crouch: m.crouchSpeed ?? 1.2,
      stairUp: m.stairSpeed ?? 1.8,
      stairDown: m.stairSpeed ?? 1.8,
      crouchHole: m.crouchHoleSpeed ?? 1.2,
      squeezeHole: m.squeezeHoleSpeed ?? 1.0,
      jump: 0,
      vault: 0,
    };
  }

  /** 根据地形与净空决定基础移动动作 */
  resolveTerrainAction(terrain, defaultMove = 'run') {
    if (terrain.hole) {
      return terrain.clearanceHeight < 1 ? 'squeezeHole' : 'crouchHole';
    }
    if (terrain.lowPassage) return 'crawl';

    const h = terrain.clearanceHeight ?? 2.5;
    const levels = this.clearance;

    if (h < (levels.holeMax ?? 0.8)) return 'crouchHole';
    if (h < (levels.crawlMax ?? 1.2)) return 'crawl';
    if (h < (levels.crouchMax ?? 1.7)) return 'crouch';

    if (terrain.stair) return 'stairUp';
    if (terrain.obstacle) return 'vault';
    return defaultMove;
  }

  /** AI 模式：开阔路段跑步，接近拐点减速 */
  resolveAIAction(terrain, distToWaypoint, distToEnd) {
    const defaultAction = this.movement.aiDefaultAction ?? 'run';
    let action = this.resolveTerrainAction(terrain, defaultAction);

    if (!LOW_CLEARANCE_ACTIONS.has(action) && action !== 'stairUp' && action !== 'vault') {
      const slowDist = this.movement.aiSlowDistance ?? 2;
      const jogDist = this.movement.aiJogDistance ?? 4;

      if (distToWaypoint < slowDist || distToEnd < slowDist) {
        action = 'walk';
      } else if (distToWaypoint < jogDist || distToEnd < jogDist) {
        action = action === 'run' ? 'jog' : action;
      }
    }

    return action;
  }

  /** 手动模式动作决策 */
  resolveManualAction(input, terrain) {
    let action = input.sprint ? 'run' : input.walk ? 'walk' : 'jog';

    const terrainAction = this.resolveTerrainAction(terrain, action);
    if (ACTION_PRIORITY[terrainAction] > ACTION_PRIORITY[action]) {
      action = terrainAction;
    }

    if (input.actionCrawl) action = 'crawl';
    if (input.actionJump) action = terrain.obstacle ? 'vault' : 'jump';
    if (input.actionStair && terrain.stair) action = 'stairUp';
    if (input.actionHole && terrain.hole) action = 'crouchHole';

    return action;
  }

  /** 离开低姿动作时延迟恢复，避免边界抖动 */
  applyHysteresis(currentAction, nextAction, delta) {
    const delay = this.movement.actionReleaseDelay ?? 0.3;

    if (LOW_CLEARANCE_ACTIONS.has(currentAction) && !LOW_CLEARANCE_ACTIONS.has(nextAction)) {
      this._releaseTimer += delta;
      if (this._releaseTimer < delay) return currentAction;
    } else {
      this._releaseTimer = 0;
    }

    return nextAction;
  }

  getCrossFadeDuration(from, to) {
    const low = LOW_CLEARANCE_ACTIONS;
    if (low.has(from) || low.has(to)) return 0.35;
    if (from === 'run' || to === 'run') return 0.2;
    return 0.25;
  }

  getAnimationFallback(action) {
    const map = {
      crouch: 'crawl',
      squeezeHole: 'crouchHole',
    };
    return map[action] || action;
  }
}
