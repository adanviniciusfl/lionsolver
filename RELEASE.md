# Como Publicar Atualizacoes do LionSolver

## Setup Inicial (fazer uma vez)

### 1. Criar repositorio no GitHub
1. Acesse https://github.com/new
2. Nome: `lionsolver`
3. Marque como Private (ou Public se preferir)
4. Clique "Create repository"

### 2. Gerar chave de assinatura
O Tauri exige que as atualizacoes sejam assinadas. Rode no terminal:

```bash
npx tauri signer generate -w ~/.tauri/lionsolver.key
```

Isso gera duas coisas:
- Chave privada: `~/.tauri/lionsolver.key` (NUNCA compartilhe!)
- Chave publica: aparece no terminal (uma string longa)

### 3. Configurar a chave publica
Copie a chave publica e cole no `tauri.conf.json`:

```json
"plugins": {
  "updater": {
    "endpoints": [
      "https://github.com/SEU_USUARIO/lionsolver/releases/latest/download/latest.json"
    ],
    "pubkey": "COLE_SUA_CHAVE_PUBLICA_AQUI"
  }
}
```

### 4. Configurar variavel de ambiente
Antes de fazer o build, configure a chave privada:

No PowerShell:
```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content "$HOME\.tauri\lionsolver.key"
```

Ou adicione permanentemente nas variaveis de ambiente do Windows.

---

## Publicar uma Atualizacao

### Passo 1: Atualizar a versao
Edite o `src-tauri/tauri.conf.json` e mude a versao:

```json
"version": "1.1.0"
```

(Siga o padrao: MAJOR.MINOR.PATCH)

### Passo 2: Fazer as alteracoes no codigo
Edite `src/App.jsx` ou qualquer arquivo necessario.

### Passo 3: Build com assinatura
```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content "$HOME\.tauri\lionsolver.key"
cd C:\LionSolver
npx tauri build
```

Isso gera:
- `LionSolver_1.1.0_x64-setup.exe` (instalador)
- `LionSolver_1.1.0_x64-setup.nsis.zip` (arquivo de atualizacao)
- `LionSolver_1.1.0_x64-setup.nsis.zip.sig` (assinatura)
- `latest.json` (metadados da versao)

### Passo 4: Criar Release no GitHub
1. Acesse: https://github.com/SEU_USUARIO/lionsolver/releases/new
2. Tag: `v1.1.0`
3. Titulo: `LionSolver v1.1.0`
4. Descricao: o que mudou
5. Anexe os 3 arquivos da pasta `bundle/nsis/`:
   - `LionSolver_1.1.0_x64-setup.exe`
   - `LionSolver_1.1.0_x64-setup.nsis.zip`
   - `LionSolver_1.1.0_x64-setup.nsis.zip.sig`
6. Crie tambem o arquivo `latest.json` com este conteudo:

```json
{
  "version": "1.1.0",
  "notes": "Descricao da atualizacao",
  "pub_date": "2026-03-18T00:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "CONTEUDO_DO_ARQUIVO_.sig",
      "url": "https://github.com/SEU_USUARIO/lionsolver/releases/download/v1.1.0/LionSolver_1.1.0_x64-setup.nsis.zip"
    }
  }
}
```

7. Anexe o `latest.json` na release tambem
8. Publique a release

### Passo 5: Pronto!
Quando seus clientes abrirem o LionSolver, ele vai:
1. Verificar automaticamente se tem versao nova
2. Mostrar um popup: "Nova versao disponivel: v1.1.0 - Deseja atualizar?"
3. Se clicar "Atualizar": baixa, instala e reinicia sozinho

---

## Resumo Rapido (depois do setup)

1. Mude a versao no `tauri.conf.json`
2. Faca as alteracoes no codigo
3. Rode: `npx tauri build` (com a variavel TAURI_SIGNING_PRIVATE_KEY configurada)
4. Suba os arquivos no GitHub Releases
5. Clientes recebem automaticamente

---

## Dicas

- NUNCA compartilhe a chave privada (`.tauri/lionsolver.key`)
- Sempre teste a atualizacao localmente antes de publicar
- Use versionamento semantico: 1.0.0 -> 1.0.1 (bugfix), 1.1.0 (feature), 2.0.0 (breaking)
- O `latest.json` DEVE estar na release mais recente do GitHub
- Se o usuario nao tiver internet, o app funciona normal, so nao atualiza
