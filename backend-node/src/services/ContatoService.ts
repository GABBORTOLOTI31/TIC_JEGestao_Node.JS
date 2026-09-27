import prisma from '../prisma';

export class ContatoService {
  async salvar(data: any) {
    return prisma.contato.create({
      data: {
        nome: data.nome,
        telefone: data.telefone,
        mensagem: data.mensagem,
        dataEnvio: new Date(),
      },
    });
  }

  async listarTodos() {
    return prisma.contato.findMany({ orderBy: { dataEnvio: 'desc' } });
  }

  async buscarPorId(id: string) {
    const c = await prisma.contato.findUnique({ where: { id: BigInt(id) } });
    if (!c) throw new Error(`Contato não encontrado. ID: ${id}`);
    return c;
  }

  async deletar(id: string) {
    await this.buscarPorId(id);
    await prisma.contato.delete({ where: { id: BigInt(id) } });
  }
}
