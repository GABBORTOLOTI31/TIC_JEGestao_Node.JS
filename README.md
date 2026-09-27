# 🛠️ J.E. Gestão — Sistema de Gestão de Atendimento e Serviços de Ar Condicionado

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Framework-Express-lightgrey.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

O **J.E. Gestão** é uma solução completa desenvolvida para otimizar o fluxo de trabalho, controle operacional e gerenciamento de ordens de serviço (OS) em empresas prestadoras de serviços de **instalação, manutenção e higienização de sistemas de ar condicionado**.

---

## 📌 Principais Funcionalidades

- 📋 **Gestão de Ordens de Serviço (OS):** Emissão, acompanhamento de status, agendamento de visitas técnicas e histórico de intervenções.
- 👤 **Cadastro de Clientes e Locais de Atendimento:** Registro de dados de clientes (CPF/CNPJ, endereço, contatos) e mapeamento dos ambientes equipados.
- ❄️ **Controle de Equipamentos:** Cadastro e gerenciamento do acervo de condicionadores de ar (marca, modelo, capacidade em BTUs, tipo de gás refrigerante, histórico de manutenção).
- 🧑‍🔧 **Gestão de Técnicos e Equipes:** Atribuição de chamados a profissionais responsáveis e controle de disponibilidade.
- 📊 **Relatórios e Indicadores:** Monitoramento de atendimentos realizados, manutenção preventiva/corretiva e indicadores operacionais.

---

## 🛠️ Tecnologias Utilizadas

- **Runtime Backend:** [Node.js](https://nodejs.org/)
- **Framework Web:** [Express.js](https://expressjs.com/)
- **Linguagem:** JavaScript (Node.js)
- **Banco de Dados:** MySQL / PostgreSQL / MongoDB *(ajuste conforme o banco utilizado no projeto)*
- **ORM / Query Builder:** Sequelize / Prisma / Knex.js *(ajuste conforme a lib utilizada)*
- **Modelagem e Views:** HTML5, CSS3, EJS / Handlebars *(ou biblioteca frontend se aplicável)*

---

## 📁 Estrutura do Projeto

```text
TIC_JEGestao_Node.JS/
├── src/
│   ├── config/         # Configurações de banco de dados e ambiente
│   ├── controllers/    # Lógica de controle das requisições e rotas
│   ├── models/         # Definição das entidades e schemas
│   ├── routes/         # Definição das rotas e endpoints da aplicação
│   ├── services/       # Regras de negócio e serviços internos
│   ├── views/          # Templates e interfaces do usuário (se houver SSR)
│   └── app.js          # Inicialização e middlewares do Express
├── public/             # Arquivos estáticos (CSS, JS cliente, imagens)
├── .env.example        # Modelo de variáveis de ambiente
├── package.json        # Dependências e scripts do Node.js
└── README.md           # Documentação do projeto
