<script setup lang="ts">
import { ref, watch } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { sessao } from './api/http';
import { sair } from './api/auth';
import { recursos } from './recursos';

const route = useRoute();
const router = useRouter();
const menuAberto = ref(false);
const saindo = ref(false);

watch(() => route.fullPath, () => { menuAberto.value = false; });

async function logout() {
  saindo.value = true;
  await sair();
  saindo.value = false;
  router.push({ name: 'login' });
}
</script>

<template>
  <div v-if="sessao.token" class="shell">
    <header class="topo">
      <RouterLink to="/" class="marca">Match de Adoção</RouterLink>
      <button class="menu-btn" type="button" :aria-expanded="menuAberto" aria-label="Menu" @click="menuAberto = !menuAberto">
        {{ menuAberto ? 'Fechar' : 'Menu' }}
      </button>
    </header>
    <aside class="lateral" :class="{ aberto: menuAberto }">
      <RouterLink to="/" class="marca">Match de Adoção</RouterLink>
      <nav aria-label="Principal">
        <RouterLink v-for="r in recursos" :key="r.rota" :to="`/${r.rota}`">{{ r.titulo }}</RouterLink>
      </nav>
      <button type="button" class="sair" :disabled="saindo" @click="logout">Sair</button>
    </aside>
    <main class="conteudo"><RouterView /></main>
  </div>
  <RouterView v-else />
</template>
