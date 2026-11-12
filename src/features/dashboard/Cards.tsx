import clsx from 'clsx';
import type { Cards as CardsT } from './useDadosFiltrados';
import { formatDateBR } from '../../domain/calc';

const dm = (iso: string) => formatDateBR(iso).slice(0, 5);

const fmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function Card({ rotulo, valor, detalhe, tom }: { rotulo: string; valor: string; detalhe?: string; tom?: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="card flex flex-col gap-1 px-5 py-4">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{rotulo}</span>
      <span className={clsx('text-3xl font-bold leading-none', tom === 'up' ? 'text-red-600' : tom === 'down' ? 'text-emerald-600' : 'text-brand-primary')}>{valor}</span>
      {detalhe && <span className="text-xs text-slate-500">{detalhe}</span>}
    </div>
  );
}

export function Cards({ cards, temPeriodo }: { cards: CardsT; temPeriodo: boolean }) {
  const v = cards.variacao;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Card rotulo="Ocorrências" valor={fmt.format(cards.totalOcorrencias)} detalhe="registros de erro" />
      <Card rotulo="Qtde de erros" valor={fmt.format(cards.qtdeErros)} detalhe="soma da coluna Qtde" />
      <Card
        rotulo="Variação"
        valor={v == null ? '—' : `${v > 0 ? '+' : ''}${fmt.format(v)}%`}
        detalhe={
          !temPeriodo
            ? 'selecione um período'
            : !cards.ocorrenciasAnterior || !cards.periodoAnterior
              ? 'sem base no período anterior'
              : `vs. ${fmt.format(cards.ocorrenciasAnterior)} em ${dm(cards.periodoAnterior.inicio)}–${dm(cards.periodoAnterior.fim)}`
        }
        tom={v == null ? 'neutral' : v > 0 ? 'up' : v < 0 ? 'down' : 'neutral'}
      />
      <Card rotulo="Solicitações" valor={fmt.format(cards.totalSolicitacoes)} detalhe="aberturas de período" />
      <Card rotulo="Mediana de dias" valor={cards.totalSolicitacoes ? fmt.format(cards.medianaDias) : '—'} detalhe="para identificar o erro" />
    </div>
  );
}
