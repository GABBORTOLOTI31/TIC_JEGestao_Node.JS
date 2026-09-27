import prisma from '../prisma';

export class ServicoService {
  async listarTodos() {
    return prisma.servico.findMany();
  }

  async listarAtivos() {
    return prisma.servico.findMany({ where: { ativo: true } });
  }

  async buscarPorId(id: string) {
    const s = await prisma.servico.findUnique({ where: { id: BigInt(id) } });
    if (!s) throw new Error(`Serviço não encontrado. ID: ${id}`);
    return s;
  }

  async buscarPorNome(nome: string) {
    return prisma.servico.findMany({
      where: { nome: { contains: nome, mode: 'insensitive' } },
    });
  }

  async salvar(data: any) {
    return prisma.servico.create({
      data: {
        nome: data.nome,
        descricao: data.descricao ?? null,
        valorBase: Number(data.valorBase),
        duracaoEstimada: Number(data.duracaoEstimada),
        ativo: true,
      },
    });
  }

  async atualizar(id: string, data: any) {
    await this.buscarPorId(id);
    return prisma.servico.update({
      where: { id: BigInt(id) },
      data: {
        nome: data.nome,
        descricao: data.descricao ?? null,
        valorBase: Number(data.valorBase),
        duracaoEstimada: Number(data.duracaoEstimada),
      },
    });
  }

  async ativarDesativar(id: string) {
    const s = await this.buscarPorId(id);
    return prisma.servico.update({
      where: { id: BigInt(id) },
      data: { ativo: !s.ativo },
    });
  }

  async deletar(id: string) {
    await this.buscarPorId(id);
    await prisma.servico.delete({ where: { id: BigInt(id) } });
  }
}
