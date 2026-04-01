import { redirect } from 'next/navigation';

export default function ConfiguratorLogin() {
  // A configuração inicial (configuração do Banco de Dados) via interface 
  // foi desativada em favor de Variáveis de Ambiente no painel em Nuvem.
  redirect('/login');
}


