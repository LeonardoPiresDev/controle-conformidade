# Controle de Conformidade — Especificação de Design

Data: 2026-11-12
Área: Controladoria / Custos (Umaflex)
Status: aprovado em conversa; aguardando revisão do texto

## 1. Objetivo

Substituir o processo manual "planilha `Indicador.xlsx` → atualizar Power BI" por uma aplicação web que:

1. registra ocorrências (erros de análise de custo e solicitações de abertura de período) uma única vez, sem retrabalho;
2. calcula sozinha tudo o que hoje é fórmula ou digitação repetida;
3. mostra dashboards idênticos em conteúdo às 3 páginas do Power BI atual, atualizados em tempo real;
4. gera em 1 clique o PDF executivo para a diretoria e o Excel no formato da planilha atual.

Fora de escopo nesta fase: login/usuários, banco compartilhado, envio automático de e-mail. A arquitetura deixa esses pontos prontos para a fase "nuvem compartilhada" (ver §9).

## 2. Decisões já tomadas

| Tema | Decisão | Motivo |
|---|---|---|
| Onde roda | App estático no navegador; dados em IndexedDB | Servidor da empresa não é opção; nuvem compartilhada fica para depois |
| Publicação | GitHub Pages (grátis) | Já há intenção de criar o repositório; URL acessível de qualquer lugar |
| Status da ocorrência | **Não existe campo Status** | Exigiria entrar duas vezes no registro; foco é automatizar |
| Taxa de inconsistência | Substituída por **Variação % vs. período anterior** | Não há denominador confiável na base |
| Estrutura de dados | Duas tabelas, espelhando as duas abas da planilha | O Power BI atual continua funcionando com o Excel exportado |

## 3. Stack

- Vite + React 18 + TypeScript
- Tailwind CSS (tema com as cores do Power BI)
- Recharts (gráficos)
- Dexie (IndexedDB)
- SheetJS `xlsx` (importar/exportar Excel e CSV)
- jsPDF + html2canvas (PDF)
- Vitest + Testing Library (testes)
- Zustand (estado global: filtros e cadastros em memória)

## 4. Modelo de dados

### 4.1 `erros` (aba "Análises de Custo")

| Campo | Tipo | Origem | Obrigatório |
|---|---|---|---|
| id | string (uuid) | gerado | — |
| codEmp | number | digitado / select | sim |
| empresa | string | **auto** pelo codEmp | — |
| dataMov | ISO date | digitado | sim |
| mesCompetencia | "MM/AAAA" | **auto** = mês de dataMov | — |
| docRef | string | digitado | não |
| setor | string | **auto** pelo usuário (editável) | sim |
| tipoAnalise | string | select | sim |
| qtde | number ≥ 1 | digitado (default 1) | sim |
| usuario | string | select | sim |
| erroDetalhado | string | digitado com autocomplete | sim |
| categoria | string | select | sim |
| obs | string | digitado | não |
| criadoEm / atualizadoEm | ISO datetime | auto | — |
| origem | "manual" \| "importacao" | auto | — |

### 4.2 `solicitacoes` (aba "Solicitação abertura de Periodo")

| Campo | Tipo | Origem | Obrigatório |
|---|---|---|---|
| id | uuid | gerado | — |
| codEmp / empresa | como acima | | sim |
| dataMov | ISO date | digitado | sim |
| dataSolicitacao | ISO date | digitado (default hoje) | sim |
| mesCompetencia | "MM/AAAA" | **auto** = mês de dataMov | — |
| diasParaIdentificar | number | **auto** = dataSolicitacao − dataMov (dias) | — |
| docRef | string | digitado | não |
| setor | string | **auto** pelo solicitante (editável) | sim |
| qtde | number ≥ 1 | default 1 | sim |
| solicitante | string | select | sim |
| motivo | string | digitado com autocomplete | sim |
| criadoEm / atualizadoEm / origem | | auto | — |

### 4.3 `cadastros` (listas)

- **empresas**: `{codEmp, nome}` — seed: 1 ORYON/PR MATRIZ · 2 ORYON/PR FILIAL · 10 SEBIAN/SP · 20 UMAFLEX/SP · 23 UMAFLEX/PE
- **setores**: lista de strings — seed com os 15 setores da base
- **tiposAnalise**: seed com os 5 tipos
- **categorias**: seed com as 16 categorias da aba "Categorias"
- **usuarios**: `{nome, setor}` — seed com os 45 usuários da base; o nome é exibido como `NOME (SETOR)` para manter o padrão da planilha

