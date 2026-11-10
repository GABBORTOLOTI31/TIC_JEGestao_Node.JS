/**
 * Tipos TypeScript para a entidade Técnico
 * O backend mapeia os dados da tabela 'pessoas' e 'tecnicos' em um objeto plano.
 */

export type Tecnico = {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  especialidade: string;
  nrRegistro: string;
  ativo: boolean;
};

// Payload esperado no POST /api/tecnicos
export type NovoTecnico = {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  especialidade: string;
  nrRegistro: string;
};

// Payload esperado no PUT /api/tecnicos/:id (o backend não aceita/atualiza CPF)
export type AtualizarTecnico = {
  nome: string;
  telefone: string;
  email: string;
  especialidade: string;
  nrRegistro: string;
};
