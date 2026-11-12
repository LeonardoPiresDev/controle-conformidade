import { lazy } from 'react';

export const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage'));
export const LancarPage = lazy(() => import('../features/lancar/LancarPage'));
export const ImportarPage = lazy(() => import('../features/importar/ImportarPage'));
export const BasePage = lazy(() => import('../features/base/BasePage'));
export const ConfiguracoesPage = lazy(() => import('../features/configuracoes/ConfiguracoesPage'));

export const ROTAS = [
  { path: '/', titulo: 'Dashboard', subtitulo: 'Indicadores de erros e solicitações', icone: '📊' },
  { path: '/lancar', titulo: 'Lançar', subtitulo: 'Registrar nova ocorrência', icone: '✍️' },
  { path: '/importar', titulo: 'Importar', subtitulo: 'Carga em lote via Excel / CSV', icone: '📥' },
  { path: '/base', titulo: 'Base', subtitulo: 'Consultar, editar e excluir registros', icone: '🗂️' },
  { path: '/configuracoes', titulo: 'Config', subtitulo: 'Cadastros, identidade visual e backup', icone: '⚙️' },
] as const;
