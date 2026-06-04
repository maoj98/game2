<script setup lang="ts">
import { ref, onMounted, onUnmounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Application } from 'pixi.js'
import { useGameStore } from '@/stores/game'
import { useRoomStore } from '@/stores/room'
import { GameScene } from '@/scenes/GameScene'
import { LEVELS, INPUT_MAPPINGS } from '@/data'
import type { MechanismConfig } from '@/types'
import { InputManager } from '@/game/core/InputManager'

const router = useRouter()
const gameStore = useGameStore()
const roomStore = useRoomStore()

const canvasContainer = ref<HTMLDivElement>()
let app: Application | null = null
let scene: GameScene | null = null
const input = InputManager.getInstance()

const debugKeys = ref<string[]>([])
let debugInterval: number | null = null

onMounted(async () => {
  if (!canvasContainer.value) return

  const level = LEVELS.find((l) => l.id === roomStore.levelId) ?? LEVELS[0]
  const playerCount = roomStore.players.length || 1

  gameStore.loadLevel(level, playerCount)
  gameStore.setPlayerSkins(
    roomStore.players.map((p) => ({ slotIndex: p.slotIndex, skinId: p.skinId }))
  )

  app = new Application()
  await app.init({
    background: '#FFF8E7',
    resizeTo: canvasContainer.value,
    antialias: true,
  })
  canvasContainer.value.appendChild(app.canvas)

  scene = new GameScene()
  scene.loadLevel(level)
  scene.resize(app.screen.width, app.screen.height)
  app.stage.addChild(scene.container)

  gameStore.engine.onEvent((event: string, data: unknown) => {
    if (!scene) return

    if (event === 'playerMoved') {
      scene.updatePlayers(gameStore.engine.players)
    } else if (event === 'keyCollected') {
      const d = data as { keyIndex: number }
      scene.removeKey(d.keyIndex)
    } else if (event === 'itemPicked') {
      const d = data as { item: { itemType: string; gridX: number; gridY: number } }
      const idx = gameStore.engine.items.findIndex(
        (i) => i.gridX === d.item.gridX && i.gridY === d.item.gridY
      )
      if (idx >= 0) scene.removeItem(idx)
    } else if (event === 'doorOpened') {
      const d = data as { doorIndex: number }
      scene.openDoor(d.doorIndex)
    } else if (event === 'blockMoved') {
      const d = data as MechanismConfig
      scene.moveBlock(d)
    } else if (event === 'switchToggled') {
      const d = data as { mechanism: MechanismConfig; activated: boolean }
      scene.updateMechanismState(`stepSwitch_${d.mechanism.gridX},${d.mechanism.gridY}`, d.activated)
    } else if (event === 'platformDisappeared') {
      const d = data as MechanismConfig
      scene.removeTimedPlatform(d.gridX, d.gridY)
    } else if (event === 'platformRestored') {
      const d = data as MechanismConfig
      scene.restoreTimedPlatform(d.gridX, d.gridY)
    } else if (event === 'shieldActivated' || event === 'speedBoostActivated') {
      scene.updatePlayers(gameStore.engine.players)
    } else if (event === 'shieldUsed') {
      scene.updatePlayers(gameStore.engine.players)
    } else if (event === 'playerDied') {
      scene.updatePlayers(gameStore.engine.players)
    } else if (event === 'gameFinished') {
      setTimeout(() => {
        router.push('/result')
      }, 1500)
    }
  })

  scene.updatePlayers(gameStore.engine.players)
  gameStore.start()

  debugInterval = window.setInterval(updateDebugKeys, 50)
})

function updateDebugKeys() {
  const pressed: string[] = []
  const mapping = INPUT_MAPPINGS[0]
  if (mapping) {
    if (input.isPressed(mapping.up)) pressed.push('↑')
    if (input.isPressed(mapping.down)) pressed.push('↓')
    if (input.isPressed(mapping.left)) pressed.push('←')
    if (input.isPressed(mapping.right)) pressed.push('→')
    if (input.isJustPressed(mapping.interact)) pressed.push('E')
  }
  debugKeys.value = pressed
}

