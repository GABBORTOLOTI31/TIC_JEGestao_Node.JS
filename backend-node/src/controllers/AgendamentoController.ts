import { Request, Response } from 'express';
import { AgendamentoService } from '../services/AgendamentoService';
import { StatusAgendamento } from '@prisma/client';

const service = new AgendamentoService();

export class AgendamentoController {
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

  atualizarStatus = async (req: Request, res: Response) => {
    try {
      const status = (req.query.status as string)?.toUpperCase() as StatusAgendamento;
      res.json(await service.atualizarStatus(req.params.id, status));
    }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  };

  deletar = async (req: Request, res: Response) => {
    try { await service.deletar(req.params.id); res.status(204).send(); }
    catch (e: any) { res.status(404).json({ error: e.message }); }
  };
}
