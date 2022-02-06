<template>
  <div>
    <div class="logo" />
    <a-menu v-model:selectedKeys="selectedKeys" theme="dark" mode="inline" @click="handleClick">
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const menuList = [
  {
    key: '1',
    name: 'checkUnitPrice',
    title: '核对单价重量',
    path: '/',
  },
  {
    key: '2',
    name: 'filterOrder',
    title: '过滤订单号',
    path: '/filterOrder',
  },
]

const selectedKeys = ref(['1'])
const handleClick = (menu) => {
  router.push(menu.item.path)
}
</script>
<style>
.logo {
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  margin: 16px;
}
</style>
