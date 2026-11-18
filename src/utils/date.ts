// 按浏览器本地时区返回 yyyy-MM-dd，供日期输入和筛选使用。
export function today() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
