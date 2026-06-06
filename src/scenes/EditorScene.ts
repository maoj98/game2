import { Container, Graphics, Text, TextStyle, Rectangle } from 'pixi.js'
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

const OVERLAY_EMOJI: Record<string, string> = {
  pushBlock: '📦',
  stepSwitch: '🔘',
  timedPlatform: '⏱️',
  waterTrap: '💧',
  shield: '🛡️',
  speedBoost: '⚡',
  key: '🔑',
  door: '🚪',
  spawn: '📍',
}

export class EditorScene {
  container: Container
  private tileContainer: Container = new Container()
  private overlayContainer: Container = new Container()
  private highlightContainer: Container = new Container()
  private tileSprites: Map<string, Graphics> = new Map()
  private overlaySprites: Map<string, Container> = new Map()
  private highlightSprite: Graphics | null = null
  private hoverGridX = -1
  private hoverGridY = -1
  private offsetX = 0
  private offsetY = 0
  private width = 10
  private height = 10
  private gridClickCallback: ((gridX: number, gridY: number) => void) | null = null
  private dataProvider: (() => {
    tiles: TileType[][]
    overlays: { x: number; y: number; type: string }[]
  }) | null = null

  private viewWidth = 800
  private viewHeight = 600

  constructor() {
    this.container = new Container()
    this.container.addChild(this.tileContainer)
    this.container.addChild(this.overlayContainer)
    this.container.addChild(this.highlightContainer)
    this.container.eventMode = 'static'

    this.container.on('pointermove', (e: { globalX: number; globalY: number }) => {
      const tileLocal = this.tileContainer.toLocal({ x: e.globalX, y: e.globalY })
      const grid = this.screenToGridLocal(tileLocal.x, tileLocal.y)
      if (grid.gridX >= 0 && grid.gridY >= 0 && grid.gridX < this.width && grid.gridY < this.height) {
        this.updateHighlight(grid.gridX, grid.gridY)
      } else {
        this.hideHighlight()
      }
    })

    this.container.on('pointerleave', () => {
      this.hideHighlight()
    })

    this.container.on('pointerdown', (e: { globalX: number; globalY: number; stopPropagation: () => void }) => {
      e.stopPropagation()
      if (this.gridClickCallback) {
        const tileLocal = this.tileContainer.toLocal({ x: e.globalX, y: e.globalY })
        const grid = this.screenToGridLocal(tileLocal.x, tileLocal.y)
        if (grid.gridX >= 0 && grid.gridY >= 0 && grid.gridX < this.width && grid.gridY < this.height) {
          this.gridClickCallback(grid.gridX, grid.gridY)
          this.redrawAll()
          this.updateHighlight(grid.gridX, grid.gridY)
        }
      }
    })
  }

  onGridClick(cb: (gridX: number, gridY: number) => void): void {
    this.gridClickCallback = cb
  }

  setDataProvider(provider: () => { tiles: TileType[][]; overlays: { x: number; y: number; type: string }[] }): void {
    this.dataProvider = provider
  }

  loadGrid(tiles: TileType[][], overlayElements?: { x: number; y: number; type: string }[]): void {
    this.width = tiles[0]?.length ?? 0
    this.height = tiles.length
    this.clear()
    this.calculateOffset()
    this.drawTiles(tiles)
    this.drawOverlays(overlayElements ?? [])
    this.tileContainer.sortableChildren = true
    this.overlayContainer.sortableChildren = true
    this.highlightContainer.sortableChildren = true
    this.hideHighlight()
  }

  private updateHighlight(gridX: number, gridY: number): void {
    if (this.hoverGridX === gridX && this.hoverGridY === gridY) return
    this.hoverGridX = gridX
    this.hoverGridY = gridY

    if (this.highlightSprite) {
      this.highlightContainer.removeChild(this.highlightSprite)
    }

    const pos = gridToScreen(gridX, gridY)
    const g = new Graphics()
    g.moveTo(0, -TILE_HEIGHT / 2)
    g.lineTo(TILE_WIDTH / 2, 0)
    g.lineTo(0, TILE_HEIGHT / 2)
    g.lineTo(-TILE_WIDTH / 2, 0)
    g.closePath()
    g.stroke({ color: 0xFF8C42, width: 3 })
    g.fill({ color: 0xFF8C42, alpha: 0.25 })
    g.position.set(pos.x, pos.y)
    g.zIndex = getDepth(gridX, gridY) + 1000
    g.eventMode = 'none'
    this.highlightSprite = g
    this.highlightContainer.addChild(g)
  }

