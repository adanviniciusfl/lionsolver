# LionSolver - Planejamento de Melhorias (TODO)

Este arquivo consolida os próximos passos e épicos de desenvolvimento alinhados para crescimento e otimização do software.

- [x] **Seção "Sobre" (Documentação Integrada)**
  - Nova aba/tela com detalhes informativos sobre o app.
  - Implementar seção com tutoriais da operação.
  - Exibição visível dos dados do Changelog (versões lançadas, novidades e fixes por build).

- [x] **Relatório Excel mais Apresentável**
  - Upgrade da exportação tabulada base rudimentar existente (TSV/CSV inline).
  - Integração preferencial com a biblioteca web `SheetJS` injetando features como Auto-Fit width, headers estilizados, borders e multi-planilhas.
  - Preservar compliance e abster do uso do Tauri Plugin FS (usando a bridge web-compatible vigente do browser window para download da URI scheme do XLSX buildado).

- [x] **Dashboard com Filtro por Empresa**
  - Implementar um seletor no `DashboardPage` possibilitando segmentação das estátisticas globais.
  - Dinamizar KPIs atuais (DAS Mensal plot e evolução arrecadatória) filtrando base em clientes ativos específicos para visualização de relatórios granulares do painel.

- [ ] **Verificar Backup Exportação/Importação**
  - Elaborar checklist contundente nas rotinas do state no array complexo `useDB` contra quebras.
  - Prevenir falhas sobre parse nas strings colossais da exportação Blob URI em execuções severas com alta carga de objetos em memória.
  - Ajustar visualmente a modalidade de success and fallback da engine (se formatação v3 JSON divergir etc).

- [ ] **Simulador da Reforma Tributária**
  - Construir engine paralela às projeções do atual Fator R e Tabelas fixas.
  - Prever cenários embasados de recolhimento transitório (IBS, CBS e abolições regressivas) confrontando o valor líquido da emissão da DAS do panorama atual contra os custos sob moldes iminentes.

- [ ] **Importação de XMLs Fiscais (NFe/NFSe)**
  - Suportar parser drag and drop do DOM API (sem plugin do SO) a documentações padronizadas SEFAZ ou RPS autorizadas de prefeituras primárias.
  - Automação da consolidação da Receita Bruta mapeando CFOP do comércio, códigos de serviço, base de cálculo e deduções legais poupando a mão de obra mensal contábil em `ApuracaoPage`.

- [ ] **Revisão Tributária**
  - Implementar algoritmos preventivos e passivos rodando varreduras retroativas de array em background ou ativamente em tela dedicada para rastreio de distúrbios de Fator R e imunidades/isenções por legislação estadual negligenciadas.
  - Sugerir estornos para contadores através da demonstração explícita de sobrecarga nas `alertasRecentes` baseadas nas portarias dos últimos ciclos de competências não prescritos (Malhas/Aproveitamentos em apurações defasadas onde ST/ICMS deviam ter sido abatidos).
