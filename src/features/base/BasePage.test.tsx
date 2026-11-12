import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BasePage from './BasePage';
import { useAppStore } from '../../store/useAppStore';

async function preparar() {
  await useAppStore.getState().init({ abrirDexie: vi.fn().mockRejectedValue(new Error('x')) });
  const st = useAppStore.getState();
  await st.salvarErro({ id: 'e1', codEmp: 20, empresa: 'UMAFLEX/SP', dataMov: '2026-01-12', docRef: 'NF 1', setor: 'COMPRAS', tipoAnalise: 'VARIAÇÃO DE CUSTO', qtde: 1, usuario: 'ANTÔNIO (COMPRAS)', erroDetalhado: 'cc errado', categoria: 'ERRO NO CENTRO DE CUSTO' });
  await st.salvarErro({ id: 'e2', codEmp: 1, empresa: 'ORYON/PR MATRIZ', dataMov: '2026-02-03', docRef: 'NF 2', setor: 'FISCAL', tipoAnalise: 'VARIAÇÃO DE CUSTO', qtde: 1, usuario: 'KATY (FISCAL)', erroDetalhado: 'item errado', categoria: 'ERRO NO ITEM' });
  await st.salvarSolicitacao({ id: 's1', codEmp: 1, empresa: 'ORYON/PR MATRIZ', dataMov: '2026-01-12', dataSolicitacao: '2026-01-15', setor: 'FISCAL', solicitante: 'JÉSSICA (FISCAL)', motivo: 'CORREÇÃO TN' });
}

describe('BasePage', () => {
  beforeEach(async () => {
    await preparar();
  });

  it('busca filtra as linhas', async () => {
    render(<BasePage />);
    expect(await screen.findByRole('cell', { name: 'ANTÔNIO (COMPRAS)' })).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText(/Buscar/), 'ANTÔNIO');
    expect(screen.queryByRole('cell', { name: 'KATY (FISCAL)' })).not.toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'ANTÔNIO (COMPRAS)' })).toBeInTheDocument();
  });

  it('editar data recalcula a competência', async () => {
    render(<BasePage />);
    await screen.findByRole('cell', { name: 'ANTÔNIO (COMPRAS)' });
    const linha = screen.getByRole('cell', { name: 'ANTÔNIO (COMPRAS)' }).closest('tr')!;
    await userEvent.click(within(linha).getByRole('button', { name: 'Editar' }));
    const dialog = await screen.findByRole('dialog');
    const data = within(dialog).getByLabelText(/Data do movimento/) as HTMLInputElement;
    await userEvent.clear(data);
    await userEvent.type(data, '2026-02-12');
    await userEvent.click(within(dialog).getByRole('button', { name: /Salvar alterações/ }));
    await waitFor(() => expect(useAppStore.getState().erros.find((e) => e.id === 'e1')?.mesCompetencia).toBe('02/2026'));
  });

  it('excluir pede confirmação e remove', async () => {
    render(<BasePage />);
    await screen.findByRole('cell', { name: 'KATY (FISCAL)' });
    const linha = screen.getByRole('cell', { name: 'KATY (FISCAL)' }).closest('tr')!;
    await userEvent.click(within(linha).getByRole('button', { name: 'Excluir' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /Excluir/ }));
    await waitFor(() => expect(useAppStore.getState().erros.map((e) => e.id)).toEqual(['e1']));
  });

  it('solicitação com dias negativos avisa mas salva', async () => {
    render(<BasePage />);
    await userEvent.click(screen.getByRole('tab', { name: /Solicitações/ }));
    const linha = (await screen.findByRole('cell', { name: 'JÉSSICA (FISCAL)' })).closest('tr')!;
    await userEvent.click(within(linha).getByRole('button', { name: 'Editar' }));
    const dialog = await screen.findByRole('dialog');
    const dataSol = within(dialog).getByLabelText(/Data da solicitação/) as HTMLInputElement;
    await userEvent.clear(dataSol);
    await userEvent.type(dataSol, '2026-01-10');
    expect(within(dialog).getByText(/Dias negativos/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: /Salvar alterações/ }));
    await waitFor(() => expect(useAppStore.getState().solicitacoes[0].diasParaIdentificar).toBe(-2));
  });
});
