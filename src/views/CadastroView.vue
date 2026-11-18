<script setup lang="ts">
import { ref } from 'vue';
import AuthLayout from '../components/AuthLayout.vue';
import { RouterLink, useRouter } from 'vue-router';
import { cadastrar } from '../api/auth';
import { ApiError } from '../api/http';

const router = useRouter();
const nome = ref('');
const email = ref('');
const senha = ref('');
const erro = ref('');
const enviando = ref(false);

async function enviar() {
  erro.value = '';
  enviando.value = true;
  try {
    await cadastrar(nome.value, email.value, senha.value);
    router.push({ name: 'login', query: { cadastrado: '1' } });
  } catch (e) {
    erro.value = e instanceof ApiError ? e.completa : 'Erro inesperado ao cadastrar.';
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <AuthLayout>
    <h1>Criar conta</h1>
    <form @submit.prevent="enviar">
      <label>Nome <input v-model="nome" required minlength="3" maxlength="200" autocomplete="name" /></label>
      <label>E-mail <input v-model="email" type="email" required autocomplete="username" /></label>
      <label>Senha <input v-model="senha" type="password" required minlength="8" autocomplete="new-password" />
        <small>Mínimo de 8 caracteres.</small></label>
      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
      <button class="primario" :disabled="enviando">{{ enviando ? 'Cadastrando...' : 'Cadastrar' }}</button>
    </form>
    <p class="rodape">Já tem conta? <RouterLink to="/login">Entrar</RouterLink></p>
  </AuthLayout>
</template>
