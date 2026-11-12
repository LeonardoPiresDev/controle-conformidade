import type { Erro, Solicitacao } from '../../domain/types';
import { Modal } from '../../components/ui';
import { FormErro } from '../lancar/FormErro';
import { FormSolicitacao } from '../lancar/FormSolicitacao';

export type Alvo = { tipo: 'erros'; registro: Erro } | { tipo: 'solicitacoes'; registro: Solicitacao } | null;

export function EditarRegistroModal({ alvo, onFechar }: { alvo: Alvo; onFechar: () => void }) {
  return (
    <Modal aberto={!!alvo} titulo={alvo?.tipo === 'erros' ? 'Editar erro' : 'Editar solicitação'} onFechar={onFechar} largura="max-w-3xl">
      {alvo?.tipo === 'erros' && <FormErro key={alvo.registro.id} inicial={alvo.registro} onSalvo={onFechar} onCancelar={onFechar} />}
      {alvo?.tipo === 'solicitacoes' && <FormSolicitacao key={alvo.registro.id} inicial={alvo.registro} onSalvo={onFechar} onCancelar={onFechar} />}
    </Modal>
  );
}
