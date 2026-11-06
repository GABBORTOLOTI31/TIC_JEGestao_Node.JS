/**
 * Tipos TypeScript para a entidade Contato / Fale Conosco
 */

export type Contato = {
  id: string;
  nome: string;
  telefone: string;
  mensagem: string;
  dataEnvio: string;
};

// Payload esperado no POST /api/contatos
export type NovoContato = {
  nome: string;
  telefone: string;
  mensagem: string;
};

