# Controle de Conformidade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicação web estática (IndexedDB) que substitui a planilha `Indicador.xlsx` + Power BI de Controle de Conformidade, com lançamento, importação em lote, base editável, dashboards em tempo real e exportação PDF/Excel.

**Architecture:** Vite + React + TypeScript SPA. Toda regra de negócio vive em módulos puros (`domain/`, `import/`, `export/`) testados com Vitest; a UI só compõe. Persistência via `Repository` (interface) implementada em Dexie, trocável por Supabase depois. Estado global em Zustand: cache dos registros + filtros; qualquer gravação recarrega o cache e re-renderiza os dashboards.

**Tech Stack:** Vite 5, React 18, TypeScript 5, Tailwind 3, Recharts 2, Dexie 4, xlsx 0.18 (SheetJS), jsPDF 2 + html2canvas 1, Zustand 4, react-router-dom 6, Vitest 2 + @testing-library/react, gh-pages.

**Spec:** `docs/superpowers/specs/2026-11-12-controle-conformidade-design.md`

## Global Constraints

- Idioma da UI e dos textos: português do Brasil; cabeçalhos de Excel exatamente como na planilha original (ver Task 6).
- Cores default: primária `#0F2B46`, destaque `#2F8BD8`, fundo `#EEF2F8`, cartões brancos raio 16px.
- Nenhum campo "Status". Cards: Total de ocorrências, Qtde de erros, Variação % vs. período anterior, Mediana de dias (solicitações).
- `mesCompetencia` formato `MM/AAAA`; datas armazenadas como ISO `YYYY-MM-DD`.
- Módulos em `src/domain`, `src/import`, `src/export/excel.ts` não importam React nem Dexie.
- Comparação de texto sempre via `normalizeText` (maiúsculas, sem acentos, espaços colapsados).
- Commits pequenos, mensagem em português, sufixo `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

1. Planilha com data em texto `dd/mm/aa` (ano de 2 dígitos) e também como número serial do Excel — ambos devem virar `2026-01-20`. (Task 5)
2. Usuário na planilha com grafia divergente (`MAYARA(ALMOX)` vs `MAYARA (ALMOXARIFADO)`) — importar deve cadastrar como novo com aviso, nunca falhar. (Task 5)
3. Filtro de período que cruza o ano (dez→jan): período anterior equivalente e evolução mensal ordenada cronologicamente, não alfabeticamente. (Task 3)
4. Editar `dataMov` ou `dataSolicitacao` na Base deve recalcular competência e dias; dias negativos salvam mas exibem aviso. (Task 2, Task 9)
5. IndexedDB indisponível (navegador privado): app abre em modo memória com banner, sem tela branca. (Task 4)

---

### Task 1: Scaffold do projeto

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/app/App.tsx`, `src/index.css`, `.gitignore`, `vitest.setup.ts`
- Test: `src/app/App.test.tsx`

**Interfaces:**
- Produces: `npm run dev|build|test|deploy`; `App` renderiza cabeçalho com texto `CONTROLE DE CONFORMIDADE`.

- [ ] **Step 1:** `npm create vite@latest . -- --template react-ts`; instalar deps: `react-router-dom zustand dexie recharts xlsx jspdf html2canvas date-fns clsx` e dev: `tailwindcss postcss autoprefixer vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event gh-pages @types/node`.
- [ ] **Step 2:** Configurar Tailwind com cores `brand.primary #0F2B46`, `brand.accent #2F8BD8`, `brand.bg #EEF2F8`; fonte `Segoe UI, system-ui, sans-serif`. `vite.config.ts` com `base: './'` e bloco `test: { environment: 'jsdom', setupFiles: './vitest.setup.ts' }`.
- [ ] **Step 3:** Teste `App.test.tsx`: renderiza `<App/>` e espera `screen.getByText('CONTROLE DE CONFORMIDADE')`. Rodar → FAIL.
- [ ] **Step 4:** `App.tsx` com layout: header (logo `/logo-umaflex.png`, título, subtítulo), filete, área de conteúdo. Rodar → PASS.
- [ ] **Step 5:** Scripts: `"deploy": "vite build && gh-pages -d dist"`. Commit `chore: scaffold Vite + React + Tailwind`.

### Task 2: Domínio — tipos, cálculo e validação

