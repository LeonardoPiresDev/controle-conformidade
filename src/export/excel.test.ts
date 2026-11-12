import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { gerarIndicadorXlsx, CABECALHO_ERROS, CABECALHO_SOLICITACOES } from './excel';
import { gerarModelo } from '../import/template';
import { lerArquivo } from '../import/parse';
import { detectarAba } from '../import/detect';
import { converterLinhas } from '../import/validateRows';
import { SEED_CADASTROS } from '../data/seed';
import { enrichErro, enrichSolicitacao } from '../domain/calc';
import type { Erro, Solicitacao } from '../domain/types';

const erros = [
  enrichErro({ codEmp: 20, empresa: 'UMAFLEX/SP', dataMov: '2026-01-20', docRef: 'NF 1', setor: 'FISCAL', tipoAnalise: 'VARIAÇÃO DE CUSTO', qtde: 2, usuario: 'KATY (FISCAL)', erroDetalhado: 'valor errado', categoria: 'ERRO NO ITEM', obs: 'x' }),
  enrichErro({ codEmp: 1, empresa: 'ORYON/PR MATRIZ', dataMov: '2025-12-31', docRef: 'PED 2', setor: 'COMPRAS', tipoAnalise: 'LANÇAMENTOS EM CENTRO DE CUSTO', qtde: 1, usuario: 'ANTÔNIO (COMPRAS)', erroDetalhado: 'cc errado', categoria: 'ERRO NO CENTRO DE CUSTO' }),
];
const sols = [
  enrichSolicitacao({ codEmp: 23, empresa: 'UMAFLEX/PE', dataMov: '2026-02-06', dataSolicitacao: '2026-02-16', docRef: 'NF 9', setor: 'FISCAL', solicitante: 'FILIPE (FISCAL)', motivo: 'correção TN' }),
];

describe('gerarIndicadorXlsx', () => {
  const buf = gerarIndicadorXlsx(erros, sols, SEED_CADASTROS);
  const wb = XLSX.read(new Uint8Array(buf), { type: 'array', cellDates: true });

  it('abas e cabeçalhos no formato original', () => {
    expect(wb.SheetNames).toEqual(['Categorias', 'Análises de Custo', 'Solicitação abertura de Periodo']);
    const err = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets['Análises de Custo'], { header: 1 });
    expect(err[2]).toEqual(CABECALHO_ERROS);
    const sol = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets['Solicitação abertura de Periodo'], { header: 1 });
    expect(sol[2]).toEqual(CABECALHO_SOLICITACOES);
    const cat = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets['Categorias'], { header: 1 });
    expect(cat[0]).toEqual(['CATEGORIAS']);
    expect(cat).toHaveLength(17);
  });

  it('datas saem como células de data', () => {
    const ws = wb.Sheets['Análises de Custo'];
    expect(ws['C4'].t).toBe('d');
  });

  it('round-trip: reimportar devolve os mesmos campos', () => {
    const abas = lerArquivo(buf, 'Indicador.xlsx');
    const dErr = detectarAba(abas[1]);
    const lErr = converterLinhas(abas[1], dErr, SEED_CADASTROS);
    expect(lErr).toHaveLength(2);
    const r0 = lErr[0].registro as Erro;
    expect(r0.dataMov).toBe('2026-01-20');
    expect(r0.usuario).toBe('KATY (FISCAL)');
    expect(r0.categoria).toBe('ERRO NO ITEM');
    expect(r0.qtde).toBe(2);
    expect(r0.obs).toBe('x');
    expect((lErr[1].registro as Erro).dataMov).toBe('2025-12-31');

    const dSol = detectarAba(abas[2]);
    const lSol = converterLinhas(abas[2], dSol, SEED_CADASTROS);
    expect(lSol).toHaveLength(1);
    const s0 = lSol[0].registro as Solicitacao;
    expect(s0.diasParaIdentificar).toBe(10);
    expect(s0.dataSolicitacao).toBe('2026-02-16');
  });
});

describe('gerarModelo', () => {
  it('tem as abas de dados vazias e uma aba Listas', () => {
    const wb = XLSX.read(new Uint8Array(gerarModelo(SEED_CADASTROS)), { type: 'array' });
    expect(wb.SheetNames).toEqual(['Categorias', 'Análises de Custo', 'Solicitação abertura de Periodo', 'Listas']);
    const err = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets['Análises de Custo'], { header: 1 });
    expect(err[2]).toEqual(CABECALHO_ERROS);
    expect(err.length).toBe(3);
    const listas = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets['Listas'], { header: 1 });
    expect(listas[0]).toEqual(['EMPRESAS', 'SETORES', 'TIPOS DE ANÁLISE', 'CATEGORIAS', 'USUÁRIOS']);
  });
});
