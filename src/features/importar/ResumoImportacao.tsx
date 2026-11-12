import { Link } from 'react-router-dom';

export interface Resumo {
  importados: number;
  duplicados: number;
  rejeitados: number;
  novosCadastros: number;
}

export function ResumoImportacao({ resumo, onBaixarRejeitadas, onNovaImportacao }: { resumo: Resumo; onBaixarRejeitadas?: () => void; onNovaImportacao: () => void }) {
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat rotulo="importados" valor={resumo.importados} tom="text-emerald-600" />
        <Stat rotulo="duplicados (pulados)" valor={resumo.duplicados} tom="text-slate-600" />
        <Stat rotulo="rejeitados" valor={resumo.rejeitados} tom="text-red-600" />
        <Stat rotulo="novos cadastros" valor={resumo.novosCadastros} tom="text-sky-700" />
      </div>
      <div className="flex flex-wrap gap-2">
        {resumo.rejeitados > 0 && onBaixarRejeitadas && (
          <button className="btn-ghost" onClick={onBaixarRejeitadas}>
            ⬇ Baixar rejeitadas (.xlsx)
          </button>
        )}
        <Link to="/" className="btn-primary">
          Ver dashboard
        </Link>
        <button className="btn-ghost" onClick={onNovaImportacao}>
          Nova importação
        </button>
      </div>
    </div>
  );
}

function Stat({ rotulo, valor, tom }: { rotulo: string; valor: number; tom: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
      <div className={`text-3xl font-bold ${tom}`}>{valor}</div>
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {valor} {rotulo}
      </div>
    </div>
  );
}
