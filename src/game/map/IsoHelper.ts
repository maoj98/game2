export const TILE_WIDTH = 64
export const TILE_HEIGHT = 32

export function gridToScreen(gridX: number, gridY: number): { x: number; y: number } {
  return {
    x: (gridX - gridY) * TILE_WIDTH / 2,
    y: (gridX + gridY) * TILE_HEIGHT / 2,
  }
}

export function screenToGrid(screenX: number, screenY: number): { gridX: number; gridY: number } {
  const gx = (screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2
  const gy = (screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2
  return { gridX: Math.round(gx), gridY: Math.round(gy) }
}

export function getDepth(gridX: number, gridY: number): number {
  return gridX + gridY
}
