// Descrição declarativa das telas: cada recurso vira uma tela de listagem + formulário (CRUD) em RecursoView.
// As opções de cada perfil só organizam a interface: a API confere perfil e propriedade em toda requisição.
import { criar } from './api/crud';
import { http, type Perfil } from './api/http';

export type { Perfil };
export type Linha = Record<string, any>;

export const PERFIS: { valor: Perfil; rotulo: string }[] = [
  { valor: 'ADOTANTE', rotulo: 'Adotante' },
  { valor: 'INSTITUICAO', rotulo: 'Instituição' },
  { valor: 'ADMIN', rotulo: 'Admin' },
];
// O cadastro público oferece apenas adotante e instituição.
export const PERFIS_CADASTRO = PERFIS.filter((p) => p.valor !== 'ADMIN');
export interface Opcao { valor: string | number; rotulo: string }

export interface Campo {
  chave: string;
  rotulo: string;
  tipo: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'foto';
  obrigatorio?: boolean;
  dica?: string;
  max?: number;
  min?: number;
  /** Select preenchido com os registros de outro recurso (chave = rota do recurso). */
  fk?: string;
  /** Select com opções fixas. */
  opcoes?: Opcao[];
  desabilitado?: (f: Linha) => boolean;
  /** Perfis que veem o campo (padrão: todos). */
  perfis?: Perfil[];
}

export interface Coluna {
  chave: string;
  rotulo: string;
  tipo?: 'foto' | 'status' | 'data' | 'datahora' | 'sim-nao';
  /** Mostra o rótulo do registro apontado pela FK. */
  fk?: string;
  /** Perfis que veem a coluna (padrão: todos). */
  perfis?: Perfil[];
}

/** Ação de uma linha (ex.: solicitar adoção, aprovar). */
export interface AcaoLinha {
  rotulo: string;
  perfis: Perfil[];
  executar: (l: Linha) => Promise<unknown>;
  sucesso: string;
  visivel?: (l: Linha) => boolean;
  primaria?: boolean;
}

export interface Recurso {
  rota: string;
  titulo: string;
  singular: string;
  id: string;
  colunas: Coluna[];
  campos: Campo[];
  /** Campos do formulário de edição (padrão: os mesmos do cadastro). */
  camposEdicao?: Campo[];
  rotulo: (l: Linha) => string;
  inicial?: Linha;
  aoMudar?: (f: Linha) => void;
  /** Título da tela no menu de cada perfil; sem título, o perfil não tem a tela. */
  telas: Partial<Record<Perfil, string>>;
  /** Perfis que cadastram, editam e excluem pela tela. */
  escrita?: Perfil[];
  acoes?: AcaoLinha[];
}

export const STATUS = ['PENDENTE', 'EM ANDAMENTO', 'APROVADO', 'CANCELADO'];
const TIPOS_RESIDENCIA = ['CASA', 'APARTAMENTO', 'CHÁCARA', 'OUTRO'];

const aoMudarAdotante = (f: Linha) => { if (!f.possui_animais) f.quantidade_animais = 0; };
const alterarStatus = (status: string) => (m: Linha) => http('PATCH', `/matches/${m.id_match}/status`, { status });