**Files:**
- Create: `src/domain/types.ts`, `src/domain/calc.ts`, `src/domain/validate.ts`
- Test: `src/domain/calc.test.ts`, `src/domain/validate.test.ts`

**Interfaces:**
- Produces (`types.ts`):
  ```ts
  type Erro = { id; codEmp: number; empresa; dataMov: string; mesCompetencia; docRef; setor; tipoAnalise; qtde: number; usuario; erroDetalhado; categoria; obs; criadoEm; atualizadoEm; origem: 'manual'|'importacao' }
  type Solicitacao = { id; codEmp; empresa; dataMov; dataSolicitacao; mesCompetencia; diasParaIdentificar: number; docRef; setor; qtde; solicitante; motivo; criadoEm; atualizadoEm; origem }
  type Empresa = { codEmp: number; nome: string }; type Usuario = { nome: string; setor: string }
  type Cadastros = { empresas: Empresa[]; setores: string[]; tiposAnalise: string[]; categorias: string[]; usuarios: Usuario[] }
  type Config = { logoDataUrl: string|null; corPrimaria; corDestaque; nomeEmpresa; tituloRelatorio }
  ```
- Produces (`calc.ts`): `mesCompetencia(isoDate): string` → `"01/2026"`; `diasEntre(dataMov, dataSolicitacao): number`; `normalizeText(s): string`; `parseDateBR(input: string|number|Date): string|null` (aceita `dd/mm/aa`, `dd/mm/aaaa`, ISO, serial Excel, Date); `formatDateBR(iso): string`; `enrichErro(partial): Erro` e `enrichSolicitacao(partial): Solicitacao` preenchem campos calculados + timestamps + uuid.
- Produces (`validate.ts`): `validarErro(e): string[]` e `validarSolicitacao(s): string[]` (lista de mensagens; vazia = ok). Obrigatórios conforme spec §4.

- [ ] **Step 1:** Testes `calc.test.ts`: `mesCompetencia('2026-01-20')==='01/2026'`; `mesCompetencia('2025-12-31')==='12/2025'`; `diasEntre('2026-01-12','2026-01-15')===3`; `diasEntre('2026-01-15','2026-01-12')===-3`; `normalizeText(' Laboratório ')==='LABORATORIO'`; `parseDateBR('20/01/26')==='2026-01-20'`; `parseDateBR(46042)==='2026-01-20'`; `parseDateBR('abc')===null`. Rodar → FAIL.
- [ ] **Step 2:** Implementar `calc.ts` (serial Excel: `new Date(Date.UTC(1899,11,30) + n*86400000)`). Rodar → PASS.
- [ ] **Step 3:** Testes `validate.test.ts`: erro sem `usuario` retorna mensagem contendo `Usuário`; `qtde: 0` retorna mensagem; registro completo retorna `[]`. Rodar → FAIL; implementar; PASS.
- [ ] **Step 4:** Commit `feat(domain): tipos, cálculos e validação`.

### Task 3: Domínio — períodos e agregações

**Files:**
- Create: `src/domain/period.ts`, `src/domain/aggregate.ts`
- Test: `src/domain/period.test.ts`, `src/domain/aggregate.test.ts`

**Interfaces:**
- Produces (`period.ts`): `type Periodo = { inicio: string; fim: string }`; `periodoAnterior(p): Periodo` (mesma duração em dias, terminando no dia anterior a `inicio`); `atalhos(hoje): { mesAtual, mesAnterior, anoAtual, tudo }`; `dentro(iso, p|null): boolean`.
- Produces (`aggregate.ts`):
  - `type Filtros = { periodo: Periodo|null; codEmp: number[]; setores: string[]; usuarios: string[]; tiposAnalise: string[]; categorias: string[] }`
  - `filtrarErros(erros, f): Erro[]`, `filtrarSolicitacoes(sol, f): Solicitacao[]` (usa `dataMov`; `usuarios` filtra `solicitante`; `tiposAnalise/categorias` ignorados para solicitações)
  - `somaQtde(rows): number`; `contagem(rows): number`; `mediana(nums): number` (0 se vazio)
  - `porChave<T>(rows, key: keyof T, valor: 'qtde'|'count'): {nome: string; valor: number}[]` ordenado desc
  - `evolucaoMensal(rows, valor): {mes: string; valor: number}[]` ordenado cronologicamente por `mesCompetencia`
  - `medianaDiasPorSetor(sol): {nome; valor}[]`
  - `variacaoPercentual(atual, anterior): number|null` (null se anterior = 0)

