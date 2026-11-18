import { createRouter, createWebHistory } from 'vue-router';
import { definirAoExpirar, sessao } from '../api/http';
import { recursos } from '../recursos';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { publica: true } },
    { path: '/cadastro', name: 'cadastro', component: () => import('../views/CadastroView.vue'), meta: { publica: true } },
    { path: '/', redirect: '/animais' },
    ...recursos.map((r) => ({ path: `/${r.rota}`, name: r.rota, component: () => import('../views/RecursoView.vue'), props: { recurso: r.rota } })),
    { path: '/:rest(.*)*', redirect: '/' },
  ],
});

router.beforeEach((to) => {
  if (!to.meta.publica && !sessao.token) return { name: 'login', query: { redirect: to.fullPath } };
  if (to.meta.publica && sessao.token) return '/';
});

// Sessão expirada (401 da API): volta ao login avisando o motivo.
definirAoExpirar(() => {
  const atual = router.currentRoute.value;
  if (atual.name !== 'login') router.push({ name: 'login', query: { expirada: '1', redirect: atual.fullPath } });
});

export default router;
