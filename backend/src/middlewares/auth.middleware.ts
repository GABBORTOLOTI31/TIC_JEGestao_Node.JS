import { Request, Response, NextFunction } from 'express';
import { verificarToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  usuario?: { email: string; perfil: string };
}

export function autenticar(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Token não fornecido.' });
    return;
  }

  try {
    const payload = verificarToken(token);
    req.usuario = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

export function autorizar(...perfis: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.usuario || !perfis.includes(req.usuario.perfil)) {
      res.status(403).json({ error: 'Acesso negado.' });
      return;
    }
    next();
  };
}
