<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { sessao } from './api/http';
import { sair } from './api/auth';
import { PERFIS, recursos } from './recursos';

const route = useRoute();
const router = useRouter();
const menuAberto = ref(false);
const saindo = ref(false);

watch(() => route.fullPath, () => { menuAberto.value = false; });

// Menu do perfil da conta (lido da API); contas sem perfil não veem a área logada.
const perfil = computed(() => sessao.conta?.perfil ?? null);
const menu = computed(() => {
  const p = perfil.value;
  if (!p) return [];
  const telas = recursos.filter((r) => r.telas[p]).map((r) => ({ rota: `/${r.rota}`, titulo: r.telas[p]! }));
  return p === 'ADMIN' ? telas : [...telas, { rota: '/perfil', titulo: 'Meu perfil' }];
});
const rotuloPerfil = computed(() => PERFIS.find((p) => p.valor === perfil.value)?.rotulo);

async function logout() {
  saindo.value = true;
  await sair();
  saindo.value = false;
  router.push({ name: 'login' });
}
</script>

<template>
  <div v-if="sessao.token && perfil" class="shell">
    <header class="topo">
      <RouterLink to="/" class="marca">Match de Adoção</RouterLink>
      <button class="menu-btn" type="button" :aria-expanded="menuAberto" aria-label="Menu" @click="menuAberto = !menuAberto">
        {{ menuAberto ? 'Fechar' : 'Menu' }}
      </button>
    </header>
    <aside class="lateral" :class="{ aberto: menuAberto }">
      <RouterLink to="/" class="marca">Match de Adoção</RouterLink>
      <p class="quem">{{ rotuloPerfil }} · {{ sessao.conta?.nome }}</p>
      <nav aria-label="Principal">
        <RouterLink v-for="item in menu" :key="item.rota" :to="item.rota">{{ item.titulo }}</RouterLink>
      </nav>
      <button type="button" class="sair" :disabled="saindo" @click="logout">Sair</button>
    </aside>
    <main class="conteudo"><RouterView /></main>
  </div>
  <RouterView v-else />
</template>
