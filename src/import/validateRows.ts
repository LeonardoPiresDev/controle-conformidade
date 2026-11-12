import type { Cadastros, Erro, Solicitacao, Usuario } from '../domain/types';
import { enrichErro, enrichSolicitacao, normalizeText, parseDateBR } from '../domain/calc';
import { validarErro, validarSolicitacao } from '../domain/validate';
import { setorDoNome } from '../data/seed';
import type { AbaBruta } from './parse';
import type { CampoAlvo, Deteccao } from './detect';

export type StatusLinha = 'ok' | 'aviso' | 'erro';

export interface LinhaImportada {
  /** índice da linha na planilha (0-based, inclui cabeçalho) */
  indice: number;
  status: StatusLinha;
  mensagens: string[];
  registro: Erro | Solicitacao | null;
  novosCadastros: Partial<Cadastros>;
  duplicado?: boolean;
  bruto: unknown[];
}

function celula(linha: unknown[], idx: number | null): unknown {
  if (idx == null) return '';
  return linha[idx] ?? '';
}

function texto(v: unknown): string {
  if (v == null) return '';
  if (v instanceof Date) return v.toISOString();
  return String(v).trim();
}

function numero(v: unknown): number | null {
  if (v === '' || v == null) return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return isFinite(n) ? n : null;
}

function linhaVazia(linha: unknown[]): boolean {
  return linha.every((c) => c == null || String(c).trim() === '');
}

interface Ctx {
  cadastros: Cadastros;
  avisos: string[];
  novos: Partial<Cadastros>;
}

function acharLista(lista: string[], valor: string): string | null {
  const n = normalizeText(valor);
  return lista.find((x) => normalizeText(x) === n) ?? null;
}

function resolverLista(ctx: Ctx, lista: 'setores' | 'tiposAnalise' | 'categorias', valor: string, rotulo: string): string {
  if (!valor) return '';
  const achado = acharLista(ctx.cadastros[lista], valor);
  if (achado) return achado;
  const v = valor.trim().toUpperCase();
  ctx.avisos.push(`${rotulo} "${v}" não cadastrado — será cadastrado`);
  const arr = (ctx.novos[lista] ??= []);
  if (!arr.some((x) => normalizeText(x) === normalizeText(v))) arr.push(v);
  return v;
}

function resolverUsuario(ctx: Ctx, nome: string, setorInformado: string): Usuario | null {
  if (!nome) return null;
  const n = normalizeText(nome);
  const u = ctx.cadastros.usuarios.find((x) => normalizeText(x.nome) === n);
  if (u) return u;
  const novo: Usuario = { nome: nome.trim().toUpperCase(), setor: setorInformado || setorDoNome(nome).toUpperCase() };
  ctx.avisos.push(`Usuário "${novo.nome}" não cadastrado — será cadastrado`);
  const arr = (ctx.novos.usuarios ??= []);
  if (!arr.some((x) => normalizeText(x.nome) === n)) arr.push(novo);
  return novo;
}

function resolverEmpresa(ctx: Ctx, codRaw: unknown, nomeRaw: unknown): { codEmp: number; empresa: string } {
  const cod = numero(codRaw);
  const nome = texto(nomeRaw);
  let emp = cod != null ? ctx.cadastros.empresas.find((e) => e.codEmp === cod) : undefined;
  if (!emp && nome) emp = ctx.cadastros.empresas.find((e) => normalizeText(e.nome) === normalizeText(nome));
  if (emp) return { codEmp: emp.codEmp, empresa: emp.nome };
  if (cod != null && nome) {
    const novo = { codEmp: cod, nome: nome.toUpperCase() };
    ctx.avisos.push(`Empresa ${cod} - "${novo.nome}" não cadastrada — será cadastrada`);
    const arr = (ctx.novos.empresas ??= []);
    if (!arr.some((e) => e.codEmp === cod)) arr.push(novo);
    return { codEmp: cod, empresa: novo.nome };
  }
  return { codEmp: cod ?? 0, empresa: nome.toUpperCase() };
}

function resolverData(ctx: Ctx, raw: unknown, rotulo: string, erros: string[]): string {
  const t = raw instanceof Date || typeof raw === 'number' ? raw : texto(raw);
  if (t === '' || t === '-') {
    erros.push(`${rotulo} vazia`);
    return '';
  }
  const iso = parseDateBR(t as string | number | Date);
  if (!iso) {
    erros.push(`${rotulo} inválida: "${texto(raw)}"`);
    return '';
  }
  void ctx;
  return iso;
}

