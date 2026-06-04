import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import type { TileType, LevelData } from '@/types'
import { gridToScreen, getDepth, TILE_WIDTH, TILE_HEIGHT } from '@/game/map/IsoHelper'

const TILE_COLORS: Record<string, number> = {
  ground: 0xC8E6C9,
  wall: 0x795548,
  water: 0x42A5F5,
  bridge: 0xBCAAA4,
  plate: 0xFFD54F,
  jumpPad: 0xFF8A65,
  door: 0xFF8C42,
}

export class EditorScene {
  container: Container
  private tileContainer: Container = new Container()
  private overlayContainer: Container = new Container()
  private tileSprites: Map<string, Graphics> = new Map()
  private offsetX = 0
  private offsetY = 0
  private width = 10
  private height = 10
  private gridClickCallback: ((gridX: number, gridY: number) => void) | null = null

  constructor() {
    this.container = new Container()
    this.container.addChild(this.tileContainer)
    this.container.addChild(this.overlayContainer)
    this.container.eventMode = 'static'
    this.container.on('pointerdown', (e: { x: number; y: number }) => {
      if (this.gridClickCallback) {
        const worldX = e.x - this.offsetX
        const worldY = e.y - this.offsetY
        const grid = this.screenToGridLocal(worldX, worldY)
        this.gridClickCallback(grid.gridX, grid.gridY)
      }
    })
  }

  onGridClick(cb: (gridX: number, gridY: number) => void): void {
    this.gridClickCallback = cb
  }

  loadGrid(tiles: TileType[][], overlayElements?: { x: number; y: number; type: string }[]): void {
    this.width = tiles[0]?.length ?? 0
    this.height = tiles.length
    this.clear()
    this.calculateOffset()

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const tile = tiles[y][x]
        const pos = gridToScreen(x, y)
        const g = new Graphics()
        const color = TILE_COLORS[tile] ?? 0xC8E6C9

        g.moveTo(0, -TILE_HEIGHT / 2)
        g.lineTo(TILE_WIDTH / 2, 0)
        g.lineTo(0, TILE_HEIGHT / 2)
        g.lineTo(-TILE_WIDTH / 2, 0)
        g.closePath()
        g.fill(color)
        g.stroke({ color: 0x000000, width: 0.5, alpha: 0.3 })

        g.position.set(pos.x, pos.y)
        g.zIndex = getDepth(x, y)
        this.tileSprites.set(`${x},${y}`, g)
        this.tileContainer.addChild(g)
      }
    }

    if (overlayElements) {
      for (const el of overlayElements) {
        const pos = gridToScreen(el.x, el.y)
        const c = new Container()
        const g = new Graphics()
        g.circle(0, -4, 6)
        g.fill(0xFF4081)
        g.stroke({ color: 0xC51162, width: 1 })
        c.addChild(g)
        const style = new TextStyle({ fontSize: 8, fill: '#FFFFFF' })
        const label = new Text({ text: el.type.substring(0, 2), style })
        label.anchor.set(0.5)
        c.addChild(label)
        c.position.set(pos.x, pos.y)
        c.zIndex = getDepth(el.x, el.y) + 0.5
        this.overlayContainer.addChild(c)
      }
    }

    this.tileContainer.sortableChildren = true
    this.overlayContainer.sortableChildren = true
  }

  updateTile(x: number, y: number, tile: TileType): void {
    const key = `${x},${y}`
    const existing = this.tileSprites.get(key)
    if (existing) {
      this.tileContainer.removeChild(existing)
    }
    const pos = gridToScreen(x, y)
    const g = new Graphics()
    const color = TILE_COLORS[tile] ?? 0xC8E6C9
    g.moveTo(0, -TILE_HEIGHT / 2)
    g.lineTo(TILE_WIDTH / 2, 0)
    g.lineTo(0, TILE_HEIGHT / 2)
    g.lineTo(-TILE_WIDTH / 2, 0)
    g.closePath()
    g.fill(color)
    g.stroke({ color: 0x000000, width: 0.5, alpha: 0.3 })
    g.position.set(pos.x, pos.y)
    g.zIndex = getDepth(x, y)
    this.tileSprites.set(key, g)
    this.tileContainer.addChild(g)
  }

  private calculateOffset(): void {
    const centerScreen = gridToScreen(Math.floor(this.width / 2), Math.floor(this.height / 2))
    this.offsetX = -centerScreen.x
    this.offsetY = -centerScreen.y
    this.tileContainer.position.set(this.offsetX, this.offsetY)
    this.overlayContainer.position.set(this.offsetX, this.offsetY)
  }

  private screenToGridLocal(screenX: number, screenY: number): { gridX: number; gridY: number } {
    const gx = (screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2
    const gy = (screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2
    return { gridX: Math.floor(gx), gridY: Math.floor(gy) }
  }

  clear(): void {
    this.tileContainer.removeChildren()
    this.overlayContainer.removeChildren()
    this.tileSprites.clear()
  }

  resize(width: number, height: number): void {
    this.container.position.set(width / 2, height / 2)
  }
}
