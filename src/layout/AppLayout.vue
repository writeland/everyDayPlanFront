<script setup lang="ts">
import { onMounted } from 'vue'
import { useEntries } from '../composables/useEntries'
import { useReminders } from '../composables/useReminders'

// 公共布局加载数据并启动提醒，页面切换时布局继续保留。
const { error, refresh } = useEntries()
const { enabled, toggle, check } = useReminders()
onMounted(async () => { await refresh(); check() })
</script>

<template>
  <div class="app">
    <!-- 左侧主导航：链接由 Vue Router 处理。 -->
    <aside class="sidebar">
      <div class="brand"><span class="brand-icon">✳</span><div>今天<small>DAY BY DAY</small></div></div>
      <p class="side-label">你的空间</p>
      <nav aria-label="主导航">
        <RouterLink to="/today">◫ <span>今日计划</span></RouterLink>
        <RouterLink to="/entries">▤ <span>日程管理</span></RouterLink>
        <RouterLink to="/profile">♙ <span>我的</span></RouterLink>
      </nav>
      <div class="side-note">✦<p>把日子过成<br />喜欢的样子。</p><small>ONE DAY AT A TIME</small></div>
    </aside>
    <main>
      <!-- 顶部提醒开关和当前路由页面。 -->
      <header>
        <div class="eyebrow">YOUR DAILY SPACE <span> / </span> 一点一滴，慢慢来</div>
        <button class="outline" :aria-pressed="enabled" @click="toggle">♧ {{ enabled ? '关闭提醒' : '开启提醒' }}</button>
      </header>
      <RouterView :key="$route.path" />
      <!-- 共享错误提示与页脚。 -->
      <p v-if="error" class="error" role="alert">{{ error }} <button @click="error = ''">关闭</button></p>
      <footer>MADE FOR YOUR EVERYDAY <span>慢慢来，比较快。 ✳</span></footer>
    </main>
  </div>
</template>
