<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { atualizar, criar, listar, remover } from '../api/crud';
import { ApiError } from '../api/http';
import { porRota, type Campo, type Linha, type Opcao } from '../recursos';

const props = defineProps<{ recurso: string }>();
const rec = computed(() => porRota(props.recurso));

const linhas = ref<Linha[]>([]);
const opcoesFk = ref<Record<string, Linha[]>>({});
const carregando = ref(false);
const erro = ref('');
const aviso = ref('');

const formAberto = ref(false);
const editando = ref<Linha | null>(null);
const form = ref<Linha>({});
const erroForm = ref('');
const salvando = ref(false);

const camposForm = computed<Campo[]>(() => (editando.value && rec.value.camposEdicao) || rec.value.campos);
const fks = computed(() => [...new Set([...rec.value.campos, ...(rec.value.camposEdicao ?? []), ...rec.value.colunas].map((c) => c.fk).filter(Boolean))] as string[]);

async function carregar() {
  carregando.value = true;
  erro.value = '';
  try {
    const [dados, ...extras] = await Promise.all([listar(rec.value.rota), ...fks.value.map((f) => listar(f))]);
    linhas.value = dados;
    opcoesFk.value = Object.fromEntries(fks.value.map((f, i) => [f, extras[i]]));
  } catch (e) {
    erro.value = e instanceof ApiError ? e.completa : 'Erro ao carregar os dados.';
  } finally {
    carregando.value = false;
  }
}
watch(() => props.recurso, () => { formAberto.value = false; aviso.value = ''; carregar(); }, { immediate: true });

function opcoes(c: Campo): Opcao[] {
  if (c.opcoes) return c.opcoes;
  const alvo = porRota(c.fk!);
  return (opcoesFk.value[c.fk!] ?? []).map((l) => ({ valor: l[alvo.id], rotulo: alvo.rotulo(l) }));
}

function rotuloFk(fk: string, id: number) {
  const alvo = porRota(fk);
  const l = (opcoesFk.value[fk] ?? []).find((x) => x[alvo.id] === id);
  return l ? alvo.rotulo(l) : `#${id}`;
}

const dataBR = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');

function valorCelula(l: Linha, c: (typeof rec.value.colunas)[number]): string {
  const v = l[c.chave];
  if (v === null || v === undefined || v === '') return '—';
  if (c.fk) return rotuloFk(c.fk, v);
  if (c.tipo === 'data') return dataBR(v);
  if (c.tipo === 'datahora') return new Date(v).toLocaleString('pt-BR');
  if (c.tipo === 'sim-nao') return v ? 'Sim' : 'Não';
  return String(v);
}

function abrirNovo() {
  editando.value = null;
  form.value = { ...(rec.value.inicial ?? {}) };
  erroForm.value = '';
  formAberto.value = true;
}

function abrirEdicao(l: Linha) {
  editando.value = l;
  const f: Linha = {};
  for (const c of rec.value.camposEdicao ?? rec.value.campos) {
    const v = l[c.chave];
    f[c.chave] = c.tipo === 'date' && typeof v === 'string' ? v.slice(0, 10) : v ?? (c.tipo === 'checkbox' ? false : '');
  }
  form.value = f;
  erroForm.value = '';
  formAberto.value = true;
}

function payload(): Linha {
  const dados: Linha = {};
  for (const c of camposForm.value) {
    const v = form.value[c.chave];
    if (c.tipo === 'checkbox') dados[c.chave] = !!v;
    else if (v === '' || v === null || v === undefined) dados[c.chave] = c.obrigatorio ? undefined : null;
    else dados[c.chave] = c.tipo === 'number' || (c.tipo === 'select' && c.fk) ? Number(v) : v;
  }
  return dados;
}

async function salvar() {
  erroForm.value = '';
  salvando.value = true;
  try {
    const id = editando.value?.[rec.value.id];
    if (editando.value) await atualizar(rec.value.rota, id, payload());
    else await criar(rec.value.rota, payload());
    formAberto.value = false;
    aviso.value = editando.value ? 'Registro atualizado.' : 'Registro criado.';
    await carregar();
  } catch (e) {
    erroForm.value = e instanceof ApiError ? e.completa : 'Erro ao salvar.';
  } finally {
    salvando.value = false;
  }
}

