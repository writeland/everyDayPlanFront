// 对应后端 PageResult<T>：items 是当前页，total 是筛选后的总条数。
export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  size: number
}
