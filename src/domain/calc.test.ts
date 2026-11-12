import { describe, it, expect } from 'vitest';
import {
  mesCompetencia,
  diasEntre,
  normalizeText,
  parseDateBR,
  formatDateBR,
  enrichErro,
  enrichSolicitacao,
} from './calc';

describe('mesCompetencia', () => {
  it('formata MM/AAAA a partir de ISO', () => {
    expect(mesCompetencia('2026-01-20')).toBe('01/2026');
  });
  it('respeita virada de ano', () => {
    expect(mesCompetencia('2025-12-31')).toBe('12/2025');
  });
});

describe('diasEntre', () => {
  it('conta dias entre movimento e solicitação', () => {
    expect(diasEntre('2026-01-12', '2026-01-15')).toBe(3);
  });
  it('retorna negativo quando solicitação antecede movimento', () => {
    expect(diasEntre('2026-01-15', '2026-01-12')).toBe(-3);
  });
});

describe('normalizeText', () => {
  it('maiúsculas, sem acento, espaços colapsados', () => {
    expect(normalizeText(' Laboratório ')).toBe('LABORATORIO');
    expect(normalizeText('PED  9416')).toBe('PED 9416');
  });
});

describe('parseDateBR', () => {
  it('lê dd/mm/aa', () => {
    expect(parseDateBR('20/01/26')).toBe('2026-01-20');
  });
  it('lê dd/mm/aaaa', () => {
    expect(parseDateBR('20/01/2026')).toBe('2026-01-20');
  });
  it('lê serial do Excel', () => {
    expect(parseDateBR(46042)).toBe('2026-01-20');
  });
  it('lê ISO e Date', () => {
    expect(parseDateBR('2026-01-20')).toBe('2026-01-20');
    expect(parseDateBR(new Date(2026, 0, 20))).toBe('2026-01-20');
  });
  it('retorna null para lixo', () => {
    expect(parseDateBR('abc')).toBeNull();
    expect(parseDateBR('')).toBeNull();
    expect(parseDateBR('-')).toBeNull();
  });
});

describe('formatDateBR', () => {
  it('formata dd/mm/aaaa', () => {
    expect(formatDateBR('2026-01-20')).toBe('20/01/2026');
  });
});

describe('enrichErro', () => {
  it('preenche calculados, id e timestamps', () => {
    const e = enrichErro({ codEmp: 20, empresa: 'UMAFLEX/SP', dataMov: '2026-01-20', setor: 'FISCAL', tipoAnalise: 'VARIAÇÃO DE CUSTO', qtde: 1, usuario: 'X (FISCAL)', erroDetalhado: 'y', categoria: 'ERRO NO ITEM' });
    expect(e.mesCompetencia).toBe('01/2026');
    expect(e.id).toMatch(/[0-9a-f-]{36}/);
    expect(e.origem).toBe('manual');
    expect(e.docRef).toBe('');
    expect(e.criadoEm).toBeTruthy();
  });
  it('preserva id e criadoEm quando já existem', () => {
    const e = enrichErro({ id: 'abc', criadoEm: '2026-01-01T00:00:00.000Z', codEmp: 1, dataMov: '2026-02-01' });
    expect(e.id).toBe('abc');
    expect(e.criadoEm).toBe('2026-01-01T00:00:00.000Z');
    expect(e.mesCompetencia).toBe('02/2026');
  });
});

describe('enrichSolicitacao', () => {
  it('calcula dias e competência', () => {
    const s = enrichSolicitacao({ codEmp: 1, empresa: 'ORYON/PR MATRIZ', dataMov: '2026-01-12', dataSolicitacao: '2026-01-15', setor: 'FISCAL', solicitante: 'JÉSSICA (FISCAL)', motivo: 'x' });
    expect(s.diasParaIdentificar).toBe(3);
    expect(s.mesCompetencia).toBe('01/2026');
    expect(s.qtde).toBe(1);
  });
});
