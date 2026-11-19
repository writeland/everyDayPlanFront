<script setup lang="ts">
import { reactive, ref } from 'vue'
import { saveEntry } from '../api/entries'
import type { Entry, EntryInput } from '../types/entry'
import { today } from '../utils/date'

// 有 entry 时编辑已有日程；没有时创建新日程。
const props = defineProps<{ entry?: Entry }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const saving = ref(false)
const error = ref('')
const form = reactive<EntryInput>(props.entry ? {
  title: props.entry.title,
  note: props.entry.note ?? '',
  date: props.entry.date,
  reminderTime: props.entry.reminderTime?.slice(0, 5) || null,
  done: props.entry.done,
} : { title: '', note: '', date: today(), reminderTime: null, done: false })

// 提交表单；成功后通知父页面关闭弹窗并刷新列表。
async function save() {
  if (!form.title.trim()) return
  saving.value = true
  try {
    await saveEntry({ ...form, title: form.title.trim(), reminderTime: form.reminderTime || null }, props.entry?.id)
    emit('saved')
  } catch {
    error.value = '保存失败，请检查输入或稍后重试。'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <form class="modal" @submit.prevent="save">
      <!-- 弹窗标题和关闭按钮。 -->
      <div class="section-heading">
        <div><p class="kicker">A LITTLE PLAN</p><h2>{{ entry ? '编辑日程' : '新建日程' }}</h2></div>
        <button type="button" class="close" aria-label="关闭" @click="emit('close')">×</button>
      </div>
      <!-- 日程内容、日期、可选提醒和备注。 -->
      <label>想做什么<input v-model="form.title" maxlength="120" required placeholder="例如：读 20 分钟书" /></label>
      <div class="form-row">
        <label>日期<input v-model="form.date" type="date" required /></label>
        <label>提醒时间（选填）<input v-model="form.reminderTime" type="time" /></label>
      </div>
      <label>记事本（选填）<textarea v-model="form.note" maxlength="2000" rows="4" placeholder="写下想记录的细节…"></textarea></label>
      <p class="muted">提醒需允许浏览器通知，且页面保持打开。</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <!-- 取消与保存操作。 -->
      <div class="modal-actions">
        <button type="button" class="outline" @click="emit('close')">取消</button>
        <button class="primary" :disabled="saving">保存日程</button>
      </div>
    </form>
  </div>
</template>
