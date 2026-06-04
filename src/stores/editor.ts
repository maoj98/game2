import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LevelData, TileType, MechanismConfig, ItemSpawn, IsoPosition, DoorConfig } from '@/types'

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
  const selectedTool = ref<'select' | 'tile' | 'mechanism' | 'item' | 'key' | 'door' | 'spawn' | 'erase'>('tile')
  const selectedTile = ref<TileType>('ground')
  const selectedMechanism = ref<MechanismConfig['type']>('pushBlock')
  const selectedItem = ref<ItemSpawn['itemType']>('shield')
  const selectedElement = ref<number | null>(null)

  const isValid = computed(() => {
    return name.value.length > 0 && keys.value.length > 0 && doors.value.length > 0 && playerSpawns.value.length > 0
  })

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
    mechanisms.value.push({ ...m })
  }

  function removeMechanism(index: number): void {
    mechanisms.value.splice(index, 1)
  }

  function addItem(i: ItemSpawn): void {
    items.value.push({ ...i })
  }

  function removeItem(index: number): void {
    items.value.splice(index, 1)
  }

  function addKey(pos: IsoPosition): void {
    keys.value.push({ ...pos })
  }

  function removeKey(index: number): void {
    keys.value.splice(index, 1)
  }

  function addDoor(d: DoorConfig): void {
    doors.value.push({ ...d })
  }

  function removeDoor(index: number): void {
    doors.value.splice(index, 1)
  }

  function setPlayerSpawns(spawns: IsoPosition[]): void {
    playerSpawns.value = spawns.map((s) => ({ ...s }))
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

  function saveToLocalStorage(): void {
    const data = exportLevel()
    const saved = JSON.parse(localStorage.getItem('custom_levels') ?? '[]')
    saved.push(data)
    localStorage.setItem('custom_levels', JSON.stringify(saved))
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
    exportLevel, saveToLocalStorage, loadFromLocalStorage, loadLevel, reset,
  }
})
