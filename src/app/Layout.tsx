import { NavLink, Outlet, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { useAppStore } from '../store/useAppStore';
import { ToastHost } from '../components/Toast';
import { ROTAS } from './routes';
import logoPadrao from '/logo-umaflex.png';

export function Layout() {
  const config = useAppStore((s) => s.config);
  const modoMemoria = useAppStore((s) => s.modoMemoria);
  const { pathname } = useLocation();
  const atual = ROTAS.find((r) => (r.path === '/' ? pathname === '/' : pathname.startsWith(r.path))) ?? ROTAS[0];

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b-4 border-brand-accent bg-brand-primary text-white">
        <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-3 sm:px-6">
          <img src={config.logoDataUrl ?? logoPadrao} alt={config.nomeEmpresa} className="h-9 w-auto rounded" />
          <div className="hidden h-9 w-px bg-sky-400/70 sm:block" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold tracking-wide leading-tight sm:text-lg">{config.tituloRelatorio.toUpperCase()}</h1>
            <p className="truncate text-xs text-slate-300 sm:text-sm">{atual.subtitulo}</p>
          </div>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
            {ROTAS.map((r) => (
              <NavLink key={r.path} to={r.path} end={r.path === '/'} className={({ isActive }) => clsx('flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition', isActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white')}>
                <span aria-hidden>{r.icone}</span>
                {r.titulo}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {modoMemoria && (
        <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
          O armazenamento do navegador está indisponível (modo privado ou bloqueado). Os dados ficam só nesta sessão — faça um backup antes de fechar.
        </div>
      )}

      <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 pb-24 pt-5 sm:px-6 lg:pb-8">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-slate-200 bg-white py-1 lg:hidden" aria-label="Principal (mobile)">
        {ROTAS.map((r) => (
          <NavLink key={r.path} to={r.path} end={r.path === '/'} className={({ isActive }) => clsx('flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] font-semibold', isActive ? 'text-brand-accent' : 'text-slate-500')}>
            <span className="text-lg" aria-hidden>
              {r.icone}
            </span>
            {r.titulo}
          </NavLink>
        ))}
      </nav>
      <ToastHost />
    </div>
  );
}
