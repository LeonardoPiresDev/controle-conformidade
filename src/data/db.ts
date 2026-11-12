import Dexie, { type Table } from 'dexie';
import type { Erro, Solicitacao } from '../domain/types';

export interface KV {
  chave: string;
  valor: unknown;
}

export class ConformidadeDB extends Dexie {
  erros!: Table<Erro, string>;
  solicitacoes!: Table<Solicitacao, string>;
  kv!: Table<KV, string>;

  constructor(name = 'controle-conformidade') {
    super(name);
    this.version(1).stores({
      erros: 'id, dataMov, setor, usuario, categoria, mesCompetencia',
      solicitacoes: 'id, dataMov, setor, solicitante, mesCompetencia',
      kv: 'chave',
    });
  }
}
