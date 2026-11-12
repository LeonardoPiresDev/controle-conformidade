import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import type { Repository, Backup } from './repository';
import { createDexieRepository } from './dexieRepository';
import { createMemoryRepository } from './memoryRepository';
import { SEED_CADASTROS, DEFAULT_CONFIG } from './seed';
import { enrichErro, enrichSolicitacao } from '../domain/calc';

const erro = (id: string, extra = {}) =>
  enrichErro({ id, codEmp: 20, empresa: 'UMAFLEX/SP', dataMov: '2026-01-20', setor: 'FISCAL', tipoAnalise: 'VARIAÇÃO DE CUSTO', qtde: 1, usuario: 'X (FISCAL)', erroDetalhado: 'y', categoria: 'ERRO NO ITEM', ...extra });
const sol = (id: string) =>
  enrichSolicitacao({ id, codEmp: 1, empresa: 'ORYON/PR MATRIZ', dataMov: '2026-01-12', dataSolicitacao: '2026-01-15', setor: 'FISCAL', solicitante: 'J (FISCAL)', motivo: 'm' });

const impls: [string, () => Promise<Repository>][] = [
  ['memory', async () => createMemoryRepository()],
  [
    'dexie',
    async () => {
      indexedDB = new IDBFactory();
      return createDexieRepository(`test-${Math.random()}`);
    },
  ],
];

describe.each(impls)('Repository (%s)', (_name, make) => {
  let repo: Repository;
  beforeEach(async () => {
    repo = await make();
  });

  it('upsert e list de erros', async () => {
    await repo.upsertErros([erro('a')]);
    const rows = await repo.listErros();
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe('a');
  });

  it('upsert sobrescreve pelo id', async () => {
    await repo.upsertErros([erro('a')]);
    await repo.upsertErros([erro('a', { setor: 'COMPRAS' })]);
    const rows = await repo.listErros();
    expect(rows).toHaveLength(1);
    expect(rows[0].setor).toBe('COMPRAS');
  });

  it('deleteErros', async () => {
    await repo.upsertErros([erro('a'), erro('b')]);
    await repo.deleteErros(['a']);
    expect((await repo.listErros()).map((r) => r.id)).toEqual(['b']);
  });

  it('solicitacoes', async () => {
    await repo.upsertSolicitacoes([sol('s1')]);
    expect(await repo.listSolicitacoes()).toHaveLength(1);
    await repo.deleteSolicitacoes(['s1']);
    expect(await repo.listSolicitacoes()).toHaveLength(0);
  });

  it('cadastros vazios devolvem o seed', async () => {
    const c = await repo.getCadastros();
    expect(c).toEqual(SEED_CADASTROS);
    expect(c.categorias).toHaveLength(16);
    expect(c.empresas).toHaveLength(5);
  });

  it('config default e save', async () => {
    expect(await repo.getConfig()).toEqual(DEFAULT_CONFIG);
    await repo.saveConfig({ ...DEFAULT_CONFIG, nomeEmpresa: 'ACME' });
    expect((await repo.getConfig()).nomeEmpresa).toBe('ACME');
  });

  it('importAll substituir apaga o anterior', async () => {
    await repo.upsertErros([erro('old')]);
    const b: Backup = { versao: 1, geradoEm: 'x', erros: [erro('new')], solicitacoes: [], cadastros: SEED_CADASTROS, config: DEFAULT_CONFIG };
    await repo.importAll(b, 'substituir');
    expect((await repo.listErros()).map((r) => r.id)).toEqual(['new']);
  });

  it('importAll mesclar mantém ids diferentes e sobrescreve iguais', async () => {
    await repo.upsertErros([erro('a'), erro('b')]);
    const b: Backup = { versao: 1, geradoEm: 'x', erros: [erro('b', { setor: 'PCM' }), erro('c')], solicitacoes: [], cadastros: SEED_CADASTROS, config: DEFAULT_CONFIG };
    await repo.importAll(b, 'mesclar');
    const rows = await repo.listErros();
    expect(rows.map((r) => r.id).sort()).toEqual(['a', 'b', 'c']);
    expect(rows.find((r) => r.id === 'b')?.setor).toBe('PCM');
  });

  it('exportAll e clearAll', async () => {
    await repo.upsertErros([erro('a')]);
    const b = await repo.exportAll();
    expect(b.versao).toBe(1);
    expect(b.erros).toHaveLength(1);
    await repo.clearAll();
    expect(await repo.listErros()).toHaveLength(0);
  });
});