- [ ] **Step 1:** Testes: `periodoAnterior({inicio:'2026-01-01',fim:'2026-01-31'})` → `{inicio:'2025-12-02',fim:'2025-12-31'}`; `mediana([3,10,4])===4`; `mediana([3,10])===6.5`; `evolucaoMensal` com meses `['02/2026','12/2025','01/2026']` retorna ordem `12/2025, 01/2026, 02/2026`; `porChave` soma qtde por setor; `variacaoPercentual(120,100)===20`; `variacaoPercentual(5,0)===null`. Rodar → FAIL.
- [ ] **Step 2:** Implementar. PASS. Commit `feat(domain): períodos e agregações`.

### Task 4: Persistência — Dexie, Repository, seed, store

**Files:**
- Create: `src/data/db.ts`, `src/data/repository.ts`, `src/data/dexieRepository.ts`, `src/data/memoryRepository.ts`, `src/data/seed.ts`, `src/store/useAppStore.ts`
- Test: `src/data/repository.test.ts` (roda contra `memoryRepository` e contra Dexie com `fake-indexeddb`)

**Interfaces:**
- Produces (`repository.ts`):
  ```ts
  interface Repository {
    listErros(): Promise<Erro[]>; upsertErros(rows: Erro[]): Promise<void>; deleteErros(ids: string[]): Promise<void>;
    listSolicitacoes(); upsertSolicitacoes(rows); deleteSolicitacoes(ids);
    getCadastros(): Promise<Cadastros>; saveCadastros(c): Promise<void>;
    getConfig(): Promise<Config>; saveConfig(c): Promise<void>;
    exportAll(): Promise<Backup>; importAll(b: Backup, modo: 'substituir'|'mesclar'): Promise<void>; clearAll(): Promise<void>;
  }
  type Backup = { versao: 1; geradoEm: string; erros; solicitacoes; cadastros; config }
  ```
- Produces (`seed.ts`): `SEED_CADASTROS: Cadastros` com os valores da spec §4.3 (5 empresas, 15 setores, 5 tipos, 16 categorias, 45 usuários com setor extraído do parêntese); `DEFAULT_CONFIG`.
- Produces (`useAppStore.ts`): Zustand com `{ repo, pronto, modoMemoria, erros, solicitacoes, cadastros, config, filtros, init(), recarregar(), salvarErro(e), salvarSolicitacao(s), excluirErros(ids), excluirSolicitacoes(ids), salvarCadastros(c), salvarConfig(c), setFiltros(f), adicionarCadastro(lista, valor) }`. `init()` tenta Dexie (`db.open()`); se lançar, usa `memoryRepository` e `modoMemoria=true`.

- [ ] **Step 1:** Instalar `fake-indexeddb` (dev). Testes parametrizados: `upsertErros` + `listErros` devolve o registro; `deleteErros`; `getCadastros` em banco vazio devolve `SEED_CADASTROS`; `importAll(..., 'substituir')` apaga o anterior; `'mesclar'` mantém ids diferentes e sobrescreve iguais. FAIL.
- [ ] **Step 2:** Implementar Dexie schema (`erros: id, dataMov, setor, usuario, categoria`; `solicitacoes: id, dataMov, setor, solicitante`; `kv: chave`) e as duas implementações. PASS.
- [ ] **Step 3:** Implementar store; teste rápido: `init()` com Dexie quebrado (mock `db.open` rejeitando) → `modoMemoria===true`. PASS.
- [ ] **Step 4:** Commit `feat(data): repositório Dexie/memória, seed e store`.

### Task 5: Importação — parse, detecção, validação, duplicados, modelo

**Files:**
- Create: `src/import/parse.ts`, `src/import/detect.ts`, `src/import/validateRows.ts`, `src/import/dedupe.ts`, `src/import/template.ts`
- Test: `src/import/*.test.ts`; fixture `tests/fixtures/Indicador.xlsx` (copiar de `U:\Custos\SP\UMAFLEX\KPI\Indicador.xlsx`)

