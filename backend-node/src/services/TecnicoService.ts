import prisma from '../prisma';

function mapTecnico(t: any) {
  return {
    id: t.id.toString(),
    nome: t.pessoa.nome,
    cpf: t.pessoa.cpf,
    telefone: t.pessoa.telefone,
    email: t.pessoa.email,
    especialidade: t.especialidade,
    nrRegistro: t.nrRegistro,
    ativo: t.ativo,
  };
}

const INCLUDE = { pessoa: true };

export class TecnicoService {
  async listarTodos() {
    const todos = await prisma.tecnico.findMany({ include: INCLUDE });
    return todos.map(mapTecnico);
  }

  async listarAtivos() {
    const ativos = await prisma.tecnico.findMany({ where: { ativo: true }, include: INCLUDE });
    return ativos.map(mapTecnico);
  }

  async buscarPorId(id: string) {
    const t = await prisma.tecnico.findUnique({ where: { id: BigInt(id) }, include: INCLUDE });
    if (!t) throw new Error(`Técnico não encontrado. ID: ${id}`);
    return mapTecnico(t);
  }

  async buscarPorNome(nome: string) {
    const todos = await prisma.tecnico.findMany({
      where: { pessoa: { nome: { contains: nome, mode: 'insensitive' } } },
      include: INCLUDE,
    });
    return todos.map(mapTecnico);
  }

  async salvar(data: any) {
    const existsCpf = await prisma.pessoa.findUnique({ where: { cpf: data.cpf } });
    if (existsCpf) throw new Error(`Já existe um técnico cadastrado com o CPF: ${data.cpf}`);
    const existsReg = await prisma.tecnico.findUnique({ where: { nrRegistro: data.nrRegistro } });
    if (existsReg) throw new Error(`Já existe um técnico cadastrado com o registro: ${data.nrRegistro}`);

    const p = await prisma.pessoa.create({
      data: {
        nome: data.nome,
        cpf: data.cpf,
        telefone: data.telefone,
        email: data.email,
        tecnico: {
          create: {
            especialidade: data.especialidade,
            nrRegistro: data.nrRegistro,
            ativo: true,
          },
        },
      },
      include: { tecnico: true },
    });
    return mapTecnico({ ...p.tecnico, pessoa: p });
  }

  async atualizar(id: string, data: any) {
    await this.buscarPorId(id);
    const bid = BigInt(id);
    await prisma.pessoa.update({
      where: { id: bid },
      data: { nome: data.nome, telefone: data.telefone, email: data.email },
    });
    await prisma.tecnico.update({
      where: { id: bid },
      data: {
        especialidade: data.especialidade,
        nrRegistro: data.nrRegistro,
      },
    });
    return this.buscarPorId(id);
  }

  async ativarDesativar(id: string) {
    const t = await prisma.tecnico.findUnique({ where: { id: BigInt(id) } });
    if (!t) throw new Error(`Técnico não encontrado. ID: ${id}`);
    const updated = await prisma.tecnico.update({
      where: { id: BigInt(id) },
      data: { ativo: !t.ativo },
      include: { pessoa: true },
    });
    return mapTecnico(updated);
  }

  async deletar(id: string) {
    await this.buscarPorId(id);
    await prisma.pessoa.delete({ where: { id: BigInt(id) } });
  }
}
