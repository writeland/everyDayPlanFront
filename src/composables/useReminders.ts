import { onMounted, onUnmounted, ref } from 'vue'
import { today } from '../utils/date'
import { useEntries } from './useEntries'

// 管理浏览器通知开关与定时检查，供公共布局使用。
export function useReminders() {
  const { entries, error } = useEntries()
  const supported = 'Notification' in window
  const enabled = ref(supported && Notification.permission === 'granted' && localStorage.getItem('daily-checkin-reminders-enabled') !== 'false')
  // 同一页面会话中，避免同一条日程在同一分钟重复通知。
  const notified = new Set<string>()
  let timer: number | undefined

  // 检查今天未完成且到达提醒时间的日程。
  function check() {
    if (!supported || !enabled.value || Notification.permission !== 'granted') return
    const now = Date.now()
    for (const entry of entries.value) {
      if (entry.done || !entry.reminderTime || entry.date !== today()) continue
      const time = entry.reminderTime.slice(0, 5)
      const key = `${entry.id}-${entry.date}-${time}`
      const due = new Date(`${entry.date}T${time}:00`).getTime()
      if (now >= due && now - due < 60000 && !notified.has(key)) {
        try {
          new Notification('日程提醒', { body: entry.title })
          notified.add(key)
        } catch { error.value = '浏览器无法显示通知。' }
      }
    }
  }

  // 切换提醒开关；开启时请求浏览器通知权限。
  async function toggle() {
    if (!supported) { error.value = '当前浏览器不支持通知。'; return }
    try {
      if (enabled.value) enabled.value = false
      else {
        if (await Notification.requestPermission() !== 'granted') {
          error.value = '请在浏览器设置中允许通知。'
          return
        }
        enabled.value = true
      }
      localStorage.setItem('daily-checkin-reminders-enabled', String(enabled.value))
      check()
    } catch { error.value = '无法开启通知，请检查浏览器设置。' }
  }

  // 布局挂载时开始轮询，卸载时清理定时器。
  onMounted(() => { timer = window.setInterval(check, 15000) })
  onUnmounted(() => window.clearInterval(timer))
  return { enabled, toggle, check }
}
