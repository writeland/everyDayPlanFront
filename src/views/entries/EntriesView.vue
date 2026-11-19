<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { deleteEntry, listEntryPage } from '../../api/entries'
import { setEntryDone, listCheckinPage } from '../../api/checkins'
import type { Entry } from '../../types/entry'
import type { Checkin } from '../../types/checkin'
import EntryForm from '../../components/EntryForm.vue'
import { useEntries } from '../../composables/useEntries'
import { today } from '../../utils/date'

// 路由传入 todayOnly：区分今日计划和全部日程两个页面。
const props = defineProps<{ todayOnly: boolean }>()
type Filter = 'all' | 'pending' | 'done' | 'history'
const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: '全部' }, { value: 'pending', label: '未完成' },
  { value: 'done', label: '已完成' }, { value: 'history', label: '打卡历史' },
]
const filter = ref<Filter>('all')
const showForm = ref(false)
const editing = ref<Entry>()
const { entries, error, refresh } = useEntries()
// 根据共享日程计算今日数量、完成数和进度。
const todayEntries = computed(() => entries.value.filter(entry => entry.date === today()))
const completed = computed(() => todayEntries.value.filter(entry => entry.done).length)
const progress = computed(() => todayEntries.value.length ? Math.round(completed.value / todayEntries.value.length * 100) : 0)
// 列表在数据库中先筛选再分页；统计与提醒继续使用共享日程数据。
const pageSize = 4
const currentPage = ref(1)
const totalItems = ref(0)
const pageEntries = ref<Entry[]>([])
const pageCheckins = ref<Checkin[]>([])
const loading = ref(false)
const pageError = ref('')
let requestNumber = 0
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize)))
async function loadPage() {
  const number = ++requestNumber
  loading.value = true
  pageError.value = ''
  try {
    if (filter.value === 'history') {
      const result = await listCheckinPage({ page: currentPage.value, size: pageSize })
      if (number !== requestNumber) return
      pageCheckins.value = result.items
      totalItems.value = result.total
    } else {
      const result = await listEntryPage({
        page: currentPage.value, size: pageSize,
        date: props.todayOnly ? today() : undefined,
        done: filter.value === 'all' ? undefined : filter.value === 'done',
      })
      if (number !== requestNumber) return
      pageEntries.value = result.items
      totalItems.value = result.total
    }
    if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
  } catch (cause) {
    if (number === requestNumber) {
      pageEntries.value = []
      pageCheckins.value = []
      totalItems.value = 0
      pageError.value = cause instanceof Error ? cause.message : '读取分页列表失败，请重试。'
    }
  } finally {
    if (number === requestNumber) loading.value = false
  }
}
watch(filter, () => { currentPage.value = 1 }, { flush: 'sync' })
watch([filter, currentPage], loadPage, { immediate: true })
const dateLabel = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'full' }).format(new Date())

// 打开新建或编辑弹窗；保存成功后关闭并重新读取列表。
function openForm(entry?: Entry) { editing.value = entry; showForm.value = true }
async function saved() { showForm.value = false; await refresh(); await loadPage() }
// 切换日程完成状态，并重新读取后端数据。
async function toggle(entry: Entry) {
  try { await setEntryDone(entry.id, !entry.done); await refresh(); await loadPage() }
  catch { error.value = '更新状态失败，请重试。' }
}
// 确认后删除日程；历史打卡记录由后端保留。
async function remove(entry: Entry) {
  if (!confirm('确定删除这条日程吗？打卡历史会保留。')) return
  try { await deleteEntry(entry.id); await refresh(); await loadPage() }
  catch { error.value = '删除失败，请重试。' }
}
</script>

