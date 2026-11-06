/**
 * Tipos TypeScript para a entidade Material / Peça
 */

export type Material = {
  id: string;
  descricao: string;
  unidade: string;
  precoUnitario: number;
};

// Payload esperado no POST /api/materiais
export type NovoMaterial = {
  descricao: string;
  unidade: string;
  precoUnitario: number;
};

