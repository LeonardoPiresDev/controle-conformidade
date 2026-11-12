import type { Erro, Solicitacao } from './types';

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

function dataValida(iso: string | undefined): boolean {
  return !!iso && ISO_RE.test(iso);
}

function vazio(s: string | undefined): boolean {
  return !s || !s.trim();
}

export function validarErro(e: Partial<Erro>): string[] {
  const m: string[] = [];
  if (!e.codEmp || e.codEmp <= 0) m.push('Empresa é obrigatória');
  if (!dataValida(e.dataMov)) m.push('Data do movimento inválida');
  if (vazio(e.setor)) m.push('Setor é obrigatório');
  if (vazio(e.tipoAnalise)) m.push('Tipo de análise é obrigatório');
  if (!e.qtde || e.qtde < 1) m.push('Qtde deve ser maior ou igual a 1');
  if (vazio(e.usuario)) m.push('Usuário é obrigatório');
  if (vazio(e.erroDetalhado)) m.push('Erro detalhado é obrigatório');
  if (vazio(e.categoria)) m.push('Categoria é obrigatória');
  return m;
}

export function validarSolicitacao(s: Partial<Solicitacao>): string[] {
  const m: string[] = [];
  if (!s.codEmp || s.codEmp <= 0) m.push('Empresa é obrigatória');
  if (!dataValida(s.dataMov)) m.push('Data do movimento inválida');
  if (!dataValida(s.dataSolicitacao)) m.push('Data da solicitação inválida');
  if (vazio(s.setor)) m.push('Setor é obrigatório');
  if (!s.qtde || s.qtde < 1) m.push('Qtde deve ser maior ou igual a 1');
  if (vazio(s.solicitante)) m.push('Solicitante é obrigatório');
  if (vazio(s.motivo)) m.push('Motivo é obrigatório');
  return m;
}
