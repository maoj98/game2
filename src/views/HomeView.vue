<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useRoomStore } from '@/stores/room'

const router = useRouter()
const roomStore = useRoomStore()

function createRoom() {
  roomStore.createRoom()
  router.push('/lobby')
}

function joinRoom() {
  roomStore.createRoom()
  roomStore.joinRoom()
  router.push('/lobby')
}

function goToEditor() {
  router.push('/editor')
}
</script>

<template>
  <div class="home-view">
    <div class="home-bg"></div>
    <div class="home-content">
      <div class="title-section">
        <h1 class="game-title">闯关小队</h1>
        <p class="game-subtitle">组队协作 · 收集钥匙 · 破解机关</p>
      </div>

      <div class="characters-parade">
        <div class="char-bounce" style="--delay: 0s; --color: #FF8C42">🐱</div>
        <div class="char-bounce" style="--delay: 0.15s; --color: #C4884D">🐶</div>
        <div class="char-bounce" style="--delay: 0.3s; --color: #F5A5B8">🐰</div>
        <div class="char-bounce" style="--delay: 0.45s; --color: #8B6846">🐻</div>
        <div class="char-bounce" style="--delay: 0.6s; --color: #E8652A">🦊</div>
        <div class="char-bounce" style="--delay: 0.75s; --color: #3D3D3D">🐼</div>
        <div class="char-bounce" style="--delay: 0.9s; --color: #4CAF50">🐸</div>
        <div class="char-bounce" style="--delay: 1.05s; --color: #2C3E6B">🐧</div>
      </div>

      <div class="btn-group">
        <button class="game-btn btn-create" @click="createRoom">
          <span class="btn-icon">🏠</span>
          <span class="btn-text">创建房间</span>
        </button>
        <button class="game-btn btn-join" @click="joinRoom">
          <span class="btn-icon">🚪</span>
          <span class="btn-text">加入房间</span>
        </button>
        <button class="game-btn btn-editor" @click="goToEditor">
          <span class="btn-icon">🗺️</span>
          <span class="btn-text">关卡编辑器</span>
        </button>
      </div>

      <div class="controls-hint">
        <p>🎮 玩家1: WASD + E/Q &nbsp;&nbsp; 玩家2: 方向键 + / .</p>
        <p>🎮 玩家3: IJKL + U/Y &nbsp;&nbsp; 玩家4: 小键盘 8456 + 7/9</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #FFF8E7 0%, #FFE0B2 50%, #FFCC80 100%);
}

.home-bg {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(255,140,66,0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(76,175,80,0.12) 0%, transparent 50%);
  pointer-events: none;
}

.home-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 2rem;
}

.title-section {
  margin-bottom: 2rem;
}

.game-title {
  font-family: 'ZCOOL KuaiLe', cursive;
  font-size: 5rem;
  color: #FF8C42;
  text-shadow:
    3px 3px 0 #E65100,
    6px 6px 0 rgba(0,0,0,0.1);
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
}

.game-subtitle {
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 1.25rem;
  color: #795548;
  letter-spacing: 0.3em;
}

.characters-parade {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.char-bounce {
  font-size: 2.5rem;
  animation: bounce 2s ease-in-out infinite;
  animation-delay: var(--delay);
  filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.15));
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-16px); }
}

.btn-group {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.game-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  border: none;
  border-radius: 16px;
  font-family: 'ZCOOL KuaiLe', cursive;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow:
    0 4px 0 rgba(0,0,0,0.15),
    0 6px 12px rgba(0,0,0,0.1);
  color: white;
}

.game-btn:hover {
  transform: translateY(-3px);
  box-shadow:
    0 7px 0 rgba(0,0,0,0.15),
    0 10px 20px rgba(0,0,0,0.15);
}

.game-btn:active {
  transform: translateY(2px);
  box-shadow:
    0 2px 0 rgba(0,0,0,0.15),
    0 3px 6px rgba(0,0,0,0.1);
}

.btn-icon { font-size: 1.5rem; }

.btn-create { background: linear-gradient(135deg, #FF8C42, #FF6D00); }
.btn-join { background: linear-gradient(135deg, #4CAF50, #2E7D32); }
.btn-editor { background: linear-gradient(135deg, #7E57C2, #512DA8); }

.controls-hint {
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 1rem 2rem;
  display: inline-block;
}

.controls-hint p {
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 0.875rem;
  color: #5D4037;
  margin: 0.25rem 0;
}
</style>
