import { useCallback, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { Card } from '../../components/ui';
import { toast } from '../../components/Toast';
import { useAppStore } from '../../store/useAppStore';
import { lerArquivo, type AbaBruta } from '../../import/parse';
import { detectarAba, type Deteccao } from '../../import/detect';
import { converterLinhas, consolidarNovosCadastros, type LinhaImportada } from '../../import/validateRows';
import { marcarDuplicados } from '../../import/dedupe';
import { gerarModelo } from '../../import/template';
import { baixarArquivo, carimboData, MIME_XLSX } from '../../export/download';
import type { Erro, Solicitacao } from '../../domain/types';
import { DropZone } from './DropZone';
import { MapeamentoColunas } from './MapeamentoColunas';
import { PreviewImportacao } from './PreviewImportacao';
import { ResumoImportacao, type Resumo } from './ResumoImportacao';

interface AbaAnalisada {
  aba: AbaBruta;
  det: Deteccao;
  linhas: LinhaImportada[];
}

type Etapa = { fase: 'vazio' } | { fase: 'lendo' } | { fase: 'preview'; nome: string; abas: AbaAnalisada[] } | { fase: 'importando' } | { fase: 'resumo'; resumo: Resumo; rejeitadas: { aba: AbaAnalisada; linhas: LinhaImportada[] }[] };

export default function ImportarPage() {
  const cadastros = useAppStore((s) => s.cadastros);
  const erros = useAppStore((s) => s.erros);
  const solicitacoes = useAppStore((s) => s.solicitacoes);
  const importarLote = useAppStore((s) => s.importarLote);

  const [etapa, setEtapa] = useState<Etapa>({ fase: 'vazio' });
  const [incluirDuplicados, setIncluirDuplicados] = useState(false);
  const [mostrarMapa, setMostrarMapa] = useState(false);

  const analisar = useCallback(
    (aba: AbaBruta, det: Deteccao): AbaAnalisada => {
      const linhas = marcarDuplicados(converterLinhas(aba, det, cadastros), erros, solicitacoes);
      return { aba, det, linhas };
    },
    [cadastros, erros, solicitacoes],
  );

  async function receberArquivo(file: File) {
    setEtapa({ fase: 'lendo' });
    try {
      const buf = await file.arrayBuffer();
      const abas = lerArquivo(buf, file.name)
        .map((aba) => ({ aba, det: detectarAba(aba) }))
        .filter((x) => x.det.tipo !== 'ignorar')
        .map((x) => analisar(x.aba, x.det));
      if (!abas.length) {
        toast.erro('Nenhuma aba reconhecida. Verifique se o cabeçalho tem "CÓD EMP" e as colunas da Indicador.xlsx.');
        setEtapa({ fase: 'vazio' });
        return;
      }
      setEtapa({ fase: 'preview', nome: file.name, abas });
    } catch (e) {
      toast.erro(`Não foi possível ler o arquivo: ${(e as Error).message}`);
      setEtapa({ fase: 'vazio' });
    }
  }

  function atualizarMapa(idx: number, det: Deteccao) {
    if (etapa.fase !== 'preview') return;
    const abas = etapa.abas.map((a, i) => (i === idx ? analisar(a.aba, det) : a));
    setEtapa({ ...etapa, abas });
  }

  const totais = useMemo(() => {
    if (etapa.fase !== 'preview') return null;
    const todas = etapa.abas.flatMap((a) => a.linhas);
    const aceitas = todas.filter((l) => l.status !== 'erro' && (incluirDuplicados || !l.duplicado));
    return {
      erros: etapa.abas.filter((a) => a.det.tipo === 'erros').reduce((n, a) => n + a.linhas.length, 0),
      solicitacoes: etapa.abas.filter((a) => a.det.tipo === 'solicitacoes').reduce((n, a) => n + a.linhas.length, 0),
      aceitas: aceitas.length,
      duplicadas: todas.filter((l) => l.duplicado).length,
      rejeitadas: todas.filter((l) => l.status === 'erro').length,
    };
  }, [etapa, incluirDuplicados]);

  async function confirmar() {
    if (etapa.fase !== 'preview') return;
    const abas = etapa.abas;
    setEtapa({ fase: 'importando' });
    try {
      const aceitas = abas.flatMap((a) => a.linhas).filter((l) => l.status !== 'erro' && l.registro && (incluirDuplicados || !l.duplicado));
      const errosNovos = aceitas.map((l) => l.registro!).filter((r): r is Erro => 'usuario' in r);
      const solNovas = aceitas.map((l) => l.registro!).filter((r): r is Solicitacao => 'solicitante' in r);
      const novosCadastros = consolidarNovosCadastros(aceitas);
      await importarLote({ erros: errosNovos, solicitacoes: solNovas, novosCadastros });
      const nNovos = Object.values(novosCadastros).reduce((n, arr) => n + (arr?.length ?? 0), 0);
      const todas = abas.flatMap((a) => a.linhas);
      setEtapa({
        fase: 'resumo',
        resumo: {
          importados: aceitas.length,
          duplicados: incluirDuplicados ? 0 : todas.filter((l) => l.duplicado && l.status !== 'erro').length,
          rejeitados: todas.filter((l) => l.status === 'erro').length,
          novosCadastros: nNovos,
        },
        rejeitadas: abas.map((aba) => ({ aba, linhas: aba.linhas.filter((l) => l.status === 'erro') })).filter((x) => x.linhas.length),
      });
      toast.ok(`${aceitas.length} registros importados.`);
    } catch (e) {
      toast.erro(`Falha na importação: ${(e as Error).message}`);
      setEtapa({ fase: 'preview', nome: 'arquivo', abas });
    }
  }

  function baixarModelo() {
    baixarArquivo(gerarModelo(cadastros), 'Modelo_Indicador.xlsx', MIME_XLSX);
  }

  function baixarRejeitadas() {
    if (etapa.fase !== 'resumo') return;
    const wb = XLSX.utils.book_new();
    for (const { aba, linhas } of etapa.rejeitadas) {
      const cab = [...aba.det.cabecalhos, 'MOTIVO DA REJEIÇÃO'];
      const dados = linhas.map((l) => [...aba.det.cabecalhos.map((_, i) => l.bruto[i] ?? ''), l.mensagens.join('; ')]);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([cab, ...dados]), aba.aba.nome.slice(0, 31));
    }
    baixarArquivo(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer, `Rejeitadas_${carimboData()}.xlsx`, MIME_XLSX);
  }

  return (
    <div className="grid gap-5">
      <Card
        titulo="Carga em lote"
        acoes={
          <button className="btn-ghost" onClick={baixarModelo}>
            ⬇ Baixar planilha modelo
          </button>
        }
      >
        {(etapa.fase === 'vazio' || etapa.fase === 'lendo') && <DropZone onArquivo={(f) => void receberArquivo(f)} ocupado={etapa.fase === 'lendo'} />}

        {etapa.fase === 'importando' && <p className="py-10 text-center text-sm text-slate-500">Gravando registros…</p>}

        {etapa.fase === 'resumo' && <ResumoImportacao resumo={etapa.resumo} onBaixarRejeitadas={etapa.rejeitadas.length ? baixarRejeitadas : undefined} onNovaImportacao={() => setEtapa({ fase: 'vazio' })} />}

        {etapa.fase === 'preview' && totais && (
          <div className="grid gap-5">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <span className="font-semibold text-brand-primary">{etapa.nome}</span>
              <span data-testid="total-erros">
                <b>{totais.erros}</b> erros
              </span>
              <span data-testid="total-solicitacoes">
                <b>{totais.solicitacoes}</b> solicitações
              </span>
              <span className="text-slate-600" data-testid="total-duplicadas">
                <b>{totais.duplicadas}</b> duplicadas
              </span>
              <span className="text-red-600" data-testid="total-rejeitadas">
                <b>{totais.rejeitadas}</b> rejeitadas
              </span>
              <label className="ml-auto flex items-center gap-2 text-xs">
                <input type="checkbox" checked={incluirDuplicados} onChange={(e) => setIncluirDuplicados(e.target.checked)} />
                Importar duplicadas mesmo assim
              </label>
              <button className="btn-ghost !py-1 text-xs" onClick={() => setMostrarMapa((v) => !v)}>
                {mostrarMapa ? 'Ocultar' : 'Ajustar'} mapeamento de colunas
              </button>
            </div>

            {etapa.abas.map((a, i) => (
              <div key={a.aba.nome} className="grid gap-3">
                {mostrarMapa && <MapeamentoColunas det={a.det} onChange={(d) => atualizarMapa(i, d)} />}
                <PreviewImportacao nome={a.aba.nome} det={a.det} linhas={a.linhas} />
              </div>
            ))}

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
              <button className="btn-ghost" onClick={() => setEtapa({ fase: 'vazio' })}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={() => void confirmar()}>
                Confirmar importação ({totais.aceitas} registros)
              </button>
            </div>
          </div>
        )}
      </Card>

      {etapa.fase === 'vazio' && (
        <Card titulo="Como funciona">
          <ol className="grid gap-2 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
            <li className="rounded-lg bg-slate-50 p-3"><b>1.</b> Solte a planilha. O sistema identifica sozinho as abas de Erros e Solicitações pelo cabeçalho.</li>
            <li className="rounded-lg bg-slate-50 p-3"><b>2.</b> Revise a pré-visualização: linhas rejeitadas (data inválida, obrigatório vazio) não entram; avisos entram e cadastram usuários/categorias novos.</li>
            <li className="rounded-lg bg-slate-50 p-3"><b>3.</b> Registros já existentes (mesmo doc., data, usuário e categoria) são marcados como duplicados e pulados por padrão.</li>
            <li className="rounded-lg bg-slate-50 p-3"><b>4.</b> Confirme. Competência e dias para identificar são calculados automaticamente e o dashboard atualiza na hora.</li>
          </ol>
        </Card>
      )}
    </div>
  );
}
