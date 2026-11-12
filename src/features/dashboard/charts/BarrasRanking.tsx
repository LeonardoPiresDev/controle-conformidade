import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Ponto } from '../../../domain/aggregate';
import { GRID, TEXTO_SEC } from './palette';
import { EmptyState } from '../../../components/ui';

const fmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

export function BarrasRanking({ dados, rotulo, onClique, selecionados = [], limite = 10, altura }: { dados: Ponto[]; rotulo: string; onClique?: (nome: string) => void; selecionados?: string[]; limite?: number; altura?: number }) {
  const top = dados.slice(0, limite);
  if (!top.length) return <EmptyState titulo="Sem dados no filtro atual" />;
  const cor = getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim() || '#0F2B46';
  const h = altura ?? Math.max(160, top.length * 28 + 20);
  return (
    <div style={{ height: h }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={top} layout="vertical" margin={{ top: 4, right: 48, left: 8, bottom: 4 }} barCategoryGap={6}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="nome" width={190} tick={{ fontSize: 11, fill: '#334155' }} axisLine={{ stroke: GRID }} tickLine={false} interval={0} />
          <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(v: number) => [fmt.format(v), rotulo]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Bar dataKey="valor" name={rotulo} radius={[0, 4, 4, 0]} isAnimationActive={false} onClick={(d: { nome?: string }) => d?.nome && onClique?.(d.nome)} cursor={onClique ? 'pointer' : 'default'}>
            {top.map((p) => (
              <Cell key={p.nome} fill={cor} opacity={selecionados.length && !selecionados.includes(p.nome) ? 0.35 : 1} />
            ))}
            <LabelList dataKey="valor" position="right" style={{ fontSize: 11, fill: TEXTO_SEC, fontWeight: 600 }} formatter={(v: number) => fmt.format(v)} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
