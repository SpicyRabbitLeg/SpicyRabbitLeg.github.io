/**
 * 键盘/鼠标输入管理 — 手动操控模式
 */
export class InputManager {
  constructor(target) {
    this.keys = {};
    this.manualActions = {
      crawl: false,
      jump: false,
      stair: false,
      hole: false,
    };

    target.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyC') this.manualActions.crawl = true;
      if (e.code === 'Space') this.manualActions.jump = true;
      if (e.code === 'KeyE') this.manualActions.stair = true;
      if (e.code === 'KeyF') this.manualActions.hole = true;
    });

    target.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'KeyC') this.manualActions.crawl = false;
      if (e.code === 'Space') this.manualActions.jump = false;
      if (e.code === 'KeyE') this.manualActions.stair = false;
      if (e.code === 'KeyF') this.manualActions.hole = false;
    });
  }

  getState() {
    let moveX = 0;
    let moveZ = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;

    return {
      moveX,
      moveZ,
      sprint: this.keys['ShiftLeft'] || this.keys['ShiftRight'],
      walk: this.keys['ControlLeft'],
      actionCrawl: this.manualActions.crawl,
      actionJump: this.manualActions.jump,
      actionStair: this.manualActions.stair,
      actionHole: this.manualActions.hole,
    };
  }
}
