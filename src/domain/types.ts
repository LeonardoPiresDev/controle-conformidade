export type Origem = 'manual' | 'importacao';

export interface RegistroBase {
  id: string;
  codEmp: number;
  empresa: string;
  /** ISO YYYY-MM-DD */
  dataMov: string;
  /** MM/AAAA — calculado */
  mesCompetencia: string;
  docRef: string;
  setor: string;
  qtde: number;
  criadoEm: string;
  atualizadoEm: string;
  origem: Origem;
}

export interface Erro extends RegistroBase {
  tipoAnalise: string;
  usuario: string;
  erroDetalhado: string;
  categoria: string;
  obs: string;
}

export interface Solicitacao extends RegistroBase {
  /** ISO YYYY-MM-DD */
  dataSolicitacao: string;
  /** calculado = dataSolicitacao - dataMov */
  diasParaIdentificar: number;
  solicitante: string;
  motivo: string;
}

export type Registro = Erro | Solicitacao;
export type TipoRegistro = 'erros' | 'solicitacoes';

export interface Empresa {
  codEmp: number;
  nome: string;
}

export interface Usuario {
  nome: string;
  setor: string;
}

export interface Cadastros {
  empresas: Empresa[];
  setores: string[];
  tiposAnalise: string[];
  categorias: string[];
  usuarios: Usuario[];
}

export interface Config {
  logoDataUrl: string | null;
  corPrimaria: string;
  corDestaque: string;
  nomeEmpresa: string;
  tituloRelatorio: string;
}
