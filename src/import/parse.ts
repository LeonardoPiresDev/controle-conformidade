import * as XLSX from 'xlsx';

export interface AbaBruta {
  nome: string;
  /** matriz linha × coluna; células vazias são '' */
  linhas: unknown[][];
}

function detectarSeparador(texto: string): string {
  const primeira = texto.split(/\r?\n/).find((l) => l.trim()) ?? '';
  const cont = (c: string) => primeira.split(c).length - 1;
  const candidatos: [string, number][] = [[';', cont(';')], [',', cont(',')], ['\t', cont('\t')]];
  candidatos.sort((a, b) => b[1] - a[1]);
  return candidatos[0][1] > 0 ? candidatos[0][0] : ';';
}

function paraMatriz(ws: XLSX.WorkSheet): unknown[][] {
  const linhas = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: '' });
  return linhas.map((l) => (Array.isArray(l) ? l : []));
}

/** Lê .xlsx/.xls/.csv e devolve todas as abas como matrizes brutas. */
export function lerArquivo(buf: ArrayBuffer, nomeArquivo: string): AbaBruta[] {
  const ext = nomeArquivo.toLowerCase().split('.').pop() ?? '';
  if (ext === 'csv' || ext === 'txt') {
    let texto: string;
    try {
      texto = new TextDecoder('utf-8', { fatal: true }).decode(buf);
    } catch {
      // CSV salvo pelo Excel pt-BR no Windows vem em Windows-1252
      texto = new TextDecoder('windows-1252').decode(buf);
    }
    if (texto.charCodeAt(0) === 0xfeff) texto = texto.slice(1);
    const FS = detectarSeparador(texto);
    const wb = XLSX.read(texto, { type: 'string', raw: true, FS });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return [{ nome: nomeArquivo.replace(/\.[^.]+$/, ''), linhas: paraMatriz(ws) }];
  }
  const wb = XLSX.read(new Uint8Array(buf), { type: 'array', cellDates: true });
  return wb.SheetNames.map((nome) => ({ nome, linhas: paraMatriz(wb.Sheets[nome]) }));
}
