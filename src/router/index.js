import CheckUnitPrice from '../pages/CheckUnitPrice.vue'
import FilterOrder from '../pages/FilterOrder.vue'
import * as VueRouter from 'vue-router'

const routes = [
  { path: '/', name: 'checkUnitPrice', component: CheckUnitPrice },
  { path: '/filterOrder', name: 'filterOrder', component: FilterOrder },
]

export default VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
})
