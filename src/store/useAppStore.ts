import { create } from 'zustand';
import type { Cadastros, Config, Erro, Solicitacao } from '../domain/types';
import type { Repository, Backup, ModoRestauracao } from '../data/repository';
import { createDexieRepository } from '../data/dexieRepository';
import { createMemoryRepository } from '../data/memoryRepository';
import { DEFAULT_CONFIG, SEED_CADASTROS } from '../data/seed';
import { enrichErro, enrichSolicitacao, normalizeText } from '../domain/calc';
import { FILTROS_VAZIOS, type Filtros } from '../domain/aggregate';

export type ListaCadastro = 'setores' | 'tiposAnalise' | 'categorias';

export interface InitOptions {
  abrirDexie?: () => Promise<Repository>;
}

export interface LoteImportacao {
  erros: Erro[];
  solicitacoes: Solicitacao[];
  novosCadastros?: Partial<Cadastros>;
}

interface AppState {
  repo: Repository | null;
  pronto: boolean;
  modoMemoria: boolean;
  erros: Erro[];
  solicitacoes: Solicitacao[];
  cadastros: Cadastros;
  config: Config;
  filtros: Filtros;

  init(opts?: InitOptions): Promise<void>;
  recarregar(): Promise<void>;
  salvarErro(e: Partial<Erro>): Promise<Erro>;
  salvarSolicitacao(s: Partial<Solicitacao>): Promise<Solicitacao>;
  excluirErros(ids: string[]): Promise<void>;
  excluirSolicitacoes(ids: string[]): Promise<void>;
  importarLote(lote: LoteImportacao): Promise<void>;
  salvarCadastros(c: Cadastros): Promise<void>;
  adicionarCadastro(lista: ListaCadastro, valor: string): Promise<string>;
  adicionarUsuario(nome: string, setor: string): Promise<string>;
  adicionarEmpresa(codEmp: number, nome: string): Promise<void>;
  salvarConfig(c: Config): Promise<void>;
  setFiltros(f: Partial<Filtros>): void;
  limparFiltros(): void;
  exportarBackup(): Promise<Backup>;
  restaurarBackup(b: Backup, modo: ModoRestauracao): Promise<void>;
  apagarTudo(): Promise<void>;
}

/** Valor como será gravado: maiúsculas e espaços colapsados, MANTENDO acentos (comparações usam normalizeText). */
export function canonico(s: string): string {
  return String(s ?? '').replace(/\s+/g, ' ').trim().toUpperCase();
}

export function cadastrosValidos(c: unknown): c is Cadastros {
  if (!c || typeof c !== 'object') return false;
  const o = c as Record<string, unknown>;
  return ['empresas', 'setores', 'tiposAnalise', 'categorias', 'usuarios'].every((k) => Array.isArray(o[k]));
}

