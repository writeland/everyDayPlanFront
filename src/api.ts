export interface Entry {
  id: number
  title: string
  note: string
  date: string
  reminderTime: string | null
  done: boolean
}

export interface Checkin {
  id: number
  entryId: number | null
  entryTitle: string
  checkinDate: string
  checkedAt: string
}

export type EntryInput = Omit<Entry, 'id'>

// 与后端 ApiResult 对应：T 随接口变化，例如 Entry[] 或 Entry。
interface ApiResult<T> {
  code: number
  data: T
  msg: string
}

// 集中处理所有接口的请求和统一响应，调用者直接拿到 data。
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  // HTTP 错误响应也可能有 JSON 消息，因此先尝试解析，再判断状态。
  let result: ApiResult<T>
  try {
    result = await response.json() as ApiResult<T>
  } catch {
    throw new Error(`请求失败（${response.status}）`)
  }
  // response.ok 表示 HTTP 状态是否成功；code 是响应体内另行约定的业务码。
  if (!response.ok || result.code !== 0) throw new Error(result.msg || `请求失败（${response.status}）`)
  return result.data
}

export const api = {
  entries: () => request<Entry[]>('/entries'),
  checkins: () => request<Checkin[]>('/checkins'),
  save: (entry: EntryInput, id?: number) => request<Entry>(id ? `/entries/${id}` : '/entries', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(entry),
  }),
  remove: (id: number) => request<void>(`/entries/${id}`, { method: 'DELETE' }),
  setDone: (id: number, done: boolean) => request<unknown>(
    `/entries/${id}/${done ? 'check-in' : 'reopen'}`,
    { method: 'POST' },
  ),
}
