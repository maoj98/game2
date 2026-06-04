<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRoomStore } from '@/stores/room'
import { SKINS, LEVELS } from '@/data'

const router = useRouter()
const roomStore = useRoomStore()

const canStart = computed(() => roomStore.canStart)
const players = computed(() => roomStore.players)
const currentLevel = computed(() => roomStore.currentLevel)

const selectedPlayerIdx = ref(0)

function skinEmoji(skinId: string): string {
  const map: Record<string, string> = {
    cat: '🐱', dog: '🐶', bunny: '🐰', bear: '🐻',
    fox: '🦊', panda: '🐼', frog: '🐸', penguin: '🐧',
  }
  return map[skinId] ?? '🐱'
}

function selectPlayer(idx: number) {
  selectedPlayerIdx.value = idx
}

function selectSkin(skinId: string) {
  if (selectedPlayerIdx.value < roomStore.players.length) {
    roomStore.setPlayerSkin(selectedPlayerIdx.value, skinId)
  }
}

function toggleReady(playerIndex: number) {
  roomStore.setPlayerReady(playerIndex)
}

function removePlayer(playerIndex: number) {
  roomStore.removePlayer(playerIndex)
  if (selectedPlayerIdx.value >= roomStore.players.length) {
    selectedPlayerIdx.value = Math.max(0, roomStore.players.length - 1)
  }
}

function selectLevel(levelId: string) {
  roomStore.setLevel(levelId)
}

function addPlayer() {
  if (roomStore.players.length < 4) {
    roomStore.joinRoom()
    selectedPlayerIdx.value = roomStore.players.length - 1
  }
}

function startGame() {
  if (canStart.value) {
    roomStore.setStatus('playing')
    router.push('/game')
  }
}

function goBack() {
  roomStore.reset()
  router.push('/')
}
</script>

<template>
  <div class="lobby-view">
    <div class="lobby-bg"></div>
    <div class="lobby-content">
      <div class="lobby-header">
        <button class="back-btn" @click="goBack">← 返回</button>
        <div class="room-info">
          <span class="room-label">房间号</span>
          <span class="room-code">{{ roomStore.roomId }}</span>
        </div>
      </div>

      <div class="lobby-body">
        <div class="left-panel">
          <h2 class="section-title">玩家列表</h2>
          <div class="player-list">
            <div
              v-for="(player, idx) in players"
              :key="player.uid"
              class="player-card"
              :class="{
                ready: player.ready,
                selected: selectedPlayerIdx === idx
              }"
              @click="selectPlayer(idx)"
            >
              <div class="player-order">{{ idx + 1 }}</div>
              <button
                class="delete-btn"
                @click.stop="removePlayer(idx)"
                title="移除玩家"
              >✕</button>
              <div
                class="player-avatar"
                :style="{ background: SKINS.find(s => s.id === player.skinId)?.color ?? '#999' }"
              >
                {{ skinEmoji(player.skinId) }}
              </div>
              <div class="player-info">
                <span class="player-name">{{ player.name }}</span>
                <span class="player-skin">{{ SKINS.find(s => s.id === player.skinId)?.name }}</span>
              </div>
              <button
                class="ready-btn"
                :class="{ 'is-ready': player.ready }"
                @click.stop="toggleReady(idx)"
              >
                {{ player.ready ? '✅ 已准备' : '准备' }}
              </button>
            </div>
            <button
              v-if="players.length < 4"
              class="add-player-btn"
              @click="addPlayer"
            >
              + 添加玩家
            </button>
          </div>

          <h2 class="section-title">
            选择皮肤
            <span v-if="players[selectedPlayerIdx]" class="skin-hint">
              （{{ players[selectedPlayerIdx].name }}）
            </span>
          </h2>
          <div class="skin-grid">
            <div
              v-for="skin in SKINS"
              :key="skin.id"
              class="skin-item"
              :class="{
                'skin-active': players[selectedPlayerIdx]?.skinId === skin.id
              }"
              :style="{ borderColor: players[selectedPlayerIdx]?.skinId === skin.id ? skin.color : 'transparent' }"
              @click="selectSkin(skin.id)"
            >
              <div class="skin-preview" :style="{ background: skin.color }">
                <span class="skin-emoji">{{ skinEmoji(skin.id) }}</span>
              </div>
              <span class="skin-name">{{ skin.name }}</span>
            </div>
          </div>
        </div>

        <div class="right-panel">
          <h2 class="section-title">选择关卡</h2>
          <div class="level-list">
            <div
              v-for="level in LEVELS"
              :key="level.id"
              class="level-card"
              :class="{ selected: roomStore.levelId === level.id }"
              @click="selectLevel(level.id)"
            >
              <div class="level-preview" :style="{
                background: level.difficulty === 1 ? '#C8E6C9' : level.difficulty === 2 ? '#FFE0B2' : '#FFCDD2'
              }">
                <span class="level-diff">{{ '⭐'.repeat(level.difficulty) }}</span>
              </div>
              <div class="level-info">
                <span class="level-name">{{ level.name }}</span>
                <span class="level-size">{{ level.width }}×{{ level.height }} · {{ level.timeLimit }}秒</span>
              </div>
            </div>
          </div>

          <div class="level-detail" v-if="currentLevel">
            <h3>{{ currentLevel.name }}</h3>
            <p>🔑 钥匙: {{ currentLevel.keys.length }} · 🚪 门: {{ currentLevel.doors.length }}</p>
            <p>⚙️ 机关: {{ currentLevel.mechanisms.length }} · 💊 道具: {{ currentLevel.items.length }}</p>
          </div>

          <div class="action-buttons">
            <button
              class="start-btn"
              :class="{ disabled: !canStart }"
              :disabled="!canStart"
              @click="startGame"
            >
              🚀 开始游戏
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lobby-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #FFF8E7 0%, #FFE0B2 100%);
  padding: 1rem;
}

