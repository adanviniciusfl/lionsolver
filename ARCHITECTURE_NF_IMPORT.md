# Arquitetura — Importação de Notas Fiscais (NFe / NFSe / NFCe)

> Documento de design para o épico **"Importação de XMLs Fiscais"** do LionSolver.
> Última revisão: 2026-03-21 (rev 2 — gargalos endereçados)

---

## 1. Visão Geral do Fluxo

```
┌──────────────────────────────────────────────────────────────┐
│                    ImportacaoNFPage                          │
│  ┌────────────────┐   ┌──────────────────────────────────┐   │
│  │  Drop Zone     │──▶│  Parser Layer                    │   │
│  │  (XML / PDF)   │   │  NFe | NFCe | NFSe | PDF fallback│   │
│  └────────────────┘   └──────────────┬───────────────────┘   │
│                                       │ NotaImportada         │
│                       ┌──────────────▼───────────────────┐   │
│                       │  Engine de Classificação          │   │
│                       │  CFOP → Anexo + SubId             │   │
│                       │  Cód. Serviço LC116 → Anexo III/IV│   │
│                       └──────────────┬───────────────────┘   │
│                                       │ SugestaoReceita[]     │
│                       ┌──────────────▼───────────────────┐   │
│                       │  useDB.notas[]  (localStorage)    │   │
│                       └──────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                                │
              consulta por (empresa_id + competência)
                                │
┌──────────────────────────────▼───────────────────────────────┐
│                    ApuracaoPage — Step 0                      │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Banner: "X sugestões disponíveis para 2026-03"         │ │
│  │  [Ver Sugestões ▼]                                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Painel de Sugestões (expansível)                       │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │ NF 001 | Serviços TI | Anexo III/V | R$ 5.000   │   │ │
│  │  │ Confiança: ALTA ●    [Aplicar] [Ignorar]        │   │ │
│  │  └─────────────────────────────────────────────────┘   │ │
│  │  [Aplicar Todas]                                        │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ← Receitas adicionadas/editadas manualmente como sempre →   │
└───────────────────────────────────────────────────────────────┘
```

---

## 2. Novos Modelos de Dados

### 2.1 `NotaImportada`

```javascript
{
  id: string,                   // genId()
  empresa_id: string,           // FK → empresas[].id
  tipo: "NFe" | "NFCe" | "NFSe",
  numero: string,               // número da nota
  serie: string,
  chave_acesso: string | null,  // 44 dígitos (NFe/NFCe) ou null (NFSe)
  emitente_cnpj: string,
  emitente_razao: string,
  destinatario_cnpj: string | null,
  competencia: "YYYY-MM",       // derivado de data_emissao
  data_emissao: string,         // ISO 8601
  valor_total: number,
  valor_servicos: number | null,  // NFSe
  valor_produtos: number | null,  // NFe/NFCe
  valor_iss: number | null,
  valor_icms: number | null,
  valor_pis: number | null,
  valor_cofins: number | null,
  cfop: string | null,          // ex: "5102" (NFe/NFCe)
  codigo_servico: string | null,// ex: "1.05" (LC 116/2003, NFSe)
  municipio_prestacao: string | null, // ISS outro município
  discriminacao: string | null, // texto livre da nota
  // ▶ Gargalo 1 — Receita vs Despesa
  natureza: "saida" | "entrada" | "indeterminada",
  // "saida"  → emitente_cnpj == CNPJ da empresa logada → compõe RBT12
  // "entrada"→ empresa é destinatária (compra) → NÃO compõe RBT12, rotulada despesa
  // "indeterminada" → parser PDF não conseguiu cruzar CNPJs com certeza

  status: "pendente" | "confirmado" | "ignorado" | "despesa",
  // "despesa" é o status final para notas de entrada (não aparecem nas sugestões)
  fonte: "xml" | "pdf",
  confianca: "alta" | "media" | "baixa",  // do parser
  importado_em: string          // ISO 8601
}
```

**localStorage key:** `lionsolver_notas`

### 2.2 `SugestaoReceita` (estrutura em memória — não persiste)

Calculado on-demand por `getSugestoes(empresa_id, competencia)`:

```javascript
{
  nota_id: string,
  nota_numero: string,
  emitente_razao: string,
  valor: number,
  anexo: string,     // ex: "III/V"
  subId: string,     // ex: "NORMAL"
  confianca: "alta" | "media" | "baixa",
  motivo: string     // ex: "CFOP 5102 → comércio interno Anexo I"
}
```

