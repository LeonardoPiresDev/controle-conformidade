import type { Cadastros, Config, Usuario } from '../domain/types';

export const SEED_EMPRESAS = [
  { codEmp: 1, nome: 'ORYON/PR MATRIZ' },
  { codEmp: 2, nome: 'ORYON/PR FILIAL' },
  { codEmp: 10, nome: 'SEBIAN/SP' },
  { codEmp: 20, nome: 'UMAFLEX/SP' },
  { codEmp: 23, nome: 'UMAFLEX/PE' },
];

export const SEED_SETORES = [
  'ALMOXARIFADO',
  'AMBULATORIO',
  'COMERCIAL',
  'COMPRAS',
  'ENGENHARIA',
  'FISCAL',
  'LABORATÓRIO',
  'LOGÍSTICA',
  'PCM',
  'PCP',
  'PROJETOS',
  'RECEPÇÃO',
  'RH',
  'SEGURANÇA',
  'TI',
];

export const SEED_TIPOS_ANALISE = [
  'ACERTOS DE ESTOQUE',
  'CONCILIAÇÃO DOS ESTOQUES',
  'LANÇAMENTOS EM CENTRO DE CUSTO',
  'REGISTRO DE INVENTÁRIO',
  'VARIAÇÃO DE CUSTO',
];

export const SEED_CATEGORIAS = [
  'ERRO NO TIPO DE NOTA',
  'ERRO NO ITEM',
  'ERRO NO CENTRO DE CUSTO',
  'ERRO NA CONTA CONTÁBIL',
  'ERRO NA OBSERVAÇÃO DO PEDIDO',
  'ERRO NA REQUISIÇÃO DA OP',
  'ERRO NO ACERTO DE ESTOQUE',
  'ERRO FALTA DE LANÇAMENTO FISCAL',
  'ERRO NO CADASTRO DE ITEM',
  'ERRO NA CONVERSÃO DE UNIDADE DE MEDIDA',
  'ERRO NA ESTRUTURA DE ITEM',
  'ERRO EMISSÃO DE IMPORTAÇÃO',
  'ERRO NO AVISO DE RECEBIMENTO',
  'ERRO NA COMPRA',
  'ERRO EMISSÃO DE NF',
  'ERRO NA CONFERÊNCIA DA NF',
];

const u = (nome: string, setor: string): Usuario => ({ nome, setor });

export const SEED_USUARIOS: Usuario[] = [
  u('ALICIA (FISCAL)', 'FISCAL'),
  u('ANDRÉ (PROJETOS)', 'PROJETOS'),
  u('ANTÔNIO (COMPRAS)', 'COMPRAS'),
  u('ARILSON (FISCAL)', 'FISCAL'),
  u('CAMILA (RH)', 'RH'),
  u('CARLOS (ALMOXARIFADO)', 'ALMOXARIFADO'),
  u('CARLOS (COMERCIAL)', 'COMERCIAL'),
  u('CARLOS RENATO (PCP)', 'PCP'),
  u('CAROL (RH)', 'RH'),
  u('DIEGO (PCM)', 'PCM'),
  u('EDJA (LOGÍSTICA)', 'LOGÍSTICA'),
  u('ELIANE (COMERCIAL)', 'COMERCIAL'),
  u('ERICK (COMERCIAL)', 'COMERCIAL'),
  u('FILIPE (FISCAL)', 'FISCAL'),
  u('FRANCIELLE (LOGÍSTICA)', 'LOGÍSTICA'),
  u('GERSON (ALMOXARIFADO)', 'ALMOXARIFADO'),
  u('GIUILIO (ENGENHARIA)', 'ENGENHARIA'),
  u('GLÁUCIA (LOGÍSTICA)', 'LOGÍSTICA'),
  u('HAISSEN (COMPRAS)', 'COMPRAS'),
  u('ISABELLA (PCP)', 'PCP'),
  u('JANAINA (COMERCIAL)', 'COMERCIAL'),
  u('JHONATA (COMERCIAL)', 'COMERCIAL'),
  u('JOÃO (ALMOXARIFADO)', 'ALMOXARIFADO'),
  u('JOÃO (FISCAL)', 'FISCAL'),
  u('JOÃO (PCM)', 'PCM'),
  u('JUCÉLI (LABORATÓRIO)', 'LABORATÓRIO'),
  u('JULIANO (TI)', 'TI'),
  u('JÉSSICA (FISCAL)', 'FISCAL'),
  u('JÚLIA (COMPRAS)', 'COMPRAS'),
  u('KATY (FISCAL)', 'FISCAL'),
  u('LUCAS (LOGÍSTICA)', 'LOGÍSTICA'),
  u('MARCELA (AMBULATORIO)', 'AMBULATORIO'),
  u('MARCELA (RECEPÇÃO)', 'RECEPÇÃO'),
  u('MARCOS (ALMOXARIFADO)', 'ALMOXARIFADO'),
  u('MARCOS (FISCAL)', 'FISCAL'),
  u('MATHEUS (ENGENHARIA)', 'ENGENHARIA'),
  u('MAYARA (ALMOXARIFADO)', 'ALMOXARIFADO'),
  u('MISLAINE (ALMOXARIFADO)', 'ALMOXARIFADO'),
  u('MÔNICA (LOGÍSTICA)', 'LOGÍSTICA'),
  u('PAULO (LOGÍSTICA)', 'LOGÍSTICA'),
  u('PAULO (SEGURANÇA DO TRABALHO)', 'SEGURANÇA'),
  u('RAYSSA (PCM)', 'PCM'),
  u('SAMUEL (PCM)', 'PCM'),
  u('TAINARA (PCM)', 'PCM'),
  u('VALÉRIA (FISCAL)', 'FISCAL'),
  u('VITÓRIA (COMPRAS)', 'COMPRAS'),
  u('WALTER (LOGÍSTICA)', 'LOGÍSTICA'),
];

export const SEED_CADASTROS: Cadastros = {
  empresas: SEED_EMPRESAS,
  setores: SEED_SETORES,
  tiposAnalise: SEED_TIPOS_ANALISE,
  categorias: SEED_CATEGORIAS,
  usuarios: SEED_USUARIOS,
};

export const DEFAULT_CONFIG: Config = {
  logoDataUrl: null,
  corPrimaria: '#0F2B46',
  corDestaque: '#2F8BD8',
  nomeEmpresa: 'Umaflex',
  tituloRelatorio: 'Controle de Conformidade',
};

/** Extrai o setor de um nome no padrão "NOME (SETOR)". */
export function setorDoNome(nome: string): string {
  const m = /\(([^)]+)\)?\s*$/.exec(nome);
  return m ? m[1].trim() : '';
}
