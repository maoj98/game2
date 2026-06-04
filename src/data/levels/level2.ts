import type { LevelData } from '@/types'

export const level2: LevelData = {
  id: 'level2',
  name: '水域险途',
  difficulty: 2,
  timeLimit: 150,
  width: 12,
  height: 12,
  tiles: [
    ['wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall'],
    ['wall','ground','ground','ground','water','water','water','ground','ground','ground','ground','wall'],
    ['wall','ground','ground','ground','water','water','water','ground','ground','ground','ground','wall'],
    ['wall','ground','ground','ground','ground','ground','ground','ground','ground','ground','ground','wall'],
    ['wall','water','water','ground','ground','ground','ground','ground','ground','water','water','wall'],
    ['wall','water','water','ground','ground','ground','ground','ground','ground','water','water','wall'],
    ['wall','ground','ground','ground','ground','ground','ground','ground','ground','ground','ground','wall'],
    ['wall','ground','ground','ground','ground','ground','ground','ground','ground','ground','ground','wall'],
    ['wall','water','water','ground','ground','ground','ground','ground','ground','water','water','wall'],
    ['wall','ground','ground','ground','ground','ground','ground','ground','ground','ground','ground','wall'],
    ['wall','ground','ground','ground','ground','ground','ground','ground','ground','ground','ground','wall'],
    ['wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall'],
  ],
  mechanisms: [
    { type: 'waterTrap', gridX: 4, gridY: 1, config: {} },
    { type: 'waterTrap', gridX: 5, gridY: 1, config: {} },
    { type: 'stepSwitch', gridX: 3, gridY: 3, config: { linkedDoorIndex: 0 } },
    { type: 'stepSwitch', gridX: 8, gridY: 3, config: { linkedDoorIndex: 1 } },
    { type: 'pushBlock', gridX: 5, gridY: 6, config: {} },
  ],
  items: [
    { itemType: 'shield', gridX: 9, gridY: 9 },
    { itemType: 'speedBoost', gridX: 2, gridY: 5 },
    { itemType: 'shield', gridX: 6, gridY: 2 },
  ],
  keys: [
    { gridX: 10, gridY: 10 },
    { gridX: 1, gridY: 1 },
    { gridX: 10, gridY: 2 },
  ],
  doors: [
    { gridX: 6, gridY: 1, requiredKeys: 3 },
    { gridX: 5, gridY: 11, requiredKeys: 3 },
  ],
  playerSpawns: [
    { gridX: 1, gridY: 10 },
    { gridX: 2, gridY: 10 },
    { gridX: 1, gridY: 9 },
    { gridX: 2, gridY: 9 },
  ],
  starThresholds: { star1: 150, star2: 105, star3: 60 },
}
