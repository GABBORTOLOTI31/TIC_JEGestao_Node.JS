import prisma from '../prisma';

export class MaterialService {
  async listarTodos() {
    return prisma.material.findMany();
  }

  async buscarPorId(id: string) {
    const m = await prisma.material.findUnique({ where: { id: BigInt(id) } });
    if (!m) throw new Error(`Material não encontrado. ID: ${id}`);
    return m;
  }

  async buscarPorDescricao(descricao: string) {
    return prisma.material.findMany({
      where: { descricao: { contains: descricao, mode: 'insensitive' } },
    });
  }

  async salvar(data: any) {
    return prisma.material.create({
      data: {
        descricao: data.descricao,
        unidade: data.unidade,
        precoUnitario: Number(data.precoUnitario),
      },
    });
  }

  async atualizar(id: string, data: any) {
    await this.buscarPorId(id);
    return prisma.material.update({
      where: { id: BigInt(id) },
      data: {
        descricao: data.descricao,
        unidade: data.unidade,
        precoUnitario: Number(data.precoUnitario),
      },
    });
  }

  async deletar(id: string) {
    await this.buscarPorId(id);
    await prisma.material.delete({ where: { id: BigInt(id) } });
  }
}
