import { Request, Response } from 'express';
import { SolicitacaoServicoService } from '../services/SolicitacaoServicoService';
import { StatusSolicitacao } from '@prisma/client';

const service = new SolicitacaoServicoService();

export class SolicitacaoServicoController {
  listarTodas = async (_req: Request, res: Response) => {
    try { res.json(await service.listarTodas()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  };

  listarPorStatus = async (req: Request, res: Response) => {
    try {
      const status = (req.query.status as string)?.toUpperCase() as StatusSolicitacao;
      res.json(await service.listarPorStatus(status));
    }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  };

  buscarPorId = async (req: Request, res: Response) => {
    try { res.json(await service.buscarPorId(req.params.id)); }
    catch (e: any) { res.status(404).json({ error: e.message }); }
  };

  salvar = async (req: Request, res: Response) => {
    try { res.status(201).json(await service.salvar(req.body)); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  };

  atualizarStatus = async (req: Request, res: Response) => {
    try {
      const status = (req.query.status as string)?.toUpperCase() as StatusSolicitacao;
      res.json(await service.atualizarStatus(req.params.id, status));
    }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  };
}
