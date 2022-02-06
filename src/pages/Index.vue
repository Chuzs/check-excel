<template>
  <a-layout>
    <a-layout-sider :style="{height: '100vh', position: 'fixed', left: 0}">
      <SideMenu />
    </a-layout-sider>
    <a-layout :style="{ marginLeft: '200px' }">
      <a-layout-header :style="{ background: '#fff', padding: 0, position: 'fixed', top:0, width: '100%',zIndex: '1' }" />
      <a-layout-content :style="{ margin: '88px 12px 0' }">
        <div :style="{ minHeight: 'calc(100vh - 158px)'}">
          <router-view></router-view>
        </div>
      </a-layout-content>
      <a-layout-footer style="text-align: center">
        Check excel ©2022 Created by Chuzs
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>
<script setup>
import SideMenu from '../components/SideMenu.vue'

</script>
<style>
.logo {
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  margin: 16px;
}

.site-layout-sub-header-background {
  background: #fff;
}

.site-layout-background {
  background: #fff;
}

[data-theme='dark'] .site-layout-sub-header-background {
  background: #141414;
}
</style>