<template>
  <!-- 欢迎语和当日日期。 -->
  <section class="hero">
    <div><h1>你好，今天也要<span>好好生活</span> <i>✳</i></h1><p class="date">◷ &nbsp;{{ dateLabel }}</p><p class="muted">给生活留一点空白，把重要的事慢慢完成。</p></div>
    <div class="hero-art" aria-hidden="true">✿ <span>❁</span><small>MAKE TODAY COUNT</small></div>
  </section>
  <!-- 今日计划数量、已完成数量和进度。 -->
  <section class="stats" aria-label="今日统计">
    <div class="stat"><span class="stat-icon">▤</span><div><span>今日计划</span><strong>{{ todayEntries.length }}</strong></div></div>
    <div class="stat"><span class="stat-icon">✓</span><div><span>已完成</span><strong>{{ completed }}</strong></div></div>
    <div class="stat"><span class="stat-icon stat-icon-gold">⚑</span><div><span>今日进度</span><strong>{{ progress }}%</strong></div></div>
  </section>
  <!-- 日程列表标题、创建入口和筛选条件。 -->
  <section class="content">
    <div class="section-heading">
      <div><p class="kicker">LITTLE PLANS, BIG DAYS</p><h2>{{ todayOnly ? '今日计划' : '日程管理' }}</h2><p class="muted">{{ todayOnly ? '按自己的节奏，开始今天吧。' : '查看日程状态与打卡历史。' }}</p></div>
      <button class="primary" @click="openForm()">＋ 新建日程</button>
    </div>
    <div class="filters" aria-label="筛选日程">
      <template v-for="option in filters" :key="option.value">
        <button v-if="!todayOnly || option.value !== 'history'" :class="{ selected: filter === option.value }" @click="filter = option.value">{{ option.label }}</button>
      </template>
    </div>
    <p v-if="filter === 'history'" class="history-hint">打卡历史记录实际完成的时间；取消完成或删除日程后仍保留。</p>
    <!-- 历史打卡和当前日程分别展示，避免混淆状态与历史事件。 -->
    <div v-if="pageError" class="list">
      <div class="empty" role="alert">{{ pageError }} <button type="button" @click="loadPage">重试</button></div>
    </div>
    <div v-else-if="filter === 'history'" class="list">
      <article v-for="record in loading ? [] : pageCheckins" :key="record.id" class="item">
        <span class="history-mark">✓</span>
        <div><strong>{{ record.entryTitle }}</strong><p class="meta">打卡时间 {{ record.checkedAt?.replace('T', ' ').slice(0, 16) }}</p></div>
      </article>
      <div v-if="!loading && !totalItems" class="empty">还没有打卡记录，完成一项日程后会出现在这里。</div>
    </div>
    <div v-else class="list">
      <article v-for="entry in loading ? [] : pageEntries" :key="entry.id" class="item" :class="{ 'item-completed': entry.done }">
        <input class="check" type="checkbox" :checked="entry.done" :aria-label="`${entry.done ? '恢复未完成' : '完成'}：${entry.title}`" @change="toggle(entry)" />
        <div class="item-body">
          <strong :class="{ done: entry.done }">{{ entry.title }}</strong>
          <p class="meta">◷ {{ entry.date }}<template v-if="entry.reminderTime"> · {{ entry.reminderTime.slice(0, 5) }} 提醒</template></p>
          <p v-if="entry.note" class="note">{{ entry.note }}</p>
        </div>
        <div class="actions"><button @click="openForm(entry)">编辑</button><button @click="remove(entry)">删除</button></div>
      </article>
      <div v-if="!loading && !totalItems" class="empty">这里还没有符合条件的日程。</div>
    </div>
    <!-- 分页器始终展示当前筛选的总数和页码。 -->
    <div v-if="!pageError && totalItems > 0" class="pagination" role="navigation" aria-label="列表分页">
      <span>共 {{ totalItems }} 条 · 每页 {{ pageSize }} 条</span>
      <div class="pagination-controls">
        <button type="button" :disabled="loading || currentPage === 1" @click="currentPage--">上一页</button>
        <span aria-live="polite">{{ currentPage }} / {{ totalPages }}</span>
        <button type="button" :disabled="loading || currentPage >= totalPages" @click="currentPage++">下一页</button>
      </div>
    </div>
  </section>
  <!-- 新建和编辑共用同一个表单组件。 -->
  <EntryForm v-if="showForm" :entry="editing" @close="showForm = false" @saved="saved" />
</template>
