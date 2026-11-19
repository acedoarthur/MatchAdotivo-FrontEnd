<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import AuthLayout from '../components/AuthLayout.vue';
import CamposFormulario from '../components/CamposFormulario.vue';
import EscolhaPerfil from '../components/EscolhaPerfil.vue';
import { RouterLink, useRouter } from 'vue-router';
import { cadastrar } from '../api/auth';
import { ApiError } from '../api/http';
import { PERFIS_CADASTRO, payload, recursoDoPerfil } from '../recursos';

type PerfilCadastro = 'ADOTANTE' | 'INSTITUICAO';

const router = useRouter();
const perfil = ref<PerfilCadastro>('ADOTANTE');
const nome = ref('');
const email = ref('');
const senha = ref('');
const erro = ref('');
const enviando = ref(false);

// Os campos do perfil são os mesmos das telas de adotante e instituição (e dos schemas da API).
const rec = computed(() => recursoDoPerfil(perfil.value));
const formularios = reactive({ ADOTANTE: { ...recursoDoPerfil('ADOTANTE').inicial }, INSTITUICAO: {} });
const form = computed(() => formularios[perfil.value]);

async function enviar() {
  erro.value = '';
  enviando.value = true;
  try {
    const cadastro = payload(rec.value.campos, form.value);
    // No adotante, o nome da conta é o próprio nome do cadastro.
    const nomeConta = perfil.value === 'ADOTANTE' ? cadastro.nome : nome.value;
    const chave = perfil.value === 'ADOTANTE' ? 'adotante' : 'instituicao';
    await cadastrar({ nome: nomeConta, email: email.value, senha: senha.value, perfil: perfil.value, [chave]: cadastro });
    router.push({ name: 'login', query: { cadastrado: '1' } });
  } catch (e) {
    erro.value = e instanceof ApiError ? e.completa : 'Erro inesperado ao cadastrar.';
  } finally {
    enviando.value = false;
  }
}
</script>

<template>
  <AuthLayout largo>
    <h1>Criar conta</h1>
    <form @submit.prevent="enviar">
      <EscolhaPerfil v-model="perfil" :opcoes="PERFIS_CADASTRO.map((p) => ({ ...p, rotulo: `Sou ${p.rotulo}` }))" rotulo="Tipo de conta" />
      <p class="secao">Acesso</p>
      <div class="campos">
        <label v-if="perfil === 'INSTITUICAO'" class="cheio">Nome do responsável <input v-model="nome" required minlength="3" maxlength="200" autocomplete="name" /></label>
        <label>E-mail <input v-model="email" type="email" required autocomplete="username" /></label>
        <label>Senha <input v-model="senha" type="password" required minlength="8" autocomplete="new-password" />
          <small>Mínimo de 8 caracteres.</small></label>
      </div>
      <p class="secao">{{ perfil === 'ADOTANTE' ? 'Dados do adotante' : 'Dados da instituição' }}</p>
      <CamposFormulario :campos="rec.campos" :form="form" :ao-mudar="rec.aoMudar" />
      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
      <button class="primario" :disabled="enviando">{{ enviando ? 'Cadastrando...' : 'Cadastrar' }}</button>
    </form>
    <p class="rodape">Já tem conta? <RouterLink to="/login">Entrar</RouterLink></p>
  </AuthLayout>
</template>
