import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectComCadastro } from './SelectComCadastro';

describe('SelectComCadastro', () => {
  it('seleciona uma opção existente', async () => {
    const onChange = vi.fn();
    render(<SelectComCadastro label="Setor" opcoes={['FISCAL', 'COMPRAS']} valor="" onChange={onChange} onNovo={vi.fn()} />);
    await userEvent.selectOptions(screen.getByLabelText('Setor'), 'COMPRAS');
    expect(onChange).toHaveBeenCalledWith('COMPRAS');
  });

  it('cadastrar novo chama onNovo e onChange com o valor digitado', async () => {
    const onChange = vi.fn();
    const onNovo = vi.fn().mockResolvedValue('TESTE');
    render(<SelectComCadastro label="Setor" opcoes={['FISCAL']} valor="" onChange={onChange} onNovo={onNovo} />);
    await userEvent.selectOptions(screen.getByLabelText('Setor'), '__novo__');
    const input = await screen.findByPlaceholderText('Novo setor');
    await userEvent.type(input, 'TESTE{enter}');
    expect(onNovo).toHaveBeenCalledWith('TESTE');
    expect(onChange).toHaveBeenCalledWith('TESTE');
  });
});
