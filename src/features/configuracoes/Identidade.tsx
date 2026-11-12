import { useState } from 'react';
import { Card, Input } from '../../components/ui';
import { toast } from '../../components/Toast';
import { useAppStore } from '../../store/useAppStore';
import { DEFAULT_CONFIG } from '../../data/seed';
import logoPadrao from '/logo-umaflex.png';

const MAX_LOGO = 500 * 1024;

export function Identidade() {
  const config = useAppStore((s) => s.config);
  const salvarConfig = useAppStore((s) => s.salvarConfig);
  const [f, setF] = useState(config);

  function lerLogo(file: File) {
    if (file.size > MAX_LOGO) {
      toast.erro('A logo deve ter no máximo 500 KB.');
      return;
    }
    const r = new FileReader();
    r.onload = () => setF({ ...f, logoDataUrl: String(r.result) });
    r.readAsDataURL(file);
  }

  return (
    <Card titulo="Identidade visual">
      <div className="grid gap-5 md:grid-cols-[220px_1fr]">
        <div>
          <span className="label">Logo</span>
          <div className="flex h-24 items-center justify-center rounded-lg p-3" style={{ background: f.corPrimaria }}>
            <img src={f.logoDataUrl ?? logoPadrao} alt="Logo" className="max-h-16 max-w-full" />
          </div>
          <div className="mt-2 flex gap-2">
            <label className="btn-ghost cursor-pointer !py-1 text-xs">
              Trocar logo…
              <input type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={(e) => e.target.files?.[0] && lerLogo(e.target.files[0])} />
            </label>
            {f.logoDataUrl && (
              <button className="btn-ghost !py-1 text-xs" onClick={() => setF({ ...f, logoDataUrl: null })}>
                Padrão
              </button>
            )}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Nome da empresa" value={f.nomeEmpresa} onChange={(e) => setF({ ...f, nomeEmpresa: e.target.value })} />
          <Input label="Título do sistema / relatório" value={f.tituloRelatorio} onChange={(e) => setF({ ...f, tituloRelatorio: e.target.value })} />
          <Input label="Cor primária (cabeçalho)" type="color" value={f.corPrimaria} onChange={(e) => setF({ ...f, corPrimaria: e.target.value })} className="[&_input]:h-10 [&_input]:p-1" />
          <Input label="Cor de destaque (filete, botões)" type="color" value={f.corDestaque} onChange={(e) => setF({ ...f, corDestaque: e.target.value })} className="[&_input]:h-10 [&_input]:p-1" />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button className="btn-ghost" onClick={() => setF(DEFAULT_CONFIG)}>
          Restaurar padrão
        </button>
        <button
          className="btn-primary"
          onClick={async () => {
            await salvarConfig(f);
            toast.ok('Identidade salva.');
          }}
        >
          Salvar
        </button>
      </div>
    </Card>
  );
}
