import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_EXPIRES_IN = '8h';

export function gerarToken(email: string, perfil: string): string {
  return jwt.sign({ email, perfil }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verificarToken(token: string): { email: string; perfil: string } {
  const payload = jwt.verify(token, JWT_SECRET) as { email: string; perfil: string };
  return payload;
}
