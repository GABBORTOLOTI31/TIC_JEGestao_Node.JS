/**
 * Tipos TypeScript para a entidade Cliente
 * O backend mapeia os dados da tabela 'pessoas' e 'clientes' em um objeto plano (flattened).
 * Identificadores BigInt chegam como string no JSON.
 */

export type Cliente = {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  dataCadastro: string;
  endereco: string;
};

// Payload esperado no POST /api/clientes (e PUT /api/clientes/:id)
export type NovoCliente = {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  dataCadastro: string;
  endereco: string;
};
