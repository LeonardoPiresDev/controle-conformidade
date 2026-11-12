import { useState } from 'react';
import clsx from 'clsx';
import { Card } from '../../components/ui';
import { FormErro } from './FormErro';
import { FormSolicitacao } from './FormSolicitacao';
import { useAppStore } from '../../store/useAppStore';
import { formatDateBR } from '../../domain/calc';

type Aba = 'erro' | 'solicitacao';

export default function LancarPage() {
  const [aba, setAba] = useState<Aba>('erro');
  const erros = useAppStore((s) => s.erros);
  const solicitacoes = useAppStore((s) => s.solicitacoes);

  const recentes = (aba === 'erro' ? erros : solicitacoes)
    .slice()
    .sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm))
    .slice(0, 6);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <Card
        titulo={
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1" role="tablist">
            {(
              [
                ['erro', 'Erro / inconsistência'],
                ['solicitacao', 'Solicitação de abertura de período'],
              ] as const
            ).map(([k, t]) => (
              <button key={k} role="tab" aria-selected={aba === k} className={clsx('rounded-md px-3 py-1.5 text-sm font-semibold transition', aba === k ? 'bg-white text-brand-primary shadow' : 'text-slate-500 hover:text-slate-700')} onClick={() => setAba(k)}>
                {t}
              </button>
            ))}
          </div>
        }
      >
        {aba === 'erro' ? <FormErro key="erro" /> : <FormSolicitacao key="sol" />}
      </Card>

      <Card titulo="Últimos lançamentos">
        {recentes.length === 0 && <p className="text-sm text-slate-500">Nenhum lançamento ainda.</p>}
        <ul className="divide-y divide-slate-100 text-sm">
          {recentes.map((r) => (
            <li key={r.id} className="py-2">
              <div className="flex justify-between gap-2">
                <span className="font-semibold text-brand-primary">{'usuario' in r ? r.usuario : r.solicitante}</span>
                <span className="text-xs text-slate-500">{formatDateBR(r.dataMov)}</span>
              </div>
              <div className="truncate text-slate-600">{'categoria' in r ? r.categoria : r.motivo}</div>
              <div className="text-xs text-slate-400">
                {r.empresa} · {r.docRef || 'sem doc.'}
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
