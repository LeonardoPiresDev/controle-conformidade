import { normalizeText } from '../domain/calc';
import type { AbaBruta } from './parse';

export type CampoAlvo =
  | 'codEmp'
  | 'empresa'
  | 'dataMov'
  | 'dataSolicitacao'
  | 'mesCompetencia'
  | 'diasParaIdentificar'
  | 'docRef'
  | 'setor'
  | 'tipoAnalise'
  | 'qtde'
  | 'usuario'
  | 'erroDetalhado'
  | 'categoria'
  | 'obs'
  | 'solicitante'
  | 'motivo';

export type TipoAba = 'erros' | 'solicitacoes' | 'ignorar';

export interface Deteccao {
  tipo: TipoAba;
  linhaCabecalho: number;
  mapa: Record<CampoAlvo, number | null>;
  cabecalhos: string[];
}

export const CAMPOS: CampoAlvo[] = [
  'codEmp', 'empresa', 'dataMov', 'dataSolicitacao', 'mesCompetencia', 'diasParaIdentificar', 'docRef', 'setor',
  'tipoAnalise', 'qtde', 'usuario', 'erroDetalhado', 'categoria', 'obs', 'solicitante', 'motivo',
];

export const ROTULOS: Record<CampoAlvo, string> = {
  codEmp: 'Cód. Empresa',
  empresa: 'Empresa',
  dataMov: 'Data do movimento',
  dataSolicitacao: 'Data da solicitação',
  mesCompetencia: 'Mês competência',
  diasParaIdentificar: 'Dias para identificar',
  docRef: 'Doc. referência',
  setor: 'Setor',
  tipoAnalise: 'Tipo de análise',
  qtde: 'Qtde',
  usuario: 'Usuário',
  erroDetalhado: 'Erro detalhado',
  categoria: 'Categoria',
  obs: 'Obs',
  solicitante: 'Solicitante',
  motivo: 'Motivo',
};

/** Sinônimos já normalizados (sem acento, maiúsculas, sem pontuação). */
const SINONIMOS: Record<CampoAlvo, string[]> = {
  codEmp: ['COD EMP', 'CODIGO EMPRESA', 'COD EMPRESA', 'EMPRESA COD', 'COD'],
  empresa: ['DESC EMPRESA', 'EMPRESA', 'DESCRICAO EMPRESA', 'NOME EMPRESA'],
  dataMov: ['DATA MOV', 'DATA DO MOVIMENTO', 'DATA MOVIMENTO', 'DT MOV', 'DATA'],
  dataSolicitacao: ['DATA SOLICITACAO', 'DATA DA SOLICITACAO', 'DT SOLICITACAO'],
  mesCompetencia: ['MES COMPETENCIA', 'COMPETENCIA', 'MES'],
  diasParaIdentificar: ['DIAS PARA IDENTIFICAR O ERRO', 'DIAS PARA IDENTIFICAR', 'DIAS'],
  docRef: ['DOC REFERENCIA', 'DOCUMENTO', 'DOC REF', 'DOC', 'DOCUMENTO REFERENCIA'],
  setor: ['SETOR', 'AREA', 'DEPARTAMENTO'],
  tipoAnalise: ['TIPO DE ANALISE DE CUSTOS', 'TIPO DE ANALISE', 'TIPO ANALISE', 'TIPO'],
  qtde: ['QTDE', 'QTD', 'QUANTIDADE'],
  usuario: ['USUARIO', 'RESPONSAVEL', 'COLABORADOR'],
  erroDetalhado: ['ERRO DETALHADO', 'ERRO', 'DESCRICAO DO ERRO', 'DETALHE'],
  categoria: ['CATEGORIA', 'TIPO DE ERRO', 'CATEGORIA DO ERRO'],
  obs: ['OBS', 'OBSERVACAO', 'OBSERVACOES'],
  solicitante: ['SOLICITANTE'],
  motivo: ['MOTIVO', 'JUSTIFICATIVA'],
};

export function normalizarCabecalho(s: unknown): string {
  return normalizeText(String(s ?? ''))
    .replace(/[.:_\-\/()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function mapaVazio(): Record<CampoAlvo, number | null> {
  return Object.fromEntries(CAMPOS.map((c) => [c, null])) as Record<CampoAlvo, number | null>;
}

export function mapearCabecalhos(cabecalhos: unknown[]): Record<CampoAlvo, number | null> {
  const mapa = mapaVazio();
  const norm = cabecalhos.map(normalizarCabecalho);
  const usados = new Set<number>();
  // 1ª passada: casamento exato (mais específico primeiro)
  for (const campo of CAMPOS) {
    for (const sin of SINONIMOS[campo]) {
      const idx = norm.findIndex((h, i) => h === sin && !usados.has(i));
      if (idx >= 0) {
        mapa[campo] = idx;
        usados.add(idx);
        break;
      }
    }
  }
  // 2ª passada: contém (para cabeçalhos com sufixos como "SETOR RESPONSÁVEL")
  for (const campo of CAMPOS) {
    if (mapa[campo] != null) continue;
    for (const sin of SINONIMOS[campo]) {
      if (sin.length < 4) continue;
      const idx = norm.findIndex((h, i) => h.includes(sin) && !usados.has(i));
      if (idx >= 0) {
        mapa[campo] = idx;
        usados.add(idx);
        break;
      }
    }
  }
  return mapa;
}

export function detectarAba(aba: AbaBruta): Deteccao {
  const limite = Math.min(aba.linhas.length, 15);
  for (let i = 0; i < limite; i++) {
    const linha = aba.linhas[i] ?? [];
    const norm = linha.map(normalizarCabecalho);
    const temCod = norm.some((h) => h === 'COD EMP' || h.startsWith('COD EMP') || h === 'CODIGO EMPRESA');
    const temData = norm.some((h) => h.includes('DATA'));
    if (!temCod || !temData) continue;
    const mapa = mapearCabecalhos(linha);
    let tipo: TipoAba = 'ignorar';
    if (mapa.dataSolicitacao != null || mapa.solicitante != null || mapa.motivo != null) tipo = 'solicitacoes';
    else if (mapa.categoria != null || mapa.usuario != null) tipo = 'erros';
    return { tipo, linhaCabecalho: i, mapa, cabecalhos: linha.map((c) => String(c ?? '')) };
  }
  return { tipo: 'ignorar', linhaCabecalho: -1, mapa: mapaVazio(), cabecalhos: [] };
}
