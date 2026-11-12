import { Request, Response } from 'express';
import { OrdemDeServicoService } from '../services/OrdemDeServicoService';
import { StatusOS } from '@prisma/client';

const service = new OrdemDeServicoService();

/**
 * Controller responsável pelo gerenciamento de requisições HTTP do módulo de Ordens de Serviço (OS).
 * Intermedia operações de abertura, status, checklist operacional e lançamento de materiais.
 */
export class OrdemDeServicoController {
  /**
   * Retorna a lista de todas as ordens de serviço cadastradas, com dados de cliente e técnico associados.
   * Responde com HTTP 200 e array de ordens ou 500 em caso de erro interno.
   */
  listarTodas = async (_req: Request, res: Response) => {
    try { res.json(await service.listarTodas()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  };

  /**
   * Busca os detalhes completos de uma ordem de serviço pelo ID, incluindo checklist e materiais.
   * Responde com HTTP 200 caso encontrada ou 404 se não existir.
   */
  buscarPorId = async (req: Request, res: Response) => {
    try { res.json(await service.buscarPorId(req.params.id)); }
    catch (e: any) { res.status(404).json({ error: e.message }); }
  };

  /**
   * Registra a abertura de uma nova Ordem de Serviço vinculada a cliente, técnico e equipamento.
   * Responde com HTTP 201 (Created) e a OS criada, ou 400 em caso de dados inválidos.
   */
  criar = async (req: Request, res: Response) => {
    try { res.status(201).json(await service.salvar(req.body)); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  };

  /**
   * Altera o status da ordem de serviço via query parameter (?status=...).
   * Em caso de conclusão (CONCLUIDA), a data de conclusão é registrada automaticamente.
   * Responde com HTTP 200 e a OS atualizada, ou 400 se o status for inválido.
   */
  atualizarStatus = async (req: Request, res: Response) => {
    try {
      const status = (req.query.status as string)?.toUpperCase() as StatusOS;
      res.json(await service.atualizarStatus(req.params.id, status));
    }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  };

  /**
   * Adiciona um item de material à OS via query params (?idMaterial=...&quantidade=...).
   * O preço unitário é congelado a partir do cadastro atual do material e o valor total da OS é recalculado.
   * Rejeita a operação se a OS estiver CONCLUIDA ou CANCELADA.
   * Responde com HTTP 200 e a OS atualizada, ou 400 em caso de erro.
   */
  adicionarMaterial = async (req: Request, res: Response) => {
    try {
      const idMaterial = String(req.query.idMaterial);
      const quantidade = Number(req.query.quantidade);
      res.json(await service.adicionarMaterial(req.params.id, idMaterial, quantidade));
    }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  };

  /**
   * Realiza operação de upsert no checklist operacional de inspeção técnica da OS.
   * Permite criação ou atualização dos itens de verificação (pressão, temperatura, etc.).
   * Responde com HTTP 200 e a OS atualizada, ou 400 em caso de erro.
   */
  definirChecklist = async (req: Request, res: Response) => {
    try { res.json(await service.definirChecklist(req.params.id, req.body)); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  };

  /**
   * Remove uma ordem de serviço do sistema pelo ID.
   * Responde com HTTP 204 (No Content) em caso de sucesso ou 404 se não encontrada.
   */
  deletar = async (req: Request, res: Response) => {
    try { await service.deletar(req.params.id); res.status(204).send(); }
    catch (e: any) { res.status(404).json({ error: e.message }); }
  };
}
