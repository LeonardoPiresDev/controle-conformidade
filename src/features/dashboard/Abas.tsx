import clsx from 'clsx';
import { Card } from '../../components/ui';
import { useAppStore } from '../../store/useAppStore';
import type { DadosDashboard } from './useDadosFiltrados';
import { useToggleFiltro } from './FiltrosGlobais';
import { Donut } from './charts/Donut';
import { Area } from './charts/Area';
import { BarrasRanking } from './charts/BarrasRanking';

function FiltroTipoAnalise() {
  const tipos = useAppStore((s) => s.cadastros.tiposAnalise);
  const sel = useAppStore((s) => s.filtros.tiposAnalise);
  const toggle = useToggleFiltro();
  return (
    <ul className="grid gap-1">
      {tipos.map((t) => (
        <li key={t}>
          <button type="button" className={clsx('flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition', sel.includes(t) ? 'bg-brand-primary text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100')} onClick={() => toggle('tiposAnalise', t)} aria-pressed={sel.includes(t)}>
            <span className={clsx('h-2.5 w-2.5 rounded-full', sel.includes(t) ? 'bg-brand-accent' : 'bg-slate-300')} />
            {t}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function AbaErrosUsuario({ d }: { d: DadosDashboard }) {
  const f = useAppStore((s) => s.filtros);
  const toggle = useToggleFiltro();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card titulo="Tipo de Análise de Custos">
        <FiltroTipoAnalise />
      </Card>
      <Card titulo="Principais Causas de Erros" id="chart-categoria">
        <Donut dados={d.causas} selecionados={f.categorias} onClique={(n) => toggle('categorias', n)} />
      </Card>
      <Card titulo="Evolução Mensal de Erros" id="chart-evolucao">
        <Area dados={d.evolucaoErros} rotulo="Qtde de erros" />
      </Card>
      <Card titulo="Ranking de Erros por Usuário" id="chart-ranking-usuario">
        <BarrasRanking dados={d.rankingUsuario} rotulo="Qtde de erros" selecionados={f.usuarios} onClique={(n) => toggle('usuarios', n)} limite={12} />
      </Card>
    </div>
  );
}

export function AbaErrosSetor({ d }: { d: DadosDashboard }) {
  const f = useAppStore((s) => s.filtros);
  const toggle = useToggleFiltro();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card titulo="Tipo de Análise de Custos">
        <FiltroTipoAnalise />
      </Card>
      <Card titulo="Principais Causas de Erros" id="chart-categoria-setor">
        <Donut dados={d.causas} selecionados={f.categorias} onClique={(n) => toggle('categorias', n)} />
      </Card>
      <Card titulo="Evolução Mensal de Erros" id="chart-evolucao-setor">
        <Area dados={d.evolucaoErros} rotulo="Qtde de erros" />
      </Card>
      <Card titulo="Ranking de Erros por Setor" id="chart-ranking-setor">
        <BarrasRanking dados={d.rankingSetor} rotulo="Qtde de erros" selecionados={f.setores} onClique={(n) => toggle('setores', n)} limite={15} />
      </Card>
    </div>
  );
}

export function AbaSolicitacoes({ d }: { d: DadosDashboard }) {
  const f = useAppStore((s) => s.filtros);
  const toggle = useToggleFiltro();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card titulo="Solicitações de Abertura de Período por Setor" id="chart-sol-setor" className="lg:col-span-2">
        <Donut dados={d.solPorSetor} selecionados={f.setores} onClique={(n) => toggle('setores', n)} />
      </Card>
      <Card titulo="Evolução Mensal de Solicitações" id="chart-sol-evolucao">
        <Area dados={d.evolucaoSol} rotulo="Solicitações" />
      </Card>
      <Card titulo="Mediana de Dias para Identificação por Setor" id="chart-sol-mediana">
        <BarrasRanking dados={d.medianaPorSetor} rotulo="Mediana de dias" selecionados={f.setores} onClique={(n) => toggle('setores', n)} />
      </Card>
    </div>
  );
}
