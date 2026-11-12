export interface Periodo {
  /** ISO YYYY-MM-DD inclusivo */
  inicio: string;
  /** ISO YYYY-MM-DD inclusivo */
  fim: string;
}

function toUTC(iso: string): number {
  return Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
}

function fromUTC(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

const DIA = 86400000;

export function addDias(iso: string, n: number): string {
  return fromUTC(toUTC(iso) + n * DIA);
}

export function periodoAnterior(p: Periodo): Periodo {
  const dur = Math.round((toUTC(p.fim) - toUTC(p.inicio)) / DIA) + 1;
  const fim = addDias(p.inicio, -1);
  const inicio = addDias(fim, -(dur - 1));
  return { inicio, fim };
}

function mes(y: number, m: number): Periodo {
  const inicio = fromUTC(Date.UTC(y, m, 1));
  const fim = fromUTC(Date.UTC(y, m + 1, 0));
  return { inicio, fim };
}

export function atalhos(hojeIso: string): { mesAtual: Periodo; mesAnterior: Periodo; anoAtual: Periodo; tudo: null } {
  const y = +hojeIso.slice(0, 4);
  const m = +hojeIso.slice(5, 7) - 1;
  return {
    mesAtual: mes(y, m),
    mesAnterior: mes(y, m - 1),
    anoAtual: { inicio: `${y}-01-01`, fim: `${y}-12-31` },
    tudo: null,
  };
}

function ultimoDiaDoMes(iso: string): string {
  return fromUTC(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7), 0));
}

function addMeses(iso: string, n: number): string {
  return fromUTC(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1 + n, +iso.slice(8, 10)));
}

/**
 * Janela de comparação para a variação %.
 * - `atual` é o período recortado até `hoje` (dias futuros não contam).
 * - Período alinhado a meses inteiros → compara com os N meses anteriores; se o mês corrente
 *   ainda não fechou, compara o mesmo trecho (dia 1 → mesmo dia) do mês equivalente anterior.
 * - Qualquer outro intervalo → mesma duração terminando na véspera do início.
 */
export function periodoComparacao(p: Periodo, hoje: string): { atual: Periodo; anterior: Periodo } {
  const recortado = p.fim > hoje && p.inicio <= hoje;
  const atual: Periodo = { inicio: p.inicio, fim: recortado ? hoje : p.fim };
  const alinhado = p.inicio.endsWith('-01') && p.fim === ultimoDiaDoMes(p.fim);
  if (alinhado) {
    const meses = (+p.fim.slice(0, 4) - +p.inicio.slice(0, 4)) * 12 + (+p.fim.slice(5, 7) - +p.inicio.slice(5, 7)) + 1;
    const inicio = addMeses(p.inicio, -meses);
    const dias = Math.round((toUTC(atual.fim) - toUTC(atual.inicio)) / DIA) + 1;
    const fim = recortado ? addDias(inicio, dias - 1) : addDias(p.inicio, -1);
    return { atual, anterior: { inicio, fim } };
  }
  return { atual, anterior: periodoAnterior(atual) };
}

export function dentro(iso: string, p: Periodo | null): boolean {
  if (!p) return true;
  return iso >= p.inicio && iso <= p.fim;
}

export function hojeIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
