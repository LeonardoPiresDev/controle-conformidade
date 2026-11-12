import type { Cadastros, Config, Erro, Solicitacao } from '../domain/types';
import type { Backup, ModoRestauracao, Repository } from './repository';
import { DEFAULT_CONFIG, SEED_CADASTROS } from './seed';

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export function createMemoryRepository(): Repository {
  let erros = new Map<string, Erro>();
  let solicitacoes = new Map<string, Solicitacao>();
  let cadastros: Cadastros | null = null;
  let config: Config | null = null;

  const repo: Repository = {
    async listErros() {
      return [...erros.values()].map(clone);
    },
    async upsertErros(rows) {
      for (const r of rows) erros.set(r.id, clone(r));
    },
    async deleteErros(ids) {
      for (const id of ids) erros.delete(id);
    },
    async listSolicitacoes() {
      return [...solicitacoes.values()].map(clone);
    },
    async upsertSolicitacoes(rows) {
      for (const r of rows) solicitacoes.set(r.id, clone(r));
    },
    async deleteSolicitacoes(ids) {
      for (const id of ids) solicitacoes.delete(id);
    },
    async getCadastros() {
      return clone(cadastros ?? SEED_CADASTROS);
    },
    async saveCadastros(c) {
      cadastros = clone(c);
    },
    async getConfig() {
      return clone(config ?? DEFAULT_CONFIG);
    },
    async saveConfig(c) {
      config = clone(c);
    },
    async exportAll() {
      return {
        versao: 1,
        geradoEm: new Date().toISOString(),
        erros: await repo.listErros(),
        solicitacoes: await repo.listSolicitacoes(),
        cadastros: await repo.getCadastros(),
        config: await repo.getConfig(),
      };
    },
    async importAll(b: Backup, modo: ModoRestauracao) {
      if (modo === 'substituir') {
        erros = new Map();
        solicitacoes = new Map();
      }
      await repo.upsertErros(b.erros ?? []);
      await repo.upsertSolicitacoes(b.solicitacoes ?? []);
      if (b.cadastros) cadastros = clone(b.cadastros);
      if (b.config) config = clone(b.config);
    },
    async clearAll() {
      erros = new Map();
      solicitacoes = new Map();
      cadastros = null;
      config = null;
    },
  };
  return repo;
}
