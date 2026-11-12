import { CAMPOS, ROTULOS, type CampoAlvo, type Deteccao, type TipoAba } from '../../import/detect';

const CAMPOS_POR_TIPO: Record<Exclude<TipoAba, 'ignorar'>, CampoAlvo[]> = {
  erros: ['codEmp', 'empresa', 'dataMov', 'docRef', 'setor', 'tipoAnalise', 'qtde', 'usuario', 'erroDetalhado', 'categoria', 'obs'],
  solicitacoes: ['codEmp', 'empresa', 'dataMov', 'dataSolicitacao', 'docRef', 'setor', 'qtde', 'solicitante', 'motivo'],
};

export function MapeamentoColunas({ det, onChange }: { det: Deteccao; onChange: (d: Deteccao) => void }) {
  if (det.tipo === 'ignorar') return null;
  const campos = CAMPOS_POR_TIPO[det.tipo];
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {campos.map((campo) => (
        <label key={campo} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs">
          <span className="font-semibold text-slate-600">{ROTULOS[campo]}</span>
          <select
            className="input !w-44 !py-1 text-xs"
            value={det.mapa[campo] ?? ''}
            onChange={(e) => {
              const v = e.target.value === '' ? null : Number(e.target.value);
              onChange({ ...det, mapa: { ...det.mapa, [campo]: v } });
            }}
          >
            <option value="">— não usar —</option>
            {det.cabecalhos.map((h, i) => (
              <option key={i} value={i} disabled={!h}>
                {h || `(coluna ${i + 1})`}
              </option>
            ))}
          </select>
        </label>
      ))}
      <input type="hidden" value={CAMPOS.length} readOnly />
    </div>
  );
}
