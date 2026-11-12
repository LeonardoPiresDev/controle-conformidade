import { useMemo } from 'react';
import clsx from 'clsx';
import { useAppStore } from '../../store/useAppStore';
import { atalhos, hojeIso, type Periodo } from '../../domain/period';
import type { Filtros } from '../../domain/aggregate';

function MultiSelect({ rotulo, opcoes, valores, onChange }: { rotulo: string; opcoes: string[]; valores: string[]; onChange: (v: string[]) => void }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="label !mb-0">{rotulo}</span>
      <select
        className={clsx('input !py-1.5 text-xs', valores.length && 'border-brand-accent ring-1 ring-sky-300')}
        value={valores.length === 1 ? valores[0] : valores.length ? '__multi__' : ''}
        onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}
        aria-label={rotulo}
      >
        <option value="">Todos</option>
        {valores.length > 1 && <option value="__multi__">{valores.length} selecionados</option>}
        {opcoes.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FiltrosGlobais() {
  const filtros = useAppStore((s) => s.filtros);
  const setFiltros = useAppStore((s) => s.setFiltros);
  const limparFiltros = useAppStore((s) => s.limparFiltros);
  const cadastros = useAppStore((s) => s.cadastros);
  const erros = useAppStore((s) => s.erros);
  const solicitacoes = useAppStore((s) => s.solicitacoes);

  const a = useMemo(() => atalhos(hojeIso()), []);
  const usuarios = useMemo(() => [...new Set([...erros.map((e) => e.usuario), ...solicitacoes.map((s) => s.solicitante)])].sort(), [erros, solicitacoes]);
  const p = filtros.periodo;
  const igual = (x: Periodo | null) => !!p && !!x && p.inicio === x.inicio && p.fim === x.fim;
  const ativos = (p ? 1 : 0) + filtros.codEmp.length + filtros.setores.length + filtros.usuarios.length + filtros.tiposAnalise.length + filtros.categorias.length;

  const setPeriodo = (per: Periodo | null) => setFiltros({ periodo: per });
  const chip = (rotulo: string, per: Periodo | null, ativo: boolean) => (
    <button key={rotulo} type="button" className={clsx('rounded-full px-3 py-1 text-xs font-semibold ring-1 transition', ativo ? 'bg-brand-primary text-white ring-transparent' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50')} onClick={() => setPeriodo(per)}>
      {rotulo}
    </button>
  );

  return (
    <div className="card grid gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        {chip('Tudo', null, !p)}
        {chip('Mês atual', a.mesAtual, igual(a.mesAtual))}
        {chip('Mês anterior', a.mesAnterior, igual(a.mesAnterior))}
        {chip('Ano', a.anoAtual, igual(a.anoAtual))}
        <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />
        <label className="flex items-center gap-1 text-xs text-slate-600">
          de
          <input type="date" className="input !w-auto !py-1 text-xs" value={p?.inicio ?? ''} onChange={(e) => setPeriodo(e.target.value ? { inicio: e.target.value, fim: p?.fim && p.fim >= e.target.value ? p.fim : e.target.value } : null)} aria-label="Data inicial" />
        </label>
        <label className="flex items-center gap-1 text-xs text-slate-600">
          até
          <input type="date" className="input !w-auto !py-1 text-xs" value={p?.fim ?? ''} onChange={(e) => setPeriodo(e.target.value ? { inicio: p?.inicio && p.inicio <= e.target.value ? p.inicio : e.target.value, fim: e.target.value } : null)} aria-label="Data final" />
        </label>
        {ativos > 0 && (
          <button type="button" className="btn-ghost ml-auto !py-1 text-xs" onClick={limparFiltros}>
            Limpar filtros ({ativos})
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <MultiSelect rotulo="Empresa" opcoes={cadastros.empresas.map((e) => `${e.codEmp} - ${e.nome}`)} valores={filtros.codEmp.map((c) => `${c} - ${cadastros.empresas.find((e) => e.codEmp === c)?.nome ?? ''}`)} onChange={(v) => setFiltros({ codEmp: v.map((x) => Number(x.split(' - ')[0])) })} />
        <MultiSelect rotulo="Setor" opcoes={cadastros.setores} valores={filtros.setores} onChange={(v) => setFiltros({ setores: v })} />
        <MultiSelect rotulo="Usuário / Solicitante" opcoes={usuarios} valores={filtros.usuarios} onChange={(v) => setFiltros({ usuarios: v })} />
        <MultiSelect rotulo="Tipo de análise" opcoes={cadastros.tiposAnalise} valores={filtros.tiposAnalise} onChange={(v) => setFiltros({ tiposAnalise: v })} />
        <MultiSelect rotulo="Categoria" opcoes={cadastros.categorias} valores={filtros.categorias} onChange={(v) => setFiltros({ categorias: v })} />
      </div>
    </div>
  );
}

export function useToggleFiltro() {
  const filtros = useAppStore((s) => s.filtros);
  const setFiltros = useAppStore((s) => s.setFiltros);
  return (chave: keyof Omit<Filtros, 'periodo' | 'codEmp'>, valor: string) => {
    const atual = filtros[chave];
    setFiltros({ [chave]: atual.includes(valor) ? atual.filter((v) => v !== valor) : [...atual, valor] } as Partial<Filtros>);
  };
}
