# Plano de Implementação — Pivot para SaaS (BaaS Supabase)

Este plano detalha a migração do LionSolver de uma arquitetura *Offline-First* (`localStorage`) para uma Plataforma SaaS Multi-tenant escalável utilizando o **Supabase (PostgreSQL + Auth)**, conforme diretrizes do **Antigravity Kit**.

## Visão Geral
Preparar a fundação comercial do produto. O sistema passará a ter telas públicas (Login/Cadastro), autenticação segura via JWT, e todos os dados fiscais das empresas serão salvos de forma relacional na nuvem para permitir planos de assinatura (Self, Pro, Enterprise).

## Critérios de Sucesso
- [ ] O app deve possuir uma tela de Autenticação (Login / Sign Up) usando a estética Obsidian.
- [ ] O banco de dados Supabase deve possuir um Schema Relacional estrito (Tabelas: `profiles`, `empresas`, `apuracoes`).
- [ ] Row Level Security (RLS): Um contador só pode ler/escrever os dados das empresas que ele mesmo cadastrou (vinculadas ao seu `user_id`).
- [ ] O hook principal do sistema (`useDB.js`) deve ser 100% migrado para realizar requisições de rede assíncronas via `@supabase/supabase-js`, substituindo os arrays em memória ram locais.

## Tech Stack & Agentes
- **Agente Principal:** `@backend-specialist` e `@database-architect` (Modelagem SQL e permissões RLS).
- **Agente Auxiliar:** `@frontend-specialist` (React Router DOM e Tela de Auth).
- **Backend as a Service:** Supabase (Auth + DB).

---

## Task Breakdown

### [P0] Setup de Rotas e Telas Públicas
| ID | Tarefa | Agente | Skills | Verificação |
|----|--------|--------|--------|-------------|
| 1.1 | **Instalar React Router DOM e Autenticação SDK** | `@backend-specialist` | `react-best-practices` | `npm i react-router-dom @supabase/supabase-js` com sucesso. |
| 1.2 | **Refatorar App.jsx para Roteamento** | `@frontend-specialist` | `frontend-design` | Dividir App em `<AuthRoutes>` e `<PrivateRoutes>`. A UI atual deve ficar na PrivateRoute. |
| 1.3 | **Criar Tela de Login/Cadastro** | `@frontend-specialist` | `ui-ux-pro-max` | Desenhar uma tela de SignIn deslumbrante estilo Glassmorphism. |

### [P1] Banco de Dados & RLS (Supabase)
| ID | Tarefa | Agente | Skills | Verificação |
|----|--------|--------|--------|-------------|
| 2.1 | **Criar Projeto Supabase e chaves ENV** | *User* | - | Chaves e URL configuradas no `.env.local` na raiz. |
| 2.2 | **Desenhar o Schema SQL** | `@database-architect` | `database-design` | Script `.sql` validado para criação das tabelas `users/profiles`, `empresas` e `apuracoes`. |
| 2.3 | **Aplicar Row Level Security (RLS)** | `@security-auditor` | `vulnerability-scanner` | Garantir que `select * from empresas` retorne apenas empresas onde `user_id == auth.uid()`. |

### [P2] Refatoração do Motor do App (`useDB`)
| ID | Tarefa | Agente | Skills | Verificação |
|----|--------|--------|--------|-------------|
| 3.1 | **Centralizar Client do Supabase** | `@backend-specialist` | `api-patterns` | Arquivo `src/lib/supabase.js` importando as credenciais. |
| 3.2 | **Refatorar `loadData` para buscar do BD** | `@backend-specialist` | `nodejs-best-practices` | `useDB` agora tem um `useEffect` assíncrono que puxa as empresas e apurações da API. |
| 3.3 | **Refatorar `saveData/CRUD` para Mutations** | `@backend-specialist` | `api-patterns` | Funções `addE`, `updE`, `delE` devem realizar chamadas RPC/Insert em vez de map local. |
| 3.4 | **Controle de Estado de Carregamento** | `@frontend-specialist` | `react-best-practices` | Adicionar loaders nas telas para lidar com a latência de rede. |

---

## 🏁 Fase X: Transição Limpa
- [ ] Checar se todas as chamadas à rede estão devidamente tratadas (`try/catch`).
- [ ] Confirmar que usuários não logados são repelidos para o Login.
