# LionSolver — Software de Apuração do Simples Nacional

## 🚀 Como gerar o executável (.exe)

### Pré-requisitos (instale uma vez)

1. **Node.js** (LTS) — https://nodejs.org/
   - Baixe e instale o "LTS Recommended"
   - Marque a opção "Add to PATH" durante a instalação

2. **Rust** — o script BUILD.bat instala automaticamente se não tiver
   - Ou instale manualmente: https://rustup.rs/

3. **Visual Studio Build Tools** (necessário para compilar Rust no Windows)
   - Baixe: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - Na instalação, marque "Desenvolvimento Desktop com C++"
   - Isso instala o compilador MSVC necessário (~6 GB)

### Build (gerar o .exe)

1. Extraia esta pasta no seu computador (ex: `C:\LionSolver\`)
2. Dê **duplo-clique** no arquivo `BUILD.bat`
3. Aguarde (~5-10 minutos na primeira vez, ~2 min nas seguintes)
4. O instalador será gerado em:
   ```
   src-tauri\target\release\bundle\nsis\LionSolver_1.0.0_x64-setup.exe
   ```
5. Execute o instalador — ele cria o atalho no menu Iniciar

### Estrutura do projeto

```
lionsolver-desktop/
├── BUILD.bat                    ← Script de build (duplo-clique)
├── README.md                    ← Este arquivo
├── package.json                 ← Dependências Node.js
├── vite.config.js               ← Config do Vite (bundler)
├── index.html                   ← Entry point HTML
├── src/
│   ├── main.jsx                 ← Entry point React
│   └── App.jsx                  ← Aplicação completa (1100+ linhas)
└── src-tauri/
    ├── Cargo.toml               ← Dependências Rust
    ├── tauri.conf.json           ← Config do Tauri (janela, ícone, bundler)
    ├── capabilities/
    │   └── default.json          ← Permissões da janela
    ├── icons/
    │   └── icon.svg              ← Ícone do app (gere .ico com tauri icon)
    └── src/
        └── main.rs               ← Backend Rust (mínimo)
```

### Gerar ícones (.ico, .png)

Após a primeira instalação, execute:
```bash
npx tauri icon src-tauri/icons/icon.svg
```
Isso gera todos os formatos de ícone necessários automaticamente.

### Modo desenvolvimento (hot-reload)

```bash
npm install
npx tauri dev
```

O app abre em janela nativa com hot-reload — qualquer mudança no código atualiza instantaneamente.

---

## 📋 Funcionalidades

- **Motor de Cálculo** — Anexos I a V com tabelas da LC 123/2006 (LC 155/2016)
- **Subseções de Receita** — ICMS Normal, ST, Monofásico, Exportação, Devoluções
- **Fator r** — Anexo III fixo, V fixo, e III/V automático
- **ISS por Município** — Domicílio + N municípios diferentes
- **RBT12 Detalhada** — Mês a mês com histórico automático
- **RBT12 Proporcionalizada** — Empresas em início de atividade
- **Benefícios Estaduais ICMS** — 27 UFs mapeadas (BA, PR, AM, AL, SE, RJ, etc.)
- **Relatórios PDF e XLSX** — Memória de cálculo, distribuição por tributo, alertas
- **Dashboard** — KPIs, gráficos, pendentes, alertas
- **Configurações** — Escritório, contador, CRC, backup JSON
- **100% Offline** — Sem internet após instalação

## 📄 Legislação Referenciada

- LC 123/2006 (Simples Nacional)
- LC 155/2016 (Alteração das tabelas)
- Resolução CGSN 140/2018
- RICMS de cada estado (benefícios ICMS)
