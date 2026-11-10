/**
 * Tipos TypeScript para a entidade Orçamento
 */

export type StatusSolicitacao = 'PENDENTE' | 'EM_ANALISE' | 'APROVADO' | 'RECUSADO' | 'CONVERTIDO';

export type Orcamento = {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  tipoServico: string;
  descricao: string | null;
  dataEnvio: string;
  status: StatusSolicitacao;
};

// Payload esperado no POST /api/orcamentos
export type NovoOrcamento = {
  nome: string;
  telefone: string;
  email: string;
  tipoServico: string;
  descricao?: string;
};
