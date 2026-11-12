import { Component, type ReactNode } from 'react';
import { useAppStore } from '../store/useAppStore';
import { baixarArquivo, carimboData } from '../export/download';

interface State {
  erro: Error | null;
}

/** Última linha de defesa: nunca deixar a tela branca; oferece backup e recarga. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { erro: null };

  static getDerivedStateFromError(erro: Error): State {
    return { erro };
  }

  async baixarBackup() {
    try {
      const b = await useAppStore.getState().exportarBackup();
      baixarArquivo(new Blob([JSON.stringify(b, null, 2)], { type: 'application/json' }), `backup_emergencia_${carimboData()}.json`);
    } catch (e) {
      alert(`Não foi possível gerar o backup: ${(e as Error).message}`);
    }
  }

  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <div className="mx-auto mt-16 max-w-lg rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="text-lg font-bold text-red-700">Algo deu errado ao exibir a tela</h1>
        <p className="mt-2 text-sm text-slate-600">Seus dados continuam salvos no navegador. Baixe um backup por segurança e recarregue a página.</p>
        <pre className="mt-3 max-h-32 overflow-auto rounded bg-slate-50 p-2 text-xs text-slate-500">{this.state.erro.message}</pre>
        <div className="mt-4 flex gap-2">
          <button className="btn-primary" onClick={() => void this.baixarBackup()}>
            Baixar backup
          </button>
          <button className="btn-ghost" onClick={() => location.reload()}>
            Recarregar
          </button>
        </div>
      </div>
    );
  }
}
