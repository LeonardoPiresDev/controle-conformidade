/**
 * Paleta categórica validada (scripts/validate_palette.js — light, 8 slots, ALL CHECKS PASS).
 * Slot 1 = azul de destaque da marca. Hues atribuídos em ordem fixa, nunca ciclados:
 * a partir do 9º valor as fatias são agrupadas em "OUTROS".
 */
export const CATEGORICAS = ['#2F8BD8', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'] as const;
export const COR_OUTROS = '#94a3b8';
export const MAX_SERIES = CATEGORICAS.length;

/** Cor por posição fixa na lista de entidades (entidade → cor estável enquanto a lista não muda de ordem). */
export function corPorIndice(i: number): string {
  return i < MAX_SERIES ? CATEGORICAS[i] : COR_OUTROS;
}

export const COR_PRIMARIA = 'var(--brand-primary)';
export const COR_ACENTO = 'var(--brand-accent)';
export const GRID = '#e2e8f0';
export const TEXTO_SEC = '#64748b';

/** Agrupa além de MAX_SERIES em "OUTROS" (mantém ordem). */
export function agruparOutros<T extends { nome: string; valor: number }>(pontos: T[], max = MAX_SERIES): { nome: string; valor: number }[] {
  if (pontos.length <= max) return pontos;
  const cabeca = pontos.slice(0, max - 1);
  const resto = pontos.slice(max - 1).reduce((s, p) => s + p.valor, 0);
  return [...cabeca, { nome: 'OUTROS', valor: resto }];
}
