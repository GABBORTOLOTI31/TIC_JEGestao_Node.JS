import { Request, Response } from 'express';
import { ClienteService } from '../services/ClienteService';

const service = new ClienteService();

/**
 * Controller responsável pelo gerenciamento de requisições HTTP do módulo de Clientes.
 * Faz a intermediação entre as rotas da API e a camada de persistência (ClienteService).
 */
export class ClienteController {
  /**
   * Retorna a lista completa de todos os clientes cadastrados.
   * Responde com HTTP 200 e array de clientes ou 500 em caso de erro interno.
   */
  listarTodos = async (_req: Request, res: Response) => {
    try { res.json(await service.listarTodos()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  };

  /**
   * Busca um cliente específico pelo seu identificador único (ID).
   * Responde com HTTP 200 caso encontrado ou 404 se não existir.
   */
  buscarPorId = async (req: Request, res: Response) => {
    try { res.json(await service.buscarPorId(req.params.id)); }
    catch (e: any) { res.status(404).json({ error: e.message }); }
  };

  /**
   * Realiza busca textual de clientes pelo nome via query parameter (?nome=...).
   * Responde com HTTP 200 e array com os resultados encontrados.
   */
  buscarPorNome = async (req: Request, res: Response) => {
    try { res.json(await service.buscarPorNome(String(req.query.nome ?? ''))); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  };

  /**
   * Cadastra um novo cliente no sistema.
   * Valida unicidade de CPF e campos obrigatórios.
   * Responde com HTTP 201 (Created) e o cliente criado, ou 400 em caso de validação inválida.
   */
  salvar = async (req: Request, res: Response) => {
    try { res.status(201).json(await service.salvar(req.body)); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  };

  /**
   * Atualiza os dados completos de um cliente existente pelo ID (sem permitir alteração de CPF).
   * Responde com HTTP 200 e os dados atualizados, ou 400 em caso de erro.
   */
  atualizar = async (req: Request, res: Response) => {
    try { res.json(await service.atualizar(req.params.id, req.body)); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  };

  /**
   * Atualização parcial dos dados do cliente pelo ID.
   * Responde com HTTP 200 e os dados atualizados, ou 400 em caso de erro.
   */
  atualizarParcial = async (req: Request, res: Response) => {
    try { res.json(await service.atualizarParcial(req.params.id, req.body)); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  };

  /**
   * Remove um cliente do sistema pelo ID.
   * Responde com HTTP 204 (No Content) em caso de sucesso ou 404/400 se houver restrições de chave estrangeira.
   */
  deletar = async (req: Request, res: Response) => {
    try { await service.deletar(req.params.id); res.status(204).send(); }
    catch (e: any) { res.status(404).json({ error: e.message }); }
  };
}
