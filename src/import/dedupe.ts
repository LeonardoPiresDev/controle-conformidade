import type { Erro, Solicitacao } from '../domain/types';
import { normalizeText } from '../domain/calc';
import type { LinhaImportada } from './validateRows';

export function chaveErro(e: Erro): string {
  return ['E', e.codEmp, e.dataMov, normalizeText(e.docRef), normalizeText(e.usuario), normalizeText(e.categoria)].join('|');
}

export function chaveSolicitacao(s: Solicitacao): string {
  return ['S', s.codEmp, s.dataMov, s.dataSolicitacao, normalizeText(s.docRef), normalizeText(s.solicitante), normalizeText(s.motivo)].join('|');
}

function ehSolicitacao(r: Erro | Solicitacao): r is Solicitacao {
  return 'solicitante' in r;
}

export function chaveRegistro(r: Erro | Solicitacao): string {
  return ehSolicitacao(r) ? chaveSolicitacao(r) : chaveErro(r);
}

/** Marca `duplicado` nas linhas cujo registro já existe na base (mesma chave natural). */
export function marcarDuplicados(linhas: LinhaImportada[], erros: Erro[], solicitacoes: Solicitacao[]): LinhaImportada[] {
  const existentes = new Set<string>([...erros.map(chaveErro), ...solicitacoes.map(chaveSolicitacao)]);
  return linhas.map((l) => ({
    ...l,
    duplicado: l.registro ? existentes.has(chaveRegistro(l.registro)) : false,
  }));
}
