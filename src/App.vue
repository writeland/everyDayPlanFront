<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { api, type Checkin, type Entry, type EntryInput } from './api'

type Page = 'today' | 'entries' | 'profile'
type Filter = 'all' | 'pending' | 'done' | 'history'
const page = ref<Page>('today')
const filter = ref<Filter>('all')
const entries = ref<Entry[]>([])
const checkins = ref<Checkin[]>([])
const error = ref('')
const showForm = ref(false)
const editingId = ref<number>()
const saving = ref(false)
const reminderEnabled = ref(localStorage.getItem('daily-checkin-reminders-enabled') !== 'false' && 'Notification' in window && Notification.permission === 'granted')
const notified = new Set<string>()
let timer: number | undefined

function today() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const form = reactive<EntryInput>({ title: '', note: '', date: today(), reminderTime: null, done: false })
const todayEntries = computed(() => entries.value.filter(entry => entry.date === today()))
const completed = computed(() => todayEntries.value.filter(entry => entry.done).length)
const progress = computed(() => todayEntries.value.length ? Math.round(completed.value / todayEntries.value.length * 100) : 0)
const visibleEntries = computed(() => {
  const list = page.value === 'today' ? todayEntries.value : entries.value
  if (filter.value === 'pending') return list.filter(entry => !entry.done)
  if (filter.value === 'done') return list.filter(entry => entry.done)
  return list
})
const dateLabel = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'full' }).format(new Date())

async function refresh() {
  try {
    const [entryData, historyData] = await Promise.all([api.entries(), api.checkins()])
    entries.value = entryData
    checkins.value = historyData
    error.value = ''
  } catch {
    error.value = '无法读取数据，请确认后端和数据库已启动。'
  }
}

function navigate(target: Page) {
  page.value = target
  filter.value = 'all'
}

function openForm(entry?: Entry) {
  editingId.value = entry?.id
  Object.assign(form, entry ? { ...entry, reminderTime: entry.reminderTime?.slice(0, 5) || null } : {
    title: '', note: '', date: today(), reminderTime: null, done: false,
  })
  showForm.value = true
}

async function save() {
  if (!form.title.trim()) return
  saving.value = true
  try {
    await api.save({ ...form, title: form.title.trim(), reminderTime: form.reminderTime || null }, editingId.value)
    showForm.value = false
    await refresh()
  } catch {
    error.value = '保存失败，请检查输入或稍后重试。'
  } finally {
    saving.value = false
  }
}

async function toggle(entry: Entry) {
  try {
    await api.setDone(entry.id, !entry.done)
    await refresh()
  } catch {
    error.value = '更新状态失败，请重试。'
  }
}

async function remove(entry: Entry) {
  if (!confirm('确定删除这条日程吗？打卡历史会保留。')) return
  try {
    await api.remove(entry.id)
    await refresh()
  } catch {
    error.value = '删除失败，请重试。'
  }
}

async function toggleReminders() {
  if (!('Notification' in window)) {
    error.value = '当前浏览器不支持通知。'
    return
  }
  if (reminderEnabled.value) {
    reminderEnabled.value = false
  } else {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      error.value = '请在浏览器设置中允许通知。'
      return
    }
    reminderEnabled.value = true
  }
  localStorage.setItem('daily-checkin-reminders-enabled', String(reminderEnabled.value))
  checkReminders()
}

function checkReminders() {
  if (!reminderEnabled.value || Notification.permission !== 'granted') return
  const now = new Date()
  for (const entry of entries.value) {
    if (entry.done || !entry.reminderTime || entry.date !== today()) continue
    const time = entry.reminderTime.slice(0, 5)
    const key = `${entry.id}-${entry.date}-${time}`
    const due = new Date(`${entry.date}T${time}:00`)
    if (now.getTime() >= due.getTime() && now.getTime() - due.getTime() < 60000 && !notified.has(key)) {
      new Notification('日程提醒', { body: entry.title })
      notified.add(key)
    }
  }
}

onMounted(async () => {
  await refresh()
  checkReminders()
  timer = window.setInterval(checkReminders, 15000)
})
onUnmounted(() => window.clearInterval(timer))
</script>

