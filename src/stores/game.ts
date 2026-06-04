import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { GameResult, LevelData, PlayerState } from '@/types'
import { GameEngine } from '@/game/core/GameEngine'

export const useGameStore = defineStore('game', () => {
  const engine = ref(new GameEngine())
  const timeRemaining = ref(0)
  const collectedKeys = ref(0)
  const totalKeys = ref(0)
  const players = ref<PlayerState[]>([])
  const finished = ref(false)
  const result = ref<GameResult | null>(null)
  const animFrameId = ref(0)

  function loadLevel(level: LevelData, playerCount: number): void {
    engine.value.loadLevel(level, playerCount)
    syncState()
  }

  function setPlayerSkins(skins: { slotIndex: number; skinId: string }[]): void {
    for (const s of skins) {
      engine.value.setPlayerSkin(s.slotIndex, s.skinId)
    }
  }

  function start(): void {
    engine.value.onEvent((event, data) => {
      if (event === 'gameFinished') {
        finished.value = true
        result.value = data as GameResult
      }
    })
    engine.value.start()
    gameLoop(performance.now())
  }

  function gameLoop(timestamp: number): void {
    if (finished.value) return
    engine.value.update(timestamp)
    syncState()
    animFrameId.value = requestAnimationFrame(gameLoop)
  }

  function syncState(): void {
    timeRemaining.value = engine.value.timeRemaining
    collectedKeys.value = engine.value.collectedKeys
    totalKeys.value = engine.value.level?.keys.length ?? 0
    players.value = engine.value.players.map((p) => ({ ...p }))
    finished.value = engine.value.finished
    result.value = engine.value.result
  }

  function stop(): void {
    cancelAnimationFrame(animFrameId.value)
    finished.value = true
  }

  function reset(): void {
    cancelAnimationFrame(animFrameId.value)
    engine.value = new GameEngine()
    timeRemaining.value = 0
    collectedKeys.value = 0
    totalKeys.value = 0
    players.value = []
    finished.value = false
    result.value = null
  }

  return {
    engine, timeRemaining, collectedKeys, totalKeys, players, finished, result,
    loadLevel, setPlayerSkins, start, stop, reset,
  }
})
