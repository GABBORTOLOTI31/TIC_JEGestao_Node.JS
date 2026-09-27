import { Request, Response } from 'express';
import { OrdemDeServicoService } from '../services/OrdemDeServicoService';
import { StatusOS } from '@prisma/client';

const service = new OrdemDeServicoService();

export class OrdemDeServicoController {
  listarTodas = async (_req: Request, res: Response) => {
    try { res.json(await service.listarTodas()); }
    catch (e: any) { res.status(500).json({ error: e.message }); }
  };

  buscarPorId = async (req: Request, res: Response) => {
    try { res.json(await service.buscarPorId(req.params.id)); }
    catch (e: any) { res.status(404).json({ error: e.message }); }
  };

  criar = async (req: Request, res: Response) => {
    try { res.status(201).json(await service.salvar(req.body)); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  };

  atualizarStatus = async (req: Request, res: Response) => {
    try {
      const status = (req.query.status as string)?.toUpperCase() as StatusOS;
      res.json(await service.atualizarStatus(req.params.id, status));
    }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  };

  adicionarMaterial = async (req: Request, res: Response) => {
    try {
      const idMaterial = String(req.query.idMaterial);
      const quantidade = Number(req.query.quantidade);
      res.json(await service.adicionarMaterial(req.params.id, idMaterial, quantidade));
    }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  };

  definirChecklist = async (req: Request, res: Response) => {
    try { res.json(await service.definirChecklist(req.params.id, req.body)); }
    catch (e: any) { res.status(400).json({ error: e.message }); }
  };

  deletar = async (req: Request, res: Response) => {
    try { await service.deletar(req.params.id); res.status(204).send(); }
    catch (e: any) { res.status(404).json({ error: e.message }); }
  };
}
