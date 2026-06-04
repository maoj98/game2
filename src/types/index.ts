export interface IsoPosition {
  gridX: number
  gridY: number
}

export type TileType = 'ground' | 'wall' | 'water' | 'bridge' | 'plate' | 'jumpPad' | 'door'

export type MechanismType = 'pushBlock' | 'stepSwitch' | 'timedPlatform' | 'waterTrap'

export type ItemType = 'shield' | 'speedBoost'

export type Direction = 'up' | 'down' | 'left' | 'right'

export interface MechanismConfig {
  type: MechanismType
  gridX: number
  gridY: number
  config: Record<string, number | string | boolean>
}

export interface ItemSpawn {
  itemType: ItemType
  gridX: number
  gridY: number
}

export interface DoorConfig {
  gridX: number
  gridY: number
  requiredKeys: number
  linkedSwitchIds?: number[]
}

export interface LevelData {
  id: string
  name: string
  difficulty: 1 | 2 | 3
  timeLimit: number
  width: number
  height: number
  tiles: TileType[][]
  mechanisms: MechanismConfig[]
  items: ItemSpawn[]
  keys: IsoPosition[]
  doors: DoorConfig[]
  playerSpawns: IsoPosition[]
  starThresholds: { star1: number; star2: number; star3: number }
}

export interface SkinData {
  id: string
  name: string
  color: string
  earType: 'pointed' | 'round' | 'long' | 'floppy'
  bodyPattern: 'solid' | 'striped' | 'spotted' | 'patched'
}

export interface InputMapping {
  up: string
  down: string
  left: string
  right: string
  interact: string
  useItem: string
}

export interface PlayerState {
  id: string
  name: string
  skinId: string
  ready: boolean
  slotIndex: number
  gridX: number
  gridY: number
  direction: Direction
  isMoving: boolean
  heldItem: ItemType | null
  shieldActive: boolean
  speedBoostActive: boolean
  speedBoostTimer: number
  alive: boolean
}

export interface RoomState {
  roomId: string
  hostId: string
  levelId: string
  status: 'waiting' | 'playing' | 'result'
  players: PlayerState[]
}

export interface GameResult {
  levelId: string
  completed: boolean
  timeUsed: number
  keysCollected: number
  totalKeys: number
  stars: 0 | 1 | 2 | 3
}

export interface GameState {
  level: LevelData | null
  players: PlayerState[]
  keys: IsoPosition[]
  collectedKeys: number
  doors: DoorConfig[]
  doorsOpen: boolean[]
  mechanisms: MechanismConfig[]
  mechanismStates: Record<string, boolean | number>
  items: ItemSpawn[]
  itemPicked: Record<string, boolean>
  timeRemaining: number
  started: boolean
  finished: boolean
  result: GameResult | null
}
