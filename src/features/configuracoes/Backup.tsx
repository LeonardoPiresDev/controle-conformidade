import { useState } from 'react';
import { Card, Modal } from '../../components/ui';
import { toast } from '../../components/Toast';
import { useAppStore } from '../../store/useAppStore';
import type { Backup as BackupT } from '../../data/repository';
import { baixarArquivo, carimboData } from '../../export/download';

const ISO = /^\d{4}-\d{2}-\d{2}$/;
function registroOk(r: unknown): boolean {
  if (!r || typeof r !== 'object') return false;
  const o = r as Record<string, unknown>;
  return typeof o.id === 'string' && !!o.id && typeof o.dataMov === 'string' && ISO.test(o.dataMov);
}
export function validarBackup(obj: unknown): obj is BackupT {
  if (!obj || typeof obj !== 'object') return false;
  const b = obj as Partial<BackupT>;
  return b.versao === 1 && Array.isArray(b.erros) && Array.isArray(b.solicitacoes) && b.erros.every(registroOk) && b.solicitacoes.every(registroOk);
}

export function Backup() {
  const exportarBackup = useAppStore((s) => s.exportarBackup);
  const restaurarBackup = useAppStore((s) => s.restaurarBackup);
  const apagarTudo = useAppStore((s) => s.apagarTudo);
  const erros = useAppStore((s) => s.erros);
  const solicitacoes = useAppStore((s) => s.solicitacoes);

  const [pendente, setPendente] = useState<BackupT | null>(null);
  const [erroArquivo, setErroArquivo] = useState('');
  const [confirmarApagar, setConfirmarApagar] = useState(0);

  async function baixar() {
    const b = await exportarBackup();
    baixarArquivo(new Blob([JSON.stringify(b, null, 2)], { type: 'application/json' }), `backup_conformidade_${carimboData()}.json`);
    toast.ok('Backup gerado.');
  }

  async function lerArquivo(file: File) {
    setErroArquivo('');
    try {
      const obj = JSON.parse(await file.text());
      if (!validarBackup(obj)) {
        setErroArquivo('Este arquivo não é um backup válido do Controle de Conformidade (versão 1).');
        return;
      }
      setPendente(obj);
    } catch {
      setErroArquivo('Não foi possível ler o JSON.');
    }
  }

  async function restaurar(modo: 'substituir' | 'mesclar') {
    if (!pendente) return;
    try {
      await restaurarBackup(pendente, modo);
      toast.ok(`Backup restaurado (${modo}).`);
    } catch (e) {
      toast.erro(`Falha ao restaurar: ${(e as Error).message}`);
    } finally {
      setPendente(null);
    }
  }

  return (
    <>
      <Card titulo="Backup e restauração">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-4">
            <h4 className="font-semibold text-slate-800">Baixar backup (JSON)</h4>
            <p className="mb-3 text-sm text-slate-500">
              Inclui {erros.length} erros, {solicitacoes.length} solicitações, cadastros e configurações. Guarde em local seguro (ex.: OneDrive).
            </p>
            <button className="btn-primary" onClick={() => void baixar()}>
              ⬇ Baixar backup
            </button>
          </div>
          <div className="rounded-lg border border-slate-200 p-4">
            <h4 className="font-semibold text-slate-800">Restaurar backup</h4>
            <p className="mb-3 text-sm text-slate-500">Escolha um arquivo .json gerado por este sistema. Você poderá substituir tudo ou mesclar com os dados atuais.</p>
            <label className="btn-ghost cursor-pointer">
              Restaurar de arquivo…
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                aria-label="Restaurar backup"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void lerArquivo(f);
                  e.target.value = '';
                }}
              />
            </label>
            {erroArquivo && <p className="mt-2 text-sm text-red-600">{erroArquivo}</p>}
          </div>
        </div>
      </Card>

      <Card titulo="Zona de perigo" className="border border-red-200">
        <p className="mb-3 text-sm text-slate-600">Apaga todos os erros, solicitações, cadastros personalizados e configurações deste navegador. Faça um backup antes.</p>
        {confirmarApagar === 0 && (
          <button className="btn-danger" onClick={() => setConfirmarApagar(1)}>
            Apagar tudo…
          </button>
        )}
        {confirmarApagar === 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-red-700">Tem certeza? Isso não pode ser desfeito.</span>
            <button className="btn-danger" onClick={() => setConfirmarApagar(2)}>
              Sim, continuar
            </button>
            <button className="btn-ghost" onClick={() => setConfirmarApagar(0)}>
              Cancelar
            </button>
          </div>
        )}
        {confirmarApagar === 2 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-red-700">Última confirmação: apagar {erros.length + solicitacoes.length} registros.</span>
            <button
              className="btn-danger"
              onClick={async () => {
                await apagarTudo();
                setConfirmarApagar(0);
                toast.info('Todos os dados foram apagados.');
              }}
            >
              Apagar definitivamente
            </button>
            <button className="btn-ghost" onClick={() => setConfirmarApagar(0)}>
              Cancelar
            </button>
          </div>
        )}
      </Card>

      <Modal aberto={!!pendente} titulo="Como restaurar?" onFechar={() => setPendente(null)} largura="max-w-lg">
        <p className="text-sm text-slate-700">
          O backup tem <b>{pendente?.erros.length ?? 0}</b> erros e <b>{pendente?.solicitacoes.length ?? 0}</b> solicitações
          {pendente?.geradoEm && ` (gerado em ${new Date(pendente.geradoEm).toLocaleString('pt-BR')})`}.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button className="btn-primary" onClick={() => void restaurar('mesclar')}>
            Mesclar com os dados atuais
          </button>
          <button className="btn-danger" onClick={() => void restaurar('substituir')}>
            Substituir tudo
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">Mesclar mantém o que já existe e sobrescreve registros com o mesmo id. Substituir apaga a base atual antes de restaurar.</p>
      </Modal>
    </>
  );
}
