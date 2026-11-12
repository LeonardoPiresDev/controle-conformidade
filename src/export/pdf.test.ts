import { describe, it, expect } from 'vitest';
import { montarDadosRelatorio } from './pdf';
import { enrichErro, enrichSolicitacao } from '../domain/calc';
import { FILTROS_VAZIOS } from '../domain/aggregate';
import { DEFAULT_CONFIG } from '../data/seed';

const E = (p: Parameters<typeof enrichErro>[0]) =>
  enrichErro({ codEmp: 20, empresa: 'UMAFLEX/SP', tipoAnalise: 'X', usuario: 'A (FISCAL)', setor: 'FISCAL', categoria: 'ERRO NO ITEM', erroDetalhado: 'x', qtde: 1, dataMov: '2026-01-10', ...p });

const erros = [
  E({ qtde: 2 }),
  E({ setor: 'COMPRAS', usuario: 'B (COMPRAS)', categoria: 'ERRO NO CENTRO DE CUSTO' }),
  E({ setor: 'COMPRAS', usuario: 'B (COMPRAS)', categoria: 'ERRO NO ITEM', qtde: 3 }),
  ...Array.from({ length: 11 }, (_, i) => E({ usuario: `U${i} (FISCAL)` })),
];
const sols = [enrichSolicitacao({ codEmp: 1, empresa: 'ORYON/PR MATRIZ', dataMov: '2026-01-10', dataSolicitacao: '2026-01-13', setor: 'FISCAL', solicitante: 'J (FISCAL)', motivo: 'm' })];

describe('montarDadosRelatorio', () => {
  const d = montarDadosRelatorio(erros, sols, { ...FILTROS_VAZIOS, periodo: { inicio: '2026-01-01', fim: '2026-01-31' } }, DEFAULT_CONFIG);

  it('cabeçalho com título, período e emissão', () => {
    expect(d.titulo).toBe('Controle de Conformidade');
    expect(d.periodoTexto).toBe('01/01/2026 a 31/01/2026');
    expect(d.emitidoEm).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
  });

  it('tabela Setor × Categoria com totais de linha e coluna', () => {
    expect(d.matriz.categorias).toEqual(['ERRO NO ITEM', 'ERRO NO CENTRO DE CUSTO']);
    const fiscal = d.matriz.linhas.find((l) => l.setor === 'FISCAL')!;
    expect(fiscal.valores).toEqual([13, 0]);
    expect(fiscal.total).toBe(13);
    const compras = d.matriz.linhas.find((l) => l.setor === 'COMPRAS')!;
    expect(compras.valores).toEqual([3, 1]);
    expect(d.matriz.totaisColuna).toEqual([16, 1]);
    expect(d.matriz.totalGeral).toBe(17);
  });

  it('top 10 usuários ordenado desc', () => {
    expect(d.topUsuarios).toHaveLength(10);
    expect(d.topUsuarios[0]).toEqual({ nome: 'B (COMPRAS)', valor: 4 });
    expect(d.topUsuarios[1]).toEqual({ nome: 'A (FISCAL)', valor: 2 });
  });

  it('cards e séries vêm do mesmo cálculo do dashboard', () => {
    expect(d.cards.totalOcorrencias).toBe(14);
    expect(d.cards.medianaDias).toBe(3);
    expect(d.medianaPorSetor).toEqual([{ nome: 'FISCAL', valor: 3 }]);
  });
});
