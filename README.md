# Sistema de Gestão de Frota - Granduvale Mineração

Sistema completo para gerenciamento da frota de veículos, incluindo registros de abastecimento, manutenção, viagens e checklists.

## Funcionalidades

- Cadastro de veículos, motoristas, postos, tipos de combustível e tipos de manutenção
- Registro de abastecimentos, manutenções e viagens com campos específicos
- Histórico completo e filtrado por tipo, veículo e período
- Relatórios e dashboards para análise de dados
- Checklists personalizáveis para inspeção de veículos
- Personalização da aparência do sistema
- Suporte a múltiplos perfis de usuários (admin, gerente, usuário)
- Funcionalidade offline com sincronização quando conectado

## Tecnologias Utilizadas

- Frontend: React, TailwindCSS, ShadCN UI
- Backend: Node.js, Express
- Banco de Dados: PostgreSQL
- ORM: Drizzle ORM
- Autenticação: Sistema de usuário e senha

## Instalação

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Configure as variáveis de ambiente (banco de dados)
4. Execute as migrações: `npm run db:push`
5. Inicie o servidor: `npm run dev`

## Usando o Sistema

### Cadastros Básicos

Acesse a seção "Cadastros" no menu lateral para gerenciar:
- Veículos
- Motoristas
- Postos de Combustível
- Tipos de Combustível
- Tipos de Manutenção

Estas informações são essenciais para o funcionamento correto do sistema.

### Registros

Na seção "Registros", você pode:
- Adicionar novos abastecimentos
- Registrar manutenções
- Documentar viagens realizadas

### Checklists

Use os templates de checklist para realizar inspeções periódicas nos veículos.

### Configurações

Na seção "Configurações" você pode personalizar:
- Aparência do sistema (cores, logo, nome da empresa)
- Usuários e permissões
- Templates de checklist

## Recursos Mobile

O sistema é totalmente responsivo e pode ser instalado como PWA (Progressive Web App) em dispositivos móveis.

## Suporte

Para mais informações, entre em contato com a equipe de desenvolvimento.