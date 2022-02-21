<template>
  <div>
    <div class="logo" />
    <a-menu
      v-model:selectedKeys="selectedKeys"
      theme="dark"
      mode="inline"
      @click="handleClick"
    >
      <template v-for="item in menuList" :key="item.key">
        <template v-if="!item.children">
          <a-menu-item :key="item.key" :path="item.path">
            <template #icon>
              <PieChartOutlined />
            </template>
            {{ item.title }}
          </a-menu-item>
        </template>
        <template v-else>
          <a-sub-menu :key="item.key" :menu-info="item" />
        </template>
      </template>
    </a-menu>
  </div>
</template>
<script setup>
import { PieChartOutlined } from '@ant-design/icons-vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const menuList = [
  {
    key: '/',
    name: 'checkUnitPrice',
    title: '核对单价重量',
    path: '/',
  },
  {
    key: '2',
    name: 'filterOrder',
    title: '核减库存',
    path: '/filterOrder',
  },
  {
    key: '/3',
    name: 'checkPdf',
    title: '核对PDF',
    path: '/checkPdf',
  },
]

const selectedKeys = ref(['/'])
console.log(router.currentRoute.value)
const handleClick = (menu) => {
  router.push(menu.item.path)
}
onMounted(() => {
  selectedKeys.value = [router.currentRoute.value.fullPath]
})
</script>
<style>
.logo {
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  margin: 16px;
}
</style>
