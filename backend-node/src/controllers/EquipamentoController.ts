import { Request, Response } from 'express';
import { EquipamentoService } from '../services/EquipamentoService';

const service = new EquipamentoService();

export class EquipamentoController {
  listarTodos = async (_req: Request, res: Response) => {
    try { res.json(await service.listarTodos()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  };

  buscarPorId = async (req: Request, res: Response) => {
    try { res.json(await service.buscarPorId(req.params.id)); }
    catch (e: any) { res.status(404).json({ error: e.message }); }
  };

  salvar = async (req: Request, res: Response) => {
    try { res.status(201).json(await service.salvar(req.body)); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  };

  atualizar = async (req: Request, res: Response) => {
    try { res.json(await service.atualizar(req.params.id, req.body)); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  };

  deletar = async (req: Request, res: Response) => {
    try { await service.deletar(req.params.id); res.status(204).send(); }
    catch (e: any) { res.status(404).json({ error: e.message }); }
  };
}
