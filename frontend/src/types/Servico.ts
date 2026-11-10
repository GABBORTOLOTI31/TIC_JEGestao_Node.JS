/**
 * Tipos TypeScript para a entidade Serviço
 * Valores monetários são retornados como number (Float no Prisma).
 */

export type Servico = {
  id: string;
  nome: string;
  descricao: string | null;
  valorBase: number;
  duracaoEstimada: number;
  ativo: boolean;
};

// Payload esperado no POST /api/servicos
export type NovoServico = {
  nome: string;
  descricao?: string;
  valorBase: number;
  duracaoEstimada: number;
};
