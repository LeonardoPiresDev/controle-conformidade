import { create } from 'zustand';
import clsx from 'clsx';

type Tom = 'ok' | 'erro' | 'info';
interface ToastItem {
  id: number;
  texto: string;
  tom: Tom;
}
interface ToastState {
  itens: ToastItem[];
  mostrar: (texto: string, tom?: Tom) => void;
  remover: (id: number) => void;
}

let seq = 0;
export const useToast = create<ToastState>((set, get) => ({
  itens: [],
  mostrar(texto, tom = 'ok') {
    const id = ++seq;
    set({ itens: [...get().itens, { id, texto, tom }] });
    setTimeout(() => get().remover(id), tom === 'erro' ? 6000 : 3500);
  },
  remover(id) {
    set({ itens: get().itens.filter((t) => t.id !== id) });
  },
}));

export const toast = {
  ok: (t: string) => useToast.getState().mostrar(t, 'ok'),
  erro: (t: string) => useToast.getState().mostrar(t, 'erro'),
  info: (t: string) => useToast.getState().mostrar(t, 'info'),
};

export function ToastHost() {
  const itens = useToast((s) => s.itens);
  const remover = useToast((s) => s.remover);
  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-[60] flex flex-col gap-2 lg:bottom-6">
      {itens.map((t) => (
        <div
          key={t.id}
          role="status"
          onClick={() => remover(t.id)}
          className={clsx(
            'pointer-events-auto cursor-pointer rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg',
            t.tom === 'ok' && 'bg-emerald-600',
            t.tom === 'erro' && 'bg-red-600',
            t.tom === 'info' && 'bg-brand-primary',
          )}
        >
          {t.texto}
        </div>
      ))}
    </div>
  );
}
