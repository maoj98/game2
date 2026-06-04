<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Application } from 'pixi.js'
import { useEditorStore } from '@/stores/editor'
import type { EditorTool } from '@/stores/editor'
import { EditorScene } from '@/scenes/EditorScene'
import type { TileType, MechanismType, ItemType } from '@/types'

const router = useRouter()
const editorStore = useEditorStore()

const canvasContainer = ref<HTMLDivElement>()
let app: Application | null = null
let scene: EditorScene | null = null

const tools: { value: EditorTool; label: string }[] = [
  { value: 'tile', label: '🟩 瓦片' },
  { value: 'mechanism', label: '⚙️ 机关' },
  { value: 'item', label: '💊 道具' },
  { value: 'key', label: '🔑 钥匙' },
  { value: 'door', label: '🚪 门' },
  { value: 'spawn', label: '📍 出生点' },
  { value: 'erase', label: '🧹 擦除' },
]

const tileTypes: { value: TileType; label: string; color: string }[] = [
  { value: 'ground', label: '地面', color: '#C8E6C9' },
  { value: 'wall', label: '墙壁', color: '#795548' },
  { value: 'water', label: '水域', color: '#42A5F5' },
  { value: 'bridge', label: '桥梁', color: '#BCAAA4' },
  { value: 'plate', label: '开关板', color: '#FFD54F' },
  { value: 'jumpPad', label: '跳板', color: '#FF8A65' },
]

const mechanismTypes: { value: MechanismType; label: string }[] = [
  { value: 'pushBlock', label: '推拉石块' },
  { value: 'stepSwitch', label: '踩开关' },
  { value: 'timedPlatform', label: '限时跳板' },
  { value: 'waterTrap', label: '水域陷阱' },
]

const itemTypes: { value: ItemType; label: string }[] = [
  { value: 'shield', label: '护盾' },
  { value: 'speedBoost', label: '加速' },
]

const isValid = computed(() => editorStore.isValid)

function refreshScene() {
  if (!scene) return
  const overlay: { x: number; y: number; type: string }[] = []

  for (const m of editorStore.mechanisms) {
    overlay.push({ x: m.gridX, y: m.gridY, type: m.type })
  }
  for (const i of editorStore.items) {
    overlay.push({ x: i.gridX, y: i.gridY, type: i.itemType })
  }
  for (const k of editorStore.keys) {
    overlay.push({ x: k.gridX, y: k.gridY, type: 'key' })
  }
  for (const d of editorStore.doors) {
    overlay.push({ x: d.gridX, y: d.gridY, type: 'door' })
  }
  for (const s of editorStore.playerSpawns) {
    overlay.push({ x: s.gridX, y: s.gridY, type: 'spawn' })
  }

  scene.loadGrid(editorStore.tiles, overlay)
}

onMounted(async () => {
  if (!canvasContainer.value) return

  app = new Application()
  await app.init({
    background: '#F5F5F5',
    resizeTo: canvasContainer.value,
    antialias: true,
  })
  canvasContainer.value.appendChild(app.canvas)

  scene = new EditorScene()
  scene.resize(app.screen.width, app.screen.height)
  app.stage.addChild(scene.container)

  scene.setDataProvider(() => {
    const overlay: { x: number; y: number; type: string }[] = []
    for (const m of editorStore.mechanisms) {
      overlay.push({ x: m.gridX, y: m.gridY, type: m.type })
    }
    for (const i of editorStore.items) {
      overlay.push({ x: i.gridX, y: i.gridY, type: i.itemType })
    }
    for (const k of editorStore.keys) {
      overlay.push({ x: k.gridX, y: k.gridY, type: 'key' })
    }
    for (const d of editorStore.doors) {
      overlay.push({ x: d.gridX, y: d.gridY, type: 'door' })
    }
    for (const s of editorStore.playerSpawns) {
      overlay.push({ x: s.gridX, y: s.gridY, type: 'spawn' })
    }
    return { tiles: editorStore.tiles, overlays: overlay }
  })

  scene.onGridClick((gridX: number, gridY: number) => {
    if (editorStore.selectedTool === 'erase') {
      editorStore.eraseElement(gridX, gridY)
    } else {
      editorStore.placeElement(gridX, gridY)
    }
  })

  refreshScene()
})

