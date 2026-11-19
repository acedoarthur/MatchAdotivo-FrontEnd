<script setup lang="ts">
import { ref } from 'vue';
import AuthLayout from '../components/AuthLayout.vue';
import EscolhaPerfil from '../components/EscolhaPerfil.vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { entrar } from '../api/auth';
import { ApiError, type Perfil } from '../api/http';
import { PERFIS } from '../recursos';

const route = useRoute();
const router = useRouter();
const perfil = ref<Perfil>('ADOTANTE');
const email = ref('');
const senha = ref('');
const erro = ref('');
const enviando = ref(false);

async function enviar() {
  erro.value = '';
  enviando.value = true;
  try {
    // A API confere se o perfil escolhido é o da conta; a navegação usa o perfil devolvido por ela.
    await entrar(email.value, senha.value, perfil.value);
    const destino = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/';
    router.push(destino);
  } catch (e) {
    erro.value = e instanceof ApiError ? e.completa : 'Erro inesperado ao entrar.';
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <AuthLayout>
    <h1>Entrar</h1>
    <p v-if="route.query.expirada" class="aviso">Sua sessão expirou. Entre novamente para continuar.</p>
    <p v-if="route.query.cadastrado" class="sucesso">Cadastro realizado! Faça login.</p>
    <form @submit.prevent="enviar">
      <EscolhaPerfil v-model="perfil" :opcoes="PERFIS" rotulo="Entrar como" />
      <label>E-mail <input v-model="email" type="email" required autocomplete="username" /></label>
      <label>Senha <input v-model="senha" type="password" required autocomplete="current-password" /></label>
      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
      <button class="primario" :disabled="enviando">{{ enviando ? 'Entrando...' : 'Entrar' }}</button>
    </form>
    <p class="rodape">Não tem conta? <RouterLink to="/cadastro">Cadastre-se</RouterLink></p>
  </AuthLayout>
</template>
