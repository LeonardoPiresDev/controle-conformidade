import type { Cadastros, Config, Erro, Solicitacao } from '../domain/types';

export interface Backup {
  versao: 1;
  geradoEm: string;
  erros: Erro[];
  solicitacoes: Solicitacao[];
  cadastros: Cadastros;
  config: Config;
}

export type ModoRestauracao = 'substituir' | 'mesclar';

export interface Repository {
  listErros(): Promise<Erro[]>;
  upsertErros(rows: Erro[]): Promise<void>;
  deleteErros(ids: string[]): Promise<void>;

  listSolicitacoes(): Promise<Solicitacao[]>;
  upsertSolicitacoes(rows: Solicitacao[]): Promise<void>;
  deleteSolicitacoes(ids: string[]): Promise<void>;

  getCadastros(): Promise<Cadastros>;
  saveCadastros(c: Cadastros): Promise<void>;

  getConfig(): Promise<Config>;
  saveConfig(c: Config): Promise<void>;

  exportAll(): Promise<Backup>;
  importAll(b: Backup, modo: ModoRestauracao): Promise<void>;
  clearAll(): Promise<void>;
}