export const recursos: Recurso[] = [
  {
    rota: 'animais', titulo: 'Animais', singular: 'animal', id: 'id_animal',
    telas: { ADOTANTE: 'Animais disponíveis', INSTITUICAO: 'Meus animais', ADMIN: 'Animais' },
    escrita: ['INSTITUICAO', 'ADMIN'],
    acoes: [{ rotulo: 'Solicitar adoção', perfis: ['ADOTANTE'], primaria: true, sucesso: 'Pedido enviado. Acompanhe em Meus pedidos.', executar: (a) => criar('matches', { id_animal: a.id_animal }) }],
    rotulo: (a) => `${a.apelido ? `${a.apelido} · ` : ''}${a.tipo}${a.raca ? ` (${a.raca})` : ''} #${a.id_animal}`,
    colunas: [
      { chave: 'foto', rotulo: 'Foto', tipo: 'foto' },
      { chave: 'apelido', rotulo: 'Apelido' },
      { chave: 'tipo', rotulo: 'Tipo' },
      { chave: 'raca', rotulo: 'Raça' },
      { chave: 'data_nascimento', rotulo: 'Nascimento', tipo: 'data' },
      { chave: 'id_instituicao', rotulo: 'Instituição', fk: 'instituicoes', perfis: ['ADOTANTE', 'ADMIN'] },
    ],
    campos: [
      { chave: 'tipo', rotulo: 'Tipo', tipo: 'text', obrigatorio: true, max: 50, dica: 'Cachorro, gato, coelho...' },
      { chave: 'apelido', rotulo: 'Apelido', tipo: 'text', max: 100 },
      { chave: 'raca', rotulo: 'Raça', tipo: 'text', max: 100 },
      { chave: 'data_nascimento', rotulo: 'Data de nascimento', tipo: 'date' },
      // A instituição logada cadastra para si mesma; só o administrador escolhe.
      { chave: 'id_instituicao', rotulo: 'Instituição', tipo: 'select', fk: 'instituicoes', obrigatorio: true, perfis: ['ADMIN'] },
      { chave: 'foto', rotulo: 'Foto', tipo: 'foto', perfis: ['INSTITUICAO', 'ADMIN'] },
      { chave: 'detalhes', rotulo: 'Detalhes', tipo: 'textarea' },
    ],
  },
  {
    rota: 'instituicoes', titulo: 'Instituições', singular: 'instituição', id: 'id_instituicao',
    telas: { ADMIN: 'Instituições' },
    escrita: ['ADMIN'],
    rotulo: (i) => i.razao_social,
    colunas: [
      { chave: 'foto', rotulo: 'Foto', tipo: 'foto' },
      { chave: 'razao_social', rotulo: 'Razão social' },
      { chave: 'cnpj', rotulo: 'CNPJ' },
      { chave: 'endereco', rotulo: 'Endereço' },
    ],
    campos: [
      { chave: 'razao_social', rotulo: 'Razão social', tipo: 'text', obrigatorio: true, max: 200 },
      { chave: 'cnpj', rotulo: 'CNPJ', tipo: 'text', obrigatorio: true, dica: '14 dígitos (pontuação é aceita)' },
      { chave: 'endereco', rotulo: 'Endereço', tipo: 'text', obrigatorio: true, max: 255 },
      { chave: 'foto', rotulo: 'Foto', tipo: 'foto', perfis: ['INSTITUICAO', 'ADMIN'] },
    ],
  },
  {
    rota: 'vacinas', titulo: 'Vacinas', singular: 'vacina', id: 'id_vacina',
    telas: { INSTITUICAO: 'Vacinas', ADMIN: 'Vacinas' },
    escrita: ['INSTITUICAO', 'ADMIN'],
    rotulo: (v) => v.nome,
    colunas: [{ chave: 'nome', rotulo: 'Nome' }],
    campos: [{ chave: 'nome', rotulo: 'Nome', tipo: 'text', obrigatorio: true, max: 150, dica: 'Ex.: antirrábica, V8, V10' }],
  },
  {
    rota: 'animais-vacinas', titulo: 'Vacinações', singular: 'aplicação de vacina', id: 'id_animal_vacina',
    telas: { INSTITUICAO: 'Vacinações', ADMIN: 'Vacinações' },
    escrita: ['INSTITUICAO', 'ADMIN'],
    rotulo: (a) => `Aplicação #${a.id_animal_vacina}`,
    colunas: [
      { chave: 'id_animal', rotulo: 'Animal', fk: 'animais' },
      { chave: 'id_vacina', rotulo: 'Vacina', fk: 'vacinas' },
      { chave: 'data_aplicacao', rotulo: 'Data da aplicação', tipo: 'data' },
    ],
    campos: [
      { chave: 'id_animal', rotulo: 'Animal', tipo: 'select', fk: 'animais', obrigatorio: true },
      { chave: 'id_vacina', rotulo: 'Vacina', tipo: 'select', fk: 'vacinas', obrigatorio: true },
      { chave: 'data_aplicacao', rotulo: 'Data da aplicação', tipo: 'date', obrigatorio: true, dica: 'A mesma vacina pode ter várias doses em datas distintas.' },
    ],
  },
  {
    rota: 'adotantes', titulo: 'Adotantes', singular: 'adotante', id: 'id_adotante',
    // A instituição vê quem pediu seus animais; o adotante usa "Meu perfil".
    telas: { INSTITUICAO: 'Solicitantes', ADMIN: 'Adotantes' },
    escrita: ['ADMIN'],
    rotulo: (a) => a.nome,
    inicial: { possui_animais: false, quantidade_animais: 0, tipo_residencia: 'CASA' },
    aoMudar: aoMudarAdotante,
    colunas: [
      { chave: 'nome', rotulo: 'Nome' },
      { chave: 'cpf', rotulo: 'CPF' },
      { chave: 'endereco', rotulo: 'Endereço' },
      { chave: 'tipo_residencia', rotulo: 'Residência' },
      { chave: 'possui_animais', rotulo: 'Possui animais', tipo: 'sim-nao' },
      { chave: 'quantidade_animais', rotulo: 'Qtd.' },
    ],
    campos: [
      { chave: 'nome', rotulo: 'Nome', tipo: 'text', obrigatorio: true, max: 200 },
      { chave: 'cpf', rotulo: 'CPF', tipo: 'text', obrigatorio: true, dica: '11 dígitos (pontuação é aceita)' },
      { chave: 'data_nascimento', rotulo: 'Data de nascimento', tipo: 'date', obrigatorio: true, dica: 'O adotante deve ter pelo menos 18 anos.' },
      { chave: 'endereco', rotulo: 'Endereço', tipo: 'text', obrigatorio: true, max: 255 },
      { chave: 'tipo_residencia', rotulo: 'Tipo de residência', tipo: 'select', obrigatorio: true, opcoes: TIPOS_RESIDENCIA.map((v) => ({ valor: v, rotulo: v })) },
      { chave: 'possui_animais', rotulo: 'Possui animais', tipo: 'checkbox' },
      { chave: 'quantidade_animais', rotulo: 'Quantidade de animais', tipo: 'number', obrigatorio: true, min: 0, dica: 'Zero se não possui; maior que zero se possui.', desabilitado: (f) => !f.possui_animais },
      { chave: 'tipos_animais', rotulo: 'Tipos de animais', tipo: 'text', dica: 'Ex.: cachorro, gato' },
    ],
  },
  {
    rota: 'matches', titulo: 'Pedidos de adoção', singular: 'pedido de adoção', id: 'id_match',
    telas: { ADOTANTE: 'Meus pedidos', INSTITUICAO: 'Pedidos recebidos', ADMIN: 'Pedidos de adoção' },
    // O adotante solicita pela tela de animais; a instituição decide pelas ações da linha.
    escrita: ['ADMIN'],
    acoes: [
      { rotulo: 'Aprovar', perfis: ['INSTITUICAO', 'ADMIN'], primaria: true, sucesso: 'Adoção aprovada.', visivel: (m) => m.status !== 'APROVADO', executar: alterarStatus('APROVADO') },
      { rotulo: 'Recusar', perfis: ['INSTITUICAO', 'ADMIN'], sucesso: 'Pedido recusado.', visivel: (m) => m.status !== 'CANCELADO', executar: alterarStatus('CANCELADO') },
    ],
    rotulo: (m) => `Pedido #${m.id_match}`,
    colunas: [
      { chave: 'id_adotante', rotulo: 'Adotante', fk: 'adotantes', perfis: ['INSTITUICAO', 'ADMIN'] },
      { chave: 'id_animal', rotulo: 'Animal', fk: 'animais' },
      { chave: 'data_pedido', rotulo: 'Data do pedido', tipo: 'datahora' },
      { chave: 'status', rotulo: 'Status', tipo: 'status' },
    ],
    campos: [
      { chave: 'id_adotante', rotulo: 'Adotante', tipo: 'select', fk: 'adotantes', obrigatorio: true },
      { chave: 'id_animal', rotulo: 'Animal', tipo: 'select', fk: 'animais', obrigatorio: true, dica: 'O pedido nasce PENDENTE. Animal com adoção aprovada não recebe novos pedidos.' },
    ],
    // Depois de criado, somente o status muda.
    camposEdicao: [
      { chave: 'status', rotulo: 'Status', tipo: 'select', obrigatorio: true, opcoes: STATUS.map((v) => ({ valor: v, rotulo: v })), dica: 'Só um pedido por animal pode ser APROVADO.' },
    ],
  },
];

export const porRota = (rota: string) => recursos.find((r) => r.rota === rota)!;

/** Cadastro ligado a cada perfil (tela "Meu perfil", cadastro público e conclusão do perfil). */
export const recursoDoPerfil = (perfil: 'ADOTANTE' | 'INSTITUICAO') => porRota(perfil === 'ADOTANTE' ? 'adotantes' : 'instituicoes');

export const visivelPara = (perfil: Perfil) => (item: { perfis?: Perfil[] }) => !item.perfis || item.perfis.includes(perfil);

/** Corpo enviado à API a partir do formulário: números convertidos e opcionais vazios como null. */
export function payload(campos: Campo[], form: Linha): Linha {
  const dados: Linha = {};
  for (const c of campos) {
    const v = form[c.chave];
    if (c.tipo === 'checkbox') dados[c.chave] = !!v;
    else if (v === '' || v === null || v === undefined) dados[c.chave] = c.obrigatorio ? undefined : null;
    else dados[c.chave] = c.tipo === 'number' || (c.tipo === 'select' && c.fk) ? Number(v) : v;
  }
  return dados;
}