**Interfaces:**
- `parse.ts`: `lerArquivo(buf: ArrayBuffer, nome: string): AbaBruta[]` onde `AbaBruta = { nome: string; linhas: unknown[][] }` (CSV vira uma aba).
- `detect.ts`: `detectarAba(aba): { tipo: 'erros'|'solicitacoes'|'ignorar'; linhaCabecalho: number; mapa: Record<CampoAlvo, number|null> }`. Cabeçalhos casados por `normalizeText` contra tabela de sinônimos (ex.: `DATA MOV`, `DATA DO MOVIMENTO`, `DATA`; `USUARIO`, `SOLICITANTE`).
- `validateRows.ts`: `converterLinhas(aba, det, cadastros): LinhaImportada[]` com `LinhaImportada = { indice: number; status: 'ok'|'aviso'|'erro'; mensagens: string[]; registro: Erro|Solicitacao|null; novosCadastros: Partial<Cadastros> }`. Usuário/setor/categoria desconhecido → `aviso` + `novosCadastros`.
- `dedupe.ts`: `marcarDuplicados(linhas, existentes): LinhaImportada[]` adiciona flag `duplicado: boolean` pela chave `codEmp|dataMov|normalize(docRef)|normalize(usuario|solicitante)|normalize(categoria|motivo)`.
- `template.ts`: `gerarModelo(cadastros): ArrayBuffer` (usa `export/excel.ts` da Task 6 com listas vazias + aba "Listas").

- [ ] **Step 1:** Teste com a fixture real: `lerArquivo` retorna 3 abas; `detectarAba` → `Categorias: ignorar`, `Análises de Custo: erros` com `linhaCabecalho===2`, `Solicitação abertura de Periodo: solicitacoes`; `converterLinhas` da aba de erros produz 252 linhas, nenhuma `erro`, primeira com `dataMov==='2026-01-20'`, `mesCompetencia==='01/2026'`, `categoria==='ERRO EMISSÃO DE NF'`; aba de solicitações produz 82 linhas e a primeira tem `diasParaIdentificar===3`. FAIL.
- [ ] **Step 2:** Implementar `parse`, `detect`, `validateRows`. PASS.
- [ ] **Step 3:** Testes de borda: linha com data `'abc'` → `erro`; usuário `'MAYARA(ALMOX)'` inexistente → `aviso` e aparece em `novosCadastros.usuarios`; CSV com `;` como separador é lido. PASS.
- [ ] **Step 4:** Teste `dedupe`: mesma chave → `duplicado=true`; docRef diferente → false. PASS.
- [ ] **Step 5:** Commit `feat(import): leitura, detecção, validação e duplicados`.

### Task 6: Exportação Excel + modelo

**Files:**
- Create: `src/export/excel.ts`
- Test: `src/export/excel.test.ts`

**Interfaces:**
- `gerarIndicadorXlsx(erros, solicitacoes, cadastros): ArrayBuffer` — abas, na ordem: `Categorias` (A1 `CATEGORIAS`, lista abaixo), `Análises de Custo` (cabeçalho na linha 3: `CÓD EMP | DESC. EMPRESA | DATA MOV | MÊS COMPETÊNCIA | DOC. REFERÊNCIA | SETOR | TIPO DE ANÁLISE DE CUSTOS | QTDE | USUÁRIO | ERRO DETALHADO | CATEGORIA | OBS`), `Solicitação abertura de Periodo` (linha 3: `CÓD EMP | DESC. EMPRESA | DATA DO MOVIMENTO | DATA SOLICITAÇÃO | MÊS COMPETÊNCIA | DIAS PARA IDENTIFICAR O ERRO | DOC. REFERÊNCIA | SETOR | QTDE | SOLICITANTE | MOTIVO`). Datas como células tipo data (`cellDates`), formato `dd/mm/yy`.
- `gerarModelo` (Task 5) chama esta função com arrays vazios e acrescenta aba `Listas`.

- [ ] **Step 1:** Teste round-trip: gerar xlsx com 2 erros + 1 solicitação → passar por `lerArquivo` + `detectarAba` + `converterLinhas` → mesmos campos (dataMov, usuario, categoria, qtde, diasParaIdentificar). FAIL → implementar → PASS.
- [ ] **Step 2:** Commit `feat(export): Excel no formato Indicador.xlsx e planilha modelo`.

### Task 7: UI base — layout, navegação, componentes

