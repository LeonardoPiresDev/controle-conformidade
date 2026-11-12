import * as XLSX from 'xlsx';
import type { Cadastros } from '../domain/types';
import { montarWorkbook, workbookParaBuffer } from '../export/excel';

export const ABA_LISTAS = 'Listas';

/** Planilha modelo: abas de dados vazias (cabeçalho na linha 3) + aba Listas com os cadastros. */
export function gerarModelo(cadastros: Cadastros): ArrayBuffer {
  const wb = montarWorkbook([], [], cadastros);
  const n = Math.max(cadastros.empresas.length, cadastros.setores.length, cadastros.tiposAnalise.length, cadastros.categorias.length, cadastros.usuarios.length);
  const linhas: unknown[][] = [['EMPRESAS', 'SETORES', 'TIPOS DE ANÁLISE', 'CATEGORIAS', 'USUÁRIOS']];
  for (let i = 0; i < n; i++) {
    const e = cadastros.empresas[i];
    linhas.push([
      e ? `${e.codEmp} - ${e.nome}` : '',
      cadastros.setores[i] ?? '',
      cadastros.tiposAnalise[i] ?? '',
      cadastros.categorias[i] ?? '',
      cadastros.usuarios[i]?.nome ?? '',
    ]);
  }
  const ws = XLSX.utils.aoa_to_sheet(linhas);
  ws['!cols'] = [24, 18, 32, 40, 32].map((wch) => ({ wch }));
  XLSX.utils.book_append_sheet(wb, ws, ABA_LISTAS);
  return workbookParaBuffer(wb);
}
