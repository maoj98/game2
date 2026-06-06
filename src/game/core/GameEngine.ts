import type { LevelData, PlayerState, Direction, ItemType, MechanismConfig, DoorConfig, IsoPosition, GameResult } from '@/types'
import { InputManager } from './InputManager'
import { CollisionSystem } from './CollisionSystem'
import { INPUT_MAPPINGS } from '@/data'

export type GameEventCallback = (event: string, data?: unknown) => void

export class GameEngine {
  level: LevelData | null = null
  players: PlayerState[] = []
  keys: IsoPosition[] = []
  collectedKeys = 0
  doors: DoorConfig[] = []
  doorsOpen: boolean[] = []
  mechanisms: MechanismConfig[] = []
  mechanismStates: Map<string, boolean | number> = new Map()
  items: { itemType: ItemType; gridX: number; gridY: number; picked: boolean }[] = []
  timedPlatformTimers: Map<string, number> = new Map()
  timedPlatformVisible: Map<string, boolean> = new Map()
  timeRemaining = 0
  started = false
  finished = false
  result: GameResult | null = null
  lastTimestamp = 0

  private input: InputManager
  private collision: CollisionSystem
  private eventCallbacks: GameEventCallback[] = []
  private moveCooldowns: Map<string, number> = new Map()
  private readonly MOVE_COOLDOWN = 150
  private readonly MOVE_COOLDOWN_BOOSTED = 80

  constructor() {
    this.input = InputManager.getInstance()
    this.collision = new CollisionSystem()
  }

  onEvent(cb: GameEventCallback): void {
    this.eventCallbacks.push(cb)
  }

  private emit(event: string, data?: unknown): void {
    for (const cb of this.eventCallbacks) {
      cb(event, data)
    }
  }

  loadLevel(level: LevelData, playerCount: number): void {
    this.level = level
    this.collision.loadMap(level.tiles, level.mechanisms)
    this.keys = [...level.keys]
    this.collectedKeys = 0
    this.doors = [...level.doors]
    this.doorsOpen = level.doors.map(() => false)
    this.mechanisms = [...level.mechanisms]
    this.mechanismStates = new Map()
    this.items = level.items.map((i) => ({ ...i, picked: false }))
    this.timedPlatformTimers = new Map()
    this.timedPlatformVisible = new Map()
    this.timeRemaining = level.timeLimit
    this.started = false
    this.finished = false
    this.result = null
    this.moveCooldowns.clear()

    this.players = []
    for (let i = 0; i < playerCount && i < level.playerSpawns.length; i++) {
      const spawn = level.playerSpawns[i]
      this.players.push({
        uid: `engine_player_${i}_${Date.now()}`,
        id: `player${i}`,
        name: `玩家${i + 1}`,
        skinId: 'cat',
        ready: false,
        slotIndex: i,
        gridX: spawn.gridX,
        gridY: spawn.gridY,
        direction: 'down' as Direction,
        isMoving: false,
        heldItem: null,
        shieldActive: false,
        speedBoostActive: false,
        speedBoostTimer: 0,
        alive: true,
      })
    }
  }

  setPlayerSkin(playerIndex: number, skinId: string): void {
    if (this.players[playerIndex]) {
      this.players[playerIndex].skinId = skinId
    }
  }

  validateLevel(): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    if (!this.level) {
      errors.push('关卡数据为空')
      return { valid: false, errors }
    }

    if (this.level.keys.length === 0) {
      errors.push('关卡没有钥匙，无法打开门')
    }

    if (this.level.doors.length === 0) {
      errors.push('关卡没有门，无法通关')
    }

    if (this.level.playerSpawns.length === 0) {
      errors.push('关卡没有出生点，玩家无法生成')
    }

    if (this.level.doors.length > 0 && this.level.keys.length > 0) {
      const minRequiredKeys = Math.min(...this.level.doors.map(d => d.requiredKeys))
      if (this.level.keys.length < minRequiredKeys) {
        errors.push(`钥匙数量不足：需要至少 ${minRequiredKeys} 把钥匙`)
      }
    }

    const hasGround = this.level.tiles.some(row => row.some(tile => tile === 'ground'))
    if (!hasGround) {
      errors.push('地图没有可通行的地面')
    }

