import { Request, Response } from 'express';
import { AgendamentoService } from '../services/AgendamentoService';
import { StatusAgendamento } from '@prisma/client';

const service = new AgendamentoService();

/**
 * Controller responsável pelo gerenciamento de requisições HTTP do módulo de Agendamentos.
 * Faz a intermediação entre as rotas da API e a camada de negócio (AgendamentoService).
 */
export class AgendamentoController {
  /**
   * Retorna a lista completa de todos os agendamentos cadastrados.
   * Responde com HTTP 200 e array de agendamentos ou 500 em caso de erro interno.
   */
  listarTodos = async (_req: Request, res: Response) => {
    try { res.json(await service.listarTodos()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  };

  /**
   * Busca um agendamento específico pelo seu identificador único (ID).
   * Responde com HTTP 200 caso encontrado ou 404 se não existir.
   */
  buscarPorId = async (req: Request, res: Response) => {
    try { res.json(await service.buscarPorId(req.params.id)); }
    catch (e: any) { res.status(404).json({ error: e.message }); }
  };

  /**
   * Cadastra um novo agendamento no sistema.
   * Valida existência de cliente, técnico, serviço e verifica conflitos de horário.
   * Responde com HTTP 201 (Created) e o agendamento criado, ou 400 em caso de erro de validação.
   */
  salvar = async (req: Request, res: Response) => {
    try { res.status(201).json(await service.salvar(req.body)); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  };

  /**
   * Atualiza os dados de um agendamento existente pelo ID.
   * Responde com HTTP 200 e o agendamento atualizado, ou 400 em caso de dados inválidos.
   */
  atualizar = async (req: Request, res: Response) => {
    try { res.json(await service.atualizar(req.params.id, req.body)); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  };

  /**
   * Altera exclusivamente o status de um agendamento via query parameter (?status=...).
   * Converte o status para caixa alta antes da validação.
   * Responde com HTTP 200 e o agendamento atualizado, ou 400 se o status for inválido.
   */
  atualizarStatus = async (req: Request, res: Response) => {
    try {
      const status = (req.query.status as string)?.toUpperCase() as StatusAgendamento;
      res.json(await service.atualizarStatus(req.params.id, status));
    }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  };

  /**
   * Remove um agendamento do sistema pelo ID.
   * Responde com HTTP 204 (No Content) em caso de sucesso ou 404 se o agendamento não for encontrado.
   */
  deletar = async (req: Request, res: Response) => {
    try { await service.deletar(req.params.id); res.status(204).send(); }
    catch (e: any) { res.status(404).json({ error: e.message }); }
  };
}
