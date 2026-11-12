import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Backup } from './Backup';
import { useAppStore } from '../../store/useAppStore';
import { SEED_CADASTROS, DEFAULT_CONFIG } from '../../data/seed';
import { enrichErro } from '../../domain/calc';

function arquivoJson(obj: unknown): File {
  const texto = JSON.stringify(obj);
  const f = new File([texto], 'backup.json', { type: 'application/json' });
  Object.defineProperty(f, 'text', { value: async () => texto });
  return f;
}

describe('Backup', () => {
  beforeEach(async () => {
    await useAppStore.getState().init({ abrirDexie: vi.fn().mockRejectedValue(new Error('x')) });
  });

  it('rejeita JSON com versão diferente de 1', async () => {
    const restaurar = vi.spyOn(useAppStore.getState(), 'restaurarBackup');
    render(<Backup />);
    await userEvent.upload(screen.getByLabelText(/Restaurar/), arquivoJson({ versao: 2, erros: [] }));
    expect(await screen.findByText(/não é um backup válido/)).toBeInTheDocument();
    expect(restaurar).not.toHaveBeenCalled();
    restaurar.mockRestore();
  });

  it('JSON válido pede o modo e restaura mesclando', async () => {
    const erro = enrichErro({ id: 'bk1', codEmp: 20, empresa: 'UMAFLEX/SP', dataMov: '2026-01-20', setor: 'FISCAL', tipoAnalise: 'X', qtde: 1, usuario: 'A (FISCAL)', erroDetalhado: 'x', categoria: 'ERRO NO ITEM' });
    render(<Backup />);
    await userEvent.upload(screen.getByLabelText(/Restaurar/), arquivoJson({ versao: 1, geradoEm: 'x', erros: [erro], solicitacoes: [], cadastros: SEED_CADASTROS, config: DEFAULT_CONFIG }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(screen.getByRole('button', { name: /Mesclar/ }));
    await waitFor(() => expect(useAppStore.getState().erros.map((e) => e.id)).toEqual(['bk1']));
    expect(dialog).not.toBeInTheDocument();
  });
});
