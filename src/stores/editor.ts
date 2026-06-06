import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LevelData, TileType, MechanismConfig, ItemSpawn, IsoPosition, DoorConfig } from '@/types'

export type EditorTool = 'tile' | 'mechanism' | 'item' | 'key' | 'door' | 'spawn' | 'erase'

export const useEditorStore = defineStore('editor', () => {
  const name = ref('自定义关卡')
  const width = ref(10)
  const height = ref(10)
  const timeLimit = ref(120)
  const tiles = ref<TileType[][]>([])
  const mechanisms = ref<MechanismConfig[]>([])
  const items = ref<ItemSpawn[]>([])
  const keys = ref<IsoPosition[]>([])
  const doors = ref<DoorConfig[]>([])
  const playerSpawns = ref<IsoPosition[]>([])
  const selectedTool = ref<EditorTool>('tile')
  const selectedTile = ref<TileType>('ground')
  const selectedMechanism = ref<MechanismConfig['type']>('pushBlock')
  const selectedItem = ref<ItemSpawn['itemType']>('shield')
  const selectedElement = ref<number | null>(null)

  const isValid = computed(() => {
    return name.value.length > 0 && keys.value.length > 0 && doors.value.length > 0 && playerSpawns.value.length > 0
  })

  function validateLevel(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!name.value || name.value.trim().length === 0) {
      errors.push('关卡名称不能为空')
    }

    if (width.value < 5 || width.value > 20) {
      errors.push('地图宽度必须在 5-20 之间')
    }

    if (height.value < 5 || height.value > 20) {
      errors.push('地图高度必须在 5-20 之间')
    }

    if (timeLimit.value < 30 || timeLimit.value > 600) {
      errors.push('限时必须在 30-600 秒之间')
    }

    if (playerSpawns.value.length === 0) {
      errors.push('必须至少放置一个出生点')
    }

    if (keys.value.length === 0) {
      errors.push('必须至少放置一把钥匙')
    }

    if (doors.value.length === 0) {
      errors.push('必须至少放置一扇门')
    }

    const minRequiredKeys = Math.min(...doors.value.map(d => d.requiredKeys))
    if (keys.value.length < minRequiredKeys) {
      errors.push(`钥匙数量不足：需要至少 ${minRequiredKeys} 把钥匙才能打开要求最高的门`)
    }

    const hasGround = tiles.value.some(row => row.some(tile => tile === 'ground'))
    if (!hasGround) {
      errors.push('地图必须包含可通行的地面')
    }

    return { valid: errors.length === 0, errors }
  }

  function initGrid(): void {
    const newTiles: TileType[][] = []
    for (let y = 0; y < height.value; y++) {
      const row: TileType[] = []
      for (let x = 0; x < width.value; x++) {
        if (x === 0 || y === 0 || x === width.value - 1 || y === height.value - 1) {
          row.push('wall')
        } else {
          row.push('ground')
        }
      }
      newTiles.push(row)
    }
    tiles.value = newTiles
    mechanisms.value = []
    items.value = []
    keys.value = []
    doors.value = []
    playerSpawns.value = [{ gridX: 1, gridY: 1 }]
  }

  function setTile(x: number, y: number, tile: TileType): void {
    if (y >= 0 && y < tiles.value.length && x >= 0 && x < tiles.value[0].length) {
      tiles.value[y][x] = tile
    }
  }

  function addMechanism(m: MechanismConfig): void {
    const exists = mechanisms.value.some((me) => me.gridX === m.gridX && me.gridY === m.gridY && me.type === m.type)
    if (exists) return
    mechanisms.value.push({ ...m })
  }

  function removeMechanism(index: number): void {
    mechanisms.value.splice(index, 1)
  }

  function addItem(i: ItemSpawn): void {
    const exists = items.value.some((it) => it.gridX === i.gridX && it.gridY === i.gridY && it.itemType === i.itemType)
    if (exists) return
    items.value.push({ ...i })
  }

  function removeItem(index: number): void {
    items.value.splice(index, 1)
  }

  function addKey(pos: IsoPosition): void {
    const exists = keys.value.some((k) => k.gridX === pos.gridX && k.gridY === pos.gridY)
    if (exists) return
    keys.value.push({ ...pos })
  }

  function removeKey(index: number): void {
    keys.value.splice(index, 1)
  }

  function addDoor(d: DoorConfig): void {
    const exists = doors.value.some((dr) => dr.gridX === d.gridX && dr.gridY === d.gridY)
    if (exists) return
    doors.value.push({ ...d })
  }

  function removeDoor(index: number): void {
    doors.value.splice(index, 1)
  }

  function setPlayerSpawns(spawns: IsoPosition[]): void {
    playerSpawns.value = spawns.map((s) => ({ ...s }))
  }

  function placeElement(gridX: number, gridY: number): boolean {
    if (gridX < 0 || gridY < 0 || gridX >= width.value || gridY >= height.value) return false

    const tool = selectedTool.value

    if (tool === 'tile') {
      setTile(gridX, gridY, selectedTile.value)
      return true
    }

    if (tool === 'mechanism') {
      addMechanism({
        type: selectedMechanism.value,
        gridX,
        gridY,
        config: selectedMechanism.value === 'timedPlatform' ? { duration: 5 } : {},
      })
      return true
    }

    if (tool === 'item') {
      addItem({ itemType: selectedItem.value, gridX, gridY })
      return true
    }

    if (tool === 'key') {
      addKey({ gridX, gridY })
      return true
    }

    if (tool === 'door') {
      addDoor({ gridX, gridY, requiredKeys: keys.value.length || 1 })
      return true
    }

    if (tool === 'spawn') {
      setPlayerSpawns([{ gridX, gridY }])
      return true
    }

    return false
  }

  function eraseElement(gridX: number, gridY: number): boolean {
    if (gridX < 0 || gridY < 0 || gridX >= width.value || gridY >= height.value) return false

    let erased = false

    const mIdx = mechanisms.value.findIndex((m) => m.gridX === gridX && m.gridY === gridY)
    if (mIdx >= 0) {
      removeMechanism(mIdx)
      erased = true
    }

    const iIdx = items.value.findIndex((i) => i.gridX === gridX && i.gridY === gridY)
    if (iIdx >= 0) {
      removeItem(iIdx)
      erased = true
    }

    const kIdx = keys.value.findIndex((k) => k.gridX === gridX && k.gridY === gridY)
    if (kIdx >= 0) {
      removeKey(kIdx)
      erased = true
    }

    const dIdx = doors.value.findIndex((d) => d.gridX === gridX && d.gridY === gridY)
    if (dIdx >= 0) {
      removeDoor(dIdx)
      erased = true
    }

    const hasSpawn = playerSpawns.value.some((s) => s.gridX === gridX && s.gridY === gridY)
    if (hasSpawn) {
      playerSpawns.value = playerSpawns.value.filter((s) => !(s.gridX === gridX && s.gridY === gridY))
      erased = true
    }

    if (tiles.value[gridY]?.[gridX] && tiles.value[gridY][gridX] !== 'ground') {
      tiles.value[gridY][gridX] = 'ground'
      erased = true
    }

    return erased
  }

  function resize(w: number, h: number): void {
    width.value = w
    height.value = h
    initGrid()
  }

  function exportLevel(): LevelData {
    return {
      id: `custom_${Date.now()}`,
      name: name.value,
      difficulty: 1,
      timeLimit: timeLimit.value,
      width: width.value,
      height: height.value,
      tiles: tiles.value.map((row) => [...row]),
      mechanisms: mechanisms.value.map((m) => ({ ...m })),
      items: items.value.map((i) => ({ ...i })),
      keys: keys.value.map((k) => ({ ...k })),
      doors: doors.value.map((d) => ({ ...d })),
      playerSpawns: playerSpawns.value.map((s) => ({ ...s })),
      starThresholds: {
        star1: timeLimit.value,
        star2: Math.floor(timeLimit.value * 0.7),
        star3: Math.floor(timeLimit.value * 0.4),
      },
    }
  }

  function saveToLocalStorage(): { success: boolean; errors: string[] } {
    const validation = validateLevel()
    if (!validation.valid) {
      return { success: false, errors: validation.errors }
    }
    const data = exportLevel()
    const saved = JSON.parse(localStorage.getItem('custom_levels') ?? '[]')
    saved.push(data)
    localStorage.setItem('custom_levels', JSON.stringify(saved))
    return { success: true, errors: [] }
  }

  function loadFromLocalStorage(): LevelData[] {
    return JSON.parse(localStorage.getItem('custom_levels') ?? '[]')
  }

  function loadLevel(level: LevelData): void {
    name.value = level.name
    width.value = level.width
    height.value = level.height
    timeLimit.value = level.timeLimit
    tiles.value = level.tiles.map((row) => [...row])
    mechanisms.value = level.mechanisms.map((m) => ({ ...m }))
    items.value = level.items.map((i) => ({ ...i }))
    keys.value = level.keys.map((k) => ({ ...k }))
    doors.value = level.doors.map((d) => ({ ...d }))
    playerSpawns.value = level.playerSpawns.map((s) => ({ ...s }))
  }

  function reset(): void {
    name.value = '自定义关卡'
    width.value = 10
    height.value = 10
    timeLimit.value = 120
    selectedTool.value = 'tile'
    selectedTile.value = 'ground'
    selectedMechanism.value = 'pushBlock'
    selectedItem.value = 'shield'
    selectedElement.value = null
    initGrid()
  }

  initGrid()

  return {
    name, width, height, timeLimit, tiles, mechanisms, items, keys, doors, playerSpawns,
    selectedTool, selectedTile, selectedMechanism, selectedItem, selectedElement,
    isValid,
    initGrid, setTile, addMechanism, removeMechanism, addItem, removeItem,
    addKey, removeKey, addDoor, removeDoor, setPlayerSpawns, resize,
    placeElement, eraseElement, validateLevel,
    exportLevel, saveToLocalStorage, loadFromLocalStorage, loadLevel, reset,
  }
})
