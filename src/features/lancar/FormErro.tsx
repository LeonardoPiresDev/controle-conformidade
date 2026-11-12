import { useMemo, useState, type FormEvent } from 'react';
import type { Erro } from '../../domain/types';
import { validarErro } from '../../domain/validate';
import { hojeIso } from '../../domain/period';
import { useAppStore } from '../../store/useAppStore';
import { Input, Textarea } from '../../components/ui';
import { SelectComCadastro } from '../../components/SelectComCadastro';
import { toast } from '../../components/Toast';
import { Datalist, EmpresaCodigo, UsuarioSetor, mapearErros } from './camposComuns';

type Form = {
  codEmp: number | '';
  empresa: string;
  dataMov: string;
  docRef: string;
  setor: string;
  tipoAnalise: string;
  qtde: number | '';
  usuario: string;
  erroDetalhado: string;
  categoria: string;
  obs: string;
};

function vazio(): Form {
  return { codEmp: '', empresa: '', dataMov: hojeIso(), docRef: '', setor: '', tipoAnalise: '', qtde: 1, usuario: '', erroDetalhado: '', categoria: '', obs: '' };
}

function deErro(e: Erro): Form {
  return { codEmp: e.codEmp, empresa: e.empresa, dataMov: e.dataMov, docRef: e.docRef, setor: e.setor, tipoAnalise: e.tipoAnalise, qtde: e.qtde, usuario: e.usuario, erroDetalhado: e.erroDetalhado, categoria: e.categoria, obs: e.obs };
}

let ultimo: Form | null = null;

export function FormErro({ inicial, onSalvo, onCancelar }: { inicial?: Erro; onSalvo?: (e: Erro) => void; onCancelar?: () => void }) {
  const cadastros = useAppStore((s) => s.cadastros);
  const erros = useAppStore((s) => s.erros);
  const salvarErro = useAppStore((s) => s.salvarErro);
  const adicionarCadastro = useAppStore((s) => s.adicionarCadastro);

  const [f, setF] = useState<Form>(() => (inicial ? deErro(inicial) : vazio()));
  const [msgs, setMsgs] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const editando = !!inicial;

  const descricoes = useMemo(() => [...new Set(erros.map((e) => e.erroDetalhado).filter(Boolean))].sort(), [erros]);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((prev) => ({ ...prev, [k]: v }));

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    const parcial: Partial<Erro> = { ...f, codEmp: f.codEmp === '' ? 0 : f.codEmp, qtde: f.qtde === '' ? 0 : f.qtde, id: inicial?.id, criadoEm: inicial?.criadoEm, origem: inicial?.origem };
    const problemas = validarErro(parcial);
    setMsgs(mapearErros(problemas));
    if (problemas.length) return;
    setSalvando(true);
    try {
      const salvo = await salvarErro(parcial);
      toast.ok(editando ? 'Registro atualizado.' : 'Erro lançado com sucesso.');
      if (!editando) ultimo = f;
      onSalvo?.(salvo);
      if (!editando) setF({ ...vazio(), codEmp: f.codEmp, empresa: f.empresa, dataMov: f.dataMov, tipoAnalise: f.tipoAnalise });
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
        <div className="grid grid-cols-2 gap-3">
          <Input label="Data do movimento" type="date" obrigatorio value={f.dataMov} onChange={(e) => set('dataMov', e.target.value)} erro={msgs.dataMov} />
          <Input label="Doc. referência" placeholder="NF 123 / PED 456 / RC 7" value={f.docRef} onChange={(e) => set('docRef', e.target.value.toUpperCase())} />
        </div>
      </div>

      <UsuarioSetor rotuloUsuario="Usuário" usuario={f.usuario} setor={f.setor} onChange={(u, s) => setF((p) => ({ ...p, usuario: u, setor: s }))} erroUsuario={msgs.usuario} erroSetor={msgs.setor} />

      <div className="grid gap-4 md:grid-cols-[1fr_120px]">
        <SelectComCadastro label="Tipo de análise" obrigatorio opcoes={cadastros.tiposAnalise} valor={f.tipoAnalise} onChange={(v) => set('tipoAnalise', v)} onNovo={(v) => adicionarCadastro('tiposAnalise', v)} erro={msgs.tipoAnalise} />
        <Input label="Qtde" type="number" min={1} obrigatorio value={f.qtde} onChange={(e) => set('qtde', e.target.value === '' ? '' : Number(e.target.value))} erro={msgs.qtde} />
      </div>

      <Input label="Erro detalhado" obrigatorio list="dl-erro-detalhado" placeholder="Descreva o erro (ex.: C.C. INDICADO ERRADO)" value={f.erroDetalhado} onChange={(e) => set('erroDetalhado', e.target.value.toUpperCase())} erro={msgs.erroDetalhado} />
      <Datalist id="dl-erro-detalhado" valores={descricoes} />

      <SelectComCadastro label="Categoria" obrigatorio opcoes={cadastros.categorias} valor={f.categoria} onChange={(v) => set('categoria', v)} onNovo={(v) => adicionarCadastro('categorias', v)} erro={msgs.categoria} />

      <Textarea label="Obs" value={f.obs} onChange={(e) => set('obs', e.target.value)} />

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