---

## 3. Camada de Parsing

### 3.1 Parser XML (NFe / NFCe — padrão SEFAZ)

**Tecnologia:** `DOMParser` nativo do browser — zero dependências externas.

**Namespace XML:** `http://www.portalfiscal.inf.br/nfe`

**Campos mapeados:**

| Campo XML (XPath simplificado)       | Campo NotaImportada      |
|--------------------------------------|--------------------------|
| `infNFe/@Id`                         | `chave_acesso`           |
| `ide/nNF`                            | `numero`                 |
| `ide/serie`                          | `serie`                  |
| `ide/dhEmi`                          | `data_emissao`           |
| `emit/CNPJ`                          | `emitente_cnpj`          |
| `emit/xNome`                         | `emitente_razao`         |
| `dest/CNPJ`                          | `destinatario_cnpj`      |
| `det/prod/CFOP` (primeiro item)      | `cfop`                   |
| `total/ICMSTot/vNF`                  | `valor_total`            |
| `total/ICMSTot/vICMS`                | `valor_icms`             |
| `total/ICMSTot/vPIS`                 | `valor_pis`              |
| `total/ICMSTot/vCOFINS`              | `valor_cofins`           |

**Detecção do tipo:**
- Tag raiz `nfeProc` ou `NFe` com namespace SEFAZ → NFe
- `mod = 65` no `ide` → NFCe

**⚠ Gargalo 1 — Filtro Receita vs Despesa (NFe/NFCe)**

O XML da NFe possui dois blocos de CNPJ: `<emit>` (emitente) e `<dest>` (destinatário).
A receita bruta do Simples Nacional **só é gerada quando a empresa é a emitente** (nota de saída).

Lógica obrigatória no parser, logo após extrair os campos:

```javascript
function resolverNatureza(emitenteCnpj, destinatarioCnpj, empresaCnpj) {
  const cnpjLimpo = (v) => (v || "").replace(/\D/g, "");
  if (cnpjLimpo(emitenteCnpj) === cnpjLimpo(empresaCnpj))  return "saida";
  if (cnpjLimpo(destinatarioCnpj) === cnpjLimpo(empresaCnpj)) return "entrada";
  return "indeterminada";
}
```

O `empresaCnpj` é obtido de `empresas.find(e => e.id === empresa_id).cnpj`.

**Consequências por natureza:**

| natureza         | status inicial | Aparece nas sugestões? |
|------------------|----------------|------------------------|
| `"saida"`        | `"pendente"`   | ✅ Sim                 |
| `"entrada"`      | `"despesa"`    | ❌ Não (reservado para módulo futuro de custos) |
| `"indeterminada"`| `"pendente"`   | ⚠ Sim, com aviso ao usuário para revisar |

Para NFSe a natureza é sempre `"saida"` — a empresa só emite NFSe de serviços prestados.

### 3.2 Parser XML (NFSe — arquitetura de drivers municipais)

**⚠ Gargalo 3 — O Inferno dos Padrões NFSe**

NFSe **não tem padrão nacional único**. O ABRASF v2 cobre ~60-70% dos municípios,
mas capitais como São Paulo, Rio de Janeiro e Curitiba possuem schemas proprietários
totalmente incompatíveis. A solução é uma arquitetura extensível de **drivers**.

**Estrutura de drivers:**

```javascript
// Interface que todo driver deve implementar
// parseNFSe(xmlDoc: Document) → Partial<NotaImportada> | null

const NFSE_DRIVERS = [
  { nome: "ABRASF v2",    detectar: abrasf_detectar,    parsear: abrasf_parsear    },
  { nome: "São Paulo",    detectar: sp_detectar,         parsear: sp_parsear        },
  { nome: "Rio (RIO-NFS)",detectar: rio_detectar,        parsear: rio_parsear       },
  { nome: "Curitiba",     detectar: curitiba_detectar,   parsear: curitiba_parsear  },
  // novos drivers adicionados aqui sem alterar o orquestrador
];

function parseXmlNFSe(xmlDoc, empresaCnpj) {
  for (const driver of NFSE_DRIVERS) {
    if (driver.detectar(xmlDoc)) {
      const parcial = driver.parsear(xmlDoc);
      if (parcial) {
        parcial.natureza = "saida"; // NFSe é sempre emissão de serviço
        parcial.confianca = driver.nome === "ABRASF v2" ? "alta" : "media";
        return parcial;
      }
    }
  }
  // Nenhum driver reconheceu — retorna esqueleto com confiança baixa
  return { confianca: "baixa", natureza: "indeterminada", fonte: "xml" };
}
```

