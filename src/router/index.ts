import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import LobbyView from '@/views/LobbyView.vue'
import GameView from '@/views/GameView.vue'
import ResultView from '@/views/ResultView.vue'
import EditorView from '@/views/EditorView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/lobby', name: 'lobby', component: LobbyView },
  { path: '/game', name: 'game', component: GameView },
  { path: '/result', name: 'result', component: ResultView },
  { path: '/editor', name: 'editor', component: EditorView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