onBeforeUnmount(() => {
  if (debugInterval) {
    clearInterval(debugInterval)
    debugInterval = null
  }
})

onUnmounted(() => {
  gameStore.stop()
  if (app) {
    app.destroy(true)
    app = null
  }
  scene = null
})

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function exitGame() {
  gameStore.reset()
  router.push('/')
}
</script>

<template>
  <div class="game-view">
    <div class="game-hud" v-if="gameStore.engine.level">
      <div class="hud-left">
        <div class="hud-timer" :class="{ urgent: gameStore.timeRemaining < 30 }">
          ⏱️ {{ formatTime(gameStore.timeRemaining) }}
        </div>
      </div>
      <div class="hud-center">
        <div class="hud-keys">
          🔑 {{ gameStore.collectedKeys }} / {{ gameStore.totalKeys }}
        </div>
      </div>
      <div class="hud-right">
        <div class="hud-players">
          <span
            v-for="player in gameStore.players"
            :key="player.id"
            class="player-indicator"
            :class="{ dead: !player.alive }"
          >
            {{ player.name }}
            <span v-if="player.heldItem" class="item-badge">
              {{ player.heldItem === 'shield' ? '🛡️' : '⚡' }}
            </span>
          </span>
        </div>
        <button class="exit-btn" @click="exitGame">退出</button>
      </div>
    </div>

    <div class="canvas-container" ref="canvasContainer"></div>

    <div class="debug-panel">
      <div class="debug-title">🎮 调试信息</div>
      <div class="debug-row">
        <span class="debug-label">按键:</span>
        <span class="debug-value">{{ debugKeys.length > 0 ? debugKeys.join(' ') : '无' }}</span>
      </div>
      <div class="debug-row" v-for="player in gameStore.players" :key="player.id">
        <span class="debug-label">{{ player.name }}:</span>
        <span class="debug-value">({{ player.gridX }}, {{ player.gridY }}) {{ player.direction }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-view {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: #FFF8E7;
}

.debug-panel {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  background: rgba(0,0,0,0.75);
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-family: monospace;
  font-size: 0.875rem;
  z-index: 100;
  min-width: 200px;
}

.debug-title {
  font-weight: bold;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255,255,255,0.2);
  padding-bottom: 0.25rem;
}

.debug-row {
  display: flex;
  justify-content: space-between;
  margin: 0.25rem 0;
}

.debug-label {
  opacity: 0.7;
}

.debug-value {
  color: #4CAF50;
  font-weight: bold;
}

.game-hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: rgba(255,248,231,0.9);
  backdrop-filter: blur(8px);
  border-bottom: 2px solid rgba(255,140,66,0.3);
}

.hud-left, .hud-center, .hud-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.hud-timer {
  font-family: 'ZCOOL KuaiLe', cursive;
  font-size: 1.5rem;
  color: #5D4037;
  background: rgba(255,255,255,0.8);
  padding: 0.25rem 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.hud-timer.urgent {
  color: #E53935;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.hud-keys {
  font-family: 'ZCOOL KuaiLe', cursive;
  font-size: 1.25rem;
  color: #FF8C42;
  background: rgba(255,255,255,0.8);
  padding: 0.25rem 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.player-indicator {
  font-size: 0.875rem;
  color: #5D4037;
  background: rgba(255,255,255,0.8);
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
}

.player-indicator.dead {
  opacity: 0.3;
  text-decoration: line-through;
}

.item-badge { font-size: 0.75rem; }

.exit-btn {
  background: rgba(229,57,53,0.15);
  border: 1.5px solid #E53935;
  border-radius: 8px;
  padding: 0.25rem 0.75rem;
  color: #E53935;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.exit-btn:hover {
  background: #E53935;
  color: white;
}

.canvas-container {
  width: 100%;
  height: 100%;
}
</style>
