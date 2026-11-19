import { http, limparToken, salvarToken, sessao, type Conta, type Perfil } from './http';

/** Carrega a conta do token: o perfil vem sempre da API. */
export async function carregarConta() {
  sessao.conta = await http<Conta>('GET', '/usuarios/me');
  return sessao.conta;
}

// O perfil escolhido é conferido pela API; ela recusa (403) se não for o perfil da conta.
export async function entrar(email: string, senha: string, perfil: Perfil) {
  const { token } = await http<{ token: string }>('POST', '/usuarios/login', { email, senha, perfil }, true);
  salvarToken(token);
  return carregarConta();
}

// Cadastro público: { nome, email, senha, perfil: 'ADOTANTE' | 'INSTITUICAO', adotante | instituicao }.
export function cadastrar(dados: Record<string, unknown>) {
  return http<Conta>('POST', '/usuarios', dados, true);
}

// Contas antigas, sem perfil: cria o cadastro escolhido e o vincula à conta.
export async function completarPerfil(dados: Record<string, unknown>) {
  sessao.conta = await http<Conta>('POST', '/usuarios/perfil', dados);
}

export async function sair() {
  try { await http('POST', '/usuarios/logout'); } catch { /* mesmo se falhar, encerra a sessão local */ }
  limparToken();
}
