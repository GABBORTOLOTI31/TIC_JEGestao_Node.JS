import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { Perfil } from '@prisma/client';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, senha } = req.body;
      const token = await authService.autenticar(email, senha);
      res.json({ token });
    } catch (e: any) {
      res.status(401).json({ error: e.message });
    }
  }

  async registrar(req: Request, res: Response): Promise<void> {
    try {
      const { nome, email, senha, perfil } = req.body;
      const perfilEnum: Perfil = (perfil?.toUpperCase() as Perfil) || Perfil.ATENDENTE;
      const usuario = await authService.registrar(nome, email, senha, perfilEnum);
      res.json({
        mensagem: 'Usuário registrado com sucesso.',
        id: usuario.id.toString(),
        email: usuario.email,
        perfil: usuario.perfil,
      });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }
}
