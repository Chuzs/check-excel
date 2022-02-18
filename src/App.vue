<template>
<a-config-provider :locale="locale">
  <Index  />
</a-config-provider>
</template>

<script setup>
// import ReadExcel from './components/ReadExcel.vue'
import Index from './pages/Index.vue'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
dayjs.locale('zh-cn')
const locale = zhCN

// This starter template is using Vue 3 experimental <script setup> SFCs
// Check out https://github.com/vuejs/rfcs/blob/master/active-rfcs/0040-script-setup.md
</script>

<style>
</style>
