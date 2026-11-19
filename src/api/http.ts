import { reactive } from 'vue';

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

export type Perfil = 'ADOTANTE' | 'INSTITUICAO' | 'ADMIN';
/** Conta autenticada (GET /usuarios/me). Só orienta a navegação: as permissões são conferidas pela API. */
export interface Conta {
  id_usuario: number;
  nome: string;
  email: string;
  perfil: Perfil | null;
  id_adotante: number | null;
  id_instituicao: number | null;
}
const CHAVE = 'match-adotivo:token';

// Sessão: o JWT fica no localStorage e é enviado como Bearer nas rotas protegidas.
function lerToken(): string | null {
  try { return localStorage.getItem(CHAVE); } catch { return null; }
}

function expirou(token: string): boolean {
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof exp === 'number' && exp * 1000 <= Date.now();
  } catch { return true; }
}

export const sessao = reactive({
  token: (() => { const t = lerToken(); return t && !expirou(t) ? t : null; })() as string | null,
  conta: null as Conta | null,
});

export function salvarToken(token: string) {
  sessao.token = token;
  try { localStorage.setItem(CHAVE, token); } catch { /* sem armazenamento: vale só nesta aba */ }
}

export function limparToken() {
  sessao.token = null;
  sessao.conta = null;
  try { localStorage.removeItem(CHAVE); } catch { /* ignora */ }
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public details: { campo: string; mensagem: string }[] = []) {
    super(message);
  }
  /** Mensagem completa, incluindo os campos inválidos informados pela API. */
  get completa(): string {
    return this.details.length ? `${this.message}: ${this.details.map((d) => d.mensagem).join(' ')}` : this.message;
  }
}

// Chamado quando a API responde 401 numa rota protegida (token vencido, inválido ou revogado).
let aoExpirar: () => void = () => {};
export function definirAoExpirar(fn: () => void) { aoExpirar = fn; }

export async function http<T>(method: string, caminho: string, corpo?: unknown, publica = false): Promise<T> {
  const headers: Record<string, string> = {};
  // Arquivo (upload de foto): vai como está, com o próprio tipo; o restante é JSON.
  const arquivo = corpo instanceof Blob;
  if (corpo !== undefined) headers['Content-Type'] = arquivo ? corpo.type : 'application/json';
  if (!publica && sessao.token) headers.Authorization = `Bearer ${sessao.token}`;

  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}${caminho}`, { method, headers, body: corpo === undefined ? undefined : arquivo ? corpo : JSON.stringify(corpo) });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique se a API está em execução.', 0);
  }

  if (resposta.status === 204) return undefined as T;
  const dados = await resposta.json().catch(() => null);
  if (resposta.ok) return dados as T;

  if (resposta.status === 401 && !publica) {
    limparToken();
    aoExpirar();
    throw new ApiError('Sua sessão expirou. Entre novamente.', 401);
  }
  throw new ApiError(dados?.error ?? `Erro inesperado (${resposta.status}).`, resposta.status, dados?.details ?? []);
}

/** Foto guardada pela API ("/uploads/...") é servida pela própria API; fotos antigas por URL seguem como estão. */
export const urlFoto = (foto: string) => (foto.startsWith('/uploads/') ? `${BASE}${foto}` : foto);

export const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const LIMITE_FOTO = 5 * 1024 * 1024;

/** Envia a imagem e devolve o caminho a gravar no campo foto. O servidor valida de novo tipo e tamanho. */
export async function enviarFoto(arquivo: File): Promise<string> {
  if (!TIPOS_FOTO.includes(arquivo.type)) throw new ApiError('Escolha uma imagem JPG, PNG, GIF ou WebP.', 400);
  if (arquivo.size > LIMITE_FOTO) throw new ApiError('A imagem deve ter no máximo 5 MB.', 413);
  return (await http<{ foto: string }>('POST', '/fotos', arquivo)).foto;
}
