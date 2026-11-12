import { describe, it, expect } from 'vitest';
import { calcularDados } from './useDadosFiltrados';
import { enrichErro, enrichSolicitacao } from '../../domain/calc';
import { FILTROS_VAZIOS } from '../../domain/aggregate';

const E = (p: Parameters<typeof enrichErro>[0]) =>
  enrichErro({ codEmp: 20, empresa: 'UMAFLEX/SP', tipoAnalise: 'LANÇAMENTOS EM CENTRO DE CUSTO', usuario: 'A (FISCAL)', setor: 'FISCAL', categoria: 'ERRO NO ITEM', erroDetalhado: 'x', qtde: 1, ...p });
const S = (p: Parameters<typeof enrichSolicitacao>[0]) =>
  enrichSolicitacao({ codEmp: 1, empresa: 'ORYON/PR MATRIZ', setor: 'FISCAL', solicitante: 'J (FISCAL)', motivo: 'm', ...p });

const erros = [
  E({ dataMov: '2026-01-05', qtde: 2 }),
  E({ dataMov: '2026-01-15', setor: 'COMPRAS', usuario: 'B (COMPRAS)', categoria: 'ERRO NO CENTRO DE CUSTO' }),
  E({ dataMov: '2026-01-25' }),
  E({ dataMov: '2025-12-20' }),
];
const sols = [S({ dataMov: '2026-01-10', dataSolicitacao: '2026-01-13' }), S({ dataMov: '2026-01-11', dataSolicitacao: '2026-01-21', setor: 'PCP' })];

describe('calcularDados', () => {
  it('cards para janeiro com variação vs dezembro', () => {
    const d = calcularDados(erros, sols, { ...FILTROS_VAZIOS, periodo: { inicio: '2026-01-01', fim: '2026-01-31' } });
    expect(d.cards.totalOcorrencias).toBe(3);
    expect(d.cards.qtdeErros).toBe(4);
    expect(d.cards.variacao).toBe(200);
    expect(d.cards.medianaDias).toBe(6.5);
    expect(d.cards.totalSolicitacoes).toBe(2);
  });

  it('sem período a variação é null', () => {
    const d = calcularDados(erros, sols, FILTROS_VAZIOS);
    expect(d.cards.variacao).toBeNull();
    expect(d.cards.totalOcorrencias).toBe(4);
  });

  it('filtro por setor reduz rankings e séries', () => {
    const d = calcularDados(erros, sols, { ...FILTROS_VAZIOS, setores: ['FISCAL'] });
    expect(d.rankingSetor).toEqual([{ nome: 'FISCAL', valor: 4 }]);
    expect(d.rankingUsuario[0].nome).toBe('A (FISCAL)');
    expect(d.causas.map((c) => c.nome)).toEqual(['ERRO NO ITEM']);
    expect(d.evolucaoErros.map((e) => e.mes)).toEqual(['12/2025', '01/2026']);
    expect(d.solPorSetor).toEqual([{ nome: 'FISCAL', valor: 1 }]);
    expect(d.medianaPorSetor).toEqual([{ nome: 'FISCAL', valor: 3 }]);
  });
});
