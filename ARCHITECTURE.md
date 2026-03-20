# Arquitetura do LionSolver

Este documento descreve a arquitetura do LionSolver, um software desktop desenvolvido com Tauri 2 e React 18, em formato de single-file component (`src/App.jsx`).

## Estrutura do Código
O arquivo `src/App.jsx` concentra praticamente toda a lógica e a interface do aplicativo, dividido nas seguintes seções principais:

1. **Auto-Updater**: Função `checkForUpdates` que interage com o plugin do Tauri para busca, download e instalação de atualizações.
2. **Design Tokens & Temas**: Configuração das cores da interface para os temas claro e escuro.
3. **Motor de Cálculo Tributário**: Tabelas dos anexos do Simples Nacional, regras de benefícios estaduais de ICMS e funções de cálculo de faixas e fatores.
4. **Relatórios (PDF e XLSX)**: Funções injetadas para construir relatórios tabulares e HTML.
5. **Componentes de UI de base**: `Badge`, `Btn`, `Inp`, `Sel`, `Modal`, `KPI` formam o framework visual sem uso de bibliotecas externas.
6. **Gerenciamento de Estado/Banco de Dados (`useDB`)**: Custom hook que controla as operações de CRUD da aplicação comunicando-se de forma assíncrona ao wrapper via manipulação do objeto global no `localStorage`.
7. **Páginas**: Componentes robustos representando seções: `ApuracaoPage`, `DashboardPage`, `ConfigPage`, `EmpresasPage`, `HistoricoPage`.
8. **App Shell**: Componente principal e provedor de escopo, que lida com o layout da navegação lateral (Menu `aside`) e o container de dinamicidade (`main`).

## Fluxo de Dados
A persistência da aplicação é realizada offline através do Web Storage:
- **Armazenamento**: Todos os dados críticos (configurações gerais, dados empresariais e apurações consolidadas) operam no `localStorage` sob o namespace `lionsolver_`.
- **Hooks de Acesso Local**: Funções como `loadData()` avaliam a memória persistente com um fallback estruturado, logo `saveData()` serializa e persiste instâncias mutadas em JSON.
- **Integração (`useDB`)**: Os React Components operam o banco via custom hook. O gancho disponibiliza listas de coleções além de emissores de ações (`addE`, `updE`, `delE`, `addA`). Os efeitos (`useEffect`) monitoram sub-árvores stateful e acionam salvamentos automáticos no storage em cascata.

## Motor de Cálculo
Concentrado na submissão de lógicas à LC 123/2006 (Simples Nacional) e LC 155/2016:
- **Anexos e Fórmulas Básicas**: A matriz `ANEXOS` dita as distribuições progressivas englobando repartições de impostos fixos (IRPJ, CSLL, Cofins, PIS, CPP, IPI, ICMS, ISS).
- **Alíquota Efetiva e Margens**: As funções de controle (`encontrarFaixa` e `calcAliqEfetiva`) operam identificação de patamares através do indexador fundamental `RBT12` (Receita Bruta Acumulada), aplicando o redutor/parcela a deduzir. A dependência `calcRBT12Proporcional` processa a RBT12 quando a empresa incorre em fundação com período subjulgado (meses de atividade insuficientes). `calcFatorR` inspeciona balanças de FS12 contra receita cruzando Anexos III e V.
- **ICMS Estadual Integrado**: A matriz utilitária de isenções `BENEFICIOS_UF` vincula reduções ao método `getICMSBeneficio`. Os limites paramétricos ou deduções base de RBT12 são abatidos diretamente nas esferas dos tributos sub-repartidos durante o loop de faturamento do wizard.
- **Subseções Diversas**: Abatimentos monofásicos, ST (Substituição Tributária) ou isenções diretas abatem das distribuições através de declarações matriciais referenciadas no dictionary de `SUBSECOES`.

## Sistema de Temas
Implementado nativamente via constants injetados:
- Operado por paletas JSON sob as raízes `escuro` e `claro` (Ex: background `bgIn`, fontes primárias e secondary `tm`, tokens de aprovação da UI base `ok` ou `err`).
- Avaliado em runtime (`T = THEMES[currentTema]`) provindo da configuração `config.tema`.
- O render global repassa referencial às macros de componentes isolados reajustando todo o estilo visual através das chaves mapeadas (sem overheads de libs UI externas).

## Sistema de Auto-Update
Exclusivo para contexto empacotado Desktop/Tauri:
- Funcionalidades dinâmicas do pacote de hooks `@tauri-apps/plugin-updater`.
- Acionado imperativamente on-mount através de `checkForUpdates(setUpdateStatus)`.
- Se a interface detecta upstream liberado:
  1. Utiliza `tauri-apps/plugin-dialog` repassando notificação na UI do SO sobre a disponibilidade.
  2. Em aceitação (confirmação `yes`), opera o `downloadAndInstall`.
  3. No callback resolutivo da promise, `@tauri-apps/plugin-process` relança a janela atualizada (`relaunch()`).
