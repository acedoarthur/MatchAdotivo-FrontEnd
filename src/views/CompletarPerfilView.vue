<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import AuthLayout from '../components/AuthLayout.vue';
import CamposFormulario from '../components/CamposFormulario.vue';
import EscolhaPerfil from '../components/EscolhaPerfil.vue';
import { completarPerfil, sair } from '../api/auth';
import { ApiError } from '../api/http';
import { PERFIS_CADASTRO, payload, recursoDoPerfil } from '../recursos';

// Contas criadas antes dos perfis não têm permissões até escolher um perfil (uma única vez).
const router = useRouter();
const perfil = ref<'ADOTANTE' | 'INSTITUICAO'>('ADOTANTE');
const rec = computed(() => recursoDoPerfil(perfil.value));
const formularios = reactive({ ADOTANTE: { ...recursoDoPerfil('ADOTANTE').inicial }, INSTITUICAO: {} });
const form = computed(() => formularios[perfil.value]);
const erro = ref('');
const enviando = ref(false);

async function enviar() {
  erro.value = '';
  enviando.value = true;
  try {
    const chave = perfil.value === 'ADOTANTE' ? 'adotante' : 'instituicao';
    await completarPerfil({ perfil: perfil.value, [chave]: payload(rec.value.campos, form.value) });
    router.push('/');
  } catch (e) {
    erro.value = e instanceof ApiError ? e.completa : 'Erro inesperado ao concluir o cadastro.';
  } finally {
    enviando.value = false;
  }
}

async function logout() {
  await sair();
  router.push({ name: 'login' });
}
</script>

<template>
  <AuthLayout largo>
    <h1>Concluir cadastro</h1>
    <p class="aviso">Sua conta foi criada antes da separação de perfis. Escolha o perfil e informe os dados para continuar; um novo cadastro será criado e vinculado à conta.</p>
    <form @submit.prevent="enviar">
      <EscolhaPerfil v-model="perfil" :opcoes="PERFIS_CADASTRO.map((p) => ({ ...p, rotulo: `Sou ${p.rotulo}` }))" rotulo="Tipo de conta" />
      <CamposFormulario :campos="rec.campos" :form="form" :ao-mudar="rec.aoMudar" />
      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
      <button class="primario" :disabled="enviando">{{ enviando ? 'Salvando...' : 'Concluir cadastro' }}</button>
    </form>
    <p class="rodape"><button type="button" class="link" @click="logout">Sair</button></p>
  </AuthLayout>
</template>
