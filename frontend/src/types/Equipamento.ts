/**
 * Tipos TypeScript para a entidade Equipamento
 * O modelo Equipamento é global no banco e se associa ao cliente através da Ordem de Serviço.
 */

export type Equipamento = {
  id: string;
  modelo: string;
  marca: string;
  numeroSerie: string;
  problemaRelatado: string;
};

export type NovoEquipamento = {
  modelo: string;
  marca: string;
  numeroSerie: string;
  problemaRelatado: string;
};