onUnmounted(() => {
  if (app) {
    app.destroy(true)
    app = null
  }
  scene = null
})

function selectTool(tool: EditorTool) {
  editorStore.selectedTool = tool
  refreshScene()
}

function saveLevel() {
  editorStore.saveToLocalStorage()
  alert('关卡已保存！')
}

function resetEditor() {
  editorStore.reset()
  refreshScene()
}

function goBack() {
  router.push('/')
}
</script>

<template>
  <div class="editor-view">
    <div class="editor-sidebar">
      <h2 class="editor-title">🗺️ 关卡编辑器</h2>

      <div class="editor-section">
        <h3>地图信息</h3>
        <div class="field">
          <label>关卡名称</label>
          <input v-model="editorStore.name" type="text" class="input-field" />
        </div>
        <div class="field-row">
          <div class="field">
            <label>宽度</label>
            <input v-model.number="editorStore.width" type="number" min="5" max="20" class="input-field" @change="editorStore.resize(editorStore.width, editorStore.height); refreshScene()" />
          </div>
          <div class="field">
            <label>高度</label>
            <input v-model.number="editorStore.height" type="number" min="5" max="20" class="input-field" @change="editorStore.resize(editorStore.width, editorStore.height); refreshScene()" />
          </div>
        </div>
        <div class="field">
          <label>限时(秒)</label>
          <input v-model.number="editorStore.timeLimit" type="number" min="30" max="600" class="input-field" />
        </div>
      </div>

      <div class="editor-section">
        <h3>工具选择</h3>
        <div class="tool-grid">
          <button
            v-for="tool in tools"
            :key="tool.value"
            class="tool-btn"
            :class="{ active: editorStore.selectedTool === tool.value }"
            @click="selectTool(tool.value)"
          >
            {{ tool.label }}
          </button>
        </div>
      </div>

      <div class="editor-section" v-if="editorStore.selectedTool === 'tile'">
        <h3>瓦片类型</h3>
        <div class="tile-grid">
          <button
            v-for="t in tileTypes"
            :key="t.value"
            class="tile-btn"
            :class="{ active: editorStore.selectedTile === t.value }"
            :style="{ borderColor: t.color }"
            @click="editorStore.selectedTile = t.value"
          >
            <span class="tile-preview" :style="{ background: t.color }"></span>
            {{ t.label }}
          </button>
        </div>
      </div>

      <div class="editor-section" v-if="editorStore.selectedTool === 'mechanism'">
        <h3>机关类型</h3>
        <div class="mechanism-list">
          <button
            v-for="m in mechanismTypes"
            :key="m.value"
            class="mechanism-btn"
            :class="{ active: editorStore.selectedMechanism === m.value }"
            @click="editorStore.selectedMechanism = m.value"
          >
            {{ m.label }}
          </button>
        </div>
      </div>

      <div class="editor-section" v-if="editorStore.selectedTool === 'item'">
        <h3>道具类型</h3>
        <div class="item-list">
          <button
            v-for="i in itemTypes"
            :key="i.value"
            class="item-btn"
            :class="{ active: editorStore.selectedItem === i.value }"
            @click="editorStore.selectedItem = i.value"
          >
            {{ i.value === 'shield' ? '🛡️' : '⚡' }} {{ i.label }}
          </button>
        </div>
      </div>

      <div class="editor-section stats">
        <p>🔑 钥匙: {{ editorStore.keys.length }}</p>
        <p>🚪 门: {{ editorStore.doors.length }}</p>
        <p>⚙️ 机关: {{ editorStore.mechanisms.length }}</p>
        <p>📍 出生点: {{ editorStore.playerSpawns.length }}</p>
      </div>

      <div class="editor-actions">
        <button class="save-btn" @click="saveLevel">💾 保存</button>
        <button class="reset-btn" @click="resetEditor">🔄 重置</button>
        <button class="back-btn" @click="goBack">← 返回</button>
      </div>
    </div>

    <div class="editor-canvas-area">
      <div class="canvas-container" ref="canvasContainer"></div>
    </div>
  </div>
