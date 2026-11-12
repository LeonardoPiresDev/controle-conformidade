import type { Config, Erro, Solicitacao } from '../domain/types';
import type { Filtros, Ponto } from '../domain/aggregate';
import { formatDateBR } from '../domain/calc';
import { calcularDados, type Cards } from '../features/dashboard/useDadosFiltrados';

export interface MatrizSetorCategoria {
  categorias: string[];
  linhas: { setor: string; valores: number[]; total: number }[];
  totaisColuna: number[];
  totalGeral: number;
}

export interface DadosRelatorio {
  titulo: string;
  nomeEmpresa: string;
  logoDataUrl: string | null;
  periodoTexto: string;
  filtrosTexto: string;
  emitidoEm: string;
  cards: Cards;
  causas: Ponto[];
  evolucaoErros: { mes: string; valor: number }[];
  rankingSetor: Ponto[];
  rankingUsuario: Ponto[];
  matriz: MatrizSetorCategoria;
  topUsuarios: Ponto[];
  solPorSetor: Ponto[];
  evolucaoSol: { mes: string; valor: number }[];
  medianaPorSetor: Ponto[];
  totalSolicitacoes: number;
}

export function montarMatriz(erros: Erro[]): MatrizSetorCategoria {
  const porCat = new Map<string, number>();
  const porSetor = new Map<string, Map<string, number>>();
  for (const e of erros) {
    porCat.set(e.categoria, (porCat.get(e.categoria) ?? 0) + e.qtde);
    const linha = porSetor.get(e.setor) ?? new Map<string, number>();
    linha.set(e.categoria, (linha.get(e.categoria) ?? 0) + e.qtde);
    porSetor.set(e.setor, linha);
  }
  const categorias = [...porCat.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([c]) => c);
  const linhas = [...porSetor.entries()]
    .map(([setor, m]) => {
      const valores = categorias.map((c) => m.get(c) ?? 0);
      return { setor, valores, total: valores.reduce((s, v) => s + v, 0) };
    })
    .sort((a, b) => b.total - a.total || a.setor.localeCompare(b.setor));
  const totaisColuna = categorias.map((c) => porCat.get(c) ?? 0);
  return { categorias, linhas, totaisColuna, totalGeral: totaisColuna.reduce((s, v) => s + v, 0) };
}

function textoFiltros(f: Filtros): string {
  const partes: string[] = [];
  if (f.codEmp.length) partes.push(`Empresa: ${f.codEmp.join(', ')}`);
  if (f.setores.length) partes.push(`Setor: ${f.setores.join(', ')}`);
  if (f.usuarios.length) partes.push(`Usuário: ${f.usuarios.join(', ')}`);
  if (f.tiposAnalise.length) partes.push(`Tipo: ${f.tiposAnalise.join(', ')}`);
  if (f.categorias.length) partes.push(`Categoria: ${f.categorias.join(', ')}`);
  return partes.join(' · ');
}

export function agoraFormatado(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function montarDadosRelatorio(erros: Erro[], solicitacoes: Solicitacao[], filtros: Filtros, config: Config): DadosRelatorio {
  const d = calcularDados(erros, solicitacoes, filtros);
  return {
    titulo: config.tituloRelatorio,
    nomeEmpresa: config.nomeEmpresa,
    logoDataUrl: config.logoDataUrl,
    periodoTexto: filtros.periodo ? `${formatDateBR(filtros.periodo.inicio)} a ${formatDateBR(filtros.periodo.fim)}` : 'Todo o período',
    filtrosTexto: textoFiltros(filtros),
    emitidoEm: agoraFormatado(),
    cards: d.cards,
    causas: d.causas,
    evolucaoErros: d.evolucaoErros,
    rankingSetor: d.rankingSetor,
    rankingUsuario: d.rankingUsuario,
    matriz: montarMatriz(d.errosFiltrados),
    topUsuarios: d.rankingUsuario.slice(0, 10),
    solPorSetor: d.solPorSetor,
    evolucaoSol: d.evolucaoSol,
    medianaPorSetor: d.medianaPorSetor,
    totalSolicitacoes: d.cards.totalSolicitacoes,
  };
}

/** Largura/altura em px das páginas renderizadas (A4 paisagem a 96dpi ≈ 1123×794). */
export const PAGINA_PX = { largura: 1123, altura: 794 };

/** Captura cada página (elemento HTML) e monta um PDF A4 paisagem. */
export async function gerarPdf(paginas: HTMLElement[]): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  for (let i = 0; i < paginas.length; i++) {
    if (i > 0) pdf.addPage();
    try {
      const canvas = await html2canvas(paginas[i], { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false, width: PAGINA_PX.largura, height: PAGINA_PX.altura });
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, w, h, undefined, 'FAST');
    } catch (e) {
      pdf.setFontSize(12);
      pdf.text(`Não foi possível renderizar a página ${i + 1}: ${(e as Error).message}`, 15, 20);
    }
  }
  return pdf.output('blob');
}
