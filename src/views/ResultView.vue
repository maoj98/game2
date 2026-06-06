<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

const result = computed(() => gameStore.result)
const stars = computed(() => result.value?.stars ?? 0)
const completed = computed(() => result.value?.completed ?? false)
const hasErrors = computed(() => result.value?.errors && result.value.errors.length > 0)
const errors = computed(() => result.value?.errors ?? [])

function nextLevel() {
  gameStore.reset()
  router.push('/lobby')
}

function backToLobby() {
  gameStore.reset()
  router.push('/lobby')
}
</script>

<template>
  <div class="result-view">
    <div class="result-bg"></div>
    <div class="result-content">
      <h1 class="result-title" :class="{ success: completed, failure: !completed }">
        {{ completed ? '🎉 通关成功' : '💀 挑战失败' }}
      </h1>

      <div class="stars-section" v-if="completed">
        <span
          v-for="i in 3"
          :key="i"
          class="star"
          :class="{ active: i <= stars }"
          :style="{ animationDelay: `${i * 0.3}s` }"
        >⭐</span>
      </div>

      <div class="errors-panel" v-if="hasErrors">
        <h3 class="errors-title">⚠️ 关卡问题</h3>
        <ul class="errors-list">
          <li v-for="(error, index) in errors" :key="index">{{ error }}</li>
        </ul>
        <p class="errors-hint">请返回关卡编辑器修复这些问题后重试</p>
      </div>

      <div class="stats-panel" v-if="result">
        <div class="stat-item">
          <span class="stat-label">用时</span>
          <span class="stat-value">{{ Math.floor(result.timeUsed) }}秒</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">钥匙</span>
          <span class="stat-value">{{ result.keysCollected }} / {{ result.totalKeys }}</span>
        </div>
        <div class="stat-item" v-if="!hasErrors">
          <span class="stat-label">评级</span>
          <span class="stat-value">{{ '⭐'.repeat(stars) }}</span>
        </div>
      </div>

      <div class="result-actions">
        <button class="action-btn btn-next" @click="nextLevel">继续闯关</button>
        <button class="action-btn btn-back" @click="backToLobby">返回大厅</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FFF8E7 0%, #FFE0B2 100%);
  position: relative;
}

.result-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.result-content {
  text-align: center;
  padding: 3rem;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(12px);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  min-width: 400px;
}

.result-title {
  font-family: 'ZCOOL KuaiLe', cursive;
  font-size: 3rem;
  margin-bottom: 1.5rem;
}

.result-title.success { color: #4CAF50; }
.result-title.failure { color: #E53935; }

.stars-section {
  margin-bottom: 1.5rem;
}

.star {
  display: inline-block;
  font-size: 3rem;
  opacity: 0.2;
  transition: all 0.5s ease;
}

.star.active {
  opacity: 1;
  animation: starPop 0.6s ease forwards;
}

@keyframes starPop {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); opacity: 1; }
}

.stats-panel {
  background: rgba(255,140,66,0.08);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

.stat-item:last-child { border-bottom: none; }

.stat-label {
  color: #795548;
  font-size: 1rem;
}

.stat-value {
  font-family: 'ZCOOL KuaiLe', cursive;
  font-size: 1.25rem;
  color: #FF8C42;
}

.errors-panel {
  background: rgba(229, 57, 53, 0.1);
  border: 2px solid rgba(229, 57, 53, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  text-align: left;
}

.errors-title {
  font-family: 'ZCOOL KuaiLe', cursive;
  color: #E53935;
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
  text-align: center;
}

.errors-list {
  margin: 0;
  padding-left: 1.5rem;
  color: #5D4037;
}

.errors-list li {
  margin: 0.375rem 0;
  font-size: 0.95rem;
}

.errors-hint {
  margin-top: 0.75rem;
  text-align: center;
  color: #795548;
  font-size: 0.875rem;
  font-style: italic;
}

.result-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.action-btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 12px;
  font-family: 'ZCOOL KuaiLe', cursive;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
}

.btn-next {
  background: linear-gradient(135deg, #4CAF50, #2E7D32);
  box-shadow: 0 3px 0 #1B5E20;
}

.btn-back {
  background: linear-gradient(135deg, #FF8C42, #E65100);
  box-shadow: 0 3px 0 #BF360C;
}

.action-btn:hover {
  transform: translateY(-2px);
}
</style>
