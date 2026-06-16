/** 碰撞层枚举 */
export const CollisionLayer = {
  WALL: 'wall',
  OBSTACLE: 'obstacle',
  GROUND: 'ground',
  STAIR: 'stair',
  HOLE: 'hole',
  LOW_PASSAGE: 'lowPassage',
  BLOCKED: 'blocked',
};

export const LayerMask = {
  [CollisionLayer.WALL]: 0x01,
  [CollisionLayer.OBSTACLE]: 0x02,
  [CollisionLayer.GROUND]: 0x04,
  [CollisionLayer.STAIR]: 0x08,
  [CollisionLayer.HOLE]: 0x10,
  [CollisionLayer.LOW_PASSAGE]: 0x20,
  [CollisionLayer.BLOCKED]: 0x40,
};