**Driver ABRASF v2 (padrão, ~60-70% dos municípios):**
```
CompNfse/Nfse/InfNfse/
  Numero, DataEmissao,
  Servico/Valores/ValorServicos    → valor_servicos
  Servico/Valores/ValorIss         → valor_iss
  Servico/ItemListaServico         → codigo_servico
  Servico/Discriminacao            → discriminacao
  PrestadorServico/IdentificacaoPrestador/Cnpj → emitente_cnpj
  TomadorServico/IdentificacaoTomador/CpfCnpj/Cnpj → destinatario_cnpj
```
Detecção: tag raiz `CompNfse` ou `ConsultarNfseResposta`.

**Driver São Paulo (ISS.net / NFS-e SP):**
```
NFSe/Cabecalho/NumeroNFe           → numero
NFSe/Cabecalho/DataEmissaoNFe      → data_emissao
NFSe/Detalhe/ValorServicos         → valor_servicos
NFSe/Detalhe/CodigoServico         → codigo_servico
NFSe/CPFCNPJPrestador/CNPJ         → emitente_cnpj
```
Detecção: namespace `http://www.prefeitura.sp.gov.br/nfe` ou tag `NFSe` sem namespace ABRASF.

**Drivers Rio e Curitiba:** a implementar na mesma interface — detecção por
namespace ou tags características do schema municipal.

**Tabela de cobertura e confiança por driver:**

| Driver        | Municípios cobertos              | Confiança   | Status       |
|---------------|----------------------------------|-------------|--------------|
| ABRASF v2     | ~60-70% (interior + médios)      | `alta`      | Implementar  |
| São Paulo     | São Paulo-SP                     | `media`     | Implementar  |
| Rio de Janeiro| Rio de Janeiro-RJ                | `media`     | Backlog      |
| Curitiba      | Curitiba-PR                      | `media`     | Backlog      |
| Fallback      | Qualquer não reconhecido         | `baixa`     | Automático   |

### 3.3 Parser PDF

**Tecnologia:** `pdfjs-dist` (Mozilla PDF.js, módulo npm).

**⚠ Gargalo 2 — Web Worker do pdf.js no Vite**

O pdf.js usa um Web Worker para processar PDFs sem travar a UI thread. No Vite,
o worker **não é resolvido automaticamente** — é necessário configurar o
`workerSrc` explicitamente antes de qualquer chamada à lib:

```javascript
// Configuração única no topo do módulo (ou em main.jsx)
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url"; // Vite URL import

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
```

O sufixo `?url` instrui o Vite a tratar o arquivo como asset de URL estática,
evitando que ele tente fazer bundle do worker (o que quebraria o contexto isolado).
Sem isso, o pdf.js cai em modo "fake worker" (síncrono), travando a UI em PDFs grandes.

**Estratégia:** extração de texto por página + regex patterns.

```javascript
async function parsePDF(file, empresaCnpj) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let textoCompleto = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    textoCompleto += content.items.map(s => s.str).join(" ") + "\n";
  }
  return extrairCamposPDF(textoCompleto, empresaCnpj);
}

// Padrões aplicados sobre texto extraído
const PATTERNS = {
  chaveNFe:     /\d{44}/,
  cnpjAny:      /(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/g,  // todos os CNPJs da página
  valorTotal:   /(?:valor total|total nf)[:\s]+R?\$?\s*([\d.,]+)/i,
  dataEmissao:  /(?:data emiss[aã]o|emitido em)[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
  cfop:         /CFOP[:\s]+(\d{4})/i,
};

// Para natureza no PDF: coleta todos os CNPJs encontrados e cruza com empresaCnpj
// Se o CNPJ da empresa aparecer antes do label "DESTINATÁRIO" → saida
// Caso contrário → indeterminada (confiança baixa por definição)
```

PDF sempre recebe `confianca: "baixa"` e `natureza: "indeterminada"` salvo quando
a chave de acesso de 44 dígitos é encontrada (permite confirmar que é NFe de saída
via SEFAZ, mesmo em PDF).

---

## 4. Engine de Classificação

