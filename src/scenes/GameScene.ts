import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { LevelData, PlayerState, MechanismConfig, IsoPosition, DoorConfig, ItemType } from '@/types'
import { gridToScreen, getDepth, TILE_WIDTH, TILE_HEIGHT } from '@/game/map/IsoHelper'
import { SKINS } from '@/data'

const TILE_COLORS: Record<string, number> = {
  ground: 0xC8E6C9,
  wall: 0x795548,
  water: 0x42A5F5,
  bridge: 0xBCAAA4,
  plate: 0xFFD54F,
  jumpPad: 0xFF8A65,
  door: 0xFF8C42,
}

export class GameScene {
  container: Container
  private level: LevelData | null = null
  private tileContainer: Container = new Container()
  private entityContainer: Container = new Container()
  private effectContainer: Container = new Container()
  private tileSprites: Map<string, Graphics> = new Map()
  private playerSprites: Map<string, Container> = new Map()
  private keySprites: Map<string, Graphics> = new Map()
  private doorSprites: Map<string, Container> = new Map()
  private mechanismSprites: Map<string, Graphics> = new Map()
  private itemSprites: Map<string, Graphics> = new Map()
  private offsetX = 0
  private offsetY = 0

  constructor() {
    this.container = new Container()
    this.container.addChild(this.tileContainer)
    this.container.addChild(this.entityContainer)
    this.container.addChild(this.effectContainer)
  }

  loadLevel(level: LevelData): void {
    this.level = level
    this.clear()
    this.calculateOffset(level)
    this.drawTiles(level)
    this.drawMechanisms(level.mechanisms)
    this.drawItems(level.items)
    this.drawKeys(level.keys)
    this.drawDoors(level.doors)
  }

  private calculateOffset(level: LevelData): void {
    const maxX = level.width
    const maxY = level.height
    const centerScreen = gridToScreen(Math.floor(maxX / 2), Math.floor(maxY / 2))
    this.offsetX = -centerScreen.x
    this.offsetY = -centerScreen.y
    this.tileContainer.position.set(this.offsetX, this.offsetY)
    this.entityContainer.position.set(this.offsetX, this.offsetY)
    this.effectContainer.position.set(this.offsetX, this.offsetY)
  }