Regras:
- Qualquer select tem a opção "+ cadastrar novo", que grava no cadastro na hora.
- Usuário e setor aceitam edição posterior; a renomeação propaga para os registros (operação explícita em Configurações).
- Comparações de texto são normalizadas (maiúsculas, sem acento, espaços colapsados) para evitar duplicatas do tipo "LABORATORIO" / "LABORATÓRIO".

### 4.4 `config`

`{ logoDataUrl, corPrimaria, corDestaque, nomeEmpresa, tituloRelatorio }` com defaults: logo Umaflex embutida, `#0F2B46`, `#2F8BD8`, "Umaflex", "Controle de Conformidade".

## 5. Telas

Layout comum: cabeçalho azul-marinho com logo + "CONTROLE DE CONFORMIDADE" + subtítulo da tela, filete azul, fundo `#EEF2F8`, cartões brancos com raio 16px e sombra suave. Navegação lateral (desktop) / inferior (mobile).

### 5.1 Dashboard

Barra de filtros globais (persistem na sessão): período (data inicial/final, com atalhos Mês atual, Mês anterior, Ano), Empresa, Setor, Usuário, Tipo de Análise, Categoria. Os filtros se aplicam às 3 abas.

Cards no topo (calculados sobre o filtro ativo):
- Total de ocorrências (registros)
- Qtde de erros (soma de `qtde`)
- Variação % vs. período anterior de mesma duração
- Mediana de dias para identificar (apenas solicitações)

Abas (mesmo conteúdo do Power BI):

| Aba | Visuais |
|---|---|
| Erros por Usuário | Filtro rápido Tipo de Análise · Donut "Principais Causas de Erros" (Categoria) · Área "Evolução Mensal" (mês competência) · Barras "Ranking de Erros por Usuário" |
| Erros por Setor | Idem, com Barras "Ranking de Erros por Setor" |
| Solicitações | Donut "Solicitações por Setor" · Área "Evolução Mensal de Solicitações" · Barras "Mediana de Dias para Identificação por Setor" |

Clicar em uma fatia/barra aplica aquele valor como filtro (cross-filter), como no Power BI. Tudo recalcula a partir do estado em memória; qualquer gravação dispara re-render.

### 5.2 Lançar

Duas abas: **Erro** e **Solicitação**. Formulário em uma coluna, ordem igual à planilha. Automatizações:
- selecionar Usuário/Solicitante preenche Setor;
- selecionar Empresa preenche Cód e vice-versa;
- Data Mov default = hoje; Data Solicitação default = hoje;
- Erro Detalhado / Motivo com autocomplete das descrições já usadas;
- botão **Repetir último** copia o registro anterior (exceto Doc. Ref.);
- `Enter` no último campo salva, mostra toast e limpa mantendo Empresa/Data;
- validação inline; não salva com obrigatório vazio.

### 5.3 Importar

- Zona arrastar-e-soltar (`.xlsx`, `.xls`, `.csv`).
- Lê todas as abas; para cada aba, detecta o tipo pelo cabeçalho (procura a linha que contém "CÓD EMP"; aba com "DATA SOLICITAÇÃO" = solicitações, com "CATEGORIA" = erros, caso contrário ignora).
- Mapeamento de colunas por nome normalizado, com tela para ajustar manualmente se algum cabeçalho não casar.
- Pré-visualização paginada: linhas válidas, linhas com aviso (ex.: usuário novo — será cadastrado), linhas com erro (data inválida, obrigatório vazio) — estas não entram.
- **Duplicados**: registro já existente com mesmo (codEmp, dataMov, docRef, usuario, categoria/motivo) é marcado; padrão "pular", opção "importar mesmo assim".
- Botão **Baixar planilha modelo**: gera `.xlsx` com as duas abas e cabeçalhos exatos, mais uma aba "Listas" com os cadastros.
- Primeiro acesso: tela de boas-vindas oferece importar a `Indicador.xlsx` atual.

### 5.4 Base

Duas abas (Erros / Solicitações). Tabela com busca global, filtro por coluna, ordenação, paginação (25/50/100), edição em linha (duplo clique ou botão), exclusão com confirmação, seleção múltipla para excluir em lote. Colunas calculadas aparecem mas não são editáveis; mudar Data Mov recalcula competência/dias.

### 5.5 Relatórios / Exportar

