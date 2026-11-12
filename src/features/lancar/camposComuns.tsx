import { useId, useState } from 'react';
import { Input } from '../../components/ui';
import { SelectComCadastro } from '../../components/SelectComCadastro';
import { useAppStore, canonico } from '../../store/useAppStore';

/** Select de empresa + input de código, sincronizados. */
export function EmpresaCodigo({ codEmp, onChange, erro }: { codEmp: number | ''; onChange: (codEmp: number | '', empresa: string) => void; erro?: string }) {
  const empresas = useAppStore((s) => s.cadastros.empresas);
  const adicionarEmpresa = useAppStore((s) => s.adicionarEmpresa);
  const [nova, setNova] = useState<{ cod: string; nome: string } | null>(null);
  const idSel = useId();

  const nomeDe = (c: number | '') => empresas.find((e) => e.codEmp === c)?.nome ?? '';

  return (
    <div className="grid grid-cols-[90px_1fr] gap-3">
      <Input
        label="Cód."
        type="number"
        min={1}
        value={codEmp}
        onChange={(e) => {
          const v = e.target.value === '' ? '' : Number(e.target.value);
          onChange(v, nomeDe(v));
        }}
      />
      {nova === null ? (
        <div>
          <label htmlFor={idSel} className="label">
            Empresa <span className="text-red-500">*</span>
          </label>
          <select
            id={idSel}
            className={`input ${erro ? 'border-red-400' : ''}`}
            value={codEmp === '' ? '' : String(codEmp)}
            onChange={(e) => {
              if (e.target.value === '__novo__') return setNova({ cod: '', nome: '' });
              const v = e.target.value === '' ? '' : Number(e.target.value);
              onChange(v, nomeDe(v));
            }}
          >
            <option value="">Selecione…</option>
            {empresas.map((e) => (
              <option key={e.codEmp} value={e.codEmp}>
                {e.codEmp} - {e.nome}
              </option>
            ))}
            <option value="__novo__">+ Cadastrar nova…</option>
          </select>
          {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
        </div>
      ) : (
        <div className="flex items-end gap-2">
          <Input label="Novo cód." type="number" className="w-24" value={nova.cod} onChange={(e) => setNova({ ...nova, cod: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} />
          <Input label="Nome da empresa" className="flex-1" value={nova.nome} onChange={(e) => setNova({ ...nova, nome: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} />
          <button
            type="button"
            className="btn-accent"
            onClick={async () => {
              const c = Number(nova.cod);
              if (!c || !nova.nome.trim()) return;
              await adicionarEmpresa(c, nova.nome);
              onChange(c, canonico(nova.nome));
              setNova(null);
            }}
          >
            OK
          </button>
          <button type="button" className="btn-ghost" onClick={() => setNova(null)}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

/** Select de usuário (com cadastro) que preenche o setor. */
export function UsuarioSetor({ rotuloUsuario, usuario, setor, onChange, erroUsuario, erroSetor }: { rotuloUsuario: string; usuario: string; setor: string; onChange: (usuario: string, setor: string) => void; erroUsuario?: string; erroSetor?: string }) {
  const cadastros = useAppStore((s) => s.cadastros);
  const adicionarUsuario = useAppStore((s) => s.adicionarUsuario);
  const adicionarCadastro = useAppStore((s) => s.adicionarCadastro);
  const [novoUsuario, setNovoUsuario] = useState<{ nome: string; setor: string } | null>(null);
  const idSel = useId();

  const setorDe = (nome: string) => cadastros.usuarios.find((u) => u.nome === nome)?.setor ?? '';

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {novoUsuario === null ? (
        <div>
          <label htmlFor={idSel} className="label">
            {rotuloUsuario} <span className="text-red-500">*</span>
          </label>
          <select
            id={idSel}
            className={`input ${erroUsuario ? 'border-red-400' : ''}`}
            value={usuario}
            onChange={(e) => {
              if (e.target.value === '__novo__') return setNovoUsuario({ nome: '', setor: setor });
              const u = e.target.value;
              onChange(u, setorDe(u) || setor);
            }}
          >
            <option value="">Selecione…</option>
            {usuario && !cadastros.usuarios.some((u) => u.nome === usuario) && <option value={usuario}>{usuario}</option>}
            {cadastros.usuarios.map((u) => (
              <option key={u.nome} value={u.nome}>
                {u.nome}
              </option>
            ))}
            <option value="__novo__">+ Cadastrar novo…</option>
          </select>
          {erroUsuario && <p className="mt-1 text-xs text-red-600">{erroUsuario}</p>}
        </div>
      ) : (
        <div className="sm:col-span-2 grid gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
          <Input label="Nome (ex.: MARIA)" autoFocus value={novoUsuario.nome} onChange={(e) => setNovoUsuario({ ...novoUsuario, nome: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} />
          <SelectComCadastro label="Setor do usuário" opcoes={cadastros.setores} valor={novoUsuario.setor} onChange={(v) => setNovoUsuario({ ...novoUsuario, setor: v })} onNovo={(v) => adicionarCadastro('setores', v)} />
          <button
            type="button"
            className="btn-accent"
            onClick={async () => {
              const nomeBase = canonico(novoUsuario.nome);
              if (!nomeBase || !novoUsuario.setor) return;
              const nome = nomeBase.includes('(') ? nomeBase : `${nomeBase} (${novoUsuario.setor})`;
              const final = await adicionarUsuario(nome, novoUsuario.setor);
              onChange(final, novoUsuario.setor);
              setNovoUsuario(null);
            }}
          >
            OK
          </button>
          <button type="button" className="btn-ghost" onClick={() => setNovoUsuario(null)}>
            ✕
          </button>
        </div>
      )}
      <SelectComCadastro label="Setor" obrigatorio opcoes={cadastros.setores} valor={setor} onChange={(v) => onChange(usuario, v)} onNovo={(v) => adicionarCadastro('setores', v)} erro={erroSetor} />
    </div>
  );
}

export function Datalist({ id, valores }: { id: string; valores: string[] }) {
  return (
    <datalist id={id}>
      {valores.map((v) => (
        <option key={v} value={v} />
      ))}
    </datalist>
  );
}

export function mapearErros(msgs: string[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const msg of msgs) {
    if (msg.startsWith('Empresa')) m.empresa = msg;
    else if (msg.startsWith('Data do movimento')) m.dataMov = msg;
    else if (msg.startsWith('Data da solicitação')) m.dataSolicitacao = msg;
    else if (msg.startsWith('Setor')) m.setor = msg;
    else if (msg.startsWith('Tipo')) m.tipoAnalise = msg;
    else if (msg.startsWith('Qtde')) m.qtde = msg;
    else if (msg.startsWith('Usuário')) m.usuario = msg;
    else if (msg.startsWith('Solicitante')) m.solicitante = msg;
    else if (msg.startsWith('Erro detalhado')) m.erroDetalhado = msg;
    else if (msg.startsWith('Categoria')) m.categoria = msg;
    else if (msg.startsWith('Motivo')) m.motivo = msg;
  }
  return m;
}