  private drawTiles(level: LevelData): void {
    this.tileSprites.clear()
    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        const tile = level.tiles[y][x]
        const pos = gridToScreen(x, y)
        const g = new Graphics()
        const color = TILE_COLORS[tile] ?? 0xC8E6C9

        g.moveTo(0, -TILE_HEIGHT / 2)
        g.lineTo(TILE_WIDTH / 2, 0)
        g.lineTo(0, TILE_HEIGHT / 2)
        g.lineTo(-TILE_WIDTH / 2, 0)
        g.closePath()
        g.fill(color)

        if (tile === 'wall') {
          g.moveTo(0, -TILE_HEIGHT / 2 - 12)
          g.lineTo(TILE_WIDTH / 2, -12)
          g.lineTo(TILE_WIDTH / 2, 0)
          g.lineTo(0, TILE_HEIGHT / 2)
          g.lineTo(-TILE_WIDTH / 2, 0)
          g.lineTo(-TILE_WIDTH / 2, -12)
          g.closePath()
          g.fill(0x8D6E63)
          g.moveTo(0, -TILE_HEIGHT / 2 - 12)
          g.lineTo(TILE_WIDTH / 2, -12)
          g.lineTo(0, -TILE_HEIGHT / 2)
          g.lineTo(-TILE_WIDTH / 2, 0)
          g.closePath()
          g.fill(0xA1887F)
        }

        if (tile === 'water') {
          g.moveTo(0, -TILE_HEIGHT / 2)
          g.lineTo(TILE_WIDTH / 2, 0)
          g.lineTo(0, TILE_HEIGHT / 2)
          g.lineTo(-TILE_WIDTH / 2, 0)
          g.closePath()
          g.fill(0x42A5F5)
        }

        g.stroke({ color: 0x000000, width: 0.5, alpha: 0.2 })
        g.position.set(pos.x, pos.y)
        g.zIndex = getDepth(x, y)
        this.tileSprites.set(`${x},${y}`, g)
        this.tileContainer.addChild(g)
      }
    }
    this.tileContainer.sortableChildren = true
  }

  private drawMechanisms(mechanisms: MechanismConfig[]): void {
    for (const m of mechanisms) {
      const pos = gridToScreen(m.gridX, m.gridY)
      const g = new Graphics()

      if (m.type === 'pushBlock') {
        g.moveTo(0, -TILE_HEIGHT / 2 - 8)
        g.lineTo(TILE_WIDTH / 2, -8)
        g.lineTo(TILE_WIDTH / 2, TILE_HEIGHT / 2 - 8)
        g.lineTo(0, TILE_HEIGHT / 2)
        g.lineTo(-TILE_WIDTH / 2, TILE_HEIGHT / 2 - 8)
        g.lineTo(-TILE_WIDTH / 2, -8)
        g.closePath()
        g.fill(0x9E9E9E)
        g.stroke({ color: 0x616161, width: 1 })
      } else if (m.type === 'stepSwitch') {
        g.circle(0, 0, 8)
        g.fill(0xFFD54F)
        g.stroke({ color: 0xF9A825, width: 1.5 })
      } else if (m.type === 'timedPlatform') {
        g.moveTo(0, -TILE_HEIGHT / 2)
        g.lineTo(TILE_WIDTH / 2, 0)
        g.lineTo(0, TILE_HEIGHT / 2)
        g.lineTo(-TILE_WIDTH / 2, 0)
        g.closePath()
        g.fill(0xFF8A65)
        g.stroke({ color: 0xE64A19, width: 1 })
      } else if (m.type === 'waterTrap') {
        g.moveTo(0, -TILE_HEIGHT / 2)
        g.lineTo(TILE_WIDTH / 2, 0)
        g.lineTo(0, TILE_HEIGHT / 2)
        g.lineTo(-TILE_WIDTH / 2, 0)
        g.closePath()
        g.fill(0x1E88E5)
        g.stroke({ color: 0x1565C0, width: 1 })
      }

      g.position.set(pos.x, pos.y)
      g.zIndex = getDepth(m.gridX, m.gridY) + 0.1
      this.mechanismSprites.set(`${m.type}_${m.gridX},${m.gridY}`, g)
      this.entityContainer.addChild(g)
    }
    this.entityContainer.sortableChildren = true
  }

  private drawItems(items: { itemType: ItemType; gridX: number; gridY: number }[]): void {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const pos = gridToScreen(item.gridX, item.gridY)
      const g = new Graphics()

      if (item.itemType === 'shield') {
        g.circle(0, -4, 8)
        g.fill(0x7E57C2)
        g.stroke({ color: 0x4527A0, width: 1 })
      } else if (item.itemType === 'speedBoost') {
        g.moveTo(0, -12)
        g.lineTo(6, -2)
        g.lineTo(2, -2)
        g.lineTo(4, 8)
        g.lineTo(-2, 0)
        g.lineTo(0, 0)
        g.closePath()
        g.fill(0x00E676)
        g.stroke({ color: 0x00C853, width: 1 })
      }

      g.position.set(pos.x, pos.y - 4)
      g.zIndex = getDepth(item.gridX, item.gridY) + 0.2
      this.itemSprites.set(`item_${i}`, g)
      this.entityContainer.addChild(g)
    }
  }

  private drawKeys(keys: IsoPosition[]): void {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const pos = gridToScreen(key.gridX, key.gridY)
      const g = new Graphics()
      g.circle(0, -8, 6)
      g.fill(0xFFD600)
      g.stroke({ color: 0xFF6F00, width: 1.5 })
      g.rect(-2, -2, 4, 10)
      g.fill(0xFFD600)

      g.position.set(pos.x, pos.y - 4)
      g.zIndex = getDepth(key.gridX, key.gridY) + 0.3
      this.keySprites.set(`key_${i}`, g)
      this.entityContainer.addChild(g)
    }
  }

  private drawDoors(doors: DoorConfig[]): void {
    for (let i = 0; i < doors.length; i++) {
      const door = doors[i]
      const pos = gridToScreen(door.gridX, door.gridY)
      const doorContainer = new Container()
      const g = new Graphics()
      g.moveTo(0, -TILE_HEIGHT / 2 - 16)
      g.lineTo(TILE_WIDTH / 2, -16)
      g.lineTo(TILE_WIDTH / 2, TILE_HEIGHT / 2)
      g.lineTo(0, TILE_HEIGHT / 2 + 16)
      g.lineTo(-TILE_WIDTH / 2, TILE_HEIGHT / 2)
      g.lineTo(-TILE_WIDTH / 2, -16)
      g.closePath()
      g.fill(0xFF8C42)
      g.stroke({ color: 0xE65100, width: 2 })
      doorContainer.addChild(g)

      const style = new TextStyle({ fontSize: 10, fill: '#FFFFFF', fontWeight: 'bold' })
      const label = new Text({ text: `${door.requiredKeys}🔑`, style })
      label.anchor.set(0.5)
      label.position.set(0, -4)
      doorContainer.addChild(label)

      doorContainer.position.set(pos.x, pos.y)
      doorContainer.zIndex = getDepth(door.gridX, door.gridY) + 0.4
      this.doorSprites.set(`door_${i}`, doorContainer)
      this.entityContainer.addChild(doorContainer)
    }
  }

  updatePlayers(players: PlayerState[]): void {
    for (const [id, sprite] of this.playerSprites) {
      this.entityContainer.removeChild(sprite)
    }
    this.playerSprites.clear()

    for (const player of players) {
      const pos = gridToScreen(player.gridX, player.gridY)
      const container = new Container()
      const skin = SKINS.find((s) => s.id === player.skinId) ?? SKINS[0]

      const body = new Graphics()
      body.circle(0, -8, 12)
      body.fill(skin.color)
      body.stroke({ color: 0x000000, width: 1.5 })

      if (skin.earType === 'pointed') {
        body.moveTo(-8, -16)
        body.lineTo(-4, -26)
        body.lineTo(0, -16)
        body.fill(skin.color)
        body.moveTo(0, -16)
        body.lineTo(4, -26)
        body.lineTo(8, -16)
        body.fill(skin.color)
      } else if (skin.earType === 'round') {
        body.circle(-8, -18, 5)
        body.fill(skin.color)
        body.circle(8, -18, 5)
        body.fill(skin.color)
      } else if (skin.earType === 'long') {
        body.ellipse(-6, -28, 3, 10)
        body.fill(skin.color)
        body.ellipse(6, -28, 3, 10)
        body.fill(skin.color)
      } else if (skin.earType === 'floppy') {
        body.ellipse(-10, -14, 4, 8)
        body.fill(skin.color)
        body.ellipse(10, -14, 4, 8)
        body.fill(skin.color)
      }

      if (skin.bodyPattern === 'striped') {
        body.moveTo(-10, -6)
        body.lineTo(10, -6)
        body.stroke({ color: 0xFFFFFF, width: 2, alpha: 0.5 })
        body.moveTo(-8, 0)
        body.lineTo(8, 0)
        body.stroke({ color: 0xFFFFFF, width: 2, alpha: 0.5 })
      } else if (skin.bodyPattern === 'spotted') {
        body.circle(-4, -4, 3)
        body.fill(0xFFFFFF, 0.3)
        body.circle(3, -10, 2)
        body.fill(0xFFFFFF, 0.3)
      } else if (skin.bodyPattern === 'patched') {
        body.circle(-3, -6, 5)
        body.fill(0xFFFFFF, 0.4)
      }

      body.circle(0, -2, 2)
      body.fill(0x000000)
      body.circle(-4, -8, 2)
      body.fill(0x000000)
      body.circle(4, -8, 2)
      body.fill(0x000000)

      container.addChild(body)

      const labelStyle = new TextStyle({ fontSize: 9, fill: '#FFFFFF', fontWeight: 'bold' })
      const label = new Text({ text: player.name, style: labelStyle })
      label.anchor.set(0.5, 1)
      label.position.set(0, 8)
      container.addChild(label)

      if (player.heldItem) {
        const itemG = new Graphics()
        if (player.heldItem === 'shield') {
          itemG.circle(10, -8, 4)
          itemG.fill(0x7E57C2)
        } else {
          itemG.moveTo(10, -14)
          itemG.lineTo(13, -8)
          itemG.lineTo(11, -8)
          itemG.lineTo(12, -2)
          itemG.lineTo(9, -8)
          itemG.lineTo(10, -8)
          itemG.closePath()
          itemG.fill(0x00E676)
        }
        container.addChild(itemG)
      }

      if (player.shieldActive) {
        const shieldG = new Graphics()
        shieldG.circle(0, -8, 16)
        shieldG.stroke({ color: 0x7E57C2, width: 2, alpha: 0.6 })
        container.addChild(shieldG)
      }

      if (!player.alive) {
        container.alpha = 0.3
      }

      container.position.set(pos.x, pos.y)
      container.zIndex = getDepth(player.gridX, player.gridY) + 0.5
      this.playerSprites.set(player.id, container)
      this.entityContainer.addChild(container)
    }
    this.entityContainer.sortableChildren = true
  }

  removeKey(index: number): void {
    const sprite = this.keySprites.get(`key_${index}`)
    if (sprite) {
      this.entityContainer.removeChild(sprite)
      this.keySprites.delete(`key_${index}`)
    }
  }

  removeItem(index: number): void {
    const sprite = this.itemSprites.get(`item_${index}`)
    if (sprite) {
      this.entityContainer.removeChild(sprite)
      this.itemSprites.delete(`item_${index}`)
    }
  }

  openDoor(index: number): void {
    const sprite = this.doorSprites.get(`door_${index}`)
    if (sprite) {
      sprite.alpha = 0.3
    }
  }

  moveBlock(m: MechanismConfig): void {
    const oldKey = `pushBlock_${m.gridX},${m.gridY}`
    const sprite = this.mechanismSprites.get(oldKey)
    if (sprite) {
      const pos = gridToScreen(m.gridX, m.gridY)
      sprite.position.set(pos.x, pos.y)
      this.mechanismSprites.delete(oldKey)
    }
  }

  updateMechanismState(key: string, activated: boolean): void {
    const sprite = this.mechanismSprites.get(key)
    if (sprite) {
      sprite.alpha = activated ? 1 : 0.5
    }
  }

  removeTimedPlatform(gridX: number, gridY: number): void {
    const key = `timedPlatform_${gridX},${gridY}`
    const sprite = this.mechanismSprites.get(key)
    if (sprite) {
      sprite.alpha = 0.2
    }
  }

  restoreTimedPlatform(gridX: number, gridY: number): void {
    const key = `timedPlatform_${gridX},${gridY}`
    const sprite = this.mechanismSprites.get(key)
    if (sprite) {
      sprite.alpha = 1
    }
  }

  clear(): void {
    this.tileContainer.removeChildren()
    this.entityContainer.removeChildren()
    this.effectContainer.removeChildren()
    this.tileSprites.clear()
    this.playerSprites.clear()
    this.keySprites.clear()
    this.doorSprites.clear()
    this.mechanismSprites.clear()
    this.itemSprites.clear()
  }

  resize(width: number, height: number): void {
    this.container.position.set(width / 2, height / 2)
  }
}
