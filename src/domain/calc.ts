import type { Erro, Solicitacao } from './types';

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})/;
const BR_RE = /^\s*(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2}|\d{4})\s*$/;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function isoFromParts(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** Converte qualquer representação razoável de data em ISO YYYY-MM-DD, ou null. */
export function parseDateBR(input: string | number | Date | null | undefined): string | null {
  if (input == null) return null;
  if (input instanceof Date) {
    if (isNaN(input.getTime())) return null;
    return `${input.getFullYear()}-${pad(input.getMonth() + 1)}-${pad(input.getDate())}`;
  }
  if (typeof input === 'number') {
    if (!isFinite(input) || input < 1) return null;
    const ms = Math.round((input - 25569) * 86400000);
    const dt = new Date(ms);
    return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
  }
  const s = String(input).trim();
  if (!s) return null;
  const iso = ISO_RE.exec(s);
  if (iso) return isoFromParts(+iso[1], +iso[2], +iso[3]);
  const br = BR_RE.exec(s);
  if (br) {
    let y = +br[3];
    if (br[3].length === 2) y += 2000;
    return isoFromParts(y, +br[2], +br[1]);
  }
  return null;
}

export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return '';
  const m = ISO_RE.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export function mesCompetencia(iso: string): string {
  const m = ISO_RE.exec(iso);
  if (!m) return '';
  return `${m[2]}/${m[1]}`;
}

/** Chave ordenável AAAA-MM a partir de MM/AAAA. */
export function chaveMes(mesComp: string): string {
  const [m, y] = mesComp.split('/');
  return `${y}-${m}`;
}

export function diasEntre(isoInicio: string, isoFim: string): number {
  const a = Date.UTC(+isoInicio.slice(0, 4), +isoInicio.slice(5, 7) - 1, +isoInicio.slice(8, 10));
  const b = Date.UTC(+isoFim.slice(0, 4), +isoFim.slice(5, 7) - 1, +isoFim.slice(8, 10));
  return Math.round((b - a) / 86400000);
}

export function normalizeText(s: string | null | undefined): string {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function agora(): string {
  return new Date().toISOString();
}

export function enrichErro(p: Partial<Erro>): Erro {
  const dataMov = p.dataMov ?? '';
  const now = agora();
  return {
    id: p.id ?? uuid(),
    codEmp: Number(p.codEmp ?? 0),
    empresa: (p.empresa ?? '').trim(),
    dataMov,
    mesCompetencia: mesCompetencia(dataMov),
    docRef: (p.docRef ?? '').trim(),
    setor: (p.setor ?? '').trim(),
    tipoAnalise: (p.tipoAnalise ?? '').trim(),
    qtde: Number(p.qtde ?? 1),
    usuario: (p.usuario ?? '').trim(),
    erroDetalhado: (p.erroDetalhado ?? '').trim(),
    categoria: (p.categoria ?? '').trim(),
    obs: (p.obs ?? '').trim(),
    criadoEm: p.criadoEm ?? now,
    atualizadoEm: now,
    origem: p.origem ?? 'manual',
  };
}

export function enrichSolicitacao(p: Partial<Solicitacao>): Solicitacao {
  const dataMov = p.dataMov ?? '';
  const dataSolicitacao = p.dataSolicitacao ?? '';
  const now = agora();
  return {
    id: p.id ?? uuid(),
    codEmp: Number(p.codEmp ?? 0),
    empresa: (p.empresa ?? '').trim(),
    dataMov,
    dataSolicitacao,
    mesCompetencia: mesCompetencia(dataMov),
    diasParaIdentificar: dataMov && dataSolicitacao ? diasEntre(dataMov, dataSolicitacao) : 0,
    docRef: (p.docRef ?? '').trim(),
    setor: (p.setor ?? '').trim(),
    qtde: Number(p.qtde ?? 1),
    solicitante: (p.solicitante ?? '').trim(),
    motivo: (p.motivo ?? '').trim(),
    criadoEm: p.criadoEm ?? now,
    atualizadoEm: now,
    origem: p.origem ?? 'manual',
  };
}
