import { useMemo, useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { normalizeText } from '../domain/calc';

export interface Coluna<T> {
  chave: keyof T & string;
  titulo: string;
  largura?: string;
  render?: (linha: T) => ReactNode;
  /** valor usado para busca/ordenação (default: String(linha[chave])) */
  valor?: (linha: T) => string | number;
  filtravel?: boolean;
  alinhar?: 'left' | 'right' | 'center';
}

export interface DataTableProps<T extends { id: string }> {
  colunas: Coluna<T>[];
  linhas: T[];
  busca?: string;
  tamanhosPagina?: number[];
  onEditar?: (linha: T) => void;
  onExcluir?: (linha: T) => void;
  selecao?: { ids: Set<string>; onChange: (ids: Set<string>) => void };
  vazio?: ReactNode;
}

type Ordem = { chave: string; dir: 'asc' | 'desc' } | null;

export function DataTable<T extends { id: string }>({ colunas, linhas, busca = '', tamanhosPagina = [25, 50, 100], onEditar, onExcluir, selecao, vazio }: DataTableProps<T>) {
  const [ordem, setOrdem] = useState<Ordem>(null);
  const [pagina, setPagina] = useState(1);
  const [tamanho, setTamanho] = useState(tamanhosPagina[0]);
  const [filtrosColuna, setFiltrosColuna] = useState<Record<string, string>>({});

  const valorDe = (l: T, c: Coluna<T>) => (c.valor ? c.valor(l) : (l[c.chave] as unknown as string | number) ?? '');

  const filtradas = useMemo(() => {
    const q = normalizeText(busca);
    return linhas.filter((l) => {
      if (q && !colunas.some((c) => normalizeText(String(valorDe(l, c))).includes(q))) return false;
      for (const [chave, v] of Object.entries(filtrosColuna)) {
        if (!v) continue;
        const c = colunas.find((x) => x.chave === chave);
        if (c && String(valorDe(l, c)) !== v) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linhas, busca, filtrosColuna, colunas]);

  const ordenadas = useMemo(() => {
    if (!ordem) return filtradas;
    const c = colunas.find((x) => x.chave === ordem.chave);
    if (!c) return filtradas;
    const arr = [...filtradas].sort((a, b) => {
      const va = valorDe(a, c);
      const vb = valorDe(b, c);
      if (typeof va === 'number' && typeof vb === 'number') return va - vb;
      return String(va).localeCompare(String(vb), 'pt-BR');
    });
    return ordem.dir === 'asc' ? arr : arr.reverse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtradas, ordem, colunas]);

  const totalPaginas = Math.max(1, Math.ceil(ordenadas.length / tamanho));
  const pag = Math.min(pagina, totalPaginas);
  const visiveis = ordenadas.slice((pag - 1) * tamanho, pag * tamanho);

  const opcoesFiltro = (c: Coluna<T>) => [...new Set(linhas.map((l) => String(valorDe(l, c))))].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const todasSelecionadas = selecao && visiveis.length > 0 && visiveis.every((l) => selecao.ids.has(l.id));

  function toggleOrdem(chave: string) {
    setOrdem((o) => (o?.chave !== chave ? { chave, dir: 'asc' } : o.dir === 'asc' ? { chave, dir: 'desc' } : null));
  }

  const temFiltros = colunas.some((c) => c.filtravel);

  return (
    <div>
      {temFiltros && (
        <div className="mb-3 flex flex-wrap gap-2">
          {colunas
            .filter((c) => c.filtravel)
            .map((c) => (
              <select
                key={c.chave}
                className="input !w-auto !py-1 text-xs"
                value={filtrosColuna[c.chave] ?? ''}
                onChange={(e) => {
                  setFiltrosColuna({ ...filtrosColuna, [c.chave]: e.target.value });
                  setPagina(1);
                }}
                aria-label={`Filtrar ${c.titulo}`}
              >
                <option value="">{c.titulo}: todos</option>
                {opcoesFiltro(c).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ))}
          {Object.values(filtrosColuna).some(Boolean) && (
            <button className="btn-ghost !py-1 text-xs" onClick={() => setFiltrosColuna({})}>
              Limpar filtros
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {selecao && (
                <th className="w-8 px-3 py-2">
                  <input
                    type="checkbox"
                    aria-label="Selecionar página"
                    checked={!!todasSelecionadas}
                    onChange={(e) => {
                      const ids = new Set(selecao.ids);
                      visiveis.forEach((l) => (e.target.checked ? ids.add(l.id) : ids.delete(l.id)));
                      selecao.onChange(ids);
                    }}
                  />
                </th>
              )}
              {colunas.map((c) => (
                <th key={c.chave} style={{ width: c.largura }} className={clsx('cursor-pointer select-none px-3 py-2 font-semibold hover:text-brand-primary', c.alinhar === 'right' && 'text-right', c.alinhar === 'center' && 'text-center')} onClick={() => toggleOrdem(c.chave)}>
                  {c.titulo}
                  {ordem?.chave === c.chave && <span className="ml-1">{ordem.dir === 'asc' ? '▲' : '▼'}</span>}
                </th>
              ))}
              {(onEditar || onExcluir) && <th className="w-24 px-3 py-2 text-right">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visiveis.length === 0 && (
              <tr>
                <td colSpan={colunas.length + 2} className="px-3 py-8 text-center text-slate-500">
                  {vazio ?? 'Nenhum registro encontrado.'}
                </td>
              </tr>
            )}
            {visiveis.map((l) => (
              <tr key={l.id} className={clsx('hover:bg-sky-50/60', selecao?.ids.has(l.id) && 'bg-sky-50')} onDoubleClick={() => onEditar?.(l)}>
                {selecao && (
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      aria-label={`Selecionar ${l.id}`}
                      checked={selecao.ids.has(l.id)}
                      onChange={(e) => {
                        const ids = new Set(selecao.ids);
                        e.target.checked ? ids.add(l.id) : ids.delete(l.id);
                        selecao.onChange(ids);
                      }}
                    />
                  </td>
                )}
                {colunas.map((c) => (
                  <td key={c.chave} className={clsx('px-3 py-2 align-top', c.alinhar === 'right' && 'text-right', c.alinhar === 'center' && 'text-center')}>
                    {c.render ? c.render(l) : String(l[c.chave] ?? '')}
                  </td>
                ))}
                {(onEditar || onExcluir) && (
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    {onEditar && (
                      <button className="mr-1 rounded px-2 py-1 text-xs font-semibold text-brand-accent hover:bg-sky-50" onClick={() => onEditar(l)} aria-label="Editar">
                        Editar
                      </button>
                    )}
                    {onExcluir && (
                      <button className="rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50" onClick={() => onExcluir(l)} aria-label="Excluir">
                        Excluir
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <span>
          {ordenadas.length} registro{ordenadas.length === 1 ? '' : 's'}
          {ordenadas.length !== linhas.length && ` (de ${linhas.length})`}
        </span>
        <div className="flex items-center gap-2">
          <select className="input !w-auto !py-1 text-xs" value={tamanho} onChange={(e) => { setTamanho(+e.target.value); setPagina(1); }} aria-label="Registros por página">
            {tamanhosPagina.map((n) => (
              <option key={n} value={n}>
                {n} por página
              </option>
            ))}
          </select>
          <button className="btn-ghost !py-1" disabled={pag <= 1} onClick={() => setPagina(pag - 1)}>
            ‹
          </button>
          <span>
            {pag} / {totalPaginas}
          </span>
          <button className="btn-ghost !py-1" disabled={pag >= totalPaginas} onClick={() => setPagina(pag + 1)}>
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