  private hideHighlight(): void {
    this.hoverGridX = -1
    this.hoverGridY = -1
    if (this.highlightSprite) {
      this.highlightContainer.removeChild(this.highlightSprite)
      this.highlightSprite = null
    }
  }

  private drawTiles(tiles: TileType[][]): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.drawSingleTile(x, y, tiles[y][x])
      }
    }
  }

  private drawSingleTile(x: number, y: number, tile: TileType): void {
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
    g.eventMode = 'none'
    this.tileSprites.set(key, g)
    this.tileContainer.addChild(g)
  }

  private drawOverlays(elements: { x: number; y: number; type: string }[]): void {
    this.overlaySprites.forEach((sprite) => this.overlayContainer.removeChild(sprite))
    this.overlaySprites.clear()
    for (const el of elements) {
      this.drawSingleOverlay(el.x, el.y, el.type)
    }
  }

  private drawSingleOverlay(x: number, y: number, type: string): void {
    const key = `${x},${y}`
    const existing = this.overlaySprites.get(key)
    if (existing) {
      this.overlayContainer.removeChild(existing)
    }
    const pos = gridToScreen(x, y)
    const c = new Container()
    const g = new Graphics()
    g.circle(0, -4, 10)
    g.fill(0xFFFFFF)
    g.stroke({ color: 0x333333, width: 1 })
    g.eventMode = 'none'
    c.addChild(g)
    const style = new TextStyle({ fontSize: 12, fill: '#333333' })
    const label = new Text({ text: OVERLAY_EMOJI[type] ?? type.substring(0, 2), style })
    label.anchor.set(0.5)
    label.position.set(0, -4)
    label.eventMode = 'none'
    c.addChild(label)
    c.position.set(pos.x, pos.y)
    c.zIndex = getDepth(x, y) + 0.5
    c.eventMode = 'none'
    this.overlaySprites.set(key, c)
    this.overlayContainer.addChild(c)
  }

  redrawAll(): void {
    if (!this.dataProvider) return
    const data = this.dataProvider()
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (data.tiles[y]?.[x]) {
          this.drawSingleTile(x, y, data.tiles[y][x])
        }
      }
    }
    this.drawOverlays(data.overlays)
  }

  updateTile(x: number, y: number, tile: TileType): void {
    this.drawSingleTile(x, y, tile)
  }

  addOverlay(x: number, y: number, type: string): void {
    this.drawSingleOverlay(x, y, type)
  }

  removeOverlay(x: number, y: number): void {
    const key = `${x},${y}`
    const existing = this.overlaySprites.get(key)
    if (existing) {
      this.overlayContainer.removeChild(existing)
      this.overlaySprites.delete(key)
    }
  }

  private calculateOffset(): void {
    const centerScreen = gridToScreen(Math.floor(this.width / 2), Math.floor(this.height / 2))
    this.offsetX = -centerScreen.x
    this.offsetY = -centerScreen.y
    this.tileContainer.position.set(this.offsetX, this.offsetY)
    this.overlayContainer.position.set(this.offsetX, this.offsetY)
    this.highlightContainer.position.set(this.offsetX, this.offsetY)
  }

  private screenToGridLocal(screenX: number, screenY: number): { gridX: number; gridY: number } {
    const gx = (screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2
    const gy = (screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2
    return { gridX: Math.round(gx), gridY: Math.round(gy) }
  }

  clear(): void {
    this.tileContainer.removeChildren()
    this.overlayContainer.removeChildren()
    this.highlightContainer.removeChildren()
    this.tileSprites.clear()
    this.overlaySprites.clear()
    this.highlightSprite = null
    this.hoverGridX = -1
    this.hoverGridY = -1
  }

  resize(width: number, height: number): void {
    this.viewWidth = width
    this.viewHeight = height
    this.container.position.set(width / 2, height / 2)
    this.container.hitArea = new Rectangle(-width / 2, -height / 2, width, height)
  }
}
