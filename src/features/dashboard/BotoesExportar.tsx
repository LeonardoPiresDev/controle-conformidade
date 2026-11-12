import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { toast } from '../../components/Toast';
import { gerarIndicadorXlsx } from '../../export/excel';
import { baixarArquivo, carimboData, MIME_XLSX } from '../../export/download';
import { gerarPdf, montarDadosRelatorio, type DadosRelatorio } from '../../export/pdf';
import { RelatorioOculto } from '../../export/RelatorioOculto';
import type { DadosDashboard } from './useDadosFiltrados';

function ehMobile(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
}

export function BotoesExportar({ dados }: { dados: DadosDashboard }) {
  const erros = useAppStore((s) => s.erros);
  const solicitacoes = useAppStore((s) => s.solicitacoes);
  const cadastros = useAppStore((s) => s.cadastros);
  const filtros = useAppStore((s) => s.filtros);
  const config = useAppStore((s) => s.config);

  const [relatorio, setRelatorio] = useState<DadosRelatorio | null>(null);
  const [gerando, setGerando] = useState(false);
  const [ultimoPdf, setUltimoPdf] = useState<{ file: File; titulo: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  function excel(filtrado: boolean) {
    const buf = filtrado ? gerarIndicadorXlsx(dados.errosFiltrados, dados.solFiltradas, cadastros) : gerarIndicadorXlsx(erros, solicitacoes, cadastros);
    baixarArquivo(buf, `Indicador_${carimboData()}${filtrado ? '_filtro' : ''}.xlsx`, MIME_XLSX);
    toast.ok('Excel gerado.');
  }

  function pdf() {
    setGerando(true);
    setUltimoPdf(null);
    setRelatorio(montarDadosRelatorio(erros, solicitacoes, filtros, config));
  }

  /** Compartilhar exige gesto do usuário: botão próprio, clicado depois que o arquivo está pronto. */
  async function compartilhar() {
    if (!ultimoPdf) return;
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    try {
      if (nav.share && nav.canShare?.({ files: [ultimoPdf.file] })) {
        await nav.share({ files: [ultimoPdf.file], title: ultimoPdf.titulo });
      } else {
        baixarArquivo(ultimoPdf.file, ultimoPdf.file.name, 'application/pdf');
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast.erro(`Não foi possível compartilhar: ${(e as Error).message}`);
    }
  }

  useEffect(() => {
    if (!relatorio || !ref.current) return;
    let cancelado = false;
    const t = setTimeout(async () => {
      try {
        const paginas = Array.from(ref.current?.querySelectorAll<HTMLElement>('.relatorio-pagina') ?? []);
        const blob = await gerarPdf(paginas);
        if (cancelado) return;
        const nome = `Relatorio_Conformidade_${carimboData()}.pdf`;
        const file = new File([blob], nome, { type: 'application/pdf' });
        baixarArquivo(blob, nome, 'application/pdf');
        setUltimoPdf({ file, titulo: relatorio.titulo });
        toast.ok(ehMobile() ? 'PDF gerado. Use "Compartilhar" para enviar.' : 'PDF executivo gerado.');
      } catch (e) {
        toast.erro(`Falha ao gerar PDF: ${(e as Error).message}`);
      } finally {
        if (!cancelado) {
          setRelatorio(null);
          setGerando(false);
        }
      }
    }, 600); // dá tempo ao Recharts de medir e desenhar as páginas ocultas
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [relatorio]);

  return (
    <div className="flex flex-wrap gap-2">
      <button className="btn-accent" onClick={pdf} disabled={gerando} title="Relatório A4 paisagem com logo, cards, gráficos e tabela síntese">
        {gerando ? 'Gerando PDF…' : '📄 PDF Executivo'}
      </button>
      {ultimoPdf && ehMobile() && (
        <button className="btn-primary" onClick={() => void compartilhar()} title="WhatsApp, e-mail…">
          Compartilhar
        </button>
      )}
      <button className="btn-ghost" onClick={() => excel(true)} title="Exporta apenas os registros do filtro atual">
        ⬇ Excel (filtro)
      </button>
      <button className="btn-ghost" onClick={() => excel(false)} title="Exporta toda a base no formato da Indicador.xlsx">
        ⬇ Excel (tudo)
      </button>
      {relatorio && <RelatorioOculto ref={ref} d={relatorio} />}
    </div>
  );
}
