import { request } from '../utils/request'
import type { Checkin } from '../types/checkin'
import type { PageResult } from '../types/page'

export function listCheckinPage(params: { page: number; size: number; date?: string }) {
  return request<PageResult<Checkin>>({ url: '/checkins/page', method: 'get', params })
}

// 查询打卡历史，按需传入日期（yyyy-MM-dd）。
export function listCheckins(date?: string) {
  return request<Checkin[]>({ url: '/checkins', method: 'get', params: date ? { date } : undefined })
}

// 完成日程会返回打卡记录；恢复未完成时后端返回 null。
export function setEntryDone(id: number, done: boolean) {
  return request<Checkin | null>({ url: `/entries/${id}/${done ? 'check-in' : 'reopen'}`, method: 'post' })
}
