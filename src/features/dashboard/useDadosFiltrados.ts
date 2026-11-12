import { useMemo } from 'react';
import type { Erro, Solicitacao } from '../../domain/types';
import {
  contagem,
  evolucaoMensal,
  filtrarErros,
  filtrarSolicitacoes,
  mediana,
  medianaDiasPorSetor,
  porChave,
  somaQtde,
  variacaoPercentual,
  type Filtros,
  type Ponto,
} from '../../domain/aggregate';
import { hojeIso, periodoComparacao, type Periodo } from '../../domain/period';
import { useAppStore } from '../../store/useAppStore';

export interface Cards {
  totalOcorrencias: number;
  qtdeErros: number;
  /** % vs. período anterior equivalente; null sem período ou sem base */
  variacao: number | null;
  ocorrenciasAnterior: number | null;
  /** janela usada na comparação (null sem período) */
  periodoAnterior: Periodo | null;
  totalSolicitacoes: number;
  medianaDias: number;
}

export interface DadosDashboard {
  errosFiltrados: Erro[];
  solFiltradas: Solicitacao[];
  cards: Cards;
  causas: Ponto[];
  rankingUsuario: Ponto[];
  rankingSetor: Ponto[];
  evolucaoErros: { mes: string; valor: number }[];
  solPorSetor: Ponto[];
  evolucaoSol: { mes: string; valor: number }[];
  medianaPorSetor: Ponto[];
}

export function calcularDados(erros: Erro[], solicitacoes: Solicitacao[], filtros: Filtros, hoje = hojeIso()): DadosDashboard {
  const errosFiltrados = filtrarErros(erros, filtros);
  const solFiltradas = filtrarSolicitacoes(solicitacoes, filtros);

  let variacao: number | null = null;
  let ocorrenciasAnterior: number | null = null;
  let periodoAnterior: Periodo | null = null;
  if (filtros.periodo) {
    const { atual, anterior } = periodoComparacao(filtros.periodo, hoje);
    periodoAnterior = anterior;
    ocorrenciasAnterior = contagem(filtrarErros(erros, { ...filtros, periodo: anterior }));
    variacao = variacaoPercentual(contagem(filtrarErros(erros, { ...filtros, periodo: atual })), ocorrenciasAnterior);
  }

  return {
    errosFiltrados,
    solFiltradas,
    cards: {
      totalOcorrencias: contagem(errosFiltrados),
      qtdeErros: somaQtde(errosFiltrados),
      variacao,
      ocorrenciasAnterior,
      periodoAnterior,
      totalSolicitacoes: contagem(solFiltradas),
      medianaDias: mediana(solFiltradas.map((s) => s.diasParaIdentificar)),
    },
    causas: porChave(errosFiltrados, 'categoria', 'qtde'),
    rankingUsuario: porChave(errosFiltrados, 'usuario', 'qtde'),
    rankingSetor: porChave(errosFiltrados, 'setor', 'qtde'),
    evolucaoErros: evolucaoMensal(errosFiltrados, 'qtde'),
    solPorSetor: porChave(solFiltradas, 'setor', 'count'),
    evolucaoSol: evolucaoMensal(solFiltradas, 'count'),
    medianaPorSetor: medianaDiasPorSetor(solFiltradas),
  };
}

export function useDadosFiltrados(): DadosDashboard {
  const erros = useAppStore((s) => s.erros);
  const solicitacoes = useAppStore((s) => s.solicitacoes);
  const filtros = useAppStore((s) => s.filtros);
  return useMemo(() => calcularDados(erros, solicitacoes, filtros), [erros, solicitacoes, filtros]);
}
