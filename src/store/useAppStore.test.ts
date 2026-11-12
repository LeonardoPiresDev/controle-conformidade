import { describe, it, expect, vi } from 'vitest';
import { useAppStore } from './useAppStore';

describe('useAppStore.init', () => {
  it('cai em modo memória quando o IndexedDB falha', async () => {
    const abrir = vi.fn().mockRejectedValue(new Error('indexeddb bloqueado'));
    await useAppStore.getState().init({ abrirDexie: abrir });
    const s = useAppStore.getState();
    expect(s.pronto).toBe(true);
    expect(s.modoMemoria).toBe(true);
    expect(s.cadastros.categorias).toHaveLength(16);
  });

  it('salvarErro grava e recarrega o cache', async () => {
    await useAppStore.getState().init({ abrirDexie: vi.fn().mockRejectedValue(new Error('x')) });
    await useAppStore.getState().salvarErro({ codEmp: 20, empresa: 'UMAFLEX/SP', dataMov: '2026-01-20', setor: 'FISCAL', tipoAnalise: 'VARIAÇÃO DE CUSTO', qtde: 1, usuario: 'X (FISCAL)', erroDetalhado: 'y', categoria: 'ERRO NO ITEM' });
    expect(useAppStore.getState().erros).toHaveLength(1);
    expect(useAppStore.getState().erros[0].mesCompetencia).toBe('01/2026');
  });

  it('adicionarCadastro grava novo setor normalizado e sem duplicar', async () => {
    await useAppStore.getState().init({ abrirDexie: vi.fn().mockRejectedValue(new Error('x')) });
    await useAppStore.getState().adicionarCadastro('setores', ' Qualidade ');
    await useAppStore.getState().adicionarCadastro('setores', 'qualidade');
    const setores = useAppStore.getState().cadastros.setores;
    expect(setores.filter((s) => s === 'QUALIDADE')).toHaveLength(1);
  });
});

describe('acentos e persistência', () => {
  it('cadastros guardam acentos (comparação normalizada, valor original)', async () => {
    await useAppStore.getState().init({ abrirDexie: vi.fn().mockRejectedValue(new Error('x')) });
    expect(await useAppStore.getState().adicionarCadastro('setores', ' Logística ')).toBe('LOGÍSTICA');
    expect(await useAppStore.getState().adicionarUsuario('Maria', 'LOGÍSTICA')).toBe('MARIA');
    const u = useAppStore.getState().cadastros.usuarios.find((x) => x.nome === 'MARIA');
    expect(u?.setor).toBe('LOGÍSTICA');
    expect(useAppStore.getState().cadastros.setores.filter((s) => s.startsWith('LOG'))).toEqual(['LOGÍSTICA']);
  });

  it('pede armazenamento persistente quando o Dexie abre', async () => {
    const persist = vi.fn().mockResolvedValue(true);
    vi.stubGlobal('navigator', { ...navigator, storage: { persist } });
    const { createMemoryRepository } = await import('../data/memoryRepository');
    await useAppStore.getState().init({ abrirDexie: async () => createMemoryRepository() });
    expect(persist).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('restaurarBackup completa config e cadastros malformados com os padrões', async () => {
    await useAppStore.getState().init({ abrirDexie: vi.fn().mockRejectedValue(new Error('x')) });
    await useAppStore.getState().restaurarBackup({ versao: 1, geradoEm: 'x', erros: [], solicitacoes: [], cadastros: {} as never, config: { nomeEmpresa: 'ACME' } as never }, 'substituir');
    const s = useAppStore.getState();
    expect(s.config.corPrimaria).toBe('#0F2B46');
    expect(s.config.nomeEmpresa).toBe('ACME');
    expect(s.cadastros.usuarios.length).toBeGreaterThan(0);
  });
});
