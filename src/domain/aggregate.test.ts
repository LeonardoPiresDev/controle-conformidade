import { describe, it, expect } from 'vitest';
import { enrichErro, enrichSolicitacao } from './calc';
import {
  FILTROS_VAZIOS,
  filtrarErros,
  filtrarSolicitacoes,
  somaQtde,
  contagem,
  mediana,
  porChave,
  evolucaoMensal,
  medianaDiasPorSetor,
  variacaoPercentual,
} from './aggregate';

const E = (p: Parameters<typeof enrichErro>[0]) =>
  enrichErro({ codEmp: 20, empresa: 'UMAFLEX/SP', tipoAnalise: 'LANÇAMENTOS EM CENTRO DE CUSTO', usuario: 'A (FISCAL)', setor: 'FISCAL', categoria: 'ERRO NO ITEM', erroDetalhado: 'x', qtde: 1, ...p });
const S = (p: Parameters<typeof enrichSolicitacao>[0]) =>
  enrichSolicitacao({ codEmp: 1, empresa: 'ORYON/PR MATRIZ', setor: 'FISCAL', solicitante: 'J (FISCAL)', motivo: 'm', ...p });

const erros = [
  E({ dataMov: '2026-01-10', setor: 'FISCAL', qtde: 2 }),
  E({ dataMov: '2026-01-20', setor: 'COMPRAS', usuario: 'B (COMPRAS)', categoria: 'ERRO NO CENTRO DE CUSTO', qtde: 1 }),
  E({ dataMov: '2025-12-05', setor: 'FISCAL', qtde: 1, codEmp: 1, empresa: 'ORYON/PR MATRIZ' }),
  E({ dataMov: '2026-02-01', setor: 'FISCAL', qtde: 3, tipoAnalise: 'VARIAÇÃO DE CUSTO' }),
];

describe('filtrarErros', () => {
  it('filtra por período inclusivo', () => {
    const r = filtrarErros(erros, { ...FILTROS_VAZIOS, periodo: { inicio: '2026-01-01', fim: '2026-01-31' } });
    expect(r).toHaveLength(2);
  });
  it('filtra por setor, empresa, usuário, tipo e categoria', () => {
    expect(filtrarErros(erros, { ...FILTROS_VAZIOS, setores: ['COMPRAS'] })).toHaveLength(1);
    expect(filtrarErros(erros, { ...FILTROS_VAZIOS, codEmp: [1] })).toHaveLength(1);
    expect(filtrarErros(erros, { ...FILTROS_VAZIOS, usuarios: ['B (COMPRAS)'] })).toHaveLength(1);
    expect(filtrarErros(erros, { ...FILTROS_VAZIOS, tiposAnalise: ['VARIAÇÃO DE CUSTO'] })).toHaveLength(1);
    expect(filtrarErros(erros, { ...FILTROS_VAZIOS, categorias: ['ERRO NO CENTRO DE CUSTO'] })).toHaveLength(1);
  });
});

describe('filtrarSolicitacoes', () => {
  it('usuarios filtra solicitante e ignora tipo/categoria', () => {
    const sols = [S({ dataMov: '2026-01-10', dataSolicitacao: '2026-01-13' }), S({ dataMov: '2026-01-11', dataSolicitacao: '2026-01-21', solicitante: 'K (FISCAL)' })];
    expect(filtrarSolicitacoes(sols, { ...FILTROS_VAZIOS, usuarios: ['K (FISCAL)'] })).toHaveLength(1);
    expect(filtrarSolicitacoes(sols, { ...FILTROS_VAZIOS, categorias: ['QUALQUER'] })).toHaveLength(2);
  });
});

describe('agregações básicas', () => {
  it('somaQtde e contagem', () => {
    expect(somaQtde(erros)).toBe(7);
    expect(contagem(erros)).toBe(4);
  });
  it('mediana ímpar, par e vazia', () => {
    expect(mediana([3, 10, 4])).toBe(4);
    expect(mediana([3, 10])).toBe(6.5);
    expect(mediana([])).toBe(0);
  });
  it('porChave soma qtde por setor ordenado desc', () => {
    expect(porChave(erros, 'setor', 'qtde')).toEqual([
      { nome: 'FISCAL', valor: 6 },
      { nome: 'COMPRAS', valor: 1 },
    ]);
    expect(porChave(erros, 'setor', 'count')[0]).toEqual({ nome: 'FISCAL', valor: 3 });
  });
  it('evolucaoMensal ordena cronologicamente', () => {
    expect(evolucaoMensal(erros, 'qtde').map((x) => x.mes)).toEqual(['12/2025', '01/2026', '02/2026']);
    expect(evolucaoMensal(erros, 'qtde')[1].valor).toBe(3);
  });
  it('medianaDiasPorSetor', () => {
    const sols = [
      S({ dataMov: '2026-01-10', dataSolicitacao: '2026-01-13' }),
      S({ dataMov: '2026-01-10', dataSolicitacao: '2026-01-20' }),
      S({ dataMov: '2026-01-10', dataSolicitacao: '2026-01-14', setor: 'PCP' }),
    ];
    expect(medianaDiasPorSetor(sols)).toEqual([
      { nome: 'FISCAL', valor: 6.5 },
      { nome: 'PCP', valor: 4 },
    ]);
  });
  it('variacaoPercentual', () => {
    expect(variacaoPercentual(120, 100)).toBe(20);
    expect(variacaoPercentual(5, 0)).toBeNull();
    expect(variacaoPercentual(50, 100)).toBe(-50);
  });
});
