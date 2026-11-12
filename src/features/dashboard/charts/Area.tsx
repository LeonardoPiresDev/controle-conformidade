import { Area as RArea, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LabelList } from 'recharts';
import { GRID, TEXTO_SEC } from './palette';
import { EmptyState } from '../../../components/ui';

const fmt = new Intl.NumberFormat('pt-BR');

export function Area({ dados, rotulo, altura = 240 }: { dados: { mes: string; valor: number }[]; rotulo: string; altura?: number }) {
  if (!dados.length) return <EmptyState titulo="Sem dados no filtro atual" />;
  const cor = getComputedStyle(document.documentElement).getPropertyValue('--brand-accent').trim() || '#2F8BD8';
  return (
    <div style={{ height: altura }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dados} margin={{ top: 18, right: 16, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={cor} stopOpacity={0.35} />
              <stop offset="100%" stopColor={cor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="mes" tick={{ fontSize: 11, fill: TEXTO_SEC }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: TEXTO_SEC }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip formatter={(v: number) => [fmt.format(v), rotulo]} labelFormatter={(l) => `Competência ${l}`} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <RArea type="monotone" dataKey="valor" name={rotulo} stroke={cor} strokeWidth={2} fill="url(#grad-area)" dot={{ r: 4, fill: cor, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} isAnimationActive={false}>
            <LabelList dataKey="valor" position="top" style={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} formatter={(v: number) => fmt.format(v)} />
          </RArea>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
