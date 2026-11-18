// Descrição declarativa das telas: cada recurso vira uma tela de listagem + formulário (CRUD) em RecursoView.
export type Linha = Record<string, any>;
export interface Opcao { valor: string | number; rotulo: string }

export interface Campo {
  chave: string;
  rotulo: string;
  tipo: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox';
  obrigatorio?: boolean;
  dica?: string;
  max?: number;
  min?: number;
  /** Select preenchido com os registros de outro recurso (chave = rota do recurso). */
  fk?: string;
  /** Select com opções fixas. */
  opcoes?: Opcao[];
  desabilitado?: (f: Linha) => boolean;
}

export interface Coluna {
  chave: string;
  rotulo: string;
  tipo?: 'foto' | 'status' | 'data' | 'datahora' | 'sim-nao';
  /** Mostra o rótulo do registro apontado pela FK. */
  fk?: string;
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
  semCadastro?: boolean;
}

export const STATUS = ['PENDENTE', 'EM ANDAMENTO', 'APROVADO', 'CANCELADO'];
const TIPOS_RESIDENCIA = ['CASA', 'APARTAMENTO', 'CHÁCARA', 'OUTRO'];

const aoMudarAdotante = (f: Linha) => { if (!f.possui_animais) f.quantidade_animais = 0; };

export const recursos: Recurso[] = [
  {
    rota: 'animais', titulo: 'Animais', singular: 'animal', id: 'id_animal',
    rotulo: (a) => `${a.apelido ? `${a.apelido} · ` : ''}${a.tipo}${a.raca ? ` (${a.raca})` : ''} #${a.id_animal}`,
    colunas: [
      { chave: 'foto', rotulo: 'Foto', tipo: 'foto' },
      { chave: 'apelido', rotulo: 'Apelido' },
      { chave: 'tipo', rotulo: 'Tipo' },
      { chave: 'raca', rotulo: 'Raça' },
      { chave: 'data_nascimento', rotulo: 'Nascimento', tipo: 'data' },
      { chave: 'id_instituicao', rotulo: 'Instituição', fk: 'instituicoes' },
    ],
    campos: [
      { chave: 'tipo', rotulo: 'Tipo', tipo: 'text', obrigatorio: true, max: 50, dica: 'Cachorro, gato, coelho...' },
      { chave: 'apelido', rotulo: 'Apelido', tipo: 'text', max: 100 },
      { chave: 'raca', rotulo: 'Raça', tipo: 'text', max: 100 },
      { chave: 'data_nascimento', rotulo: 'Data de nascimento', tipo: 'date' },
      { chave: 'id_instituicao', rotulo: 'Instituição', tipo: 'select', fk: 'instituicoes', obrigatorio: true },
      { chave: 'foto', rotulo: 'Foto (URL)', tipo: 'text', max: 500 },
      { chave: 'detalhes', rotulo: 'Detalhes', tipo: 'textarea' },
    ],
  },
  {
    rota: 'instituicoes', titulo: 'Instituições', singular: 'instituição', id: 'id_instituicao',
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
      { chave: 'foto', rotulo: 'Foto (URL)', tipo: 'text', max: 500 },
    ],
  },
  {
    rota: 'vacinas', titulo: 'Vacinas', singular: 'vacina', id: 'id_vacina',
    rotulo: (v) => v.nome,
    colunas: [{ chave: 'nome', rotulo: 'Nome' }],
    campos: [{ chave: 'nome', rotulo: 'Nome', tipo: 'text', obrigatorio: true, max: 150, dica: 'Ex.: antirrábica, V8, V10' }],
  },
  {
    rota: 'animais-vacinas', titulo: 'Vacinações', singular: 'aplicação de vacina', id: 'id_animal_vacina',
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
    rotulo: (m) => `Pedido #${m.id_match}`,
    colunas: [
      { chave: 'id_adotante', rotulo: 'Adotante', fk: 'adotantes' },
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
