import { request } from '../utils/request'
import type { Entry, EntryInput } from '../types/entry'

// 查询全部日程。
export function listEntries() {
  return request<Entry[]>({ url: '/entries', method: 'get' })
}

// 根据是否传入 ID 选择新增或编辑。
export function saveEntry(entry: EntryInput, id?: number) {
  return request<Entry>({ url: id ? `/entries/${id}` : '/entries', method: id ? 'put' : 'post', data: entry })
}

// 删除日程；后端成功时的 data 为 null。
export function deleteEntry(id: number) {
  return request<null>({ url: `/entries/${id}`, method: 'delete' })
}
