/**
 * Tipos TypeScript para a entidade Ordem de Serviço
 * Inclui checklist técnico e itens de materiais utilizados.
 */

export type StatusOS = 'ABERTA' | 'EM_ANDAMENTO' | 'PAUSADA' | 'CONCLUIDA' | 'CANCELADA';

export type ItemMaterialOS = {
  id: string;
  material: {
    id: string;
    descricao: string;
    precoUnitario: number;
  } | null;
  quantidade: number;
  precoUnitarioCobrado: number;
  valorTotalItem: number;
};

export type ChecklistOS = {
  id?: string;
  pressaoOk: boolean;
  temperaturaOk: boolean;
  limpezaOk: boolean;
  vazamentoVerificado: boolean;
  observacoesGerais: string | null;
};

export type OrdemServico = {
  id: string;
  cliente: {
    id: string;
    nome: string;
  } | null;
  tecnico: {
    id: string;
    nome: string;
  } | null;
  equipamento: {
    id: string;
    modelo: string;
    marca: string;
    problemaRelatado: string;
  } | null;
  agendamento: {
    id: string;
  } | null;
  dataAbertura: string;
  dataConclusao: string | null;
  status: StatusOS;
  diagnosticoTecnico: string | null;
  valorMaoDeObra: number;
  valorTotal: number;
  itensMaterial: ItemMaterialOS[];
  checklist: ChecklistOS | null;
};

// Payload esperado no POST /api/ordens-servico (camelCase)
export type NovaOrdemServico = {
  clienteId: string;
  tecnicoId: string;
  equipamentoId: string;
  agendamentoId?: string;
  valorMaoDeObra?: number;
  diagnosticoTecnico?: string;
};

