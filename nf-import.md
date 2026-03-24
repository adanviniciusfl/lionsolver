# Plano de Implementação — Módulo Fiscal Inteligente (v1.8.0 / v2.0)

Este plano detalha a reestruturação fiscal do LionSolver utilizando as premissas do **Antigravity Kit**. O escopo foi expandido para cobrir dois grandes módulos.

---

## Módulo 1: Importação Inteligente (Parsers Híbridos + IA)
Dropzone universal para documentos fiscais (XML, PDF, TXT) com dupla camada de processamento:
1. **Camada Determinística:** `DOMParser` para XMLs SEFAZ/ABRASF e Regex para PDFs bem estruturados.
2. **Camada de IA (LLM):** Motor inteligente de extração para estruturar PDFs complexos e arquivos TXT que fogem aos *drivers* normais.
3. **Classificação Avançada:** Distinção exata entre faturamento (Receitas → Simples Nacional com segregação de Anexos) e entradas (Compras/Despesas).

### Task Breakdown — Módulo 1

| ID | Tarefa | Agente | Skills | Verificação |
|----|--------|--------|--------|-------------|
| 1.1 | **Persistência `notas` e `despesas`** | `@backend-specialist` | `database-design` | Array `notas` isolando entradas e saídas armazenadas salvando no `useDB` |
| 1.2 | **Parser Híbrido (XML + Regex + IA)** | `@backend-specialist` | `api-patterns` | Função orquestradora que lê arquivos, tenta Regex, se falhar aciona IA para extrair schema unificado JSON. |
| 1.3 | **Engine de Simples Nacional** | `@backend-specialist` | `clean-code` | Identifica notas de saída, mapeia CFOP/Serviço e devolve Anexo/FatorR. |
| 1.4 | **App UI (DropZone Universal)** | `@frontend-specialist`| `frontend-design` | UI estilo Obsidian com status de parsing (Processando via IA, Sucesso, Falha). |
| 1.5 | **Integração na Apuração** | `@frontend-specialist`| `frontend-design` | Receitas e Despesas importadas injetadas nos cálculos. |

---

## Módulo 2: Automação RPA (SEFAZ BA + MeuDanfe) — Planejamento Futuro
Robô client-side/Tauri-side para captura autônoma. O sistema não dependerá apenas do "Drop", mas buscará as notas ativamente.

### Pré-requisitos (Serão feitos no Módulo 1)
- [ ] Formulário `EmpresasPage`: Adicionar campos de Credenciais (`login_sefaz_ba`, `senha_sefaz_ba`).

### Task Breakdown — Módulo 2 (Roadmap)

| ID | Tarefa | Agente | Resumo |
|----|--------|--------|--------|
| 2.1 | **Setup Puppeteer/RPA Client** | `@devops-engineer` | Configuração de automação web que roda dentro do electron/Tauri ou via bridge Web. |
| 2.2 | **Scraper SEFAZ BA** | `@backend-specialist` | Robô autentica, tira print de "Sem Movimento" ou coleta chaves de acesso de NF-es emitidas contra o CNPJ. |
| 2.3 | **Scraper MeuDanfe** | `@backend-specialist` | Robô consome chaves extraídas da SEFAZ BA, acessa o portal MeuDanfe e faz download invisível do XML/PDF. |
| 2.4 | **Orquestrador de Captura** | `@project-planner` | Agenda rotina de fim de mês que dispara o script silenciosamente e alimenta a fila do Módulo 1. |