**Files:**
- Create: `src/app/Layout.tsx`, `src/app/routes.tsx`, `src/components/{Card,Button,Select,Input,Modal,Toast,DataTable,EmptyState}.tsx`, `src/components/SelectComCadastro.tsx`
- Modify: `src/app/App.tsx`
- Test: `src/components/SelectComCadastro.test.tsx`

**Interfaces:**
- Rotas: `/` dashboard, `/lancar`, `/importar`, `/base`, `/configuracoes`. Layout: sidebar (≥1024px) / barra inferior (mobile) com ícones; header com subtítulo da rota; banner se `modoMemoria`.
- `SelectComCadastro({ opcoes: string[]; valor; onChange; onNovo(valor: string): void; label; obrigatorio })` — última opção `+ Cadastrar novo…` abre prompt inline.
- `DataTable<T>({ colunas, linhas, paginacao, busca, onEditar, onExcluir, selecao })`.

- [ ] **Step 1:** Teste: `SelectComCadastro` ao escolher `+ Cadastrar novo…` e digitar `TESTE` chama `onNovo('TESTE')` e `onChange('TESTE')`. FAIL → implementar → PASS.
- [ ] **Step 2:** Implementar layout e rotas com páginas placeholder; `App.test` continua passando. Commit `feat(ui): layout, navegação e componentes base`.

### Task 8: Tela Lançar

**Files:**
- Create: `src/features/lancar/LancarPage.tsx`, `FormErro.tsx`, `FormSolicitacao.tsx`, `useUltimoRegistro.ts`
- Test: `src/features/lancar/FormErro.test.tsx`

- [ ] **Step 1:** Testes: escolher usuário `ANTÔNIO (COMPRAS)` preenche setor `COMPRAS`; escolher empresa `20` preenche `UMAFLEX/SP`; submeter sem categoria não chama `salvarErro` e mostra mensagem; submeter completo chama `salvarErro` com `mesCompetencia==='01/2026'` para `dataMov='2026-01-20'` e limpa `docRef` mantendo `codEmp` e `dataMov`. FAIL.
- [ ] **Step 2:** Implementar os formulários (autocomplete de `erroDetalhado`/`motivo` com `<datalist>` das descrições existentes; botão "Repetir último"; Enter salva). PASS.
- [ ] **Step 3:** Commit `feat(lancar): formulários de erro e solicitação`.

### Task 9: Tela Base

**Files:**
- Create: `src/features/base/BasePage.tsx`, `EditarRegistroModal.tsx`
- Test: `src/features/base/BasePage.test.tsx`

- [ ] **Step 1:** Testes: busca `ANTÔNIO` filtra linhas; editar `dataMov` de `2026-01-12` para `2026-02-12` e salvar chama `salvarErro` com `mesCompetencia==='02/2026'`; excluir pede confirmação e chama `excluirErros([id])`; em solicitações, `dataSolicitacao` anterior a `dataMov` mostra aviso `Dias negativos` mas permite salvar. FAIL → implementar (reutiliza `FormErro`/`FormSolicitacao` no modal) → PASS.
- [ ] **Step 2:** Commit `feat(base): tabela com busca, filtros, edição e exclusão`.

### Task 10: Tela Importar

**Files:**
- Create: `src/features/importar/ImportarPage.tsx`, `DropZone.tsx`, `PreviewImportacao.tsx`, `MapeamentoColunas.tsx`, `ResumoImportacao.tsx`
- Test: `src/features/importar/ImportarPage.test.tsx`

- [ ] **Step 1:** Teste: soltar a fixture `Indicador.xlsx` → preview mostra `252` e `82` linhas; confirmar chama `upsertErros` com 252 e `upsertSolicitacoes` com 82 e salva novos cadastros; importar de novo marca todas como duplicadas e, com padrão "pular", grava 0. Botão "Baixar planilha modelo" dispara download (mock de `URL.createObjectURL`). FAIL → implementar → PASS.
- [ ] **Step 2:** Rejeitadas: botão "Baixar rejeitadas (.xlsx)". Tela de boas-vindas no primeiro acesso (`erros.length===0 && solicitacoes.length===0`) com atalho para importar. Commit `feat(importar): upload, preview, duplicados e modelo`.

### Task 11: Dashboard

