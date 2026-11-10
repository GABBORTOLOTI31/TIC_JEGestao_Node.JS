/**
 * Tipos TypeScript para a entidade Agendamento
 * O backend retorna relações simplificadas com cliente, técnico e serviço.
 */

export type StatusAgendamento = 'PENDENTE' | 'CONFIRMADO' | 'CANCELADO' | 'CONCLUIDO';

export type Agendamento = {
  id: string;
  dataHoraMarcada: string;
  observacoes: string | null;
  status: StatusAgendamento;
  cliente: {
    id: string;
    nome: string;
  } | null;
  tecnico: {
    id: string;
    nome: string;
  } | null;
  servico: {
    id: string;
    nome: string;
    duracaoEstimada: number;
  } | null;
};

// Payload esperado no POST /api/agendamentos (nomes em camelCase)
export type NovoAgendamento = {
  clienteId: string;
  tecnicoId: string;
  servicoId: string;
  dataHoraMarcada: string;
  observacoes?: string;
};
