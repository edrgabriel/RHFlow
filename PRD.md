# Product Requirements Document (PRD) - RHFlow

## 1. Visão Geral do Produto
O **RHFlow** é uma plataforma de gestão de Recursos Humanos projetada para centralizar, automatizar e simplificar as rotinas diárias de um departamento de RH. O foco principal do sistema é oferecer uma experiência de "Administrador Único" (Single-Admin) de alta segurança, permitindo o gerenciamento completo do ciclo de vida dos colaboradores — desde o recrutamento e admissão, até a gestão de benefícios, exames, férias, empréstimos e eventual desligamento.

## 2. Objetivos
- **Centralização:** Eliminar planilhas e sistemas fragmentados, reunindo todos os dados de RH em um único painel.
- **Agilidade no Recrutamento:** Facilitar a atração e triagem de talentos através de links de candidatura públicos e altamente customizáveis.
- **Controle de Processos:** Garantir que processos de Admissão e Demissão sigam checklists rigorosos (globais ou específicos por filial).
- **Segurança:** Proteger informações sensíveis através de um sistema de autenticação via JWT, garantindo que apenas a gestão tenha acesso aos dados.

## 3. Arquitetura e Tecnologias (Tech Stack)
### Frontend
- **Framework:** React.js com Vite
- **Roteamento:** React Router DOM
- **Estilização:** Tailwind CSS (focado em UI/UX moderna, limpa e responsiva)
- **Ícones:** Lucide React
- **Gráficos:** Recharts (para Dashboard e Turnover)
- **Comunicação de API:** Axios (com Interceptors para injeção de JWT)

### Backend
- **Framework:** Node.js com Express.js
- **Banco de Dados:** PostgreSQL (Hospedado no Supabase)
- **ORM:** Prisma
- **Autenticação:** JSON Web Tokens (JWT)
- **Armazenamento de Arquivos:** Base64 direto no banco de dados (Tabela `Document`)

## 4. Requisitos Funcionais (Core Features)

### 4.1. Autenticação e Segurança
- O sistema possui uma única conta administradora configurada via variáveis de ambiente.
- Rotas da API e telas do Frontend são protegidas, exigindo token JWT (exceto as rotas públicas de recrutamento).
- Logout explícito e expiração automática de sessão.

### 4.2. Gestão de Colaboradores
- **Cadastro Completo:** Registro de nome, CPF, e-mail, telefone, cargo, filial, perfil comportamental (MBTI) e status (Ativo, Desligado, Em Desligamento).
- **Hard Delete:** Exclusão definitiva de um colaborador, garantindo a remoção em cascata (Cascade Delete) de todos os seus registros associados para manter a integridade do banco de dados.

### 4.3. Módulo de Recrutamento (Candidate Portal)
- **Criação de Vagas:** O RH pode criar links únicos para vagas, contendo Título, Descrição detalhada e Remuneração.
- **Perguntas Personalizadas:** O RH pode criar um formulário dinâmico com perguntas abertas (Texto) ou fechadas (Sim/Não).
- **Portal Público:** Uma Landing Page focada em conversão onde os candidatos se inscrevem sem necessidade de login.
- **Upload de Documentos:** Suporte ao envio de currículos (PDF, JPG) diretamente na candidatura.
- **Aprovação Automática (One-Click):** Na aba de triagem, o RH pode aprovar um pré-candidato, que é automaticamente convertido em Colaborador Ativo, migrando todos os seus documentos e respostas do formulário.

### 4.4. Gestão de Processos (Admissão e Demissão)
- **Checklists Personalizáveis:** Criação de tarefas necessárias para admissões ou desligamentos.
- **Exceções por Filial:** O RH pode usar um checklist "Global" ou criar um checklist específico para uma Empresa/Filial particular.

### 4.5. Módulo de Saúde Ocupacional (Exames)
- Registro de Exames Médicos periódicos, admissionais e demissionais.
- Controle de Data do Último Exame e Data de Vencimento, facilitando avisos de renovação.

### 4.6. Módulo Financeiro e Benefícios
- **Empréstimos (Loans):** Controle de valores emprestados ao colaborador, quantidade de parcelas, parcelas já pagas e data de início do desconto em folha.
- **Férias:** Gestão de períodos aquisitivos (início e fim), data limite para tirar férias, adiantamento de 13º salário e histórico de períodos de descanso usufruídos.

### 4.7. Módulo de Relatórios e Métricas
- **Turnover Dashboard:** Gráficos interativos mostrando a taxa de rotatividade, admissões vs. demissões ao longo dos meses.
- **Relatórios Imprimíveis:** Geração de relatórios formatados para impressão em folha A4 contendo a ficha completa do colaborador ou resumos gerenciais.

### 4.8. Gestão de Documentos
- Centralização de documentos anexados aos perfis dos colaboradores (Identidade, Contratos, Atestados).
- Visualização e Download direto no painel, garantindo que o dossiê do funcionário esteja sempre digitalizado.

## 5. Requisitos Não-Funcionais
- **Responsividade:** O painel administrativo deve funcionar bem em desktops e tablets. O Portal do Candidato deve ser perfeitamente responsivo (Mobile-First) para garantir máxima acessibilidade na candidatura via smartphones.
- **Performance:** Consultas rápidas garantidas pelo Prisma ORM. O uso de Base64 para documentos foi adotado para simplicidade arquitetural inicial, mas o tamanho de uploads deve ser limitado no front-end para não sobrecarregar o tráfego da API e o banco no Supabase.
- **Deploy:** Preparado e compatível para deploy Serverless na plataforma **Vercel** (ambos frontend e backend).

## 6. Modelagem de Dados (Entidades Principais)
- `Company` (Empresa/Filial)
- `Employee` (Colaborador)
- `PreCandidate` (Pré-Candidato)
- `RecruitmentLink` (Link de Vaga)
- `Document` (Anexos em Base64)
- `AdmissionProcess` & `DismissalProcess` (Controle de Checklists)
- `MedicalExam` (Exames)
- `Loan` (Empréstimos)
- `Vacation` & `VacationPeriod` (Férias)
- `GlobalSettings` (Configurações Gerais)

## 7. Status do Projeto
Atualmente, o projeto encontra-se em sua versão funcional principal (MVP + Features Avançadas). O sistema de autenticação, proteção de rotas, gestão completa de colaboradores e módulo de recrutamento com links públicos personalizados encontram-se desenvolvidos, testados e preparados para uso em produção.