**Files:**
- Create: `src/features/dashboard/DashboardPage.tsx`, `FiltrosGlobais.tsx`, `Cards.tsx`, `AbaErrosUsuario.tsx`, `AbaErrosSetor.tsx`, `AbaSolicitacoes.tsx`, `charts/{Donut,Area,BarrasRanking}.tsx`, `useDadosFiltrados.ts`
- Test: `src/features/dashboard/useDadosFiltrados.test.ts`

- [ ] **Step 1:** Teste do hook (sem Recharts): com 3 erros em jan e 1 em dez, filtro janeiro → `totalOcorrencias=3`, `qtdeErros=soma`, `variacao=200`; filtro por setor `FISCAL` reduz ranking. FAIL → implementar → PASS.
- [ ] **Step 2:** Implementar componentes; clique em fatia/barra chama `setFiltros` com o valor (toggle). Cada gráfico dentro de `<Card>` com `id` estável (`chart-categoria`, `chart-evolucao`, `chart-ranking-setor`, `chart-ranking-usuario`, `chart-sol-setor`, `chart-sol-evolucao`, `chart-sol-mediana`) para o PDF. Commit `feat(dashboard): cards, filtros e 3 abas`.

### Task 12: Exportação PDF e botões de exportação

**Files:**
- Create: `src/export/pdf.ts`, `src/features/dashboard/BotoesExportar.tsx`, `src/export/RelatorioOculto.tsx`
- Test: `src/export/pdf.test.ts` (só montagem de dados: `montarDadosRelatorio(erros, sol, filtros, config)` retorna cards, tabela Setor×Categoria e Top 10)

- [ ] **Step 1:** Teste `montarDadosRelatorio`: tabela Setor×Categoria com totais de linha/coluna; Top 10 usuários ordenado. FAIL → implementar → PASS.
- [ ] **Step 2:** `gerarPdf(dados, elementosGraficos: HTMLElement[]): Promise<Blob>` — A4 paisagem, cabeçalho (logo, título, período, emissão `dd/MM/yyyy HH:mm`), cards, gráficos via `html2canvas` (placeholder em falha), páginas 2 e 3 conforme spec §5.5, rodapé numerado. `RelatorioOculto` renderiza os gráficos em 1123×794px fora da tela para captura.
- [ ] **Step 3:** `BotoesExportar`: "PDF Executivo" (abre em nova aba + download; `navigator.share` se disponível), "Excel (filtro)" e "Excel (tudo)". Commit `feat(export): PDF executivo e botões`.

### Task 13: Configurações

**Files:**
- Create: `src/features/configuracoes/ConfiguracoesPage.tsx`, `Cadastros.tsx`, `Identidade.tsx`, `Backup.tsx`
- Test: `src/features/configuracoes/Backup.test.tsx`

- [ ] **Step 1:** Teste: restaurar JSON com `versao` diferente de 1 mostra erro e não chama `importAll`; JSON válido pede modo e chama `importAll(b,'mesclar')`. FAIL → implementar → PASS.
- [ ] **Step 2:** Cadastros CRUD (renomear propaga para registros via `upsert` em lote), upload de logo (dataURL, máx 500 KB), cores aplicadas como CSS vars `--brand-primary/--brand-accent`, "Apagar tudo" com dupla confirmação. Commit `feat(config): cadastros, identidade e backup`.

### Task 14: Verificação final, README e publicação

- [ ] **Step 1:** `npm test` e `npm run build` verdes; `npx tsc --noEmit` sem erros.
- [ ] **Step 2:** Teste manual no navegador: importar a `Indicador.xlsx` real; conferir Ranking por Setor = FISCAL 86 registros / COMPRAS 54 / LOGÍSTICA 39 / ALMOXARIFADO 35 (contagem) e categoria `ERRO NO CENTRO DE CUSTO` = 103 registros; solicitações FISCAL = 69. Gerar PDF e Excel; reimportar o Excel exportado → 0 novas linhas (tudo duplicado).
- [ ] **Step 3:** `README.md`: instalação, uso de cada módulo, backup, publicação no GitHub Pages, roteiro da fase nuvem (Supabase). Commit `docs: README`.
- [ ] **Step 4:** Mover a sessão para a pasta definitiva escolhida pelo usuário; criar repositório GitHub privado; `git push`; `npm run deploy`; configurar Pages na branch `gh-pages`.