    return { valid: errors.length === 0, errors }
  }

  start(): void {
    const validation = this.validateLevel()
    if (!validation.valid) {
      this.finishGame(false, validation.errors)
      return
    }
    this.started = true
    this.lastTimestamp = performance.now()
  }

  update(timestamp: number): void {
    if (!this.started || this.finished) return

    const dt = (timestamp - this.lastTimestamp) / 1000
    this.lastTimestamp = timestamp

    this.timeRemaining -= dt
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0
      this.finishGame(false)
      return
    }

    for (const player of this.players) {
      if (!player.alive) continue

      if (player.speedBoostActive) {
        player.speedBoostTimer -= dt
        if (player.speedBoostTimer <= 0) {
          player.speedBoostActive = false
          player.speedBoostTimer = 0
        }
      }
    }

    this.updateTimedPlatforms(dt)
    this.processInput()
    this.checkMechanisms()
    this.checkKeyPickup()
    this.checkDoors()
    this.input.resetJustPressed()
  }

  private processInput(): void {
    for (let i = 0; i < this.players.length; i++) {
      const player = this.players[i]
      if (!player.alive) continue

      const mapping = INPUT_MAPPINGS[i]
      if (!mapping) continue

      const now = performance.now()
      const lastMove = this.moveCooldowns.get(player.id) ?? 0
      const cooldown = player.speedBoostActive ? this.MOVE_COOLDOWN_BOOSTED : this.MOVE_COOLDOWN
      if (now - lastMove < cooldown) continue

      let dx = 0
      let dy = 0

      if (this.input.isPressed(mapping.up)) { dy = -1; player.direction = 'up' }
      else if (this.input.isPressed(mapping.down)) { dy = 1; player.direction = 'down' }
      else if (this.input.isPressed(mapping.left)) { dx = -1; player.direction = 'left' }
      else if (this.input.isPressed(mapping.right)) { dx = 1; player.direction = 'right' }

      if (dx !== 0 || dy !== 0) {
        const newX = player.gridX + dx
        const newY = player.gridY + dy

        const isBlockedByPushBlock = this.mechanisms.some(
          (m) => m.type === 'pushBlock' && m.gridX === newX && m.gridY === newY
        )

        if (isBlockedByPushBlock && this.input.isJustPressed(mapping.interact)) {
          const pushDestX = newX + dx
          const pushDestY = newY + dy
          if (this.collision.isPushDestinationValid(pushDestX, pushDestY)) {
            const block = this.mechanisms.find(
              (m) => m.type === 'pushBlock' && m.gridX === newX && m.gridY === newY
            )
            if (block) {
              this.collision.updateBlockPosition(block.gridX, block.gridY, pushDestX, pushDestY)
              block.gridX = pushDestX
              block.gridY = pushDestY
              this.emit('blockMoved', block)
            }
          }
        } else if (!isBlockedByPushBlock && this.collision.isWalkable(newX, newY)) {
          player.gridX = newX
          player.gridY = newY
          player.isMoving = true
          this.moveCooldowns.set(player.id, now)
          this.emit('playerMoved', { playerIndex: i, player })

          const waterTile = this.collision.getTile(newX, newY)
          if (waterTile === 'water') {
            if (player.shieldActive) {
              player.shieldActive = false
              player.heldItem = null
              this.emit('shieldUsed', i)
            } else {
              player.alive = false
              this.emit('playerDied', i)
              this.checkAllPlayersDead()
            }
          }
        }
      }

      if (this.input.isJustPressed(mapping.useItem) && player.heldItem) {
        this.useItem(player, i)
      }
    }
  }

  private useItem(player: PlayerState, playerIndex: number): void {
    if (player.heldItem === 'shield') {
      player.shieldActive = true
      player.heldItem = null
      this.emit('shieldActivated', playerIndex)
    } else if (player.heldItem === 'speedBoost') {
      player.speedBoostActive = true
      player.speedBoostTimer = 5
      player.heldItem = null
      this.emit('speedBoostActivated', playerIndex)
    }
  }

  private updateTimedPlatforms(dt: number): void {
    for (const m of this.mechanisms) {
      if (m.type !== 'timedPlatform') continue
      const key = `${m.gridX},${m.gridY}`
      const visible = this.timedPlatformVisible.get(key) ?? true

      if (!visible) {
        const timer = (this.timedPlatformTimers.get(key) ?? 0) - dt
        if (timer <= 0) {
          this.timedPlatformVisible.set(key, true)
          this.timedPlatformTimers.delete(key)
          this.collision.setTile(m.gridX, m.gridY, 'jumpPad')
          this.emit('platformRestored', m)
        } else {
          this.timedPlatformTimers.set(key, timer)
        }
      }
    }
  }

  private checkMechanisms(): void {
    for (const m of this.mechanisms) {
      if (m.type === 'stepSwitch') {
        const activated = this.players.some(
          (p) => p.alive && p.gridX === m.gridX && p.gridY === m.gridY
        ) || this.mechanisms.some(
          (b) => b.type === 'pushBlock' && b.gridX === m.gridX && b.gridY === m.gridY && b !== m
        )

        const wasActivated = this.mechanismStates.get(`${m.gridX},${m.gridY}`) === true
        this.mechanismStates.set(`${m.gridX},${m.gridY}`, activated)

        if (activated !== wasActivated) {
          this.emit('switchToggled', { mechanism: m, activated })
        }
      }

      if (m.type === 'timedPlatform') {
        const key = `${m.gridX},${m.gridY}`
        const visible = this.timedPlatformVisible.get(key) ?? true
        if (visible) {
          const playerOnPlatform = this.players.some(
            (p) => p.alive && p.gridX === m.gridX && p.gridY === m.gridY
          )
          if (playerOnPlatform) {
            const duration = (m.config.duration as number) ?? 5
            this.timedPlatformVisible.set(key, false)
            this.timedPlatformTimers.set(key, duration)
            this.collision.setTile(m.gridX, m.gridY, 'ground')
            this.emit('platformDisappeared', m)
          }
        }
      }

      if (m.type === 'waterTrap') {
        const playerInWater = this.players.find(
          (p) => p.alive && p.gridX === m.gridX && p.gridY === m.gridY
        )
        if (playerInWater) {
          if (playerInWater.shieldActive) {
            playerInWater.shieldActive = false
            playerInWater.heldItem = null
            this.emit('shieldUsed', this.players.indexOf(playerInWater))
          } else {
            playerInWater.alive = false
            this.emit('playerDied', this.players.indexOf(playerInWater))
            this.checkAllPlayersDead()
          }
        }
      }
    }
  }

  private checkKeyPickup(): void {
    for (let i = this.keys.length - 1; i >= 0; i--) {
      const key = this.keys[i]
      const playerOnKey = this.players.find(
        (p) => p.alive && p.gridX === key.gridX && p.gridY === key.gridY
      )
      if (playerOnKey) {
        this.collectedKeys++
        this.keys.splice(i, 1)
        this.emit('keyCollected', { keyIndex: i, key, collectedKeys: this.collectedKeys, totalKeys: this.level!.keys.length })
      }
    }

    for (const item of this.items) {
      if (item.picked) continue
      const playerOnItem = this.players.find(
        (p) => p.alive && p.gridX === item.gridX && p.gridY === item.gridY && !p.heldItem
      )
      if (playerOnItem) {
        item.picked = true
        playerOnItem.heldItem = item.itemType
        this.emit('itemPicked', { item, player: playerOnItem })
      }
    }
  }

  private checkDoors(): void {
    for (let i = 0; i < this.doors.length; i++) {
      const door = this.doors[i]
      const isOpen = this.doorsOpen[i]
      const shouldOpen = this.collectedKeys >= door.requiredKeys

      if (door.linkedSwitchIds && door.linkedSwitchIds.length > 0) {
        const allSwitchesActive = door.linkedSwitchIds.every((switchIdx) => {
          const sw = this.mechanisms[switchIdx]
          if (!sw) return false
          return this.mechanismStates.get(`${sw.gridX},${sw.gridY}`) === true
        })
        if (!allSwitchesActive && !shouldOpen) continue
      }

      if (shouldOpen && !isOpen) {
        this.doorsOpen[i] = true
        this.collision.setTile(door.gridX, door.gridY, 'ground')
        this.emit('doorOpened', { doorIndex: i, door })
      }

      if (isOpen) {
        const playerAtDoor = this.players.find(
          (p) => p.alive && p.gridX === door.gridX && p.gridY === door.gridY
        )
        if (playerAtDoor) {
          this.finishGame(true)
        }
      }
    }
  }

  private checkAllPlayersDead(): void {
    if (this.players.every((p) => !p.alive)) {
      this.finishGame(false)
    }
  }

  private finishGame(completed: boolean, errors?: string[]): void {
    this.finished = true
    this.started = false
    let stars: 0 | 1 | 2 | 3 = 0
    if (completed && this.level) {
      const timeUsed = this.level.timeLimit - this.timeRemaining
      if (timeUsed <= this.level.starThresholds.star3) stars = 3
      else if (timeUsed <= this.level.starThresholds.star2) stars = 2
      else stars = 1
    }
    this.result = {
      levelId: this.level?.id ?? '',
      completed,
      timeUsed: this.level ? this.level.timeLimit - this.timeRemaining : 0,
      keysCollected: this.collectedKeys,
      totalKeys: this.level?.keys.length ?? 0,
      stars,
      errors,
    }
    this.emit('gameFinished', this.result)
  }

  getCollision(): CollisionSystem {
    return this.collision
  }
}
