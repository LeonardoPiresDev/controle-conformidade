import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import clsx from 'clsx';
import type { Ponto } from '../../../domain/aggregate';
import { agruparOutros, corPorIndice, COR_OUTROS } from './palette';
import { EmptyState } from '../../../components/ui';

const fmt = new Intl.NumberFormat('pt-BR');

export function Donut({ dados, onClique, selecionados = [], altura = 240 }: { dados: Ponto[]; onClique?: (nome: string) => void; selecionados?: string[]; altura?: number }) {
  const agrupados = agruparOutros(dados);
  const total = agrupados.reduce((s, p) => s + p.valor, 0);
  if (!total) return <EmptyState titulo="Sem dados no filtro atual" />;

  return (
    <div className="grid items-center gap-3 sm:grid-cols-[minmax(0,180px)_1fr]" style={{ minHeight: altura }}>
      <div className="relative mx-auto h-[180px] w-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={agrupados} dataKey="valor" nameKey="nome" innerRadius={56} outerRadius={84} paddingAngle={2} stroke="#fff" strokeWidth={2} isAnimationActive={false} onClick={(d: { nome?: string }) => d?.nome && d.nome !== 'OUTROS' && onClique?.(d.nome)}>
              {agrupados.map((p, i) => (
                <Cell key={p.nome} fill={p.nome === 'OUTROS' ? COR_OUTROS : corPorIndice(i)} opacity={selecionados.length && !selecionados.includes(p.nome) ? 0.35 : 1} cursor={onClique ? 'pointer' : 'default'} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number, n: string) => [`${fmt.format(v)} (${Math.round((v / total) * 100)}%)`, n]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-brand-primary">{fmt.format(total)}</span>
          <span className="text-[10px] uppercase tracking-wide text-slate-500">total</span>
        </div>
      </div>
      <ul className="grid gap-1 text-xs">
        {agrupados.map((p, i) => (
          <li key={p.nome}>
            <button
              type="button"
              className={clsx('flex w-full items-center gap-2 rounded px-1 py-0.5 text-left hover:bg-slate-50', selecionados.includes(p.nome) && 'bg-sky-50 font-semibold', p.nome === 'OUTROS' && 'cursor-default')}
              onClick={() => p.nome !== 'OUTROS' && onClique?.(p.nome)}
            >
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: p.nome === 'OUTROS' ? COR_OUTROS : corPorIndice(i) }} />
              <span className="min-w-0 flex-1 truncate text-slate-700">{p.nome}</span>
              <span className="tabular-nums text-slate-900">{fmt.format(p.valor)}</span>
              <span className="w-9 text-right tabular-nums text-slate-500">{Math.round((p.valor / total) * 100)}%</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
