import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './assets/base.css'

// Routes
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('./views/HomeView.vue')
  },
  {
    path: '/study',
    name: 'Study',
    component: () => import('./views/StudyView.vue')
  },
  {
    path: '/decks',
    name: 'Decks',
    component: () => import('./views/DecksView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const pinia = createPinia()

const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')