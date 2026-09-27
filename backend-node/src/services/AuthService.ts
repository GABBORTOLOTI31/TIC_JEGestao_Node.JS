import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import { gerarToken } from '../utils/jwt';
import { Perfil } from '@prisma/client';

export class AuthService {
  async autenticar(email: string, senha: string): Promise<string> {
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      throw new Error('Credenciais inválidas.');
    }
    const senhaOk = await bcrypt.compare(senha, usuario.senha);
    if (!senhaOk) {
      throw new Error('Credenciais inválidas.');
    }
    return gerarToken(usuario.email, usuario.perfil);
  }

  async registrar(nome: string, email: string, senha: string, perfil: Perfil) {
    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      throw new Error(`E-mail já cadastrado: ${email}`);
    }
    const hash = await bcrypt.hash(senha, 10);
    return prisma.usuario.create({
      data: { nome, email, senha: hash, perfil },
    });
  }
}
