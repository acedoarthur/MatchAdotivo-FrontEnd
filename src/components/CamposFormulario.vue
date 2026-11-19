<script setup lang="ts">
import { computed, ref } from 'vue';
import { ApiError, enviarFoto, sessao, urlFoto } from '../api/http';
import { visivelPara, type Campo, type Linha, type Opcao } from '../recursos';

// Campos de um formulário descritos em recursos.ts; usado no CRUD, no cadastro e na conclusão do perfil.
const props = defineProps<{ campos: Campo[]; form: Linha; opcoes?: (c: Campo) => Opcao[]; aoMudar?: (f: Linha) => void }>();
// Campo com `perfis` só aparece para esses perfis; fotos exigem conta com perfil (no cadastro público ainda não há).
const visiveis = computed(() => props.campos.filter((c) => c.tipo !== 'foto' || (sessao.conta?.perfil && visivelPara(sessao.conta.perfil)(c))));
const enviando = ref(false);
const erroFoto = ref('');
async function escolher(c: Campo, e: Event) {
  const entrada = e.target as HTMLInputElement;
  const arquivo = entrada.files?.[0];
  entrada.value = '';
  if (!arquivo) return;
  erroFoto.value = '';
  enviando.value = true;
  try {
    props.form[c.chave] = await enviarFoto(arquivo);
  } catch (err) {
    erroFoto.value = err instanceof ApiError ? err.completa : 'Não foi possível enviar a imagem.';
  } finally {
    enviando.value = false;
  }
}
const opcoesDe = (c: Campo) => props.opcoes?.(c) ?? c.opcoes ?? [];
</script>

<template>
  <div class="campos">
    <label v-for="c in visiveis" :key="c.chave" :class="{ inline: c.tipo === 'checkbox', cheio: c.tipo === 'textarea' || c.tipo === 'checkbox' || c.tipo === 'foto' || c.chave === 'endereco' }">
      <span>{{ c.rotulo }}<b v-if="c.obrigatorio"> *</b></span>
      <div v-if="c.tipo === 'foto'" class="foto-campo">
        <img v-if="form[c.chave]" :src="urlFoto(form[c.chave])" alt="Prévia da foto" class="foto" />
        <div class="foto-acoes">
          <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" :disabled="enviando" @change="escolher(c, $event)" />
          <button v-if="form[c.chave]" type="button" class="perigo" :disabled="enviando" @click="form[c.chave] = ''">Remover foto</button>
          <small v-if="enviando">Enviando...</small>
          <small v-else>{{ form[c.chave] ? 'Escolha outro arquivo para substituir a foto. ' : '' }}JPG, PNG, GIF ou WebP, até 5 MB.</small>
          <small v-if="erroFoto" class="erro-foto" role="alert">{{ erroFoto }}</small>
        </div>
      </div>
      <textarea v-else-if="c.tipo === 'textarea'" v-model="form[c.chave]" rows="3" />
      <select v-else-if="c.tipo === 'select'" v-model="form[c.chave]" :required="c.obrigatorio">
        <option value="" disabled>Selecione...</option>
        <option v-for="o in opcoesDe(c)" :key="o.valor" :value="o.valor">{{ o.rotulo }}</option>
      </select>
      <input v-else-if="c.tipo === 'checkbox'" v-model="form[c.chave]" type="checkbox" @change="aoMudar?.(form)" />
      <input v-else v-model="form[c.chave]" :type="c.tipo" :required="c.obrigatorio" :maxlength="c.max" :min="c.min" :step="c.tipo === 'number' ? 1 : undefined" :disabled="c.desabilitado?.(form)" />
      <small v-if="c.dica">{{ c.dica }}</small>
    </label>
  </div>
</template>
