# Controle de Conformidade — Controladoria / Custos

Aplicação web que substitui o processo manual "planilha `Indicador.xlsx` → Power BI" para o controle diário de erros de análise de custo e solicitações de abertura de período.

- Roda 100% no navegador (dados em IndexedDB), sem servidor.
- Publicável de graça no GitHub Pages.
- Pronta para a fase "nuvem compartilhada" (Supabase) sem reescrever telas — ver [Próxima fase](#próxima-fase-nuvem-compartilhada-e-automações).

## Como rodar

```bash
npm install
npm run dev
```

Abra http://localhost:5173. Outros comandos:

| Comando | O que faz |
|---|---|
| `npm test` | roda os 91 testes (cálculos, importação, Excel, telas) |
| `npm run build` | gera a versão estática em `dist/` (inclui checagem de tipos) |
| `npm run deploy` | publica `dist/` na branch `gh-pages` do repositório |

## Primeiro acesso

1. Abra o app → tela de boas-vindas → **Importar Indicador.xlsx**.
2. Solte a planilha atual. O sistema reconhece as abas *Análises de Custo* e *Solicitação abertura de Periodo* pelo cabeçalho, mostra a pré-visualização e cadastra sozinho usuários/categorias que ainda não existiam.
3. Confirme. O dashboard já aparece preenchido.

## Módulos

### Dashboard
Três abas iguais ao Power BI (*Erros por Usuário*, *Erros por Setor*, *Solicitações de Abertura de Período*), cards no topo e filtros globais (período com atalhos, empresa, setor, usuário, tipo de análise, categoria). Clicar numa fatia ou barra aplica aquele valor como filtro; clicar de novo remove. Tudo recalcula na hora após qualquer lançamento, importação ou edição.

**Cards:** Ocorrências (registros), Qtde de erros (soma da coluna Qtde), Variação % vs. período anterior de mesma duração (precisa de um período selecionado), Solicitações e Mediana de dias para identificar o erro.

### Lançar
Formulário rápido para **Erro** ou **Solicitação**. Automatizações:
- escolher o usuário preenche o setor; escolher a empresa preenche o código (e vice-versa);
- mês de competência e dias para identificar são calculados, nunca digitados;
- *Erro detalhado* e *Motivo* sugerem descrições já usadas;
- `Enter` salva, limpa o formulário e mantém empresa/data para o próximo lançamento;
- **Repetir último** copia o lançamento anterior (menos o Doc. referência);
- qualquer lista tem **+ Cadastrar novo…** direto no campo.

### Importar
Arrastar e soltar `.xlsx`, `.xls` ou `.csv`. Linhas com data inválida ou campo obrigatório vazio são rejeitadas (e podem ser baixadas para correção); registros já existentes (mesma empresa, data, doc., usuário e categoria/motivo) são marcados como duplicados e pulados por padrão. Se um cabeçalho não for reconhecido, use **Ajustar mapeamento de colunas**. **Baixar planilha modelo** gera o arquivo no formato correto com uma aba *Listas*.

### Base
Tabela completa com busca, filtro por coluna, ordenação, paginação, edição (botão ou duplo clique) e exclusão individual ou em lote. Alterar a data recalcula competência/dias.

### Exportar (botões no Dashboard)
- **PDF Executivo** — A4 paisagem, 3 páginas: resumo (logo, cards, causas, evolução, ranking por setor), síntese Setor × Categoria + Top 10 usuários, e solicitações. No celular abre o compartilhamento (WhatsApp/e-mail); no PC baixa e abre em nova aba.
- **Excel (filtro)** / **Excel (tudo)** — gera `Indicador_AAAA-MM-DD.xlsx` com as abas e cabeçalhos exatos da planilha original, então o Power BI atual continua funcionando enquanto a migração acontece.

### Configurações
- **Cadastros:** usuários (com setor), setores, categorias, tipos de análise, empresas. Renomear propaga para todos os registros; excluir só é permitido quando nada usa o item.
- **Identidade visual:** logo (até 500 KB), nome, título e cores — valem para o sistema e para o PDF.
- **Backup:** baixar JSON com tudo e restaurar (substituir ou mesclar). Faça backup com frequência: os dados vivem no navegador em que foram lançados.

## Onde ficam os dados

No IndexedDB do navegador (`controle-conformidade`). Isso significa:
- fechar/atualizar a página não perde nada;
- outro navegador ou outro computador **não** vê os mesmos dados — use Backup/Restaurar para transferir;
- em janela anônima o app avisa e funciona só em memória.

## Publicar no GitHub Pages

```bash
git remote add origin https://github.com/<usuario>/<repo>.git
git push -u origin main
npm run deploy
```

Depois, em *Settings → Pages* do repositório, confirme a branch `gh-pages`. O app usa rotas com `#`, então funciona em qualquer subpasta.

## Próxima fase: nuvem compartilhada e automações

A única porta de dados é a interface `Repository` (`src/data/repository.ts`). Para a equipe inteira usar a mesma base:

1. Criar um projeto no **Supabase** (plano gratuito: Postgres + autenticação).
2. Implementar `src/data/supabaseRepository.ts` com os mesmos métodos de `dexieRepository.ts` (tabelas `erros`, `solicitacoes`, `kv`), e trocar em `useAppStore.init`.
3. Ativar login por e-mail e um link somente-leitura para a diretoria.

Automações previstas com essa base:
- **E-mail semanal** com o PDF executivo (Supabase Edge Function + cron).
- **Alerta** quando um usuário ou setor ultrapassa X erros no mês.
- **Importação agendada** de CSV exportado do ERP.
- **Histórico de alterações** (quem editou o quê) — os campos `criadoEm`, `atualizadoEm` e `origem` já existem para isso.

## Estrutura do código

```
src/domain      regras puras: cálculo, validação, períodos, agregações (100% testadas)
src/import      leitura xlsx/csv, detecção de abas, validação de linhas, duplicados, modelo
src/export      Excel no formato Indicador.xlsx, PDF executivo, download
src/data        Repository (interface), Dexie, memória, seed dos cadastros
src/store       Zustand: cache dos registros, filtros, ações
src/features    telas: dashboard, lancar, importar, base, configuracoes
src/components  UI reutilizável (tabela, modal, selects com cadastro, toast)
```

Especificação e plano: `docs/superpowers/specs/` e `docs/superpowers/plans/`.
