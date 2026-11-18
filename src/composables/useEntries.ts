import { ref } from 'vue'
import { listEntries } from '../api/entries'
import { listCheckins } from '../api/checkins'
import type { Entry } from '../types/entry'
import type { Checkin } from '../types/checkin'

// 布局与页面共用状态，切换路由时提醒仍可访问日程。
const entries = ref<Entry[]>([])
const checkins = ref<Checkin[]>([])
const error = ref('')

// 同时读取日程和打卡历史；失败时通过共享错误提示通知页面。
async function refresh() {
  try {
    const [entryData, historyData] = await Promise.all([listEntries(), listCheckins()])
    entries.value = entryData
    checkins.value = historyData
    error.value = ''
  } catch {
    error.value = '无法读取数据，请确认后端和数据库已启动。'
  }
}

// 将共享状态和刷新方法提供给布局、页面和提醒功能。
export function useEntries() {
  return { entries, checkins, error, refresh }
}
