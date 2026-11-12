import { useId, useState } from 'react';
import clsx from 'clsx';

export interface SelectComCadastroProps {
  label: string;
  opcoes: string[];
  valor: string;
  onChange: (v: string) => void;
  /** Cadastra o novo valor e devolve o nome final (normalizado). */
  onNovo: (v: string) => Promise<string> | string | void;
  obrigatorio?: boolean;
  erro?: string;
  placeholderNovo?: string;
  disabled?: boolean;
  className?: string;
}

export const OPCAO_NOVO = '__novo__';

export function SelectComCadastro({ label, opcoes, valor, onChange, onNovo, obrigatorio, erro, placeholderNovo, disabled, className }: SelectComCadastroProps) {
  const id = useId();
  const [novo, setNovo] = useState<string | null>(null);

  async function confirmarNovo() {
    const v = (novo ?? '').trim();
    if (!v) {
      setNovo(null);
      return;
    }
    const final = (await onNovo(v)) || v.toUpperCase();
    onChange(final);
    setNovo(null);
  }

  const lista = valor && !opcoes.includes(valor) ? [valor, ...opcoes] : opcoes;

  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
        {obrigatorio && <span className="text-red-500"> *</span>}
      </label>
      {novo === null ? (
        <select
          id={id}
          className={clsx('input', erro && 'border-red-400')}
          value={valor}
          disabled={disabled}
          onChange={(e) => {
            if (e.target.value === OPCAO_NOVO) setNovo('');
            else onChange(e.target.value);
          }}
        >
          <option value="">Selecione…</option>
          {lista.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          <option value={OPCAO_NOVO}>+ Cadastrar novo…</option>
        </select>
      ) : (
        <div className="flex gap-2">
          <input
            autoFocus
            className="input"
            placeholder={placeholderNovo ?? `Novo ${label.toLowerCase()}`}
            value={novo}
            onChange={(e) => setNovo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void confirmarNovo();
              }
              if (e.key === 'Escape') setNovo(null);
            }}
          />
          <button type="button" className="btn-accent" onClick={() => void confirmarNovo()}>
            OK
          </button>
          <button type="button" className="btn-ghost" onClick={() => setNovo(null)}>
            ✕
          </button>
        </div>
      )}
      {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
    </div>
  );
}
