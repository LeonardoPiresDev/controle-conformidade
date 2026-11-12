import { describe, it, expect } from 'vitest';
import { validarErro, validarSolicitacao } from './validate';
import { enrichErro, enrichSolicitacao } from './calc';

const erroOk = enrichErro({ codEmp: 20, empresa: 'UMAFLEX/SP', dataMov: '2026-01-20', setor: 'FISCAL', tipoAnalise: 'VARIAÇÃO DE CUSTO', qtde: 1, usuario: 'X (FISCAL)', erroDetalhado: 'y', categoria: 'ERRO NO ITEM' });
const solOk = enrichSolicitacao({ codEmp: 1, empresa: 'ORYON/PR MATRIZ', dataMov: '2026-01-12', dataSolicitacao: '2026-01-15', setor: 'FISCAL', solicitante: 'JÉSSICA (FISCAL)', motivo: 'x' });

describe('validarErro', () => {
  it('registro completo é válido', () => {
    expect(validarErro(erroOk)).toEqual([]);
  });
  it('exige usuário', () => {
    expect(validarErro({ ...erroOk, usuario: '' }).join(' ')).toContain('Usuário');
  });
  it('exige qtde >= 1', () => {
    expect(validarErro({ ...erroOk, qtde: 0 }).join(' ')).toContain('Qtde');
  });
  it('exige data válida', () => {
    expect(validarErro({ ...erroOk, dataMov: '' }).join(' ')).toContain('Data');
  });
});

describe('validarSolicitacao', () => {
  it('registro completo é válido', () => {
    expect(validarSolicitacao(solOk)).toEqual([]);
  });
  it('exige solicitante e motivo', () => {
    const msgs = validarSolicitacao({ ...solOk, solicitante: '', motivo: '' }).join(' ');
    expect(msgs).toContain('Solicitante');
    expect(msgs).toContain('Motivo');
  });
});
