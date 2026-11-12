import { useState } from 'react';
import clsx from 'clsx';
import type { LinhaImportada } from '../../import/validateRows';
import type { Deteccao } from '../../import/detect';
import { Badge } from '../../components/ui';
import { formatDateBR } from '../../domain/calc';
import type { Erro, Solicitacao } from '../../domain/types';

const POR_PAGINA = 20;

function resumoRegistro(r: Erro | Solicitacao | null): string {
  if (!r) return '';
  if ('solicitante' in r) return `${r.solicitante} · ${r.motivo}`;
  return `${r.usuario} · ${r.categoria}`;
}

export function PreviewImportacao({ nome, det, linhas }: { nome: string; det: Deteccao; linhas: LinhaImportada[] }) {
  const [filtro, setFiltro] = useState<'todas' | 'ok' | 'aviso' | 'erro' | 'duplicado'>('todas');
  const [pagina, setPagina] = useState(1);

  const cont = {
    ok: linhas.filter((l) => l.status === 'ok' && !l.duplicado).length,
    aviso: linhas.filter((l) => l.status === 'aviso' && !l.duplicado).length,
    erro: linhas.filter((l) => l.status === 'erro').length,
    duplicado: linhas.filter((l) => l.duplicado).length,
  };

  const visiveis = linhas.filter((l) => {
    if (filtro === 'todas') return true;
    if (filtro === 'duplicado') return !!l.duplicado;
    return l.status === filtro && !l.duplicado;
  });
  const totalPag = Math.max(1, Math.ceil(visiveis.length / POR_PAGINA));
  const pag = Math.min(pagina, totalPag);
  const pageRows = visiveis.slice((pag - 1) * POR_PAGINA, pag * POR_PAGINA);

  const chip = (k: typeof filtro, rotulo: string, n: number, tom: string) => (
    <button key={k} className={clsx('rounded-full px-3 py-1 text-xs font-semibold ring-1 transition', filtro === k ? `${tom} ring-transparent` : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50')} onClick={() => { setFiltro(k); setPagina(1); }}>
      {rotulo}: {n}
    </button>
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="mr-2 text-sm font-semibold text-brand-primary">
          {nome} <Badge tom="blue">{det.tipo === 'erros' ? 'Erros' : 'Solicitações'}</Badge>
        </span>
        {chip('todas', 'Linhas', linhas.length, 'bg-brand-primary text-white')}
        {chip('ok', 'Válidas', cont.ok, 'bg-emerald-600 text-white')}
        {chip('aviso', 'Com aviso', cont.aviso, 'bg-amber-500 text-white')}
        {chip('erro', 'Rejeitadas', cont.erro, 'bg-red-600 text-white')}
        {chip('duplicado', 'Duplicadas', cont.duplicado, 'bg-slate-600 text-white')}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[720px] text-xs">
          <thead className="bg-slate-50 text-left uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-2 py-2">Linha</th>
              <th className="px-2 py-2">Situação</th>
              <th className="px-2 py-2">Data</th>
              <th className="px-2 py-2">Empresa</th>
              <th className="px-2 py-2">Doc.</th>
              <th className="px-2 py-2">Setor</th>
              <th className="px-2 py-2">Registro</th>
              <th className="px-2 py-2">Mensagens</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRows.map((l) => (
              <tr key={l.indice} className={clsx(l.status === 'erro' && 'bg-red-50', l.duplicado && 'bg-slate-50 text-slate-400')}>
                <td className="px-2 py-1.5 tabular-nums">{l.indice + 1}</td>
                <td className="px-2 py-1.5">
                  {l.duplicado ? <Badge tom="slate">duplicada</Badge> : l.status === 'ok' ? <Badge tom="green">ok</Badge> : l.status === 'aviso' ? <Badge tom="amber">aviso</Badge> : <Badge tom="red">rejeitada</Badge>}
                </td>
                <td className="px-2 py-1.5">{l.registro ? formatDateBR(l.registro.dataMov) : String(l.bruto[det.mapa.dataMov ?? -1] ?? '')}</td>
                <td className="px-2 py-1.5">{l.registro?.empresa}</td>
                <td className="px-2 py-1.5">{l.registro?.docRef}</td>
                <td className="px-2 py-1.5">{l.registro?.setor}</td>
                <td className="max-w-[260px] truncate px-2 py-1.5">{resumoRegistro(l.registro)}</td>
                <td className="max-w-[320px] px-2 py-1.5 text-slate-600">{l.mensagens.join('; ')}</td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-2 py-6 text-center text-slate-500">
                  Nenhuma linha nesta categoria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPag > 1 && (
        <div className="mt-2 flex items-center justify-end gap-2 text-xs text-slate-600">
          <button className="btn-ghost !py-1" disabled={pag <= 1} onClick={() => setPagina(pag - 1)}>
            ‹
          </button>
          {pag} / {totalPag}
          <button className="btn-ghost !py-1" disabled={pag >= totalPag} onClick={() => setPagina(pag + 1)}>
            ›
          </button>
        </div>
      )}
    </div>
  );
}
