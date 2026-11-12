import { useRef, useState, type DragEvent } from 'react';
import clsx from 'clsx';

export function DropZone({ onArquivo, ocupado }: { onArquivo: (f: File) => void; ocupado?: boolean }) {
  const [sobre, setSobre] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function drop(e: DragEvent) {
    e.preventDefault();
    setSobre(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) onArquivo(f);
  }

  return (
    <div
      data-testid="dropzone"
      onDragOver={(e) => {
        e.preventDefault();
        setSobre(true);
      }}
      onDragLeave={() => setSobre(false)}
      onDrop={drop}
      onClick={() => !ocupado && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      className={clsx(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed px-6 py-14 text-center transition',
        sobre ? 'border-brand-accent bg-sky-50' : 'border-slate-300 bg-white hover:border-sky-400',
        ocupado && 'pointer-events-none opacity-60',
      )}
    >
      <span className="text-4xl" aria-hidden>
        📥
      </span>
      <p className="text-base font-semibold text-brand-primary">{ocupado ? 'Lendo arquivo…' : 'Arraste a planilha aqui ou clique para escolher'}</p>
      <p className="text-sm text-slate-500">Aceita .xlsx, .xls e .csv — no padrão da Indicador.xlsx (abas Análises de Custo e Solicitação abertura de Periodo)</p>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        className="hidden"
        aria-label="Escolher arquivo"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onArquivo(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}
