import { Request, Response } from 'express';
import { ServicoService } from '../services/ServicoService';

const service = new ServicoService();

export class ServicoController {
  listarTodos = async (_req: Request, res: Response) => {
    try { res.json(await service.listarTodos()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  };

  listarAtivos = async (_req: Request, res: Response) => {
    try { res.json(await service.listarAtivos()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  };

  buscarPorId = async (req: Request, res: Response) => {
    try { res.json(await service.buscarPorId(req.params.id)); }
    catch (e: any) { res.status(404).json({ error: e.message }); }
  };

  buscarPorNome = async (req: Request, res: Response) => {
    try { res.json(await service.buscarPorNome(String(req.query.nome ?? ''))); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  };

  salvar = async (req: Request, res: Response) => {
    try { res.status(201).json(await service.salvar(req.body)); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  };

  atualizar = async (req: Request, res: Response) => {
    try { res.json(await service.atualizar(req.params.id, req.body)); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  };

  ativarDesativar = async (req: Request, res: Response) => {
    try { res.json(await service.ativarDesativar(req.params.id)); }
    catch (e: any) { res.status(404).json({ error: e.message }); }
  };

  deletar = async (req: Request, res: Response) => {
    try { await service.deletar(req.params.id); res.status(204).send(); }
    catch (e: any) { res.status(404).json({ error: e.message }); }
  };
}
