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
