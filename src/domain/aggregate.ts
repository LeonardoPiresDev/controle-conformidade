import type { Erro, Solicitacao, RegistroBase } from './types';
import { dentro, type Periodo } from './period';
import { chaveMes } from './calc';

export interface Filtros {
  periodo: Periodo | null;
  codEmp: number[];
  setores: string[];
  usuarios: string[];
  tiposAnalise: string[];
  categorias: string[];
}

export const FILTROS_VAZIOS: Filtros = {
  periodo: null,
  codEmp: [],
  setores: [],
  usuarios: [],
  tiposAnalise: [],
  categorias: [],
};

export interface Ponto {
  nome: string;
  valor: number;
}

export type Medida = 'qtde' | 'count';

function baseOk(r: RegistroBase, f: Filtros): boolean {
  if (!dentro(r.dataMov, f.periodo)) return false;
  if (f.codEmp.length && !f.codEmp.includes(r.codEmp)) return false;
  if (f.setores.length && !f.setores.includes(r.setor)) return false;
  return true;
}

export function filtrarErros(rows: Erro[], f: Filtros): Erro[] {
  return rows.filter(
    (r) =>
      baseOk(r, f) &&
      (!f.usuarios.length || f.usuarios.includes(r.usuario)) &&
      (!f.tiposAnalise.length || f.tiposAnalise.includes(r.tipoAnalise)) &&
      (!f.categorias.length || f.categorias.includes(r.categoria)),
  );
}

export function filtrarSolicitacoes(rows: Solicitacao[], f: Filtros): Solicitacao[] {
  return rows.filter((r) => baseOk(r, f) && (!f.usuarios.length || f.usuarios.includes(r.solicitante)));
}

export function somaQtde(rows: RegistroBase[]): number {
  return rows.reduce((s, r) => s + (Number(r.qtde) || 0), 0);
}

export function contagem(rows: RegistroBase[]): number {
  return rows.length;
}

export function mediana(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function medir(r: RegistroBase, m: Medida): number {
  return m === 'qtde' ? Number(r.qtde) || 0 : 1;
}

export function porChave<T extends RegistroBase>(rows: T[], key: keyof T, medida: Medida): Ponto[] {
  const acc = new Map<string, number>();
  for (const r of rows) {
    const k = String(r[key] ?? '');
    acc.set(k, (acc.get(k) ?? 0) + medir(r, medida));
  }
  return [...acc.entries()]
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor || a.nome.localeCompare(b.nome));
}

export function evolucaoMensal(rows: RegistroBase[], medida: Medida): { mes: string; valor: number }[] {
  const acc = new Map<string, number>();
  for (const r of rows) acc.set(r.mesCompetencia, (acc.get(r.mesCompetencia) ?? 0) + medir(r, medida));
  return [...acc.entries()]
    .map(([mes, valor]) => ({ mes, valor }))
    .sort((a, b) => chaveMes(a.mes).localeCompare(chaveMes(b.mes)));
}

export function medianaDiasPorSetor(rows: Solicitacao[]): Ponto[] {
  const acc = new Map<string, number[]>();
  for (const r of rows) {
    const arr = acc.get(r.setor) ?? [];
    arr.push(r.diasParaIdentificar);
    acc.set(r.setor, arr);
  }
  return [...acc.entries()]
    .map(([nome, dias]) => ({ nome, valor: mediana(dias) }))
    .sort((a, b) => b.valor - a.valor || a.nome.localeCompare(b.nome));
}

export function variacaoPercentual(atual: number, anterior: number): number | null {
  if (!anterior) return null;
  return Math.round(((atual - anterior) / anterior) * 1000) / 10;
}
