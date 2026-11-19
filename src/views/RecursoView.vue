<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import CamposFormulario from '../components/CamposFormulario.vue';
import { atualizar, buscar, criar, listar, remover } from '../api/crud';
import { ApiError, sessao, urlFoto } from '../api/http';
import { payload, porRota, visivelPara, type AcaoLinha, type Campo, type Linha, type Opcao } from '../recursos';

// `registro`: tela "Meu perfil", com somente o cadastro da própria conta.
const props = defineProps<{ recurso: string; registro?: number }>();
const rec = computed(() => porRota(props.recurso));
const perfil = computed(() => sessao.conta!.perfil!);
const visivel = computed(() => visivelPara(perfil.value));

const titulo = computed(() => props.registro ? 'Meu perfil' : rec.value.telas[perfil.value] ?? rec.value.titulo);
// A interface só oferece o que o perfil pode fazer; a API confere de novo cada operação.
const podeEscrever = computed(() => !props.registro && !!rec.value.escrita?.includes(perfil.value));
const podeEditar = computed(() => podeEscrever.value || !!props.registro);
const acoes = computed(() => (rec.value.acoes ?? []).filter((a) => a.perfis.includes(perfil.value)));
const colunas = computed(() => rec.value.colunas.filter(visivel.value));

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

const camposForm = computed<Campo[]>(() => ((editando.value && rec.value.camposEdicao) || rec.value.campos).filter(visivel.value));
const fks = computed(() => {
  const campos = podeEditar.value ? [...rec.value.campos, ...(rec.value.camposEdicao ?? [])].filter(visivel.value) : [];
  return [...new Set([...campos, ...colunas.value].map((c) => c.fk).filter(Boolean))] as string[];
});

// Registros citados na tabela que a listagem do perfil não traz (ex.: animal já adotado nos pedidos do adotante).
async function completarFks() {
  for (const c of colunas.value.filter((c) => c.fk)) {
    const alvo = porRota(c.fk!);
    const conhecidos = new Set((opcoesFk.value[c.fk!] ?? []).map((l) => l[alvo.id]));
    const faltando = [...new Set(linhas.value.map((l) => l[c.chave]).filter((id) => id != null && !conhecidos.has(id)))];
    const achados = await Promise.all(faltando.map((id) => buscar(c.fk!, id).catch(() => null)));
    opcoesFk.value[c.fk!] = [...(opcoesFk.value[c.fk!] ?? []), ...achados.filter((l): l is Linha => l !== null)];
  }
}

async function carregar() {
  carregando.value = true;
  erro.value = '';
  try {
    const principal = props.registro ? buscar(rec.value.rota, props.registro).then((l) => [l]) : listar(rec.value.rota);
    const [dados, ...extras] = await Promise.all([principal, ...fks.value.map((f) => listar(f))]);
    linhas.value = dados;
    opcoesFk.value = Object.fromEntries(fks.value.map((f, i) => [f, extras[i]]));
    await completarFks();
  } catch (e) {
    erro.value = e instanceof ApiError ? e.completa : 'Erro ao carregar os dados.';
  } finally {
    carregando.value = false;
  }
}
watch(() => [props.recurso, props.registro], () => { formAberto.value = false; aviso.value = ''; carregar(); }, { immediate: true });

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
  for (const c of (rec.value.camposEdicao ?? rec.value.campos).filter(visivel.value)) {
    const v = l[c.chave];
    f[c.chave] = c.tipo === 'date' && typeof v === 'string' ? v.slice(0, 10) : v ?? (c.tipo === 'checkbox' ? false : '');
  }
  form.value = f;
  erroForm.value = '';
  formAberto.value = true;
}

async function salvar() {
  erroForm.value = '';
  salvando.value = true;
  try {
    const id = editando.value?.[rec.value.id];
    if (editando.value) await atualizar(rec.value.rota, id, payload(camposForm.value, form.value));
    else await criar(rec.value.rota, payload(camposForm.value, form.value));
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

const executando = ref(false);
async function executar(acao: AcaoLinha, l: Linha) {
  aviso.value = '';
  erro.value = '';
  executando.value = true;
  try {
    await acao.executar(l);
    aviso.value = acao.sucesso;
    await carregar();
  } catch (e) {
    erro.value = e instanceof ApiError ? e.completa : 'Erro ao executar a ação.';
  } finally {
    executando.value = false;
  }
}
</script>

<template>
  <section>
    <div class="cabecalho">
      <div>
        <h1>{{ titulo }}</h1>
        <p v-if="!carregando && linhas.length && !registro" class="sub">{{ linhas.length }} {{ linhas.length === 1 ? 'registro' : 'registros' }}</p>
      </div>
      <button v-if="podeEscrever" class="primario" type="button" @click="abrirNovo">Novo cadastro</button>
    </div>

    <p v-if="aviso" class="sucesso">{{ aviso }}</p>
    <p v-if="erro" class="erro" role="alert">{{ erro }} <button type="button" class="link" @click="carregar">Tentar novamente</button></p>
    <p v-if="carregando" class="vazio">Carregando...</p>
    <p v-else-if="!erro && !linhas.length" class="vazio">Nenhum registro encontrado.</p>

    <div v-else-if="linhas.length" class="tabela-wrap">
      <table>
        <thead>
          <tr><th v-for="c in colunas" :key="c.chave">{{ c.rotulo }}</th><th v-if="podeEditar || acoes.length" class="acoes">Ações</th></tr>
        </thead>
        <tbody>
          <tr v-for="l in linhas" :key="l[rec.id]">
            <td v-for="c in colunas" :key="c.chave" :data-rotulo="c.rotulo">
              <img v-if="c.tipo === 'foto' && l[c.chave]" :src="urlFoto(l[c.chave])" alt="" class="foto" loading="lazy" @error="($event.target as HTMLImageElement).style.display = 'none'" />
              <span v-else-if="c.tipo === 'status'" class="selo" :class="'s-' + l[c.chave].toLowerCase().replace(' ', '-')">{{ l[c.chave] }}</span>
              <template v-else>{{ valorCelula(l, c) }}</template>
            </td>
            <td v-if="podeEditar || acoes.length" class="acoes">
              <template v-for="a in acoes" :key="a.rotulo">
                <button v-if="!a.visivel || a.visivel(l)" type="button" :class="{ primario: a.primaria }" :disabled="executando" @click="executar(a, l)">{{ a.rotulo }}</button>
              </template>
              <button v-if="podeEditar" type="button" @click="abrirEdicao(l)">Editar</button>
              <button v-if="podeEscrever" type="button" class="perigo" @click="excluir(l)">Excluir</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="formAberto" class="fundo" @click.self="formAberto = false">
      <form class="modal" @submit.prevent="salvar">
        <h2>{{ editando ? 'Editar' : 'Novo' }} · {{ rec.singular }}</h2>
        <CamposFormulario :campos="camposForm" :form="form" :opcoes="opcoes" :ao-mudar="rec.aoMudar" />
        <p v-if="erroForm" class="erro" role="alert">{{ erroForm }}</p>
        <div class="botoes">
          <button type="button" @click="formAberto = false">Cancelar</button>
          <button class="primario" :disabled="salvando">{{ salvando ? 'Salvando...' : 'Salvar' }}</button>
        </div>
      </form>
    </div>
  </section>
</template>
