import { useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useAppStore } from '../../store/useAppStore';
import { EmptyState } from '../../components/ui';
import { useDadosFiltrados } from './useDadosFiltrados';
import { FiltrosGlobais } from './FiltrosGlobais';
import { Cards } from './Cards';
import { AbaErrosSetor, AbaErrosUsuario, AbaSolicitacoes } from './Abas';
import { BotoesExportar } from './BotoesExportar';

type Aba = 'usuario' | 'setor' | 'solicitacoes';
const ABAS: { k: Aba; t: string }[] = [
  { k: 'usuario', t: 'Erros por Usuário' },
  { k: 'setor', t: 'Erros por Setor' },
  { k: 'solicitacoes', t: 'Solicitações de Abertura de Período' },
];

export default function DashboardPage() {
  const erros = useAppStore((s) => s.erros);
  const solicitacoes = useAppStore((s) => s.solicitacoes);
  const filtros = useAppStore((s) => s.filtros);
  const d = useDadosFiltrados();
  const [aba, setAba] = useState<Aba>('usuario');

  if (!erros.length && !solicitacoes.length) {
    return (
      <div className="card">
        <EmptyState
          titulo="Bem-vindo ao Controle de Conformidade"
          descricao="Ainda não há ocorrências. Importe a planilha Indicador.xlsx atual para começar com o histórico, ou lance a primeira ocorrência manualmente."
          acao={
            <div className="flex gap-2">
              <Link to="/importar" className="btn-primary">
                Importar Indicador.xlsx
              </Link>
              <Link to="/lancar" className="btn-ghost">
                Lançar ocorrência
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <FiltrosGlobais />
      <Cards cards={d.cards} temPeriodo={!!filtros.periodo} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-white p-1 shadow-card" role="tablist">
          {ABAS.map((a) => (
            <button key={a.k} role="tab" aria-selected={aba === a.k} className={clsx('rounded-md px-3 py-1.5 text-sm font-semibold transition', aba === a.k ? 'bg-brand-primary text-white' : 'text-slate-600 hover:bg-slate-50')} onClick={() => setAba(a.k)}>
              {a.t}
            </button>
          ))}
        </div>
        <BotoesExportar dados={d} />
      </div>
      {aba === 'usuario' && <AbaErrosUsuario d={d} />}
      {aba === 'setor' && <AbaErrosSetor d={d} />}
      {aba === 'solicitacoes' && <AbaSolicitacoes d={d} />}
    </div>
  );
}
