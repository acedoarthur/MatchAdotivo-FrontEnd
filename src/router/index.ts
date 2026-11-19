import { createRouter, createWebHistory } from 'vue-router';
import { definirAoExpirar, limparToken, sessao, type Perfil } from '../api/http';
import { carregarConta } from '../api/auth';
import { recursos } from '../recursos';

declare module 'vue-router' {
  interface RouteMeta { publica?: boolean; perfis?: Perfil[] }
}

const INICIO = '/animais';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { publica: true } },
    { path: '/cadastro', name: 'cadastro', component: () => import('../views/CadastroView.vue'), meta: { publica: true } },
    { path: '/completar-perfil', name: 'completar-perfil', component: () => import('../views/CompletarPerfilView.vue') },
    { path: '/', redirect: INICIO },
    // Cada tela só é acessível aos perfis que a possuem em recursos.ts.
    ...recursos.map((r) => ({
      path: `/${r.rota}`, name: r.rota, component: () => import('../views/RecursoView.vue'),
      props: { recurso: r.rota }, meta: { perfis: Object.keys(r.telas) as Perfil[] },
    })),
    {
      path: '/perfil', name: 'perfil', component: () => import('../views/RecursoView.vue'), meta: { perfis: ['ADOTANTE', 'INSTITUICAO'] },
      props: () => sessao.conta?.perfil === 'ADOTANTE'
        ? { recurso: 'adotantes', registro: sessao.conta.id_adotante }
        : { recurso: 'instituicoes', registro: sessao.conta?.id_instituicao },
    },
    { path: '/:rest(.*)*', redirect: '/' },
  ],
});

// Navegação por perfil, inclusive para URLs digitadas. É conveniência da interface: a API recusa (403) o que o perfil não pode.
router.beforeEach(async (to) => {
  if (!sessao.token) return to.meta.publica ? true : { name: 'login', query: { redirect: to.fullPath } };
  if (!sessao.conta) {
    try {
      await carregarConta();
    } catch {
      limparToken();
      return to.meta.publica ? true : { name: 'login' };
    }
  }
  const perfil = sessao.conta!.perfil;
  // Conta antiga sem perfil: só pode concluir o cadastro.
  if (!perfil) return to.name === 'completar-perfil' ? true : { name: 'completar-perfil' };
  if (to.meta.publica || to.name === 'completar-perfil') return INICIO;
  if (to.meta.perfis && !to.meta.perfis.includes(perfil)) return INICIO;
});

// Sessão expirada (401 da API): volta ao login avisando o motivo.
definirAoExpirar(() => {
  const atual = router.currentRoute.value;
  if (atual.name !== 'login') router.push({ name: 'login', query: { expirada: '1', redirect: atual.fullPath } });
});

export default router;