async function excluir(l: Linha) {
  if (!window.confirm(`Excluir ${rec.value.singular}: ${rec.value.rotulo(l)}?`)) return;
  aviso.value = '';
  erro.value = '';
  try {
    await remover(rec.value.rota, l[rec.value.id]);
    aviso.value = 'Registro excluído.';
    await carregar();
  } catch (e) {
    erro.value = e instanceof ApiError ? e.completa : 'Erro ao excluir.';
  }
}
</script>

<template>
  <section>
    <div class="cabecalho">
      <div>
        <h1>{{ rec.titulo }}</h1>
        <p v-if="!carregando && linhas.length" class="sub">{{ linhas.length }} {{ linhas.length === 1 ? 'registro' : 'registros' }}</p>
      </div>
      <button class="primario" type="button" @click="abrirNovo">Novo cadastro</button>
    </div>

    <p v-if="aviso" class="sucesso">{{ aviso }}</p>
    <p v-if="erro" class="erro" role="alert">{{ erro }} <button type="button" class="link" @click="carregar">Tentar novamente</button></p>
    <p v-if="carregando" class="vazio">Carregando...</p>
    <p v-else-if="!erro && !linhas.length" class="vazio">Nenhum registro cadastrado ainda.</p>

    <div v-else-if="linhas.length" class="tabela-wrap">
      <table>
        <thead>
          <tr><th v-for="c in rec.colunas" :key="c.chave">{{ c.rotulo }}</th><th class="acoes">Ações</th></tr>
        </thead>
        <tbody>
          <tr v-for="l in linhas" :key="l[rec.id]">
            <td v-for="c in rec.colunas" :key="c.chave" :data-rotulo="c.rotulo">
              <img v-if="c.tipo === 'foto' && l[c.chave]" :src="l[c.chave]" alt="" class="foto" loading="lazy" @error="($event.target as HTMLImageElement).style.display = 'none'" />
              <span v-else-if="c.tipo === 'status'" class="selo" :class="'s-' + l[c.chave].toLowerCase().replace(' ', '-')">{{ l[c.chave] }}</span>
              <template v-else>{{ valorCelula(l, c) }}</template>
            </td>
            <td class="acoes">
              <button type="button" @click="abrirEdicao(l)">Editar</button>
              <button type="button" class="perigo" @click="excluir(l)">Excluir</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="formAberto" class="fundo" @click.self="formAberto = false">
      <form class="modal" @submit.prevent="salvar">
        <h2>{{ editando ? 'Editar' : 'Novo' }} · {{ rec.singular }}</h2>
        <div class="campos">
        <label v-for="c in camposForm" :key="c.chave" :class="{ inline: c.tipo === 'checkbox', cheio: c.tipo === 'textarea' || c.tipo === 'checkbox' || c.chave === 'endereco' }">
          <span>{{ c.rotulo }}<b v-if="c.obrigatorio"> *</b></span>
          <textarea v-if="c.tipo === 'textarea'" v-model="form[c.chave]" rows="3" />
          <select v-else-if="c.tipo === 'select'" v-model="form[c.chave]" :required="c.obrigatorio">
            <option value="" disabled>Selecione...</option>
            <option v-for="o in opcoes(c)" :key="o.valor" :value="o.valor">{{ o.rotulo }}</option>
          </select>
          <input v-else-if="c.tipo === 'checkbox'" v-model="form[c.chave]" type="checkbox" @change="rec.aoMudar?.(form)" />
          <input v-else v-model="form[c.chave]" :type="c.tipo" :required="c.obrigatorio" :maxlength="c.max" :min="c.min" :step="c.tipo === 'number' ? 1 : undefined" :disabled="c.desabilitado?.(form)" />
          <small v-if="c.dica">{{ c.dica }}</small>
        </label>
        </div>
        <p v-if="erroForm" class="erro" role="alert">{{ erroForm }}</p>
        <div class="botoes">
          <button type="button" @click="formAberto = false">Cancelar</button>
          <button class="primario" :disabled="salvando">{{ salvando ? 'Salvando...' : 'Salvar' }}</button>
        </div>
      </form>
    </div>
  </section>
</template>
