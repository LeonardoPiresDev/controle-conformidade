import { useState } from 'react';
import clsx from 'clsx';
import { Card, Input, Modal } from '../../components/ui';
import { toast } from '../../components/Toast';
import { useAppStore, canonico, type ListaCadastro } from '../../store/useAppStore';
import { normalizeText } from '../../domain/calc';
import type { Cadastros as CadastrosT } from '../../domain/types';

type Aba = ListaCadastro | 'usuarios' | 'empresas';
const ABAS: { k: Aba; t: string }[] = [
  { k: 'usuarios', t: 'Usuários' },
  { k: 'setores', t: 'Setores' },
  { k: 'categorias', t: 'Categorias' },
  { k: 'tiposAnalise', t: 'Tipos de análise' },
  { k: 'empresas', t: 'Empresas' },
];

export function Cadastros() {
  const cadastros = useAppStore((s) => s.cadastros);
  const erros = useAppStore((s) => s.erros);
  const solicitacoes = useAppStore((s) => s.solicitacoes);
  const salvarCadastros = useAppStore((s) => s.salvarCadastros);
  const importarLote = useAppStore((s) => s.importarLote);
  const adicionarCadastro = useAppStore((s) => s.adicionarCadastro);
  const adicionarUsuario = useAppStore((s) => s.adicionarUsuario);
  const adicionarEmpresa = useAppStore((s) => s.adicionarEmpresa);

  const [aba, setAba] = useState<Aba>('usuarios');
  const [novo, setNovo] = useState('');
  const [novoSetor, setNovoSetor] = useState('');
  const [novoCod, setNovoCod] = useState('');
  const [renomear, setRenomear] = useState<{ de: string; para: string } | null>(null);

  const usoDe = (valor: string): number => {
    switch (aba) {
      case 'usuarios':
        return erros.filter((e) => e.usuario === valor).length + solicitacoes.filter((s) => s.solicitante === valor).length;
      case 'setores':
        return erros.filter((e) => e.setor === valor).length + solicitacoes.filter((s) => s.setor === valor).length;
      case 'categorias':
        return erros.filter((e) => e.categoria === valor).length;
      case 'tiposAnalise':
        return erros.filter((e) => e.tipoAnalise === valor).length;
      case 'empresas':
        return erros.filter((e) => e.empresa === valor).length + solicitacoes.filter((s) => s.empresa === valor).length;
    }
  };

  const itens: { valor: string; extra?: string }[] =
    aba === 'usuarios'
      ? cadastros.usuarios.map((u) => ({ valor: u.nome, extra: u.setor }))
      : aba === 'empresas'
        ? cadastros.empresas.map((e) => ({ valor: e.nome, extra: String(e.codEmp) }))
        : cadastros[aba].map((v) => ({ valor: v }));

  async function adicionar() {
    if (!novo.trim()) return;
    if (aba === 'usuarios') {
      if (!novoSetor) return toast.erro('Informe o setor do usuário.');
      const n = canonico(novo);
      await adicionarUsuario(n.includes('(') ? n : `${n} (${novoSetor})`, novoSetor);
    } else if (aba === 'empresas') {
      if (!Number(novoCod)) return toast.erro('Informe o código da empresa.');
      await adicionarEmpresa(Number(novoCod), novo);
    } else {
      await adicionarCadastro(aba, novo);
    }
    setNovo('');
    setNovoCod('');
    toast.ok('Cadastrado.');
  }

  async function remover(valor: string) {
    if (usoDe(valor) > 0) return toast.erro('Em uso por registros — renomeie em vez de excluir.');
    const c: CadastrosT = { ...cadastros };
    if (aba === 'usuarios') c.usuarios = c.usuarios.filter((u) => u.nome !== valor);
    else if (aba === 'empresas') c.empresas = c.empresas.filter((e) => e.nome !== valor);
    else c[aba] = c[aba].filter((v) => v !== valor);
    await salvarCadastros(c);
    toast.ok('Removido.');
  }

  async function confirmarRenomear() {
    if (!renomear) return;
    const de = renomear.de;
    const para = canonico(renomear.para);
    if (!para || normalizeText(para) === normalizeText(de)) return setRenomear(null);
    const jaExiste = aba === 'usuarios' ? cadastros.usuarios.some((u) => normalizeText(u.nome) === normalizeText(para)) : aba === 'empresas' ? cadastros.empresas.some((e) => normalizeText(e.nome) === normalizeText(para)) : cadastros[aba].some((v) => normalizeText(v) === normalizeText(para));
    if (jaExiste) return toast.erro('Já existe um item com esse nome.');
    const c: CadastrosT = JSON.parse(JSON.stringify(cadastros));
    const errosAlt = erros.filter((e) => (aba === 'usuarios' ? e.usuario : aba === 'setores' ? e.setor : aba === 'categorias' ? e.categoria : aba === 'tiposAnalise' ? e.tipoAnalise : e.empresa) === de).map((e) => ({ ...e, ...(aba === 'usuarios' ? { usuario: para } : aba === 'setores' ? { setor: para } : aba === 'categorias' ? { categoria: para } : aba === 'tiposAnalise' ? { tipoAnalise: para } : { empresa: para }), atualizadoEm: new Date().toISOString() }));
    const solAlt = aba === 'categorias' || aba === 'tiposAnalise' ? [] : solicitacoes.filter((s) => (aba === 'usuarios' ? s.solicitante : aba === 'setores' ? s.setor : s.empresa) === de).map((s) => ({ ...s, ...(aba === 'usuarios' ? { solicitante: para } : aba === 'setores' ? { setor: para } : { empresa: para }), atualizadoEm: new Date().toISOString() }));

    if (aba === 'usuarios') c.usuarios = c.usuarios.map((u) => (u.nome === de ? { ...u, nome: para } : u));
    else if (aba === 'empresas') c.empresas = c.empresas.map((e) => (e.nome === de ? { ...e, nome: para } : e));
    else if (aba === 'setores') {
      c.setores = [...new Set(c.setores.map((v) => (v === de ? para : v)))];
      c.usuarios = c.usuarios.map((u) => (u.setor === de ? { ...u, setor: para } : u));
    } else c[aba] = [...new Set(c[aba].map((v) => (v === de ? para : v)))];

    await salvarCadastros(c);
    await importarLote({ erros: errosAlt, solicitacoes: solAlt });
    toast.ok(`Renomeado e propagado para ${errosAlt.length + solAlt.length} registros.`);
    setRenomear(null);
  }

  return (
    <Card titulo="Cadastros">
      <div className="mb-4 flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1" role="tablist">
        {ABAS.map((a) => (
          <button key={a.k} role="tab" aria-selected={aba === a.k} className={clsx('rounded-md px-3 py-1.5 text-sm font-semibold', aba === a.k ? 'bg-white text-brand-primary shadow' : 'text-slate-500')} onClick={() => setAba(a.k)}>
            {a.t}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-2">
        {aba === 'empresas' && <Input label="Código" type="number" className="w-24" value={novoCod} onChange={(e) => setNovoCod(e.target.value)} />}
        <Input label={aba === 'usuarios' ? 'Nome (ex.: MARIA)' : 'Novo item'} className="min-w-[220px] flex-1" value={novo} onChange={(e) => setNovo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void adicionar()} />
        {aba === 'usuarios' && (
          <label className="flex flex-col">
            <span className="label">Setor</span>
            <select className="input !w-48" value={novoSetor} onChange={(e) => setNovoSetor(e.target.value)}>
              <option value="">Selecione…</option>
              {cadastros.setores.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        )}
        <button className="btn-accent" onClick={() => void adicionar()}>
          + Adicionar
        </button>
      </div>

      <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
        {itens.map((it) => {
          const uso = usoDe(it.valor);
          return (
            <li key={it.valor} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
              <span className="min-w-0 flex-1 truncate">
                {it.valor}
                {it.extra && <span className="ml-1 text-xs text-slate-400">({it.extra})</span>}
              </span>
              <span className="text-xs text-slate-400" title="registros que usam este item">
                {uso}
              </span>
              <button className="text-xs font-semibold text-brand-accent" onClick={() => setRenomear({ de: it.valor, para: it.valor })}>
                Renomear
              </button>
              <button className="text-xs font-semibold text-red-600 disabled:opacity-30" disabled={uso > 0} onClick={() => void remover(it.valor)} title={uso > 0 ? 'Em uso — renomeie' : 'Excluir'}>
                ✕
              </button>
            </li>
          );
        })}
      </ul>

      <Modal aberto={!!renomear} titulo="Renomear" onFechar={() => setRenomear(null)} largura="max-w-md">
        {renomear && (
          <div className="grid gap-3">
            <p className="text-sm text-slate-600">
              A alteração será propagada para <b>{usoDe(renomear.de)}</b> registros.
            </p>
            <Input label="Novo nome" autoFocus value={renomear.para} onChange={(e) => setRenomear({ ...renomear, para: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && void confirmarRenomear()} />
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setRenomear(null)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={() => void confirmarRenomear()}>
                Renomear
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}