- **PDF Executivo** (A4 paisagem): página 1 — cabeçalho com logo, título, período filtrado, data/hora de emissão; 4 cards; donut Categoria + área Evolução + barras Ranking Setor. Página 2 — tabela síntese Setor × Categoria e Top 10 usuários. Página 3 — solicitações: donut, evolução, mediana por setor. Rodapé com paginação e "Gerado por Controle de Conformidade".
- **Excel base**: `Indicador_AAAA-MM-DD.xlsx` com abas "Categorias", "Análises de Custo" e "Solicitação abertura de Periodo", cabeçalhos na linha 3 e mesmas colunas/ordem da planilha original (datas como data, não texto), respeitando o filtro ativo ou tudo (escolha no botão).
- Compartilhar: botão abre o PDF gerado em nova aba e, em mobile, usa `navigator.share` quando disponível.

### 5.6 Configurações

Cadastros (CRUD das 5 listas), Identidade (logo via upload → dataURL; cores), Backup (baixar JSON com tudo; restaurar com confirmação "substituir" ou "mesclar"), Zona de perigo (apagar tudo).

## 6. Arquitetura de código

```
src/
  app/            rotas, layout, tema
  data/
    db.ts         Dexie schema (erros, solicitacoes, cadastros, config)
    repository.ts interface Repository { listErros, saveErro, deleteErro, ... }  ← ponto de troca para Supabase
    dexieRepository.ts
    seed.ts       listas iniciais
  domain/
    calc.ts       mesCompetencia, diasParaIdentificar, normalizeText
    validate.ts   regras de obrigatoriedade por tipo
    aggregate.ts  agregações dos gráficos e cards (puras)
    period.ts     período anterior equivalente, atalhos de período
  import/
    parse.ts      xlsx/csv → linhas brutas por aba
    detect.ts     tipo da aba + mapeamento de colunas
    validateRows.ts, dedupe.ts
    template.ts   gera planilha modelo
  export/
    excel.ts      formato Indicador.xlsx
    pdf.ts        relatório executivo
  features/
    dashboard/ lancar/ importar/ base/ configuracoes/
  store/          Zustand: filtros, cadastros, config, cache de registros
```

Regra: tudo em `domain/`, `import/` e `export/excel.ts` é puro (sem React, sem Dexie) e testado unitariamente.

## 7. Tratamento de erros

- Falha ao abrir IndexedDB (modo privado/bloqueado): banner persistente explicando e oferecendo modo "sessão" em memória com aviso de perda.
- Importação: nenhum erro de linha aborta o lote; o resumo final mostra importadas / puladas (duplicadas) / rejeitadas, com download das rejeitadas em `.xlsx` para correção.
- Exportação PDF: se html2canvas falhar em algum gráfico, o PDF sai com placeholder e aviso em vez de quebrar.
- Restauração de backup valida o schema (versão) antes de gravar.

## 8. Testes

Vitest, unitários obrigatórios:
- `calc`: competência em virada de ano, dias para identificar negativos (erro de digitação) geram aviso, normalização de texto com acentos.
- `aggregate`: soma de qtde vs. contagem de registros, mediana com n par/ímpar, período anterior equivalente.
- `import/detect`: reconhece as duas abas reais da `Indicador.xlsx` (fixture copiada para `tests/fixtures`), ignora aba "Categorias" como dados, mapeia cabeçalhos com variações (`DATA\r\nMOV`).
- `import/dedupe`: identifica duplicatas exatas e não marca falsos positivos.
- `export/excel`: round-trip — exportar e reimportar produz os mesmos registros.
- Componentes: smoke test do formulário (não salva com obrigatório vazio; preenche setor ao escolher usuário).

Teste manual final: importar a `Indicador.xlsx` real (252 + 82 linhas) e conferir que os totais por setor/categoria batem com a planilha.

## 9. Preparação para a fase "nuvem compartilhada"

Não implementado agora, mas garantido pelo desenho:
- `Repository` é a única porta de dados; `supabaseRepository.ts` substituirá `dexieRepository.ts`.
- IDs são uuid gerados no cliente (sem conflito ao sincronizar).
- `criadoEm/atualizadoEm/origem` já existem para auditoria.
- Automações previstas: e-mail semanal com o PDF (Supabase Edge Function + cron), alerta por limite de erros/mês por usuário ou setor, importação agendada de CSV do ERP, link somente-leitura para a diretoria.

## 10. Entrega

- Repositório Git com `README.md`: como rodar (`npm i && npm run dev`), como publicar no GitHub Pages (`npm run deploy`), como usar cada módulo, como fazer backup.
- Build estático em `dist/`.
- Publicação no GitHub Pages feita a partir do repositório que o usuário criar.
