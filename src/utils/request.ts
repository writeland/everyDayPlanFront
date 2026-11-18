import axios, { type AxiosRequestConfig } from 'axios'

// 对应后端统一返回的 code、data、msg。
interface ApiResult<T> {
  code: number
  data: T
  msg: string
}

// 统一配置接口前缀和超时时间；开发环境中的 /api 由 Vite 代理到后端。
const client = axios.create({ baseURL: '/api', timeout: 10000 })

// 响应拦截器统一检查 HTTP 错误和后端业务码。
client.interceptors.response.use(
  response => {
    const result = response.data as ApiResult<unknown> | null
    if (!result || typeof result.code !== 'number' || !('data' in result)) {
      return Promise.reject(new Error('服务器返回的数据格式不正确'))
    }
    if (result.code !== 0) return Promise.reject(new Error(result.msg || '请求失败'))
    return response
  },
  error => {
    if (axios.isAxiosError(error)) {
      const result = error.response?.data as Partial<ApiResult<unknown>> | undefined
      return Promise.reject(new Error(result?.msg || (error.response ? `请求失败（${error.response.status}）` : '网络连接失败，请检查后端服务')))
    }
    return Promise.reject(error)
  },
)

// 通过检查后取出业务数据，接口调用方直接接收 T。
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await client.request<ApiResult<T>>(config)
  return response.data.data
}
