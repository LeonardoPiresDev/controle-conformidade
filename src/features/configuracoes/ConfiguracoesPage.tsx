import { Cadastros } from './Cadastros';
import { Identidade } from './Identidade';
import { Backup } from './Backup';

export default function ConfiguracoesPage() {
  return (
    <div className="grid gap-5">
      <Cadastros />
      <Identidade />
      <Backup />
    </div>
  );
}
