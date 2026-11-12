import type { Cadastros, Config } from '../domain/types';
import type { Backup, ModoRestauracao, Repository } from './repository';
import { ConformidadeDB } from './db';
import { DEFAULT_CONFIG, SEED_CADASTROS } from './seed';

const K_CADASTROS = 'cadastros';
const K_CONFIG = 'config';

/** Abre o banco (lança se o IndexedDB estiver indisponível) e devolve o repositório. */
export async function createDexieRepository(name?: string): Promise<Repository> {
  const db = new ConformidadeDB(name);
  await db.open();

  async function getKV<T>(chave: string, fallback: T): Promise<T> {
    const row = await db.kv.get(chave);
    return row ? (row.valor as T) : fallback;
  }

  const repo: Repository = {
    listErros: () => db.erros.toArray(),
    upsertErros: async (rows) => {
      await db.erros.bulkPut(rows);
    },
    deleteErros: async (ids) => {
      await db.erros.bulkDelete(ids);
    },
    listSolicitacoes: () => db.solicitacoes.toArray(),
    upsertSolicitacoes: async (rows) => {
      await db.solicitacoes.bulkPut(rows);
    },
    deleteSolicitacoes: async (ids) => {
      await db.solicitacoes.bulkDelete(ids);
    },
    getCadastros: () => getKV<Cadastros>(K_CADASTROS, SEED_CADASTROS),
    saveCadastros: async (c) => {
      await db.kv.put({ chave: K_CADASTROS, valor: c });
    },
    getConfig: () => getKV<Config>(K_CONFIG, DEFAULT_CONFIG),
    saveConfig: async (c) => {
      await db.kv.put({ chave: K_CONFIG, valor: c });
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
      await db.transaction('rw', db.erros, db.solicitacoes, db.kv, async () => {
        if (modo === 'substituir') {
          await db.erros.clear();
          await db.solicitacoes.clear();
        }
        await db.erros.bulkPut(b.erros ?? []);
        await db.solicitacoes.bulkPut(b.solicitacoes ?? []);
        if (b.cadastros) await db.kv.put({ chave: K_CADASTROS, valor: b.cadastros });
        if (b.config) await db.kv.put({ chave: K_CONFIG, valor: b.config });
      });
    },
    async clearAll() {
      await db.transaction('rw', db.erros, db.solicitacoes, db.kv, async () => {
        await db.erros.clear();
        await db.solicitacoes.clear();
        await db.kv.clear();
      });
    },
  };
  return repo;
}
