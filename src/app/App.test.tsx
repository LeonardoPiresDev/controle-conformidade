import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renderiza o cabeçalho Controle de Conformidade', async () => {
    render(<App />);
    expect(await screen.findByText('CONTROLE DE CONFORMIDADE')).toBeInTheDocument();
  });
});