### 4.1 Tabela CFOP → Simples Nacional

```javascript
const CFOP_PARA_SIMPLES = {
  // Comércio interno → Anexo I, Normal
  "5101": { anexo: "I",   subId: "NORMAL" },
  "5102": { anexo: "I",   subId: "NORMAL" },
  "5111": { anexo: "I",   subId: "NORMAL" },
  "5405": { anexo: "I",   subId: "ST"     }, // ST já recolhido
  "5403": { anexo: "I",   subId: "ST"     },
  "5501": { anexo: "I",   subId: "NORMAL" }, // remessa industrialização
  // Exportação → Anexo I, Exportação
  "7101": { anexo: "I",   subId: "EXP"    },
  "7102": { anexo: "I",   subId: "EXP"    },
  // Indústria → Anexo II
  "5101-IND": { anexo: "II",  subId: "NORMAL" }, // diferenciado pelo emissor
  // Serviços (sem nota fiscal de produto) → NFSe path
};
```

### 4.2 Código de Serviço LC 116/2003 → Simples Nacional

```javascript
const SERVICO_PARA_SIMPLES = {
  // Subgrupos que normalmente caem em Anexo IV (sem CPP incluso)
  "7.02": { anexo: "IV",   subId: "NORMAL", motivo: "Construção civil" },
  "7.04": { anexo: "IV",   subId: "NORMAL", motivo: "Serviços de demolição" },
  "17.06":{ anexo: "IV",   subId: "NORMAL", motivo: "Propaganda/publicidade" },
  // Demais → Anexo III/V (Fator R decide em runtime)
  "*":    { anexo: "III/V", subId: "NORMAL", motivo: "Serviço geral LC 116" },
};
```

**Nota:** O resultado `III/V` é tratado normalmente pelo motor existente (`calcFatorR`).

### 4.3 Lógica de Confiança

| Situação                                             | Confiança  |
|------------------------------------------------------|------------|
| XML NFe/NFCe + CFOP na tabela + natureza `saida`     | `alta`     |
| XML NFSe driver ABRASF + código LC116                | `alta`     |
| XML NFSe driver municipal (SP, Rio, Curitiba)        | `media`    |
| XML NFSe driver fallback / CFOP fora da tabela       | `media`    |
| PDF com chave 44 dígitos encontrada                  | `media`    |
| PDF sem chave / natureza `indeterminada`             | `baixa`    |

**Regra de ouro:** notas com `natureza: "entrada"` **nunca chegam à engine de classificação** — são marcadas `status: "despesa"` logo no parser e filtradas no `getSugestoes`.

---

## 5. Extensões no `useDB`

Adicionar ao hook existente:

```javascript
// Estado adicional
const [notas, setNotas] = useState(() => loadData("lionsolver_notas", []));

// Persistência automática (useEffect adicional)
useEffect(() => saveData("lionsolver_notas", notas), [notas]);

// Métodos
addNota: (data) => {
  const nota = { ...data, id: genId(), importado_em: new Date().toISOString() };
  setNotas(prev => [...prev, nota]);
  return nota;
},
updNota: (id, partial) =>
  setNotas(prev => prev.map(n => n.id === id ? { ...n, ...partial } : n)),
delNota: (id) =>
  setNotas(prev => prev.filter(n => n.id !== id)),

// Consulta de sugestões (derivado — sem estado próprio)
getSugestoes: (empresa_id, competencia) => {
  return notas
    .filter(n =>
      n.empresa_id === empresa_id &&
      n.competencia === competencia &&
      n.status === "pendente" &&
      n.natureza !== "entrada"   // ← notas de entrada (despesas) nunca viram sugestão
    )
    .map(n => classificarNota(n));   // chama Engine de Classificação
},
```

**Backup/Restore:** incluir `notas` no objeto de export v4:

```javascript
// ConfigPage — exportar
const data = {
  version: "lionsolver-v4",
  exportDate: new Date().toISOString(),
  config, empresas, apuracoes, notas   // ← adicionado
};
```

---

## 6. Novos Componentes de UI

### 6.1 `ImportacaoNFPage` (nova página)

**Seções:**

