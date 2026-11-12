import { useMemo, useState, type FormEvent } from 'react';
import type { Solicitacao } from '../../domain/types';
import { validarSolicitacao } from '../../domain/validate';
import { diasEntre } from '../../domain/calc';
import { hojeIso } from '../../domain/period';
import { useAppStore } from '../../store/useAppStore';
import { Input } from '../../components/ui';
import { toast } from '../../components/Toast';
import { Datalist, EmpresaCodigo, UsuarioSetor, mapearErros } from './camposComuns';

type Form = {
  codEmp: number | '';
  empresa: string;
  dataMov: string;
  dataSolicitacao: string;
  docRef: string;
  setor: string;
  qtde: number | '';
  solicitante: string;
  motivo: string;
};

function vazio(): Form {
  const hoje = hojeIso();
  return { codEmp: '', empresa: '', dataMov: hoje, dataSolicitacao: hoje, docRef: '', setor: '', qtde: 1, solicitante: '', motivo: '' };
}

function deSol(s: Solicitacao): Form {
  return { codEmp: s.codEmp, empresa: s.empresa, dataMov: s.dataMov, dataSolicitacao: s.dataSolicitacao, docRef: s.docRef, setor: s.setor, qtde: s.qtde, solicitante: s.solicitante, motivo: s.motivo };
}

let ultimo: Form | null = null;

export function FormSolicitacao({ inicial, onSalvo, onCancelar }: { inicial?: Solicitacao; onSalvo?: (s: Solicitacao) => void; onCancelar?: () => void }) {
  const solicitacoes = useAppStore((s) => s.solicitacoes);
  const salvarSolicitacao = useAppStore((s) => s.salvarSolicitacao);

  const [f, setF] = useState<Form>(() => (inicial ? deSol(inicial) : vazio()));
  const [msgs, setMsgs] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const editando = !!inicial;

  const motivos = useMemo(() => [...new Set(solicitacoes.map((s) => s.motivo).filter(Boolean))].sort(), [solicitacoes]);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((prev) => ({ ...prev, [k]: v }));

  const dias = f.dataMov && f.dataSolicitacao ? diasEntre(f.dataMov, f.dataSolicitacao) : null;

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const parcial: Partial<Solicitacao> = { ...f, codEmp: f.codEmp === '' ? 0 : f.codEmp, qtde: f.qtde === '' ? 0 : f.qtde, id: inicial?.id, criadoEm: inicial?.criadoEm, origem: inicial?.origem };
    const problemas = validarSolicitacao(parcial);
    setMsgs(mapearErros(problemas));
    if (problemas.length) return;
    setSalvando(true);
    try {
      const salvo = await salvarSolicitacao(parcial);
      toast.ok(editando ? 'Registro atualizado.' : 'Solicitação lançada com sucesso.');
      if (!editando) ultimo = f;
      onSalvo?.(salvo);
      if (!editando) setF({ ...vazio(), codEmp: f.codEmp, empresa: f.empresa, dataSolicitacao: f.dataSolicitacao });
    } catch (e) {
      toast.erro(`Falha ao salvar: ${(e as Error).message}`);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <EmpresaCodigo codEmp={f.codEmp} onChange={(c, nome) => setF((p) => ({ ...p, codEmp: c, empresa: nome }))} erro={msgs.empresa} />
        <Input label="Doc. referência" placeholder="NF 123 / OP 456" value={f.docRef} onChange={(e) => set('docRef', e.target.value.toUpperCase())} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Input label="Data do movimento" type="date" obrigatorio value={f.dataMov} onChange={(e) => set('dataMov', e.target.value)} erro={msgs.dataMov} />
        <Input label="Data da solicitação" type="date" obrigatorio value={f.dataSolicitacao} onChange={(e) => set('dataSolicitacao', e.target.value)} erro={msgs.dataSolicitacao} />
        <div>
          <span className="label">Dias para identificar</span>
          <div className={`input flex items-center bg-slate-50 ${dias != null && dias < 0 ? 'border-amber-400 text-amber-700' : ''}`} aria-live="polite">
            {dias ?? '—'}
            {dias != null && dias < 0 && <span className="ml-2 text-xs">Dias negativos: solicitação antes do movimento</span>}
          </div>
        </div>
      </div>

      <UsuarioSetor rotuloUsuario="Solicitante" usuario={f.solicitante} setor={f.setor} onChange={(u, s) => setF((p) => ({ ...p, solicitante: u, setor: s }))} erroUsuario={msgs.solicitante} erroSetor={msgs.setor} />

      <div className="grid gap-4 md:grid-cols-[1fr_120px]">
        <Input label="Motivo" obrigatorio list="dl-motivo" placeholder="Ex.: CORREÇÃO TIPO DE NOTA" value={f.motivo} onChange={(e) => set('motivo', e.target.value.toUpperCase())} erro={msgs.motivo} />
        <Input label="Qtde" type="number" min={1} obrigatorio value={f.qtde} onChange={(e) => set('qtde', e.target.value === '' ? '' : Number(e.target.value))} erro={msgs.qtde} />
      </div>
      <Datalist id="dl-motivo" valores={motivos} />

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
        {!editando && (
          <button type="button" className="btn-ghost mr-auto" disabled={!ultimo} onClick={() => ultimo && setF({ ...ultimo, docRef: '' })} title="Copia o último lançamento (exceto Doc. referência)">
            ↺ Repetir último
          </button>
        )}
        {onCancelar && (
          <button type="button" className="btn-ghost" onClick={onCancelar}>
            Cancelar
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={salvando}>
          {editando ? 'Salvar alterações' : 'Salvar (Enter)'}
        </button>
      </div>
    </form>
  );
}
