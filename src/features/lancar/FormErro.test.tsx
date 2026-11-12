import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormErro } from './FormErro';
import { useAppStore } from '../../store/useAppStore';

async function preparar() {
  await useAppStore.getState().init({ abrirDexie: vi.fn().mockRejectedValue(new Error('x')) });
}

describe('FormErro', () => {
  beforeEach(async () => {
    await preparar();
  });

  it('escolher usuário preenche o setor', async () => {
    render(<FormErro />);
    await userEvent.selectOptions(screen.getByLabelText(/Usuário/), 'ANTÔNIO (COMPRAS)');
    expect((screen.getByLabelText(/Setor/) as HTMLSelectElement).value).toBe('COMPRAS');
  });

  it('escolher empresa preenche o código e vice-versa', async () => {
    render(<FormErro />);
    await userEvent.selectOptions(screen.getByLabelText(/^Empresa/), '20');
    expect((screen.getByLabelText(/Cód/) as HTMLInputElement).value).toBe('20');
    await userEvent.clear(screen.getByLabelText(/Cód/));
    await userEvent.type(screen.getByLabelText(/Cód/), '23');
    expect((screen.getByLabelText(/^Empresa/) as HTMLSelectElement).value).toBe('23');
  });

  it('não salva sem categoria e mostra mensagem', async () => {
    const salvar = vi.spyOn(useAppStore.getState(), 'salvarErro');
    render(<FormErro />);
    await userEvent.click(screen.getByRole('button', { name: /Salvar/ }));
    expect(salvar).not.toHaveBeenCalled();
    expect(await screen.findByText(/Categoria é obrigatória/)).toBeInTheDocument();
    salvar.mockRestore();
  });

  it('salva registro completo, calcula competência e limpa mantendo empresa/data', async () => {
    render(<FormErro />);
    await userEvent.selectOptions(screen.getByLabelText(/^Empresa/), '20');
    const data = screen.getByLabelText(/Data do movimento/) as HTMLInputElement;
    await userEvent.clear(data);
    await userEvent.type(data, '2026-01-20');
    await userEvent.type(screen.getByLabelText(/Doc\. referência/), 'NF 123');
    await userEvent.selectOptions(screen.getByLabelText(/Usuário/), 'KATY (FISCAL)');
    await userEvent.selectOptions(screen.getByLabelText(/Tipo de análise/), 'VARIAÇÃO DE CUSTO');
    await userEvent.type(screen.getByLabelText(/Erro detalhado/), 'valor errado');
    await userEvent.selectOptions(screen.getByLabelText(/Categoria/), 'ERRO NO ITEM');
    await userEvent.click(screen.getByRole('button', { name: /Salvar/ }));

    await waitFor(() => expect(useAppStore.getState().erros).toHaveLength(1));
    const e = useAppStore.getState().erros[0];
    expect(e.mesCompetencia).toBe('01/2026');
    expect(e.setor).toBe('FISCAL');
    expect(e.docRef).toBe('NF 123');

    expect((screen.getByLabelText(/Doc\. referência/) as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/^Empresa/) as HTMLSelectElement).value).toBe('20');
    expect(data.value).toBe('2026-01-20');
  });
});
