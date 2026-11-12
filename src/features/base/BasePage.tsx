import { useMemo, useState } from 'react';
import clsx from 'clsx';
import type { Erro, Solicitacao, TipoRegistro } from '../../domain/types';
import { formatDateBR } from '../../domain/calc';
import { useAppStore } from '../../store/useAppStore';
import { Card, Modal, Badge } from '../../components/ui';
import { DataTable, type Coluna } from '../../components/DataTable';
import { toast } from '../../components/Toast';
import { EditarRegistroModal, type Alvo } from './EditarRegistroModal';

const COL_ERROS: Coluna<Erro>[] = [
  { chave: 'dataMov', titulo: 'Data', largura: '100px', render: (r) => formatDateBR(r.dataMov) },
  { chave: 'mesCompetencia', titulo: 'Compet.', largura: '80px', filtravel: true, valor: (r) => r.mesCompetencia },
  { chave: 'empresa', titulo: 'Empresa', filtravel: true },
  { chave: 'docRef', titulo: 'Doc.' },
  { chave: 'setor', titulo: 'Setor', filtravel: true },
  { chave: 'usuario', titulo: 'Usuário', filtravel: true },
  { chave: 'tipoAnalise', titulo: 'Tipo de análise', filtravel: true },
  { chave: 'categoria', titulo: 'Categoria', filtravel: true },
  { chave: 'erroDetalhado', titulo: 'Erro detalhado' },
  { chave: 'qtde', titulo: 'Qtde', largura: '60px', alinhar: 'right' },
  { chave: 'origem', titulo: 'Origem', largura: '90px', render: (r) => <Badge tom={r.origem === 'importacao' ? 'blue' : 'slate'}>{r.origem === 'importacao' ? 'Excel' : 'Manual'}</Badge> },
];

const COL_SOL: Coluna<Solicitacao>[] = [
  { chave: 'dataMov', titulo: 'Data mov.', largura: '100px', render: (r) => formatDateBR(r.dataMov) },
  { chave: 'dataSolicitacao', titulo: 'Data solic.', largura: '100px', render: (r) => formatDateBR(r.dataSolicitacao) },
  { chave: 'diasParaIdentificar', titulo: 'Dias', largura: '60px', alinhar: 'right', render: (r) => <span className={clsx(r.diasParaIdentificar < 0 && 'font-semibold text-amber-600')}>{r.diasParaIdentificar}</span> },
  { chave: 'mesCompetencia', titulo: 'Compet.', largura: '80px', filtravel: true },
  { chave: 'empresa', titulo: 'Empresa', filtravel: true },
  { chave: 'docRef', titulo: 'Doc.' },
  { chave: 'setor', titulo: 'Setor', filtravel: true },
  { chave: 'solicitante', titulo: 'Solicitante', filtravel: true },
  { chave: 'motivo', titulo: 'Motivo' },
  { chave: 'qtde', titulo: 'Qtde', largura: '60px', alinhar: 'right' },
  { chave: 'origem', titulo: 'Origem', largura: '90px', render: (r) => <Badge tom={r.origem === 'importacao' ? 'blue' : 'slate'}>{r.origem === 'importacao' ? 'Excel' : 'Manual'}</Badge> },
];

export default function BasePage() {
  const erros = useAppStore((s) => s.erros);
  const solicitacoes = useAppStore((s) => s.solicitacoes);
  const excluirErros = useAppStore((s) => s.excluirErros);
  const excluirSolicitacoes = useAppStore((s) => s.excluirSolicitacoes);

  const [aba, setAba] = useState<TipoRegistro>('erros');
  const [busca, setBusca] = useState('');
  const [alvo, setAlvo] = useState<Alvo>(null);
  const [excluir, setExcluir] = useState<string[] | null>(null);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  const errosOrdenados = useMemo(() => erros.slice().sort((a, b) => b.dataMov.localeCompare(a.dataMov) || b.criadoEm.localeCompare(a.criadoEm)), [erros]);
  const solOrdenadas = useMemo(() => solicitacoes.slice().sort((a, b) => b.dataMov.localeCompare(a.dataMov) || b.criadoEm.localeCompare(a.criadoEm)), [solicitacoes]);

  async function confirmarExclusao() {
    if (!excluir) return;
    try {
      if (aba === 'erros') await excluirErros(excluir);
      else await excluirSolicitacoes(excluir);
      toast.ok(`${excluir.length} registro${excluir.length > 1 ? 's' : ''} excluído${excluir.length > 1 ? 's' : ''}.`);
      setSelecionados(new Set());
    } catch (e) {
      toast.erro(`Falha ao excluir: ${(e as Error).message}`);
    } finally {
      setExcluir(null);
    }
  }

  function trocarAba(a: TipoRegistro) {
    setAba(a);
    setSelecionados(new Set());
  }

  return (
    <Card
      titulo={
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1" role="tablist">
          <button role="tab" aria-selected={aba === 'erros'} className={clsx('rounded-md px-3 py-1.5 text-sm font-semibold', aba === 'erros' ? 'bg-white text-brand-primary shadow' : 'text-slate-500')} onClick={() => trocarAba('erros')}>
            Erros ({erros.length})
          </button>
          <button role="tab" aria-selected={aba === 'solicitacoes'} className={clsx('rounded-md px-3 py-1.5 text-sm font-semibold', aba === 'solicitacoes' ? 'bg-white text-brand-primary shadow' : 'text-slate-500')} onClick={() => trocarAba('solicitacoes')}>
            Solicitações ({solicitacoes.length})
          </button>
        </div>
      }
      acoes={
        <>
          {selecionados.size > 0 && (
            <button className="btn-danger !py-1.5" onClick={() => setExcluir([...selecionados])}>
              Excluir selecionados ({selecionados.size})
            </button>
          )}
          <input className="input !w-64" placeholder="Buscar em todas as colunas…" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar" />
        </>
      }
    >
      {aba === 'erros' ? (
        <DataTable<Erro>
          key="erros"
          colunas={COL_ERROS}
          linhas={errosOrdenados}
          busca={busca}
          onEditar={(r) => setAlvo({ tipo: 'erros', registro: r })}
          onExcluir={(r) => setExcluir([r.id])}
          selecao={{ ids: selecionados, onChange: setSelecionados }}
          vazio="Nenhum erro lançado. Use Lançar ou Importar."
        />
      ) : (
        <DataTable<Solicitacao>
          key="sol"
          colunas={COL_SOL}
          linhas={solOrdenadas}
          busca={busca}
          onEditar={(r) => setAlvo({ tipo: 'solicitacoes', registro: r })}
          onExcluir={(r) => setExcluir([r.id])}
          selecao={{ ids: selecionados, onChange: setSelecionados }}
          vazio="Nenhuma solicitação lançada."
        />
      )}

      <EditarRegistroModal alvo={alvo} onFechar={() => setAlvo(null)} />

      <Modal aberto={!!excluir} titulo="Confirmar exclusão" onFechar={() => setExcluir(null)} largura="max-w-md">
        <p className="text-sm text-slate-700">
          Excluir {excluir?.length === 1 ? 'este registro' : `${excluir?.length} registros`}? Esta ação não pode ser desfeita e os dashboards serão atualizados imediatamente.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={() => setExcluir(null)}>
            Cancelar
          </button>
          <button className="btn-danger" onClick={() => void confirmarExclusao()}>
            Excluir
          </button>
        </div>
      </Modal>
    </Card>
  );
}