<template>
  <div class="app">
    <aside class="sidebar">
      <div class="brand"><span class="brand-icon">✳</span><div>今天<small>DAY BY DAY</small></div></div>
      <p class="side-label">你的空间</p>
      <nav aria-label="主导航">
        <button :class="{ active: page === 'today' }" @click="navigate('today')">◫ <span>今日计划</span></button>
        <button :class="{ active: page === 'entries' }" @click="navigate('entries')">▤ <span>日程管理</span></button>
        <button :class="{ active: page === 'profile' }" @click="navigate('profile')">♙ <span>我的</span></button>
      </nav>
      <div class="side-note">✦<p>把日子过成<br />喜欢的样子。</p><small>ONE DAY AT A TIME</small></div>
    </aside>

    <main>
      <header>
        <div class="eyebrow">YOUR DAILY SPACE <span> / </span> 一点一滴，慢慢来</div>
        <button class="outline" :aria-pressed="reminderEnabled" @click="toggleReminders">
          ♧ {{ reminderEnabled ? '关闭提醒' : '开启提醒' }}
        </button>
      </header>

      <template v-if="page !== 'profile'">
        <section class="hero">
          <div><p class="date">{{ dateLabel }}</p><h1>你好，今天也要<span>好好生活</span> <i>✳</i></h1><p class="muted">给生活留一点空白，把重要的事慢慢完成。</p></div>
          <div class="hero-art">✳<small>MAKE TODAY<br />COUNT.</small></div>
        </section>
        <section class="stats" aria-label="今日统计">
          <div><span>今日计划</span><strong>{{ todayEntries.length }}</strong><small>件事情</small></div>
          <div><span>已完成</span><strong>{{ completed }}</strong><small>件事情</small></div>
          <div><span>今日进度</span><strong>{{ progress }}%</strong><div class="track"><div :style="{ width: `${progress}%` }"></div></div></div>
          <div class="stats-note">✦ <span>每一个小小的完成，<br />都值得被记录。</span></div>
        </section>

        <section class="content">
          <div class="section-heading">
            <div><p class="kicker">LITTLE PLANS, BIG DAYS</p><h2>{{ page === 'today' ? '今日计划' : '日程管理' }}</h2><p class="muted">{{ page === 'today' ? '按自己的节奏，开始今天吧。' : '查看日程状态与打卡历史。' }}</p></div>
            <button class="primary" @click="openForm()">＋ 新建日程</button>
          </div>
          <div class="filters" aria-label="筛选日程">
            <button v-for="option in (page === 'today' ? ['all', 'pending', 'done'] : ['all', 'pending', 'done', 'history'])" :key="option" :class="{ selected: filter === option }" @click="filter = option as Filter">
              {{ { all: '全部', pending: '未完成', done: '已完成', history: '打卡历史' }[option as Filter] }}
            </button>
          </div>
          <p v-if="filter === 'history'" class="history-hint">打卡历史记录实际完成的时间；取消完成或删除日程后仍保留。</p>
          <div v-if="filter === 'history'" class="list">
            <article v-for="record in checkins" :key="record.id" class="item">
              <span class="history-mark">✓</span><div><strong>{{ record.entryTitle }}</strong><p class="meta">打卡时间 {{ record.checkedAt?.replace('T', ' ').slice(0, 16) }}</p></div>
            </article>
            <div v-if="!checkins.length" class="empty">还没有打卡记录，完成一项日程后会出现在这里。</div>
          </div>
          <div v-else class="list">
            <article v-for="entry in visibleEntries" :key="entry.id" class="item">
              <input class="check" type="checkbox" :checked="entry.done" :aria-label="`${entry.done ? '恢复未完成' : '完成'}：${entry.title}`" @change="toggle(entry)" />
              <div class="item-body"><strong :class="{ done: entry.done }">{{ entry.title }}</strong><p class="meta">◷ {{ entry.date }}<template v-if="entry.reminderTime"> · {{ entry.reminderTime.slice(0, 5) }} 提醒</template></p><p v-if="entry.note" class="note">{{ entry.note }}</p></div>
              <div class="actions"><button @click="openForm(entry)">编辑</button><button @click="remove(entry)">删除</button></div>
            </article>
            <div v-if="!visibleEntries.length" class="empty">这里还没有符合条件的日程。</div>
          </div>
        </section>
      </template>

      <section v-else class="profile content">
        <p class="kicker">YOUR SPACE</p><h1>我的</h1><p class="muted">留一处空间，记录属于你的日常。</p>
        <div class="profile-card"><div class="avatar">✳</div><div><h2>你好，朋友</h2><p class="muted">当前使用本地模式</p></div></div>
        <div class="profile-card"><div><h2>账号与个人资料</h2><p class="muted">登录、退出和个人信息功能将在后续版本开放。</p></div></div>
      </section>
      <p v-if="error" class="error" role="alert">{{ error }} <button @click="error = ''">关闭</button></p>
      <footer>MADE FOR YOUR EVERYDAY <span>慢慢来，比较快。 ✳</span></footer>
    </main>

    <div v-if="showForm" class="overlay" @click.self="showForm = false">
      <form class="modal" @submit.prevent="save">
        <div class="section-heading"><div><p class="kicker">A LITTLE PLAN</p><h2>{{ editingId ? '编辑日程' : '新建日程' }}</h2></div><button type="button" class="close" aria-label="关闭" @click="showForm = false">×</button></div>
        <label>想做什么 <input v-model="form.title" maxlength="120" required placeholder="例如：读 20 分钟书" /></label>
        <div class="form-row"><label>日期 <input v-model="form.date" type="date" required /></label><label>提醒时间（选填） <input v-model="form.reminderTime" type="time" /></label></div>
        <label>记事本（选填） <textarea v-model="form.note" maxlength="2000" rows="4" placeholder="写下想记录的细节…"></textarea></label>
        <p class="muted">提醒需允许浏览器通知，且页面保持打开。</p>
        <div class="modal-actions"><button type="button" class="outline" @click="showForm = false">取消</button><button class="primary" :disabled="saving">保存日程</button></div>
      </form>
    </div>
  </div>
</template>
