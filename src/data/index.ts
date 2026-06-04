export { SKINS } from './skins'
export { level1 } from './levels/level1'
export { level2 } from './levels/level2'
export { level3 } from './levels/level3'

import { level1 } from './levels/level1'
import { level2 } from './levels/level2'
import { level3 } from './levels/level3'
import type { LevelData } from '@/types'

export const LEVELS: LevelData[] = [level1, level2, level3]

export const INPUT_MAPPINGS: Record<number, { up: string; down: string; left: string; right: string; interact: string; useItem: string }> = {
  0: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', interact: 'KeyE', useItem: 'KeyQ' },
  1: { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', interact: 'Slash', useItem: 'Period' },
  2: { up: 'KeyI', down: 'KeyK', left: 'KeyJ', right: 'KeyL', interact: 'KeyU', useItem: 'KeyY' },
  3: { up: 'Numpad8', down: 'Numpad5', left: 'Numpad4', right: 'Numpad6', interact: 'Numpad7', useItem: 'Numpad9' },
}
