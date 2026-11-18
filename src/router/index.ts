import { createRouter, createWebHashHistory } from 'vue-router'
import AppLayout from '../layout/AppLayout.vue'
import EntriesView from '../views/entries/EntriesView.vue'
import ProfileView from '../views/profile/ProfileView.vue'

// 使用 hash 路由，刷新页面时不需要服务器额外配置回退规则。
export default createRouter({
  history: createWebHashHistory(),
  routes: [{
    path: '/', component: AppLayout,
    // 子页面共享 AppLayout；两个日程地址通过 props 使用同一个页面。
    children: [
      { path: '', redirect: '/today' },
      { path: 'today', component: EntriesView, props: { todayOnly: true } },
      { path: 'entries', component: EntriesView, props: { todayOnly: false } },
      { path: 'profile', component: ProfileView },
    ],
  }],
})
