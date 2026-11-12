import { Suspense, useEffect } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Layout } from './Layout';
import { BasePage, ConfiguracoesPage, DashboardPage, ImportarPage, LancarPage } from './routes';

function Carregando() {
  return <div className="py-16 text-center text-sm text-slate-500">Carregando…</div>;
}

export default function App() {
  const pronto = useAppStore((s) => s.pronto);
  const init = useAppStore((s) => s.init);
  const config = useAppStore((s) => s.config);

  useEffect(() => {
    if (!pronto) void init();
  }, [pronto, init]);

  useEffect(() => {
    document.documentElement.style.setProperty('--brand-primary', config.corPrimaria);
    document.documentElement.style.setProperty('--brand-accent', config.corDestaque);
  }, [config.corPrimaria, config.corDestaque]);

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route
            index
            element={
              <Suspense fallback={<Carregando />}>{pronto ? <DashboardPage /> : <Carregando />}</Suspense>
            }
          />
          <Route path="lancar" element={<Suspense fallback={<Carregando />}>{pronto ? <LancarPage /> : <Carregando />}</Suspense>} />
          <Route path="importar" element={<Suspense fallback={<Carregando />}>{pronto ? <ImportarPage /> : <Carregando />}</Suspense>} />
          <Route path="base" element={<Suspense fallback={<Carregando />}>{pronto ? <BasePage /> : <Carregando />}</Suspense>} />
          <Route path="configuracoes" element={<Suspense fallback={<Carregando />}>{pronto ? <ConfiguracoesPage /> : <Carregando />}</Suspense>} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
