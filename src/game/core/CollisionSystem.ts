import type { TileType, MechanismConfig } from '@/types'

export class CollisionSystem {
  private tiles: TileType[][] = []
  private blockedCells: Set<string> = new Set()
  private width = 0
  private height = 0

  loadMap(tiles: TileType[][], mechanisms: MechanismConfig[]): void {
    this.tiles = tiles
    this.height = tiles.length
    this.width = tiles[0]?.length ?? 0
    this.blockedCells.clear()
    for (const m of mechanisms) {
      if (m.type === 'pushBlock') {
        this.blockedCells.add(`${m.gridX},${m.gridY}`)
      }
    }
  }

  updateBlockPosition(fromX: number, fromY: number, toX: number, toY: number): void {
    this.blockedCells.delete(`${fromX},${fromY}`)
    this.blockedCells.add(`${toX},${toY}`)
  }

  isWalkable(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false
    const tile = this.tiles[y]?.[x]
    if (!tile) return false
    if (tile === 'wall' || tile === 'water') return false
    if (this.blockedCells.has(`${x},${y}`)) return false
    return true
  }

  isPushDestinationValid(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false
    const tile = this.tiles[y]?.[x]
    if (!tile || tile === 'wall' || tile === 'water') return false
    if (this.blockedCells.has(`${x},${y}`)) return false
    return true
  }

  getTile(x: number, y: number): TileType | undefined {
    return this.tiles[y]?.[x]
  }

  setTile(x: number, y: number, tile: TileType): void {
    if (y >= 0 && y < this.height && x >= 0 && x < this.width) {
      this.tiles[y][x] = tile
    }
  }
}
