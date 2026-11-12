import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ImportarPage from './ImportarPage';
import { useAppStore } from '../../store/useAppStore';

function arquivoFixture(): File {
  const buf = readFileSync(resolve(__dirname, '../../../tests/fixtures/Indicador.xlsx'));
  const file = new File([buf], 'Indicador.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  // jsdom não implementa File.arrayBuffer
  Object.defineProperty(file, 'arrayBuffer', { value: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) });
  return file;
}

async function soltarArquivo() {
  const zona = await screen.findByTestId('dropzone');
  fireEvent.drop(zona, { dataTransfer: { files: [arquivoFixture()], types: ['Files'] } });
}

const montar = () =>
  render(
    <MemoryRouter>
      <ImportarPage />
    </MemoryRouter>,
  );

describe('ImportarPage', () => {
  beforeEach(async () => {
    await useAppStore.getState().init({ abrirDexie: vi.fn().mockRejectedValue(new Error('x')) });
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  it('preview mostra 252 erros e 82 solicitações e a confirmação grava tudo', async () => {
    montar();
    await soltarArquivo();
    expect(await screen.findByTestId('total-erros')).toHaveTextContent('252');
    expect(screen.getByTestId('total-solicitacoes')).toHaveTextContent('82');
    expect(screen.getByTestId('total-rejeitadas')).toHaveTextContent('0');
    await userEvent.click(screen.getByRole('button', { name: /Confirmar importação/ }));
    await waitFor(() => expect(useAppStore.getState().erros).toHaveLength(252));
    expect(useAppStore.getState().solicitacoes).toHaveLength(82);
    expect(useAppStore.getState().cadastros.usuarios.some((u) => u.nome === 'MAYARA(ALMOX)')).toBe(true);
    expect(await screen.findByText(/334 importados/)).toBeInTheDocument();
  });

  it('reimportar marca tudo como duplicado e grava zero', async () => {
    montar();
    await soltarArquivo();
    await userEvent.click(await screen.findByRole('button', { name: /Confirmar importação/ }));
    await waitFor(() => expect(useAppStore.getState().erros).toHaveLength(252));
    await userEvent.click(screen.getByRole('button', { name: /Nova importação/ }));

    await soltarArquivo();
    expect(await screen.findByTestId('total-duplicadas')).toHaveTextContent('334');
    expect(screen.getByRole('button', { name: /Confirmar importação \(0 registros\)/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Confirmar importação/ }));
    expect(await screen.findByText(/0 importados/)).toBeInTheDocument();
    expect(useAppStore.getState().erros).toHaveLength(252);
  });

  it('baixar planilha modelo dispara download', async () => {
    montar();
    await userEvent.click(screen.getByRole('button', { name: /Baixar planilha modelo/ }));
    expect(URL.createObjectURL).toHaveBeenCalled();
  });
});