```
┌─────────────────────────────────────────────────────┐
│  Filtro: [Empresa ▼]  [Competência ▼]  [Status ▼]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │            Drop Zone                        │   │
│  │   Arraste XMLs ou PDFs de notas fiscais     │   │
│  │   NFe • NFCe • NFSe                         │   │
│  │   [ou clique para selecionar arquivos]      │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Notas Importadas                        [Limpar]  │
│  ┌─────────────────────────────────────────────┐   │
│  │ Tipo  Nº    Emitente       Valor    Status  │   │
│  │ NFSe  001   Empresa X   R$5.000   Pendente  │   │
│  │ NFe   042   Fornec. Y   R$1.200   Ignorado  │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Comportamento do Drop Zone:**
- Aceita múltiplos arquivos simultaneamente
- Extensões permitidas: `.xml`, `.pdf`
- Processo: File API → detectTipo() → parser correspondente → classificar → addNota()
- Mostra progresso inline por arquivo (ícone de loading → ok/erro)

### 6.2 `SugestoesBanner` (componente interno do ApuracaoPage — Step 0)

Renderizado condicionalmente acima da lista de receitas quando
`db.getSugestoes(empId, comp).length > 0`:

```
┌────────────────────────────────────────────────────────┐
│ 💡 3 sugestões de receita baseadas em notas importadas │
│    para Empresa X — 03/2026          [Ver sugestões ▼] │
└────────────────────────────────────────────────────────┘
```

Ao expandir:

```
┌────────────────────────────────────────────────────────┐
│ NFSe 001 — Empresa X Ltda                              │
│ Serviço TI (1.01) → Anexo III/V — NORMAL               │
│ Valor: R$ 5.000,00    Confiança: ● ALTA                │
│ [Aplicar Esta]  [Ignorar]                              │
├────────────────────────────────────────────────────────┤
│ NFe 042 — Fornecedor Y                                 │
│ CFOP 5102 → Anexo I — NORMAL                           │
│ Valor: R$ 1.200,00    Confiança: ● ALTA                │
│ [Aplicar Esta]  [Ignorar]                              │
├────────────────────────────────────────────────────────┤
│              [Aplicar Todas as Sugestões]              │
└────────────────────────────────────────────────────────┘
```

**Ao clicar "Aplicar Esta":**
1. Adiciona item ao array `receitas` do step 0 (mesmo formato atual)
2. Chama `db.updNota(id, { status: "confirmado" })`
3. Colapsa o item do painel

**Ao clicar "Ignorar":**
1. Chama `db.updNota(id, { status: "ignorado" })`
2. Remove do painel (não aparece mais)

---

## 7. Navegação

Adicionar entrada ao array `NAV` existente:

```javascript
{ id: "importacao", label: "Notas Fiscais", icon: FileText }
```

Posição sugerida: entre "Apuração" e "Histórico".

---

## 8. Dependências Externas

| Dependência | Versão sugerida | Uso                              | Já no projeto? |
|-------------|-----------------|----------------------------------|----------------|
| `pdfjs-dist`| `^4.x`          | Extração de texto de PDFs        | Não            |

**Instalação:**
```bash
npm install pdfjs-dist
```

**⚠ Configuração obrigatória no Vite (Gargalo 2):**
```javascript
// main.jsx ou módulo de parsing — executar antes de qualquer uso do pdf.js
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
```
Sem o `?url`, o Vite tenta fazer bundle do worker no thread principal, causando
erro de contexto isolado e degradação para modo síncrono.

XML (NFe/NFSe/NFCe) não precisa de dependência — usa `DOMParser` nativo do browser.

---

## 9. Versionamento de Dados

| Versão | Novidades                              |
|--------|----------------------------------------|
| v3     | config, empresas, apuracoes            |
| **v4** | + notas (migração automática: `notas: []` se ausente) |

**Migração no import (ConfigPage):**
```javascript
if (data.version === "lionsolver-v3") {
  data.notas = [];   // retrocompatível
  data.version = "lionsolver-v4";
}
```

---

## 10. Ordem de Implementação Sugerida

1. **useDB** — adicionar `notas` state, persistência e métodos CRUD
2. **Parsers** — `parseXmlNFe`, `parseXmlNFSe`, `parsePDF` (funções puras, testáveis)
3. **Engine de Classificação** — `classificarNota(nota) → SugestaoReceita`
4. **ImportacaoNFPage** — Drop Zone + tabela de notas
5. **SugestoesBanner** — integração no Step 0 do ApuracaoPage
6. **Navegação** — adicionar rota `importacao`
7. **Backup v4** — migração de schema no ConfigPage