</template>

<style scoped>
.editor-view {
  display: flex;
  height: 100vh;
  background: #F5F5F5;
}

.editor-sidebar {
  width: 280px;
  background: rgba(255,255,255,0.95);
  border-right: 2px solid #E0E0E0;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.editor-title {
  font-family: 'ZCOOL KuaiLe', cursive;
  font-size: 1.25rem;
  color: #FF8C42;
  text-align: center;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #FFE0B2;
}

.editor-section {
  background: rgba(255,248,231,0.5);
  border-radius: 8px;
  padding: 0.75rem;
}

.editor-section h3 {
  font-family: 'ZCOOL KuaiLe', cursive;
  font-size: 0.875rem;
  color: #5D4037;
  margin-bottom: 0.5rem;
}

.field {
  margin-bottom: 0.5rem;
}

.field label {
  display: block;
  font-size: 0.75rem;
  color: #795548;
  margin-bottom: 0.25rem;
}

.input-field {
  width: 100%;
  padding: 0.375rem 0.5rem;
  border: 1.5px solid #E0E0E0;
  border-radius: 6px;
  font-size: 0.875rem;
  box-sizing: border-box;
}

.input-field:focus {
  border-color: #FF8C42;
  outline: none;
}

.field-row {
  display: flex;
  gap: 0.5rem;
}

.field-row .field { flex: 1; }

.tool-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.375rem;
}

.tool-btn {
  padding: 0.5rem;
  border: 2px solid #E0E0E0;
  border-radius: 8px;
  background: white;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.tool-btn:hover {
  border-color: #FFB74D;
  background: #FFF8E1;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(255,140,66,0.2);
}

.tool-btn.active {
  border-color: #FF8C42;
  background: linear-gradient(135deg, #FFF3E0, #FFE0B2);
  color: #E65100;
  font-weight: bold;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(255,140,66,0.35), inset 0 0 0 1px rgba(255,255,255,0.5);
}

.tile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.375rem;
}

.tile-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem;
  border: 2px solid #E0E0E0;
  border-radius: 6px;
  background: white;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tile-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.tile-btn.active {
  border-color: #FF8C42;
  background: linear-gradient(135deg, #FFF3E0, #FFE0B2);
  font-weight: bold;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(255,140,66,0.3);
}

.tile-preview {
  width: 16px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.mechanism-list, .item-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.mechanism-btn, .item-btn {
  padding: 0.5rem;
  border: 2px solid #E0E0E0;
  border-radius: 6px;
  background: white;
  font-size: 0.8rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.mechanism-btn:hover, .item-btn:hover {
  border-color: #FFB74D;
  background: #FFF8E1;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(255,140,66,0.15);
}

.mechanism-btn.active, .item-btn.active {
  border-color: #FF8C42;
  background: linear-gradient(135deg, #FFF3E0, #FFE0B2);
  font-weight: bold;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(255,140,66,0.3);
}

.stats p {
  font-size: 0.8rem;
  color: #5D4037;
  margin: 0.25rem 0;
}

.editor-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.75rem;
}

.save-btn, .reset-btn, .back-btn {
  padding: 0.5rem;
  border: none;
  border-radius: 8px;
  font-family: 'ZCOOL KuaiLe', cursive;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s;
}

.save-btn {
  background: linear-gradient(135deg, #4CAF50, #2E7D32);
  color: white;
}

.reset-btn {
  background: linear-gradient(135deg, #FF8C42, #E65100);
  color: white;
}

.back-btn {
  background: rgba(0,0,0,0.08);
  color: #5D4037;
}

.editor-canvas-area {
  flex: 1;
  position: relative;
}

.canvas-container {
  width: 100%;
  height: 100%;
}
</style>
