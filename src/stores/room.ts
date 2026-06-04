import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PlayerState, RoomState } from '@/types'
import { SKINS, LEVELS } from '@/data'

let playerCounter = 0

export const useRoomStore = defineStore('room', () => {
  const roomId = ref('')
  const hostId = ref('')
  const levelId = ref('level1')
  const status = ref<'waiting' | 'playing' | 'result'>('waiting')
  const players = ref<PlayerState[]>([])

  const currentLevel = computed(() => LEVELS.find((l) => l.id === levelId.value) ?? LEVELS[0])
  const canStart = computed(() => players.value.length > 0 && players.value.every((p) => p.ready))
  const isHost = computed(() => true)

  function createRoom(): void {
    roomId.value = Math.random().toString(36).substring(2, 8).toUpperCase()
    hostId.value = 'player0'
    status.value = 'waiting'
    players.value = []
    addPlayer('player0')
  }

  function joinRoom(): void {
    if (players.value.length >= 4) return
    const id = `player${players.value.length}`
    addPlayer(id)
  }

  function addPlayer(id: string): void {
    playerCounter++
    const slotIndex = players.value.length
    const uid = `player_${Date.now()}_${playerCounter}`
    players.value.push({
      uid,
      id,
      name: `玩家${playerCounter}`,
      skinId: SKINS[slotIndex % SKINS.length].id,
      ready: false,
      slotIndex,
      gridX: 0,
      gridY: 0,
      direction: 'down',
      isMoving: false,
      heldItem: null,
      shieldActive: false,
      speedBoostActive: false,
      speedBoostTimer: 0,
      alive: true,
    })
  }

  function getCounter(): number {
    return playerCounter
  }

  function resetCounter(): void {
    playerCounter = 0
  }

  function setPlayerSkin(playerIndex: number, skinId: string): void {
    if (players.value[playerIndex]) {
      players.value[playerIndex].skinId = skinId
    }
  }

  function setPlayerReady(playerIndex: number): void {
    if (players.value[playerIndex]) {
      players.value[playerIndex].ready = !players.value[playerIndex].ready
    }
  }

  function setLevel(id: string): void {
    levelId.value = id
  }

  function setStatus(s: 'waiting' | 'playing' | 'result'): void {
    status.value = s
  }

  function removePlayer(playerIndex: number): void {
    if (playerIndex >= 0 && playerIndex < players.value.length) {
      players.value.splice(playerIndex, 1)
      players.value.forEach((p, i) => { p.slotIndex = i })
    }
  }

  function reset(): void {
    roomId.value = ''
    hostId.value = ''
    levelId.value = 'level1'
    status.value = 'waiting'
    players.value = []
    resetCounter()
  }

  return {
    roomId, hostId, levelId, status, players,
    currentLevel, canStart, isHost,
    createRoom, joinRoom, setPlayerSkin, setPlayerReady, setLevel, setStatus, removePlayer, reset, getCounter,
  }
})
