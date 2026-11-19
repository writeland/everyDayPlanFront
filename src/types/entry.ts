// 日程及提交表单所需的类型。
export interface Entry {
  id: number
  title: string
  note: string | null
  date: string
  reminderTime: string | null
  done: boolean
}

export type EntryInput = Omit<Entry, 'id' | 'note'> & { note: string }
