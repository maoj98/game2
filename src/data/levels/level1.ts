import type { LevelData } from '@/types'

export const level1: LevelData = {
  id: 'level1',
  name: '石块迷宫',
  difficulty: 1,
  timeLimit: 120,
  width: 10,
  height: 10,
  tiles: [
    ['wall','wall','wall','wall','wall','wall','wall','wall','wall','wall'],
    ['wall','ground','ground','ground','ground','ground','ground','ground','ground','wall'],
    ['wall','ground','ground','ground','ground','ground','ground','ground','ground','wall'],
    ['wall','ground','ground','ground','ground','ground','ground','ground','ground','wall'],
    ['wall','ground','ground','ground','ground','ground','ground','ground','ground','wall'],
    ['wall','ground','ground','ground','ground','ground','ground','ground','ground','wall'],
    ['wall','ground','ground','ground','ground','ground','ground','ground','ground','wall'],
    ['wall','ground','ground','ground','ground','ground','ground','ground','ground','wall'],
    ['wall','ground','ground','ground','ground','ground','ground','ground','ground','wall'],
    ['wall','wall','wall','wall','wall','wall','wall','wall','wall','wall'],
  ],
  mechanisms: [
    { type: 'pushBlock', gridX: 3, gridY: 3, config: {} },
    { type: 'pushBlock', gridX: 6, gridY: 5, config: {} },
    { type: 'stepSwitch', gridX: 4, gridY: 7, config: { linkedDoorIndex: 0 } },
  ],
  items: [
    { itemType: 'shield', gridX: 7, gridY: 2 },
    { itemType: 'speedBoost', gridX: 2, gridY: 6 },
  ],
  keys: [
    { gridX: 8, gridY: 8 },
    { gridX: 2, gridY: 2 },
  ],
  doors: [
    { gridX: 5, gridY: 1, requiredKeys: 2 },
  ],
  playerSpawns: [
    { gridX: 1, gridY: 8 },
    { gridX: 2, gridY: 8 },
    { gridX: 1, gridY: 7 },
    { gridX: 2, gridY: 7 },
  ],
  starThresholds: { star1: 120, star2: 84, star3: 48 },
}