export function converterLinhas(aba: AbaBruta, det: Deteccao, cadastros: Cadastros): LinhaImportada[] {
  const out: LinhaImportada[] = [];
  if (det.tipo === 'ignorar' || det.linhaCabecalho < 0) return out;
  const m = det.mapa;
  const get = (linha: unknown[], campo: CampoAlvo) => celula(linha, m[campo]);

  for (let i = det.linhaCabecalho + 1; i < aba.linhas.length; i++) {
    const linha = aba.linhas[i] ?? [];
    if (linhaVazia(linha)) continue;
    const ctx: Ctx = { cadastros, avisos: [], novos: {} };
    const errosLinha: string[] = [];

    const { codEmp, empresa } = resolverEmpresa(ctx, get(linha, 'codEmp'), get(linha, 'empresa'));
    const dataMov = resolverData(ctx, get(linha, 'dataMov'), 'Data do movimento', errosLinha);
    const docRef = texto(get(linha, 'docRef')).replace(/\s+/g, ' ');
    const setorRaw = texto(get(linha, 'setor'));
    const qtde = numero(get(linha, 'qtde')) ?? 1;

    let registro: Erro | Solicitacao | null = null;

    if (det.tipo === 'erros') {
      const usuarioNome = texto(get(linha, 'usuario'));
      const setorResolvido = setorRaw ? resolverLista(ctx, 'setores', setorRaw, 'Setor') : '';
      const usuario = resolverUsuario(ctx, usuarioNome, setorResolvido);
      const setor = setorResolvido || (usuario ? resolverLista(ctx, 'setores', usuario.setor, 'Setor') : '');
      const e = enrichErro({
        codEmp,
        empresa,
        dataMov,
        docRef,
        setor,
        tipoAnalise: resolverLista(ctx, 'tiposAnalise', texto(get(linha, 'tipoAnalise')), 'Tipo de análise'),
        qtde,
        usuario: usuario?.nome ?? '',
        erroDetalhado: texto(get(linha, 'erroDetalhado')),
        categoria: resolverLista(ctx, 'categorias', texto(get(linha, 'categoria')), 'Categoria'),
        obs: texto(get(linha, 'obs')),
        origem: 'importacao',
      });
      errosLinha.push(...validarErro(e).filter((msg) => !msg.startsWith('Data')));
      registro = e;
    } else {
      const dataSolicitacao = resolverData(ctx, get(linha, 'dataSolicitacao'), 'Data da solicitação', errosLinha);
      const solicitanteNome = texto(get(linha, 'solicitante'));
      const setorResolvido = setorRaw ? resolverLista(ctx, 'setores', setorRaw, 'Setor') : '';
      const solicitante = resolverUsuario(ctx, solicitanteNome, setorResolvido);
      const setor = setorResolvido || (solicitante ? resolverLista(ctx, 'setores', solicitante.setor, 'Setor') : '');
      const s = enrichSolicitacao({
        codEmp,
        empresa,
        dataMov,
        dataSolicitacao,
        docRef,
        setor,
        qtde,
        solicitante: solicitante?.nome ?? '',
        motivo: texto(get(linha, 'motivo')),
        origem: 'importacao',
      });
      errosLinha.push(...validarSolicitacao(s).filter((msg) => !msg.startsWith('Data')));
      if (dataMov && dataSolicitacao && s.diasParaIdentificar < 0) ctx.avisos.push('Dias negativos: solicitação antes do movimento');
      registro = s;
    }

    const status: StatusLinha = errosLinha.length ? 'erro' : ctx.avisos.length ? 'aviso' : 'ok';
    out.push({
      indice: i,
      status,
      mensagens: [...errosLinha, ...ctx.avisos],
      registro: status === 'erro' ? null : registro,
      novosCadastros: ctx.novos,
      bruto: linha,
    });
  }
  return out;
}

/** Consolida os novos cadastros de todas as linhas aceitas em um único objeto. */
export function consolidarNovosCadastros(linhas: LinhaImportada[]): Partial<Cadastros> {
  const acc: Partial<Cadastros> = {};
  for (const l of linhas) {
    if (l.status === 'erro') continue;
    const n = l.novosCadastros;
    for (const k of ['setores', 'tiposAnalise', 'categorias'] as const) {
      for (const v of n[k] ?? []) {
        const arr = (acc[k] ??= []);
        if (!arr.some((x) => normalizeText(x) === normalizeText(v))) arr.push(v);
      }
    }
    for (const u of n.usuarios ?? []) {
      const arr = (acc.usuarios ??= []);
      if (!arr.some((x) => normalizeText(x.nome) === normalizeText(u.nome))) arr.push(u);
    }
    for (const e of n.empresas ?? []) {
      const arr = (acc.empresas ??= []);
      if (!arr.some((x) => x.codEmp === e.codEmp)) arr.push(e);
    }
  }
  return acc;
}
