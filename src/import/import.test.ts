import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { lerArquivo } from './parse';
import { detectarAba } from './detect';
import { converterLinhas } from './validateRows';
import { marcarDuplicados } from './dedupe';
import { SEED_CADASTROS } from '../data/seed';
import { enrichSolicitacao } from '../domain/calc';
import type { Erro, Solicitacao } from '../domain/types';

function fixture(): ArrayBuffer {
  const buf = readFileSync(resolve(__dirname, '../../tests/fixtures/Indicador.xlsx'));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

describe('lerArquivo + detectarAba (planilha real)', () => {
  const abas = lerArquivo(fixture(), 'Indicador.xlsx');

  it('lê as 3 abas', () => {
    expect(abas.map((a) => a.nome)).toEqual(['Categorias', 'Análises de Custo', 'Solicitação abertura de Periodo']);
  });

  it('detecta tipo e linha de cabeçalho', () => {
    const [cat, err, sol] = abas.map(detectarAba);
    expect(cat.tipo).toBe('ignorar');
    expect(err.tipo).toBe('erros');
    expect(err.linhaCabecalho).toBe(2);
    expect(err.mapa.dataMov).toBe(2);
    expect(err.mapa.categoria).toBe(10);
    expect(sol.tipo).toBe('solicitacoes');
    expect(sol.mapa.dataSolicitacao).toBe(3);
    expect(sol.mapa.solicitante).toBe(9);
  });

  it('converte 252 erros sem rejeições', () => {
    const det = detectarAba(abas[1]);
    const linhas = converterLinhas(abas[1], det, SEED_CADASTROS);
    expect(linhas).toHaveLength(252);
    expect(linhas.filter((l) => l.status === 'erro')).toHaveLength(0);
    const r = linhas[0].registro as Erro;
    expect(r.dataMov).toBe('2026-01-20');
    expect(r.mesCompetencia).toBe('01/2026');
    expect(r.categoria).toBe('ERRO EMISSÃO DE NF');
    expect(r.codEmp).toBe(1);
    expect(r.empresa).toBe('ORYON/PR MATRIZ');
    expect(r.origem).toBe('importacao');
  });

  it('converte 82 solicitações e calcula dias', () => {
    const det = detectarAba(abas[2]);
    const linhas = converterLinhas(abas[2], det, SEED_CADASTROS);
    expect(linhas).toHaveLength(82);
    expect(linhas.filter((l) => l.status === 'erro')).toHaveLength(0);
    const r = linhas[0].registro as Solicitacao;
    expect(r.diasParaIdentificar).toBe(3);
    expect(r.solicitante).toBe('JÉSSICA (FISCAL)');
  });

  it('usuário desconhecido vira aviso e entra em novosCadastros', () => {
    const det = detectarAba(abas[2]);
    const linhas = converterLinhas(abas[2], det, SEED_CADASTROS);
    const mayara = linhas.find((l) => (l.registro as Solicitacao)?.solicitante === 'MAYARA(ALMOX)');
    expect(mayara?.status).toBe('aviso');
    expect(mayara?.novosCadastros.usuarios?.[0]).toEqual({ nome: 'MAYARA(ALMOX)', setor: 'ALMOXARIFADO' });
  });
});

describe('bordas de conversão', () => {
  const cab = ['CÓD EMP', 'DESC. EMPRESA', 'DATA MOV', 'MÊS COMPETÊNCIA', 'DOC. REFERÊNCIA', 'SETOR', 'TIPO DE ANÁLISE DE CUSTOS', 'QTDE', 'USUÁRIO', 'ERRO DETALHADO', 'CATEGORIA', 'OBS'];
  const linhaOk = [20, 'UMAFLEX/SP', '20/01/26', '', 'NF 1', 'FISCAL', 'VARIAÇÃO DE CUSTO', 1, 'KATY (FISCAL)', 'x', 'ERRO NO ITEM', ''];

  it('data inválida rejeita a linha', () => {
    const aba = { nome: 'x', linhas: [cab, [...linhaOk.slice(0, 2), 'abc', ...linhaOk.slice(3)]] };
    const det = detectarAba(aba);
    const [l] = converterLinhas(aba, det, SEED_CADASTROS);
    expect(l.status).toBe('erro');
    expect(l.mensagens.join(' ')).toMatch(/Data/);
  });

  it('empresa só com código usa o cadastro; categoria nova vira aviso', () => {
    const aba = { nome: 'x', linhas: [cab, [...linhaOk.slice(0, 1), '', ...linhaOk.slice(2, 10), 'ERRO NOVO', '']] };
    const det = detectarAba(aba);
    const [l] = converterLinhas(aba, det, SEED_CADASTROS);
    expect(l.status).toBe('aviso');
    expect((l.registro as Erro).empresa).toBe('UMAFLEX/SP');
    expect(l.novosCadastros.categorias).toEqual(['ERRO NOVO']);
  });

  it('CSV com ; é lido', () => {
    const csv = `${cab.join(';')}\n${linhaOk.join(';')}\n`;
    const buf = new TextEncoder().encode(csv).buffer as ArrayBuffer;
    const abas = lerArquivo(buf, 'base.csv');
    expect(abas).toHaveLength(1);
    const det = detectarAba(abas[0]);
    expect(det.tipo).toBe('erros');
    const [l] = converterLinhas(abas[0], det, SEED_CADASTROS);
    expect(l.status).toBe('ok');
    expect((l.registro as Erro).dataMov).toBe('2026-01-20');
  });
});

describe('marcarDuplicados', () => {
  const aba = {
    nome: 'x',
    linhas: [
      ['CÓD EMP', 'DESC. EMPRESA', 'DATA MOV', 'DOC. REFERÊNCIA', 'SETOR', 'TIPO DE ANÁLISE DE CUSTOS', 'QTDE', 'USUÁRIO', 'ERRO DETALHADO', 'CATEGORIA'],
      [20, 'UMAFLEX/SP', '20/01/26', 'NF 1', 'FISCAL', 'VARIAÇÃO DE CUSTO', 1, 'KATY (FISCAL)', 'x', 'ERRO NO ITEM'],
      [20, 'UMAFLEX/SP', '20/01/26', 'NF 2', 'FISCAL', 'VARIAÇÃO DE CUSTO', 1, 'KATY (FISCAL)', 'x', 'ERRO NO ITEM'],
    ],
  };
  it('marca chave igual e não marca docRef diferente', () => {
    const det = detectarAba(aba);
    const linhas = converterLinhas(aba, det, SEED_CADASTROS);
    const existentes = [linhas[0].registro as Erro];
    const res = marcarDuplicados(linhas, existentes, []);
    expect(res[0].duplicado).toBe(true);
    expect(res[1].duplicado).toBe(false);
  });
});

describe('CSV Windows-1252', () => {
  it('decodifica acentos de CSV salvo pelo Excel pt-BR', () => {
    const cab = 'CÓD EMP;DESC. EMPRESA;DATA MOV;DOC. REFERÊNCIA;SETOR;TIPO DE ANÁLISE DE CUSTOS;QTDE;USUÁRIO;ERRO DETALHADO;CATEGORIA';
    const linha = '20;UMAFLEX/SP;20/01/26;NF 1;LABORATÓRIO;VARIAÇÃO DE CUSTO;1;JUCÉLI (LABORATÓRIO);x;ERRO NO ITEM';
    const texto = `${cab}\n${linha}\n`;
    const bytes = new Uint8Array([...texto].map((c) => { const cp = c.charCodeAt(0); return cp < 128 ? cp : { 'Ó': 0xd3, 'Ê': 0xca, 'Á': 0xc1, 'Ã': 0xc3, 'Ç': 0xc7, 'É': 0xc9 }[c] ?? 0x3f; }));
    const abas = lerArquivo(bytes.buffer, 'base.csv');
    const det = detectarAba(abas[0]);
    expect(det.tipo).toBe('erros');
    const [l] = converterLinhas(abas[0], det, SEED_CADASTROS);
    expect(l.status).toBe('ok');
    expect((l.registro as Erro).setor).toBe('LABORATÓRIO');
    expect((l.registro as Erro).usuario).toBe('JUCÉLI (LABORATÓRIO)');
  });
});

describe('marcarDuplicados — solicitações', () => {
  it('mesma NF em datas de solicitação diferentes não é duplicada', () => {
    const base = { codEmp: 1, empresa: 'ORYON/PR MATRIZ', dataMov: '2026-03-04', docRef: 'NF 117071', setor: 'FISCAL', solicitante: 'JÉSSICA (FISCAL)', motivo: 'CORREÇÃO ITEM ARLA' };
    const existente = enrichSolicitacao({ ...base, dataSolicitacao: '2026-04-01' });
    const aba = { nome: 'x', linhas: [['CÓD EMP', 'DESC. EMPRESA', 'DATA DO MOVIMENTO', 'DATA SOLICITAÇÃO', 'DOC. REFERÊNCIA', 'SETOR', 'QTDE', 'SOLICITANTE', 'MOTIVO'], [1, 'ORYON/PR MATRIZ', '04/03/26', '01/04/26', 'NF 117071', 'FISCAL', 1, 'JÉSSICA (FISCAL)', 'CORREÇÃO ITEM ARLA'], [1, 'ORYON/PR MATRIZ', '04/03/26', '15/04/26', 'NF 117071', 'FISCAL', 1, 'JÉSSICA (FISCAL)', 'CORREÇÃO ITEM ARLA']] };
    const linhas = converterLinhas(aba, detectarAba(aba), SEED_CADASTROS);
    const res = marcarDuplicados(linhas, [], [existente]);
    expect(res[0].duplicado).toBe(true);
    expect(res[1].duplicado).toBe(false);
  });
});
