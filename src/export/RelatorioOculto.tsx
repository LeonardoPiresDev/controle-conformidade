import { forwardRef, type ReactNode } from 'react';
import type { DadosRelatorio } from './pdf';
import { PAGINA_PX } from './pdf';
import { Donut } from '../features/dashboard/charts/Donut';
import { Area } from '../features/dashboard/charts/Area';
import { BarrasRanking } from '../features/dashboard/charts/BarrasRanking';
import logoPadrao from '/logo-umaflex.png';

const fmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function Pagina({ d, numero, total, subtitulo, children }: { d: DadosRelatorio; numero: number; total: number; subtitulo: string; children: ReactNode }) {
  return (
    <div className="relatorio-pagina flex flex-col bg-white text-slate-800" style={{ width: PAGINA_PX.largura, height: PAGINA_PX.altura, fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
      <header className="flex items-center gap-5 border-b-4 border-[var(--brand-accent)] bg-[var(--brand-primary)] px-8 py-4 text-white">
        <img src={d.logoDataUrl ?? logoPadrao} alt="" className="h-11 rounded" />
        <div className="h-11 w-px bg-white/30" />
        <div className="flex-1">
          <div className="text-xl font-bold tracking-wide">{d.titulo.toUpperCase()}</div>
          <div className="text-sm text-slate-200">{subtitulo}</div>
        </div>
        <div className="text-right text-xs text-slate-200">
          <div>
            Período: <b className="text-white">{d.periodoTexto}</b>
          </div>
          <div>Emitido em {d.emitidoEm}</div>
          {d.filtrosTexto && <div className="max-w-[360px] truncate">Filtros: {d.filtrosTexto}</div>}
        </div>
      </header>
      <main className="flex-1 bg-[#EEF2F8] p-5">{children}</main>
      <footer className="flex items-center justify-between border-t border-slate-200 px-8 py-2 text-[10px] text-slate-500">
        <span>
          {d.nomeEmpresa} · Controladoria / Custos · Gerado pelo Controle de Conformidade
        </span>
        <span>
          Página {numero} de {total}
        </span>
      </footer>
    </div>
  );
}

function Bloco({ titulo, children, className = '' }: { titulo: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl bg-white p-4 shadow-sm ${className}`}>
      <h3 className="mb-2 text-sm font-bold text-[var(--brand-primary)]">{titulo}</h3>
      {children}
    </section>
  );
}

function CardMini({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{rotulo}</div>
      <div className="text-2xl font-bold text-[var(--brand-primary)]">{valor}</div>
      {detalhe && <div className="text-[10px] text-slate-500">{detalhe}</div>}
    </div>
  );
}

export const RelatorioOculto = forwardRef<HTMLDivElement, { d: DadosRelatorio }>(function RelatorioOculto({ d }, ref) {
  const v = d.cards.variacao;
  const total = 3;
  return (
    <div ref={ref} aria-hidden style={{ position: 'fixed', left: -20000, top: 0, zIndex: -1 }}>
      <Pagina d={d} numero={1} total={total} subtitulo="Resumo executivo — Erros e inconsistências">
        <div className="grid h-full grid-rows-[auto_1fr] gap-4">
          <div className="grid grid-cols-5 gap-3">
            <CardMini rotulo="Ocorrências" valor={fmt.format(d.cards.totalOcorrencias)} detalhe="registros de erro" />
            <CardMini rotulo="Qtde de erros" valor={fmt.format(d.cards.qtdeErros)} detalhe="soma da Qtde" />
            <CardMini rotulo="Variação" valor={v == null ? '—' : `${v > 0 ? '+' : ''}${fmt.format(v)}%`} detalhe={!d.cards.ocorrenciasAnterior || !d.cards.periodoAnterior ? 'sem base de comparação' : `vs. ${d.cards.ocorrenciasAnterior} em ${d.cards.periodoAnterior.inicio.slice(8)}/${d.cards.periodoAnterior.inicio.slice(5, 7)}–${d.cards.periodoAnterior.fim.slice(8)}/${d.cards.periodoAnterior.fim.slice(5, 7)}`} />
            <CardMini rotulo="Solicitações" valor={fmt.format(d.totalSolicitacoes)} detalhe="aberturas de período" />
            <CardMini rotulo="Mediana de dias" valor={d.totalSolicitacoes ? fmt.format(d.cards.medianaDias) : '—'} detalhe="para identificar" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Bloco titulo="Principais causas de erros">
              <Donut dados={d.causas} altura={200} />
            </Bloco>
            <Bloco titulo="Evolução mensal de erros">
              <Area dados={d.evolucaoErros} rotulo="Qtde de erros" altura={420} />
            </Bloco>
            <Bloco titulo="Ranking de erros por setor">
              <BarrasRanking dados={d.rankingSetor} rotulo="Qtde de erros" limite={12} altura={420} />
            </Bloco>
          </div>
        </div>
      </Pagina>

      <Pagina d={d} numero={2} total={total} subtitulo="Síntese por setor e categoria">
        <div className="grid h-full grid-cols-[1fr_340px] gap-4">
          <Bloco titulo="Qtde de erros — Setor × Categoria" className="overflow-hidden">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-slate-50 text-left text-slate-600">
                  <th className="px-2 py-1">Setor</th>
                  {d.matriz.categorias.slice(0, 9).map((c) => (
                    <th key={c} className="px-1 py-1 text-right" title={c}>
                      {c.replace(/^ERRO (NO|NA|DE|EMISSÃO|FALTA DE)\s?/i, '').slice(0, 14)}
                    </th>
                  ))}
                  {d.matriz.categorias.length > 9 && <th className="px-1 py-1 text-right">Outras</th>}
                  <th className="px-2 py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {d.matriz.linhas.slice(0, 16).map((l) => (
                  <tr key={l.setor} className="border-t border-slate-100">
                    <td className="px-2 py-1 font-semibold">{l.setor}</td>
                    {l.valores.slice(0, 9).map((x, i) => (
                      <td key={i} className="px-1 py-1 text-right tabular-nums">
                        {x || ''}
                      </td>
                    ))}
                    {d.matriz.categorias.length > 9 && <td className="px-1 py-1 text-right tabular-nums">{l.valores.slice(9).reduce((s, x) => s + x, 0) || ''}</td>}
                    <td className="px-2 py-1 text-right font-bold tabular-nums">{l.total}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                  <td className="px-2 py-1">Total</td>
                  {d.matriz.totaisColuna.slice(0, 9).map((x, i) => (
                    <td key={i} className="px-1 py-1 text-right tabular-nums">
                      {x}
                    </td>
                  ))}
                  {d.matriz.categorias.length > 9 && <td className="px-1 py-1 text-right tabular-nums">{d.matriz.totaisColuna.slice(9).reduce((s, x) => s + x, 0)}</td>}
                  <td className="px-2 py-1 text-right tabular-nums">{d.matriz.totalGeral}</td>
                </tr>
              </tbody>
            </table>
          </Bloco>
          <Bloco titulo="Top 10 usuários">
            <BarrasRanking dados={d.topUsuarios} rotulo="Qtde de erros" limite={10} altura={560} />
          </Bloco>
        </div>
      </Pagina>

      <Pagina d={d} numero={3} total={total} subtitulo="Solicitações de abertura de período">
        <div className="grid h-full grid-cols-3 gap-4">
          <Bloco titulo="Solicitações por setor">
            <Donut dados={d.solPorSetor} altura={200} />
          </Bloco>
          <Bloco titulo="Evolução mensal de solicitações">
            <Area dados={d.evolucaoSol} rotulo="Solicitações" altura={520} />
          </Bloco>
          <Bloco titulo="Mediana de dias para identificação por setor">
            <BarrasRanking dados={d.medianaPorSetor} rotulo="Mediana de dias" altura={520} />
          </Bloco>
        </div>
      </Pagina>
    </div>
  );
});
