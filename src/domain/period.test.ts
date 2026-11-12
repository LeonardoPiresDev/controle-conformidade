import { describe, it, expect } from 'vitest';
import { periodoAnterior, periodoComparacao, atalhos, dentro } from './period';

describe('periodoAnterior', () => {
  it('mesma duração terminando no dia anterior', () => {
    expect(periodoAnterior({ inicio: '2026-01-01', fim: '2026-01-31' })).toEqual({ inicio: '2025-12-01', fim: '2025-12-31' });
  });
  it('um único dia', () => {
    expect(periodoAnterior({ inicio: '2026-03-01', fim: '2026-03-01' })).toEqual({ inicio: '2026-02-28', fim: '2026-02-28' });
  });
});

describe('atalhos', () => {
  it('mês atual, anterior e ano a partir de hoje', () => {
    const a = atalhos('2026-11-12');
    expect(a.mesAtual).toEqual({ inicio: '2026-11-01', fim: '2026-11-30' });
    expect(a.mesAnterior).toEqual({ inicio: '2026-10-01', fim: '2026-10-31' });
    expect(a.anoAtual).toEqual({ inicio: '2026-01-01', fim: '2026-12-31' });
    expect(a.tudo).toBeNull();
  });
  it('mês anterior em janeiro é dezembro do ano passado', () => {
    expect(atalhos('2026-01-15').mesAnterior).toEqual({ inicio: '2025-12-01', fim: '2025-12-31' });
  });
});

describe('dentro', () => {
  it('inclusivo nas bordas e null aceita tudo', () => {
    const p = { inicio: '2026-01-01', fim: '2026-01-31' };
    expect(dentro('2026-01-01', p)).toBe(true);
    expect(dentro('2026-01-31', p)).toBe(true);
    expect(dentro('2026-02-01', p)).toBe(false);
    expect(dentro('2020-01-01', null)).toBe(true);
  });
});

describe('periodoComparacao', () => {
  it('mês corrente incompleto compara com o mesmo trecho do mês anterior', () => {
    expect(periodoComparacao({ inicio: '2026-11-01', fim: '2026-11-30' }, '2026-11-12')).toEqual({ atual: { inicio: '2026-11-01', fim: '2026-11-12' }, anterior: { inicio: '2026-10-01', fim: '2026-10-12' } });
  });
  it('mês fechado compara com o mês anterior inteiro (março × fevereiro)', () => {
    expect(periodoComparacao({ inicio: '2026-03-01', fim: '2026-03-31' }, '2026-11-12')).toEqual({ atual: { inicio: '2026-03-01', fim: '2026-03-31' }, anterior: { inicio: '2026-02-01', fim: '2026-02-28' } });
  });
  it('ano corrente compara com o mesmo trecho do ano anterior', () => {
    expect(periodoComparacao({ inicio: '2026-01-01', fim: '2026-12-31' }, '2026-11-12')).toEqual({ atual: { inicio: '2026-01-01', fim: '2026-11-12' }, anterior: { inicio: '2025-01-01', fim: '2025-11-12' } });
  });
  it('intervalo livre usa mesma duração terminando na véspera', () => {
    expect(periodoComparacao({ inicio: '2026-11-05', fim: '2026-11-12' }, '2026-11-12')).toEqual({ atual: { inicio: '2026-11-05', fim: '2026-11-12' }, anterior: { inicio: '2026-10-28', fim: '2026-11-04' } });
  });
});
