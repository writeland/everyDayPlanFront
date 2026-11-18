// 打卡历史；原日程被删除后 entryId 可以为空。
export interface Checkin {
  id: number
  entryId: number | null
  entryTitle: string
  checkinDate: string
  checkedAt: string
}