export function mesclarCadastros(base: Cadastros, extra?: Partial<Cadastros>): Cadastros {
  if (!extra) return base;
  const uniq = (arr: string[]) => {
    const seen = new Set<string>();
    return arr.filter((s) => {
      const k = normalizeText(s);
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };
  const usuarios = [...base.usuarios];
  for (const u of extra.usuarios ?? []) {
    if (!usuarios.some((x) => normalizeText(x.nome) === normalizeText(u.nome))) usuarios.push(u);
  }
  const empresas = [...base.empresas];
  for (const e of extra.empresas ?? []) {
    if (!empresas.some((x) => x.codEmp === e.codEmp)) empresas.push(e);
  }
  return {
    empresas: empresas.sort((a, b) => a.codEmp - b.codEmp),
    setores: uniq([...base.setores, ...(extra.setores ?? [])]).sort(),
    tiposAnalise: uniq([...base.tiposAnalise, ...(extra.tiposAnalise ?? [])]).sort(),
    categorias: uniq([...base.categorias, ...(extra.categorias ?? [])]),
    usuarios: usuarios.sort((a, b) => a.nome.localeCompare(b.nome)),
  };
}

export const useAppStore = create<AppState>((set, get) => {
  const repoOuErro = (): Repository => {
    const r = get().repo;
    if (!r) throw new Error('Repositório não inicializado');
    return r;
  };

  return {
    repo: null,
    pronto: false,
    modoMemoria: false,
    erros: [],
    solicitacoes: [],
    cadastros: SEED_CADASTROS,
    config: DEFAULT_CONFIG,
    filtros: FILTROS_VAZIOS,

    async init(opts) {
      const abrir = opts?.abrirDexie ?? (() => createDexieRepository());
      let repo: Repository;
      let modoMemoria = false;
      try {
        repo = await abrir();
      } catch {
        repo = createMemoryRepository();
        modoMemoria = true;
      }
      if (!modoMemoria) {
        try {
          await navigator.storage?.persist?.();
        } catch {
          /* opcional */
        }
      }
      set({ repo, modoMemoria });
      try {
        await get().recarregar();
      } catch {
        set({ repo: createMemoryRepository(), modoMemoria: true });
        await get().recarregar();
      }
      set({ pronto: true });
    },

    async recarregar() {
      const repo = repoOuErro();
      const [erros, solicitacoes, cadastros, config] = await Promise.all([
        repo.listErros(),
        repo.listSolicitacoes(),
        repo.getCadastros(),
        repo.getConfig(),
      ]);
      set({ erros, solicitacoes, cadastros, config });
    },

    async salvarErro(p) {
      const e = enrichErro(p);
      await repoOuErro().upsertErros([e]);
      await get().recarregar();
      return e;
    },

    async salvarSolicitacao(p) {
      const s = enrichSolicitacao(p);
      await repoOuErro().upsertSolicitacoes([s]);
      await get().recarregar();
      return s;
    },

    async excluirErros(ids) {
      await repoOuErro().deleteErros(ids);
      await get().recarregar();
    },

    async excluirSolicitacoes(ids) {
      await repoOuErro().deleteSolicitacoes(ids);
      await get().recarregar();
    },

    async importarLote(lote) {
      const repo = repoOuErro();
      if (lote.novosCadastros) {
        await repo.saveCadastros(mesclarCadastros(get().cadastros, lote.novosCadastros));
      }
      if (lote.erros.length) await repo.upsertErros(lote.erros);
      if (lote.solicitacoes.length) await repo.upsertSolicitacoes(lote.solicitacoes);
      await get().recarregar();
    },

    async salvarCadastros(c) {
      await repoOuErro().saveCadastros(c);
      await get().recarregar();
    },

    async adicionarCadastro(lista, valor) {
      const v = canonico(valor);
      if (!v) return '';
      const atual = get().cadastros;
      const existente = atual[lista].find((x) => normalizeText(x) === normalizeText(v));
      if (existente) return existente;
      await get().salvarCadastros(mesclarCadastros(atual, { [lista]: [v] }));
      return v;
    },

    async adicionarUsuario(nome, setor) {
      const n = canonico(nome);
      if (!n) return '';
      const atual = get().cadastros;
      const existente = atual.usuarios.find((x) => normalizeText(x.nome) === normalizeText(n));
      if (existente) return existente.nome;
      const setorFinal = atual.setores.find((x) => normalizeText(x) === normalizeText(setor)) ?? canonico(setor);
      await get().salvarCadastros(mesclarCadastros(atual, { usuarios: [{ nome: n, setor: setorFinal }], setores: setorFinal ? [setorFinal] : [] }));
      return n;
    },

    async adicionarEmpresa(codEmp, nome) {
      const atual = get().cadastros;
      if (atual.empresas.some((e) => e.codEmp === codEmp)) return;
      await get().salvarCadastros(mesclarCadastros(atual, { empresas: [{ codEmp, nome: canonico(nome) }] }));
    },

    async salvarConfig(c) {
      await repoOuErro().saveConfig(c);
      set({ config: c });
    },

    setFiltros(f) {
      set({ filtros: { ...get().filtros, ...f } });
    },

    limparFiltros() {
      set({ filtros: FILTROS_VAZIOS });
    },

    exportarBackup() {
      return repoOuErro().exportAll();
    },

    async restaurarBackup(b, modo) {
      const saneado: Backup = {
        ...b,
        erros: Array.isArray(b.erros) ? b.erros : [],
        solicitacoes: Array.isArray(b.solicitacoes) ? b.solicitacoes : [],
        cadastros: cadastrosValidos(b.cadastros) ? mesclarCadastros(SEED_CADASTROS, b.cadastros) : get().cadastros,
        config: { ...DEFAULT_CONFIG, ...(b.config && typeof b.config === 'object' ? b.config : {}) },
      };
      await repoOuErro().importAll(saneado, modo);
      await get().recarregar();
    },

    async apagarTudo() {
      await repoOuErro().clearAll();
      await get().recarregar();
    },
  };
});
