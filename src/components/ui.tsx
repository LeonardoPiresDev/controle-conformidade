import { useEffect, useId, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

/* ---------- Card ---------- */
export function Card({ titulo, acoes, children, className, id }: { titulo?: ReactNode; acoes?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={clsx('card p-5', className)}>
      {(titulo || acoes) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          {titulo && <h2 className="text-base font-bold text-brand-primary">{titulo}</h2>}
          {acoes && <div className="flex items-center gap-2">{acoes}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

/* ---------- Campos ---------- */
type Base = { label: string; erro?: string; obrigatorio?: boolean; className?: string; hint?: string };

export function Input({ label, erro, obrigatorio, className, hint, ...rest }: Base & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
        {obrigatorio && <span className="text-red-500"> *</span>}
      </label>
      <input id={id} className={clsx('input', erro && 'border-red-400')} {...rest} />
      {hint && !erro && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
    </div>
  );
}

export function Textarea({ label, erro, obrigatorio, className, hint, ...rest }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
        {obrigatorio && <span className="text-red-500"> *</span>}
      </label>
      <textarea id={id} className={clsx('input min-h-[72px]', erro && 'border-red-400')} {...rest} />
      {hint && !erro && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
    </div>
  );
}

export function Select({ label, erro, obrigatorio, className, children, ...rest }: Base & SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
        {obrigatorio && <span className="text-red-500"> *</span>}
      </label>
      <select id={id} className={clsx('input', erro && 'border-red-400')} {...rest}>
        {children}
      </select>
      {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
    </div>
  );
}

/* ---------- Modal ---------- */
export function Modal({ aberto, titulo, onFechar, children, largura = 'max-w-2xl' }: { aberto: boolean; titulo: ReactNode; onFechar: () => void; children: ReactNode; largura?: string }) {
  useEffect(() => {
    if (!aberto) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onFechar();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [aberto, onFechar]);
  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8" role="dialog" aria-modal="true" onMouseDown={onFechar}>
      <div className={clsx('card w-full p-6', largura)} onMouseDown={(e) => e.stopPropagation()}>
        <header className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-brand-primary">{titulo}</h3>
          <button className="btn-ghost !px-2" onClick={onFechar} aria-label="Fechar">
            ✕
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

/* ---------- Empty state ---------- */
export function EmptyState({ titulo, descricao, acao }: { titulo: string; descricao?: string; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-slate-500">
      <p className="text-base font-semibold text-slate-700">{titulo}</p>
      {descricao && <p className="max-w-md text-sm">{descricao}</p>}
      {acao && <div className="mt-2">{acao}</div>}
    </div>
  );
}

/* ---------- Badge ---------- */
export function Badge({ tom = 'slate', children }: { tom?: 'slate' | 'green' | 'amber' | 'red' | 'blue'; children: ReactNode }) {
  const cls = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-800',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-sky-100 text-sky-800',
  }[tom];
  return <span className={clsx('inline-block rounded-full px-2 py-0.5 text-xs font-semibold', cls)}>{children}</span>;
}
