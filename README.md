# 今天 · 前端

独立的 Vue 3 + TypeScript 日程前端，对接 `daily-checkin` Spring Boot 后端。

## 本地运行

安装 Node.js 20.19+ 或 22.12+ 和 npm，在前端目录执行：

```bash
npm install
npm run dev
```

本机当前仅检测到 Codex 自带的 Node 与 pnpm，尚未检测到独立安装的 npm。项目也可以使用 pnpm；如果本机 pnpm 报 esbuild 构建脚本未获允许，请按照 pnpm 提示授权该依赖后重新安装。

先启动后端（默认 `http://localhost:8080`），再打开 Vite 输出的地址。开发服务器会把 `/api` 转发到后端；部署时需要配置同源反向代理。

日程管理支持状态筛选与打卡历史。打卡历史保留已经发生的事件，日程的完成状态可以再次更改。“我的”目前只展示占位信息，尚未实现登录或个人资料保存。提醒仅在页面打开且浏览器允许通知时生效。

日程列表使用 `GET /api/entries/page`，打卡历史使用 `GET /api/checkins/page`；每页 4 条，日程筛选由后端执行。今日统计和浏览器提醒仍通过全量日程接口获取数据。需要启动包含分页接口的后端版本，具体参数见后端项目的 `分页接口联调文档.md`。

## 前端目录

- `src/router/`：Vue Router 路由配置，地址采用 `#/today`、`#/entries` 和 `#/profile`。
- `src/layout/`：公共布局和导航，提醒在布局内持续运行。
- `src/views/`：按功能组织的页面。
- `src/components/`：页面复用的日程表单。
- `src/composables/`：共享的日程状态和提醒逻辑。
- `src/api/entries.ts`、`src/api/checkins.ts`：按业务定义日程和打卡接口。
- `src/types/`：日程和打卡的数据类型。
- `src/utils/request.ts`：Axios 实例、超时和统一响应处理；`date.ts` 提供日期工具。

`App.vue` 只负责提供路由出口；刷新带 `#` 的页面地址时无需额外服务端路由配置。

请求路径：页面调用 `src/api/` 的业务方法 → `src/utils/request.ts` 的 Axios 实例 → Vite 开发代理 → Spring Boot。响应拦截器检查 HTTP 状态和后端的 `code`，通过后由请求函数取出 `data`；失败时抛出带提示的错误，由页面决定如何展示。
