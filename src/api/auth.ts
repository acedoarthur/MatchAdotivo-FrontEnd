import { http, limparToken, salvarToken } from './http';

export async function entrar(email: string, senha: string) {
  const { token } = await http<{ token: string }>('POST', '/usuarios/login', { email, senha }, true);
  salvarToken(token);
}

export function cadastrar(nome: string, email: string, senha: string) {
  return http<unknown>('POST', '/usuarios', { nome, email, senha }, true);
}

export async function sair() {
  try { await http('POST', '/usuarios/logout'); } catch { /* mesmo se falhar, encerra a sessão local */ }
  limparToken();
}
