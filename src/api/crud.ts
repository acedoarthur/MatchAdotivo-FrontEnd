import { http } from './http';
import type { Linha } from '../recursos';

export const listar = (rota: string) => http<Linha[]>('GET', `/${rota}`);
export const buscar = (rota: string, id: number) => http<Linha>('GET', `/${rota}/${id}`);
export const criar = (rota: string, dados: Linha) => http<Linha>('POST', `/${rota}`, dados);
export const atualizar = (rota: string, id: number, dados: Linha) => http<Linha>('PUT', `/${rota}/${id}`, dados);
export const remover = (rota: string, id: number) => http<void>('DELETE', `/${rota}/${id}`);
