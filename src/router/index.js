import CheckUnitPrice from '../pages/CheckUnitPrice.vue'
import FilterOrder from '../pages/FilterOrder.vue'
import CheckPdf from '../pages/CheckPdf.vue'
import * as VueRouter from 'vue-router'

const routes = [
  { path: '/', name: 'checkUnitPrice', component: CheckUnitPrice },
  { path: '/filterOrder', name: 'filterOrder', component: FilterOrder },
  { path: '/checkPdf', name: 'checkPdf', component: CheckPdf },
]

export default VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
})
