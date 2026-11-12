import * as XLSX from 'xlsx';
import type { Cadastros, Erro, Solicitacao } from '../domain/types';

export const ABA_CATEGORIAS = 'Categorias';
export const ABA_ERROS = 'Análises de Custo';
export const ABA_SOLICITACOES = 'Solicitação abertura de Periodo';

export const CABECALHO_ERROS = [
  'CÓD EMP',
  'DESC. EMPRESA',
  'DATA MOV',
  'MÊS COMPETÊNCIA',
  'DOC. REFERÊNCIA',
  'SETOR',
  'TIPO DE ANÁLISE DE CUSTOS',
  'QTDE',
  'USUÁRIO',
  'ERRO DETALHADO',
  'CATEGORIA',
  'OBS',
];

export const CABECALHO_SOLICITACOES = [
  'CÓD EMP',
  'DESC. EMPRESA',
  'DATA DO MOVIMENTO',
  'DATA SOLICITAÇÃO',
  'MÊS COMPETÊNCIA',
  'DIAS PARA IDENTIFICAR O ERRO',
  'DOC. REFERÊNCIA',
  'SETOR',
  'QTDE',
  'SOLICITANTE',
  'MOTIVO',
];

const FORMATO_DATA = 'dd/mm/yy';

function dataLocal(iso: string): Date | '' {
  if (!iso) return '';
  return new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));
}

function aplicarFormatoData(ws: XLSX.WorkSheet, colunas: number[], primeiraLinha: number, ultimaLinha: number) {
  for (const c of colunas) {
    for (let r = primeiraLinha; r <= ultimaLinha; r++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      const cell = ws[ref];
      if (cell && cell.t === 'd') cell.z = FORMATO_DATA;
    }
  }
}

function larguras(ws: XLSX.WorkSheet, cols: number[]) {
  ws['!cols'] = cols.map((wch) => ({ wch }));
}

/** Garante que a faixa da aba comece em A1 (linhas 1-2 vazias, cabeçalho na 3). */
function ancorarA1(ws: XLSX.WorkSheet) {
  const ref = ws['!ref'];
  if (!ref) return;
  const range = XLSX.utils.decode_range(ref);
  range.s.r = 0;
  range.s.c = 0;
  ws['!ref'] = XLSX.utils.encode_range(range);
}

export function montarAbaErros(erros: Erro[]): XLSX.WorkSheet {
  const linhas: unknown[][] = [[], [], CABECALHO_ERROS];
  for (const e of erros) {
    linhas.push([e.codEmp, e.empresa, dataLocal(e.dataMov), e.mesCompetencia, e.docRef, e.setor, e.tipoAnalise, e.qtde, e.usuario, e.erroDetalhado, e.categoria, e.obs]);
  }
  const ws = XLSX.utils.aoa_to_sheet(linhas, { cellDates: true });
  ancorarA1(ws);
  aplicarFormatoData(ws, [2], 3, linhas.length - 1);
  larguras(ws, [9, 20, 11, 12, 16, 16, 32, 6, 26, 50, 36, 30]);
  ws['!autofilter'] = { ref: `A3:L${Math.max(3, linhas.length)}` };
  return ws;
}

export function montarAbaSolicitacoes(sols: Solicitacao[]): XLSX.WorkSheet {
  const linhas: unknown[][] = [[], [], CABECALHO_SOLICITACOES];
  for (const s of sols) {
    linhas.push([s.codEmp, s.empresa, dataLocal(s.dataMov), dataLocal(s.dataSolicitacao), s.mesCompetencia, s.diasParaIdentificar, s.docRef, s.setor, s.qtde, s.solicitante, s.motivo]);
  }
  const ws = XLSX.utils.aoa_to_sheet(linhas, { cellDates: true });
  ancorarA1(ws);
  aplicarFormatoData(ws, [2, 3], 3, linhas.length - 1);
  larguras(ws, [9, 20, 12, 12, 12, 10, 16, 16, 6, 26, 60]);
  ws['!autofilter'] = { ref: `A3:K${Math.max(3, linhas.length)}` };
  return ws;
}

export function montarAbaCategorias(categorias: string[]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet([['CATEGORIAS'], ...categorias.map((c) => [c])]);
  larguras(ws, [40]);
  return ws;
}

export function montarWorkbook(erros: Erro[], solicitacoes: Solicitacao[], cadastros: Cadastros): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, montarAbaCategorias(cadastros.categorias), ABA_CATEGORIAS);
  XLSX.utils.book_append_sheet(wb, montarAbaErros(erros), ABA_ERROS);
  XLSX.utils.book_append_sheet(wb, montarAbaSolicitacoes(solicitacoes), ABA_SOLICITACOES);
  return wb;
}

export function workbookParaBuffer(wb: XLSX.WorkBook): ArrayBuffer {
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx', cellDates: true }) as ArrayBuffer;
}

/** Gera a planilha no formato exato da Indicador.xlsx original. */
export function gerarIndicadorXlsx(erros: Erro[], solicitacoes: Solicitacao[], cadastros: Cadastros): ArrayBuffer {
  return workbookParaBuffer(montarWorkbook(erros, solicitacoes, cadastros));
}