.lobby-bg {
  position: fixed;
  inset: 0;
  background-image:
    radial-gradient(circle at 10% 20%, rgba(255,140,66,0.08) 0%, transparent 40%),
    radial-gradient(circle at 90% 80%, rgba(76,175,80,0.08) 0%, transparent 40%);
  pointer-events: none;
}

.lobby-content {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
}

.lobby-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.back-btn {
  background: rgba(255,255,255,0.7);
  border: 2px solid #FF8C42;
  border-radius: 12px;
  padding: 0.5rem 1.25rem;
  font-family: 'ZCOOL KuaiLe', cursive;
  font-size: 1rem;
  color: #FF8C42;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #FF8C42;
  color: white;
}

.room-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255,255,255,0.8);
  padding: 0.5rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.room-label {
  font-size: 0.875rem;
  color: #795548;
}

.room-code {
  font-family: 'ZCOOL KuaiLe', cursive;
  font-size: 1.5rem;
  color: #FF8C42;
  letter-spacing: 0.15em;
}

.lobby-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.section-title {
  font-family: 'ZCOOL KuaiLe', cursive;
  font-size: 1.25rem;
  color: #5D4037;
  margin-bottom: 0.75rem;
}

.skin-hint {
  font-size: 0.875rem;
  color: #FF8C42;
  font-weight: normal;
}

.player-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.player-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255,255,255,0.7);
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 2.5px solid transparent;
  transition: all 0.2s;
  cursor: pointer;
}

.player-card.selected {
  border-color: #FF8C42;
  background: rgba(255,140,66,0.12);
  box-shadow: 0 0 0 2px rgba(255,140,66,0.25);
}

.player-card.ready {
  border-color: #4CAF50;
  background: rgba(76,175,80,0.1);
}

.player-card.selected.ready {
  border-color: #FF8C42;
  background: rgba(255,140,66,0.12);
  box-shadow: 0 0 0 2px rgba(255,140,66,0.25);
}

.delete-btn {
  position: absolute;
  top: 4px;
  right: 6px;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: rgba(229,57,53,0.12);
  color: #E53935;
  font-size: 0.75rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0;
}

.player-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: #E53935;
  color: white;
}

.player-order {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #FF8C42;
  color: white;
  font-family: 'ZCOOL KuaiLe', cursive;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(255,140,66,0.4);
  z-index: 1;
}

.player-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.player-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.player-name {
  font-weight: bold;
  color: #3E2723;
}

.player-skin {
  font-size: 0.75rem;
  color: #795548;
}

.ready-btn {
  padding: 0.375rem 1rem;
  border-radius: 8px;
  border: 2px solid #4CAF50;
  background: transparent;
  color: #4CAF50;
  font-family: 'ZCOOL KuaiLe', cursive;
  cursor: pointer;
  transition: all 0.2s;
}

.ready-btn.is-ready {
  background: #4CAF50;
  color: white;
}

.add-player-btn {
  padding: 0.75rem;
  border: 2px dashed #BCAAA4;
  border-radius: 12px;
  background: transparent;
  color: #8D6E63;
  font-family: 'ZCOOL KuaiLe', cursive;
  cursor: pointer;
  transition: all 0.2s;
}

.add-player-btn:hover {
  border-color: #FF8C42;
  color: #FF8C42;
}

.skin-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.skin-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  border: 2px solid transparent;
  border-radius: 12px;
  background: rgba(255,255,255,0.6);
  cursor: pointer;
  transition: all 0.2s;
}

.skin-item:hover {
  background: rgba(255,255,255,0.9);
  transform: scale(1.05);
}

.skin-item.skin-active {
  background: rgba(255,255,255,0.95);
  transform: scale(1.08);
  box-shadow: 0 0 0 3px rgba(255,140,66,0.3);
}

.skin-preview {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.25rem;
}

.skin-emoji { font-size: 1.5rem; }

.skin-name {
  font-size: 0.75rem;
  color: #5D4037;
}

.level-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.level-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(255,255,255,0.6);
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.level-card:hover {
  background: rgba(255,255,255,0.9);
}

.level-card.selected {
  border-color: #FF8C42;
  background: rgba(255,140,66,0.1);
}

.level-preview {
  width: 60px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.level-diff { font-size: 0.75rem; }

.level-info {
  display: flex;
  flex-direction: column;
}

.level-name {
  font-family: 'ZCOOL KuaiLe', cursive;
  color: #3E2723;
}

.level-size {
  font-size: 0.75rem;
  color: #795548;
}

.level-detail {
  background: rgba(255,255,255,0.7);
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.level-detail h3 {
  font-family: 'ZCOOL KuaiLe', cursive;
  color: #FF8C42;
  margin-bottom: 0.5rem;
}

.level-detail p {
  font-size: 0.875rem;
  color: #5D4037;
  margin: 0.25rem 0;
}

.action-buttons {
  text-align: center;
}

.start-btn {
  padding: 1rem 3rem;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #4CAF50, #2E7D32);
  color: white;
  font-family: 'ZCOOL KuaiLe', cursive;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 4px 0 #1B5E20, 0 6px 12px rgba(0,0,0,0.1);
  transition: all 0.2s;
}

.start-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 0 #1B5E20, 0 8px 16px rgba(0,0,0,0.15);
}

.start-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
