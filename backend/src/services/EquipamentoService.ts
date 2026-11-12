import prisma from '../prisma';

export class EquipamentoService {
  async listarTodos() {
    return prisma.equipamento.findMany();
  }

  async buscarPorId(id: string) {
    const e = await prisma.equipamento.findUnique({ where: { id: BigInt(id) } });
    if (!e) throw new Error(`Equipamento não encontrado. ID: ${id}`);
    return e;
  }

  async salvar(data: any) {
    const existe = await prisma.equipamento.findUnique({ where: { numeroSerie: data.numeroSerie } });
    if (existe) throw new Error(`Já existe um equipamento com o número de série: ${data.numeroSerie}`);
    return prisma.equipamento.create({
      data: {
        modelo: data.modelo,
        marca: data.marca,
        numeroSerie: data.numeroSerie,
        problemaRelatado: data.problemaRelatado,
      },
    });
  }

  async atualizar(id: string, data: any) {
    await this.buscarPorId(id);
    return prisma.equipamento.update({
      where: { id: BigInt(id) },
      data: {
        modelo: data.modelo,
        marca: data.marca,
        numeroSerie: data.numeroSerie,
        problemaRelatado: data.problemaRelatado,
      },
    });
  }

  async deletar(id: string) {
    await this.buscarPorId(id);
    await prisma.equipamento.delete({ where: { id: BigInt(id) } });
  }
}
