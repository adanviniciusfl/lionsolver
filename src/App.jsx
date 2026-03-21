import { useState, useCallback, useMemo, useEffect } from "react";
import { Search, Plus, Pencil, Trash2, Building2, LayoutDashboard, Calculator, FileText, History, ChevronRight, ChevronLeft, X, Check, TriangleAlert, TrendingUp, DollarSign, Archive, RotateCcw, Menu, MapPin, Settings, Download, Upload, Info } from "lucide-react";
import * as XLSX from "xlsx";

/* ══════════════════════════════════════════════════════════════
   AUTO-UPDATER (only runs in Tauri desktop, ignored in browser)
   ══════════════════════════════════════════════════════════════ */
async function checkForUpdates(setUpdateStatus) {
  try {
    // Dynamic import so it doesn't break when running in browser
    const { check } = await import("@tauri-apps/plugin-updater");
    const { ask } = await import("@tauri-apps/plugin-dialog");

    setUpdateStatus("checking");
    const update = await check();

    if (update) {
      setUpdateStatus("available");
      const yes = await ask(
        `Nova versao disponivel: v${update.version}\n\nDeseja atualizar agora?`,
        { title: "LionSolver - Atualizacao", kind: "info", okLabel: "Atualizar", cancelLabel: "Depois" }
      );
      if (yes) {
        setUpdateStatus("downloading");
        await update.downloadAndInstall();
        // Restart after install
        const { relaunch } = await import("@tauri-apps/plugin-process");
        await relaunch();
      } else {
        setUpdateStatus("skipped");
      }
    } else {
      setUpdateStatus("uptodate");
    }
  } catch (e) {
    // Not running in Tauri or no internet — silently ignore
    setUpdateStatus("browser");
  }
}

/* ══════════════════════════════════════════════════════════════
   DESIGN TOKENS — Dark & Light themes
   ══════════════════════════════════════════════════════════════ */
const APP_VERSION = "1.6.0";

const THEMES = {
  escuro: {
    bg:"#131313",bgCard:"#1c1b1b",bgHov:"#2a2a2a",bgSide:"#0e0e0e",bgIn:"#201f1f",
    border:"#2a2a2a",borderF:"#bbc3ff",text:"#e5e2e1",tm:"#8e90a2",td:"#434656",
    p:"#bbc3ff",pH:"#dee0ff",pD:"rgba(187, 195, 255, 0.12)",pText:"#001d93",
    ok:"#00daf3",okD:"rgba(0, 218, 243, 0.12)",
    w:"#FBBF24",wD:"rgba(251,191,36,0.12)",
    err:"#ffb4ab",errD:"rgba(255, 180, 171, 0.12)",
    i:"#bbc3ff",iD:"rgba(187, 195, 255, 0.12)",
    r:"16px",rs:"8px",f:"'Manrope','Inter',sans-serif",fm:"'Inter',monospace",
    sideText:"#e5e2e1",sideTm:"#8e90a2",sideTd:"#434656",sideBorder:"rgba(255,255,255,0.05)",
  },
  claro: {
    bg:"#F0F1F5",bgCard:"#FFFFFF",bgHov:"#E8E9EE",bgSide:"#1B2332",bgIn:"#F5F6FA",
    border:"#D8DAE2",borderF:"#001d93",text:"#1A1D26",tm:"#5A5F70",td:"#9096A6",
    p:"#002ccd",pH:"#001d93",pD:"rgba(0, 44, 205, 0.12)",pText:"#FFFFFF",
    ok:"#007886",okD:"rgba(0, 120, 134, 0.10)",
    w:"#D97706",wD:"rgba(217,119,6,0.10)",
    err:"#DC2626",errD:"rgba(220,38,38,0.08)",
    i:"#2848ee",iD:"rgba(40, 72, 238, 0.08)",
    r:"16px",rs:"8px",f:"'Manrope','Inter',sans-serif",fm:"'Inter',monospace",
    sideText:"#e5e2e1",sideTm:"#7A7F8E",sideTd:"#4A4F5E",sideBorder:"#252A36",
  },
};

// T will be set dynamically based on theme — start with dark as default
let T = THEMES.escuro;

/* ══════════════════════════════════════════════════════════════
   ENGINE — SIMPLES NACIONAL (LC 123/2006 + LC 155/2016)
   ══════════════════════════════════════════════════════════════ */
const ANEXOS={
  I:{nome:"Anexo I",tributos:["IRPJ","CSLL","Cofins","PIS","CPP","ICMS"],
    faixas:[{ate:180000,aliq:.04,pd:0},{ate:360000,aliq:.073,pd:5940},{ate:720000,aliq:.095,pd:13860},{ate:1800000,aliq:.107,pd:22500},{ate:3600000,aliq:.143,pd:87300},{ate:4800000,aliq:.19,pd:378000}],
    rep:[[.055,.035,.1274,.0276,.415,.34],[.055,.035,.1274,.0276,.415,.34],[.055,.035,.1274,.0276,.42,.335],[.055,.035,.1274,.0276,.42,.335],[.055,.035,.1274,.0276,.42,.335],[.135,.10,.2827,.0613,.421,0]]},
  II:{nome:"Anexo II",tributos:["IRPJ","CSLL","Cofins","PIS","CPP","IPI","ICMS"],
    faixas:[{ate:180000,aliq:.045,pd:0},{ate:360000,aliq:.078,pd:5940},{ate:720000,aliq:.10,pd:13860},{ate:1800000,aliq:.112,pd:22500},{ate:3600000,aliq:.147,pd:85500},{ate:4800000,aliq:.30,pd:720000}],
    rep:[[.055,.035,.1151,.0249,.375,.075,.32],[.055,.035,.1151,.0249,.375,.075,.32],[.055,.035,.1151,.0249,.375,.075,.32],[.055,.035,.1151,.0249,.375,.075,.32],[.055,.035,.1151,.0249,.375,.075,.32],[.085,.075,.2096,.0454,.235,.35,0]]},
  III:{nome:"Anexo III",tributos:["IRPJ","CSLL","Cofins","PIS","CPP","ISS"],
    faixas:[{ate:180000,aliq:.06,pd:0},{ate:360000,aliq:.112,pd:9360},{ate:720000,aliq:.135,pd:17640},{ate:1800000,aliq:.16,pd:35640},{ate:3600000,aliq:.21,pd:125640},{ate:4800000,aliq:.33,pd:648000}],
    rep:[[.04,.035,.1282,.0278,.434,.335],[.04,.035,.1405,.0305,.434,.32],[.04,.035,.1364,.0296,.434,.325],[.04,.035,.1364,.0296,.434,.325],[.04,.035,.1282,.0278,.434,.335],[.35,.15,.1603,.0347,.305,0]]},
  IV:{nome:"Anexo IV",tributos:["IRPJ","CSLL","Cofins","PIS","ISS"],
    faixas:[{ate:180000,aliq:.045,pd:0},{ate:360000,aliq:.09,pd:8100},{ate:720000,aliq:.102,pd:12420},{ate:1800000,aliq:.14,pd:39780},{ate:3600000,aliq:.22,pd:183780},{ate:4800000,aliq:.33,pd:828000}],
    rep:[[.188,.152,.1767,.0383,.445],[.188,.152,.1767,.0383,.445],[.188,.152,.1767,.0383,.445],[.188,.152,.1767,.0383,.445],[.188,.152,.1767,.0383,.445],[.188,.152,.1767,.0383,.445]]},
  V:{nome:"Anexo V",tributos:["IRPJ","CSLL","Cofins","PIS","CPP","ISS"],
    faixas:[{ate:180000,aliq:.155,pd:0},{ate:360000,aliq:.18,pd:4500},{ate:720000,aliq:.195,pd:9900},{ate:1800000,aliq:.205,pd:17100},{ate:3600000,aliq:.23,pd:62100},{ate:4800000,aliq:.305,pd:540000}],
    rep:[[.25,.15,.141,.0305,.2885,.14],[.23,.15,.141,.0305,.2785,.17],[.24,.15,.1492,.0323,.2385,.19],[.21,.15,.1574,.0341,.2385,.21],[.23,.125,.141,.0305,.2385,.235],[.35,.155,.1644,.0356,.295,0]]},
};

// Benefícios estaduais ICMS para Simples Nacional
// tipo: "isencao" = 100% ICMS zerado | "reducao" = % redução | "fixo" = valor fixo mensal | "tabela_propria" = tabelas de alíquota próprias
// reqME: true = benefício apenas para ME (porte), false = ME+EPP
const BENEFICIOS_UF = {
  AL: { tipo: "isencao", limiteRBT12: 48000, reqME: true,
    base: "Decreto AL 3.989/2008",
    nota: "Isenção ICMS para ME com RBT12 até R$ 48.000" },
  AM: { tipo: "isencao", limiteRBT12: 150000, reqME: true,
    base: "Lei AM 3.151/2007, arts. 13-14",
    nota: "Isenção ICMS para ME com RBT12 até R$ 150.000" },
  BA: { tipo: "isencao", limiteRBT12: 180000, reqME: true,
    base: "RICMS-BA Art. 277, Decreto 13.780/2012; Lei BA 10.406/2007",
    nota: "Isenção ICMS para ME com RBT12 até R$ 180.000. Atualizado em 2012 (antes era R$ 144.000). Válido apenas para Microempresas." },
  DF: { tipo: "fixo", limiteRBT12: 360000, reqME: true,
    base: "Lei DF 4.006/2007",
    nota: "Valor fixo mensal de ICMS/ISS para ME até R$ 360.000" },
  GO: { tipo: "fixo", limiteRBT12: 120000, reqME: true,
    base: "Decreto GO 6.703/2007",
    nota: "Valor fixo mensal de ICMS para ME até R$ 120.000" },
  PB: { tipo: "reducao", faixas: [{ate:360000,red:1},{ate:3600000,red:0.5}], reqME: false,
    base: "MP/PB 123/2009",
    nota: "Isenção até R$ 360 mil; redução de 50% acima até sublimite" },
  PR: { tipo: "tabela_propria", limiteRBT12: 360000, reqME: false,
    base: "Decreto PR 1.190/2007; Lei 15.562/2007; Decreto 8.660/2018; Anexo XI RICMS/PR",
    nota: "Isenção total até R$ 360.000 (ME e EPP). Acima: tabela própria de alíquota efetiva ICMS/PR com redução progressiva até R$ 3.600.000. Único estado que tributa apenas o excedente de R$ 360 mil." },
  RJ: { tipo: "reducao_progressiva", limiteRBT12: 2160000, reqME: false,
    base: "Lei RJ 5.147/2007; Resolução SEFAZ 224/2018",
    nota: "Reduções progressivas do ICMS por faixa até R$ 2.160.000. Percentuais variam de ~41% a ~5% conforme a faixa." },
  RS: { tipo: "reducao_faixa", limiteRBT12: 3600000, reqME: false,
    base: "Lei RS 13.036/2008",
    nota: "Benefícios escalonados por faixa de RBT12" },
  SE: { tipo: "isencao", limiteRBT12: 360000, reqME: true,
    base: "Lei SE 6.192/2007",
    nota: "Isenção da parcela ICMS para microempresas" },
  PE: { tipo: "fixo_setorial", limiteRBT12: 360000, reqME: true,
    base: "Lei PE 13.359/2007",
    nota: "Valor fixo para ME do Polo de Confecções do Agreste. Benefício setorial, não geral." },
};

function getICMSBeneficio(uf, rbt12) {
  const b = BENEFICIOS_UF[uf];
  if (!b) return { reducao: 0, base: null, limiteRBT12: 0, nota: null };

  // Isenção simples: 100% se dentro do limite
  if (b.tipo === "isencao" && b.limiteRBT12 && rbt12 <= b.limiteRBT12) {
    return { reducao: 1, base: b.base, limiteRBT12: b.limiteRBT12, nota: b.nota, reqME: b.reqME };
  }

  // Paraná: isenção total até 360k
  if (b.tipo === "tabela_propria" && rbt12 <= b.limiteRBT12) {
    return { reducao: 1, base: b.base, limiteRBT12: b.limiteRBT12, nota: b.nota, reqME: false };
  }
  // PR acima de 360k: tem redução mas precisaria da tabela completa — sinaliza no alerta
  if (b.tipo === "tabela_propria" && rbt12 > b.limiteRBT12) {
    return { reducao: 0, base: b.base, limiteRBT12: b.limiteRBT12, nota: "PR: acima de R$ 360 mil — verificar tabela própria de redução ICMS/PR (Anexo XI RICMS)", reqME: false, alertaReducao: true };
  }

  // Paraíba: faixas
  if (b.tipo === "reducao" && b.faixas) {
    for (const fx of b.faixas) {
      if (rbt12 <= fx.ate) return { reducao: fx.red, base: b.base, limiteRBT12: fx.ate, nota: b.nota, reqME: b.reqME };
    }
  }

  // RJ: sinaliza que tem redução mas é complexa
  if (b.tipo === "reducao_progressiva" && rbt12 <= b.limiteRBT12) {
    return { reducao: 0, base: b.base, limiteRBT12: b.limiteRBT12, nota: "RJ: verificar percentual de redução por faixa (Resolução SEFAZ 224/2018)", reqME: false, alertaReducao: true };
  }

  return { reducao: 0, base: b.base, limiteRBT12: b.limiteRBT12 || 0, nota: b.nota };
}

function encontrarFaixa(rbt12,key){const ax=ANEXOS[key];for(let i=0;i<ax.faixas.length;i++)if(rbt12<=ax.faixas[i].ate)return i;return 5;}
function calcAliqEfetiva(rbt12,key){const ax=ANEXOS[key],i=encontrarFaixa(rbt12,key),f=ax.faixas[i];if(i===0)return{ae:f.aliq,fx:i,an:f.aliq,pd:f.pd};return{ae:((rbt12*f.aliq)-f.pd)/rbt12,fx:i,an:f.aliq,pd:f.pd};}
function calcFatorR(fs12,rbt12){return rbt12===0?0:fs12/rbt12;}

function calcRBT12Proporcional(receitaAcum,dataAbertura,competencia){
  const ab=new Date(dataAbertura+"T00:00:00");
  const [cy,cm]=competencia.split("-").map(Number);
  const compDate=new Date(cy,cm-1,1);
  let meses=0;
  const d=new Date(ab.getFullYear(),ab.getMonth(),1);
  while(d<compDate){meses++;d.setMonth(d.getMonth()+1);}
  if(meses>=12)return{proporcional:false,rbt12:receitaAcum,meses:12};
  if(meses===0)meses=1;
  const rbt12Prop=(receitaAcum/meses)*12;
  return{proporcional:true,rbt12:rbt12Prop,rbt12Real:receitaAcum,meses,base:"LC 123/2006 Art.3º §2º; CGSN 140/2018 Art.21"};
}

/* ══════════════════════════════════════════════════════════════
   SUBSEÇÕES DE RECEITA
   ══════════════════════════════════════════════════════════════ */
const SUBSECOES={
  I:[
    {id:"NORMAL",nome:"ICMS Normal",deduz:[]},
    {id:"ST",nome:"ICMS ST (recolhido anteriormente)",deduz:["ICMS"]},
    {id:"ST_MONO",nome:"ICMS ST + PIS/Cofins Monofásico (recolhidos anteriormente)",deduz:["ICMS","PIS","Cofins"]},
    {id:"MONO",nome:"PIS/Cofins Monofásico (recolhido anteriormente)",deduz:["PIS","Cofins"]},
    {id:"DEV",nome:"Devoluções",deduz:["BASE"]},
    {id:"EXP",nome:"Exportação",deduz:["ICMS","PIS","Cofins"]},
    {id:"ISEN",nome:"Isenção/Redução Estadual ICMS",deduz:["ICMS_UF"]},
  ],
  II:[
    {id:"NORMAL",nome:"ICMS/IPI Normal",deduz:[]},
    {id:"ST",nome:"ICMS ST (recolhido anteriormente)",deduz:["ICMS"]},
    {id:"ST_MONO",nome:"ICMS ST + PIS/Cofins Mono (recolhidos anteriormente)",deduz:["ICMS","PIS","Cofins"]},
    {id:"MONO",nome:"PIS/Cofins Monofásico (recolhido anteriormente)",deduz:["PIS","Cofins"]},
    {id:"DEV",nome:"Devoluções",deduz:["BASE"]},
    {id:"EXP",nome:"Exportação",deduz:["ICMS","IPI","PIS","Cofins"]},
    {id:"ISEN",nome:"Isenção/Redução Estadual ICMS",deduz:["ICMS_UF"]},
  ],
  III:[
    {id:"NORMAL",nome:"ISS Normal (domicílio)",deduz:[],iss:"domicilio"},
    {id:"ISS_OUTRO",nome:"ISS devido a outro município",deduz:[],iss:"outro"},
    {id:"ISS_RET",nome:"ISS Retido (a ser recolhido pelo tomador)",deduz:["ISS"],iss:"retido"},
    {id:"DED",nome:"Deduções/Cancelamentos",deduz:["BASE"]},
    {id:"EXP",nome:"Exportação de Serviços",deduz:["ISS","PIS","Cofins"]},
  ],
  "III/V":[
    {id:"NORMAL",nome:"ISS Normal — Fator r (domicílio)",deduz:[],iss:"domicilio"},
    {id:"ISS_OUTRO",nome:"ISS devido a outro município — Fator r",deduz:[],iss:"outro"},
    {id:"ISS_RET",nome:"ISS Retido — Fator r (a ser recolhido pelo tomador)",deduz:["ISS"],iss:"retido"},
    {id:"DED",nome:"Deduções/Cancelamentos",deduz:["BASE"]},
    {id:"EXP",nome:"Exportação de Serviços",deduz:["ISS","PIS","Cofins"]},
  ],
  IV:[
    {id:"NORMAL",nome:"ISS Normal (domicílio)",deduz:[],iss:"domicilio"},
    {id:"ISS_OUTRO",nome:"ISS devido a outro município",deduz:[],iss:"outro"},
    {id:"ISS_RET",nome:"ISS Retido (a ser recolhido pelo tomador)",deduz:["ISS"],iss:"retido"},
    {id:"DED",nome:"Deduções/Cancelamentos",deduz:["BASE"]},
  ],
  V:[
    {id:"NORMAL",nome:"ISS Normal (domicílio)",deduz:[],iss:"domicilio"},
    {id:"ISS_OUTRO",nome:"ISS devido a outro município",deduz:[],iss:"outro"},
    {id:"ISS_RET",nome:"ISS Retido (a ser recolhido pelo tomador)",deduz:["ISS"],iss:"retido"},
    {id:"DED",nome:"Deduções/Cancelamentos",deduz:["BASE"]},
    {id:"EXP",nome:"Exportação de Serviços",deduz:["ISS","PIS","Cofins"]},
  ],
};

// Municípios amostrais (em produção: lista IBGE completa via arquivo JSON)
const MUNICIPIOS_POR_UF={
  BA:["Salvador","Feira de Santana","Vitória da Conquista","Camaçari","Itabuna","Juazeiro","Lauro de Freitas","Ilhéus","Jequié","Teixeira de Freitas","Barreiras","Alagoinhas","Porto Seguro","Simões Filho","Paulo Afonso"],
  SP:["São Paulo","Campinas","Guarulhos","Santos","São Bernardo do Campo","Osasco","Ribeirão Preto","Sorocaba","São José dos Campos","Bauru"],
  RJ:["Rio de Janeiro","Niterói","São Gonçalo","Duque de Caxias","Nova Iguaçu","Petrópolis","Volta Redonda","Campos dos Goytacazes"],
  MG:["Belo Horizonte","Uberlândia","Contagem","Juiz de Fora","Betim","Montes Claros","Uberaba","Governador Valadares"],
  PR:["Curitiba","Londrina","Maringá","Ponta Grossa","Cascavel","Foz do Iguaçu","São José dos Pinhais"],
  RS:["Porto Alegre","Caxias do Sul","Pelotas","Canoas","Santa Maria","Gravataí","Novo Hamburgo"],
  SC:["Florianópolis","Joinville","Blumenau","São José","Chapecó","Criciúma","Itajaí"],
  PE:["Recife","Jaboatão dos Guararapes","Olinda","Caruaru","Petrolina","Paulista"],
  CE:["Fortaleza","Caucaia","Juazeiro do Norte","Maracanaú","Sobral"],
  GO:["Goiânia","Aparecida de Goiânia","Anápolis","Rio Verde"],
  PA:["Belém","Ananindeua","Santarém","Marabá"],
  AM:["Manaus","Parintins","Itacoatiara"],
  MA:["São Luís","Imperatriz","São José de Ribamar"],
  DF:["Brasília"],
  MT:["Cuiabá","Várzea Grande","Rondonópolis"],
  MS:["Campo Grande","Dourados","Três Lagoas"],
  PB:["João Pessoa","Campina Grande","Santa Rita"],
  RN:["Natal","Mossoró","Parnamirim"],
  PI:["Teresina","Parnaíba"],
  AL:["Maceió","Arapiraca"],
  SE:["Aracaju","Nossa Senhora do Socorro"],
  ES:["Vitória","Vila Velha","Serra","Cariacica"],
  RO:["Porto Velho","Ji-Paraná"],
  AC:["Rio Branco","Cruzeiro do Sul"],
  AP:["Macapá","Santana"],
  RR:["Boa Vista"],
  TO:["Palmas","Araguaína"],
};
const UFS=Object.keys(MUNICIPIOS_POR_UF).sort();

/* ══════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════ */
const fBRL=v=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);
const fPct=v=>(v*100).toFixed(2).replace(".",",")+"%";
const fCNPJ=v=>{const d=v.replace(/\D/g,"").slice(0,14);return d.replace(/^(\d{2})(\d)/,"$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/,"$1.$2.$3").replace(/\.(\d{3})(\d)/,".$1/$2").replace(/(\d{4})(\d)/,"$1-$2");};
const pM=v=>{const n=parseFloat(String(v).replace(/[^\d,.-]/g,"").replace(",","."));return isNaN(n)?0:n;};
const genId=()=>Math.random().toString(36).substr(2,9);

const ANEXO_OPTS=[
  {v:"I",l:"Anexo I — Comércio"},{v:"II",l:"Anexo II — Indústria"},
  {v:"III",l:"Anexo III — Serviços (fixo)"},{v:"III/V",l:"Anexo III/V — Fator r"},
  {v:"IV",l:"Anexo IV — Serviços (sem CPP)"},{v:"V",l:"Anexo V — Serviços (fixo)"},
];

// Fallback icon for XLSX button (BarChart3 not available in this lucide version)
function BarChart3Fallback({ size = 14 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 16v-3"/><path d="M12 16V8"/><path d="M17 16v-6"/></svg>;
}

/* ══════════════════════════════════════════════════════════════
   PDF & XLSX EXPORT — rendered inline (sandbox-compatible)
   ══════════════════════════════════════════════════════════════ */

function buildPDFHTML(res, emp, comp) {
  const compLabel = (comp || "").split("-").reverse().join("/");
  const resultados = res.resultados || [];
  const alertas = res.alertas || [];

  return `<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:10px;color:#1a1a1a;line-height:1.5;padding:24px;max-width:800px;margin:0 auto">
<div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1B3A5C;padding-bottom:10px;margin-bottom:14px">
  <div><div style="font-size:18px;color:#1B3A5C;font-weight:800">LIONSOLVER</div><div style="font-size:10px;color:#666">Apuração do Simples Nacional</div></div>
  <div style="text-align:right"><div style="font-size:12px;font-weight:700;color:#1B3A5C">Competência ${compLabel}</div><div style="font-size:9px;color:#666">Gerado em ${new Date().toLocaleDateString("pt-BR")}</div></div>
</div>

<table style="width:100%;border-collapse:collapse;font-size:9px;margin-bottom:14px">
  <tr><td style="width:15%;color:#888;font-weight:600;padding:3px 6px">CNPJ</td><td style="padding:3px 6px;font-family:monospace">${emp.cnpj || "—"}</td><td style="width:15%;color:#888;font-weight:600;padding:3px 6px">UF/Cidade</td><td style="padding:3px 6px">${emp.cidade || "—"}/${emp.uf || "—"}</td></tr>
  <tr><td style="color:#888;font-weight:600;padding:3px 6px">Razão Social</td><td style="padding:3px 6px">${emp.razao || emp.empresa_nome || "—"}</td><td style="color:#888;font-weight:600;padding:3px 6px">Anexo</td><td style="padding:3px 6px">${emp.anexo || "—"}</td></tr>
</table>

<div style="display:flex;gap:8px;margin-bottom:14px">
  <div style="flex:1;background:#f5f7fa;border-radius:6px;padding:8px 10px"><div style="font-size:8px;text-transform:uppercase;color:#888;font-weight:700">DAS a Recolher</div><div style="font-size:16px;font-weight:800;color:#1B3A5C">${fBRL(res.valorDAS)}</div></div>
  <div style="flex:1;background:#f5f7fa;border-radius:6px;padding:8px 10px"><div style="font-size:8px;text-transform:uppercase;color:#888;font-weight:700">RBT12</div><div style="font-size:16px;font-weight:800;color:#1B3A5C">${fBRL(res.rbt12)}</div></div>
  <div style="flex:1;background:#f5f7fa;border-radius:6px;padding:8px 10px"><div style="font-size:8px;text-transform:uppercase;color:#888;font-weight:700">Fator r</div><div style="font-size:16px;font-weight:800;color:#1B3A5C">${fPct(res.fatorR)}</div><div style="font-size:9px;color:#666">${res.fatorR >= 0.28 ? "→ Anexo III" : "→ Anexo V"}</div></div>
</div>

${alertas.length > 0 ? `<div style="font-size:11px;text-transform:uppercase;color:#1B3A5C;font-weight:700;margin:14px 0 6px;border-bottom:1px solid #ddd;padding-bottom:3px">Alertas Fiscais</div>${alertas.map(a => `<div style="padding:5px 8px;margin:3px 0;border-radius:4px;font-size:9px;background:${a.sev === "critico" ? "#fce4ec" : a.sev === "aviso" ? "#fff8e1" : "#e8f4fd"};color:${a.sev === "critico" ? "#c62828" : a.sev === "aviso" ? "#f57f17" : "#1565c0"}">${a.msg}</div>`).join("")}` : ""}

<div style="font-size:11px;text-transform:uppercase;color:#1B3A5C;font-weight:700;margin:14px 0 6px;border-bottom:1px solid #ddd;padding-bottom:3px">Memória de Cálculo</div>
<table style="width:100%;border-collapse:collapse;font-size:9px;margin-bottom:10px">
  <thead><tr>${["Subseção", "Anexo", "Faixa", "Receita", "Alíq.Nom.", "PD", "Alíq.Ef.", "Valor"].map(h => `<th style="background:#1B3A5C;color:white;padding:5px 6px;text-align:left;font-size:8px;text-transform:uppercase">${h}</th>`).join("")}</tr></thead>
  <tbody>${resultados.map(r => `<tr>
    <td style="padding:5px 6px;border-bottom:1px solid #e5e5e5;font-weight:600">${r.tipo}</td>
    <td style="padding:5px 6px;border-bottom:1px solid #e5e5e5">${r.anexo}</td>
    <td style="padding:5px 6px;border-bottom:1px solid #e5e5e5;font-family:monospace">${r.faixa}ª</td>
    <td style="padding:5px 6px;border-bottom:1px solid #e5e5e5;font-family:monospace">${fBRL(r.receita)}</td>
    <td style="padding:5px 6px;border-bottom:1px solid #e5e5e5;font-family:monospace">${fPct(r.an)}</td>
    <td style="padding:5px 6px;border-bottom:1px solid #e5e5e5;font-family:monospace">${fBRL(r.pd)}</td>
    <td style="padding:5px 6px;border-bottom:1px solid #e5e5e5;font-family:monospace;font-weight:700;color:#1B3A5C">${fPct(r.ae)}</td>
    <td style="padding:5px 6px;border-bottom:1px solid #e5e5e5;font-family:monospace;font-weight:700">${fBRL(r.valorLiquido)}</td>
  </tr>`).join("")}</tbody>
</table>

${resultados.map(r => `<div style="background:#f0f3f7;border-left:3px solid #D4A843;padding:6px 10px;margin:4px 0;font-family:monospace;font-size:9px;color:#333">${r.tipo}: [(${fBRL(res.rbt12)} × ${fPct(r.an)}) − ${fBRL(r.pd)}] ÷ ${fBRL(res.rbt12)} = <strong>${fPct(r.ae)}</strong></div>`).join("")}

<div style="font-size:11px;text-transform:uppercase;color:#1B3A5C;font-weight:700;margin:14px 0 6px;border-bottom:1px solid #ddd;padding-bottom:3px">Distribuição por Tributo</div>
${resultados.map(r => `<div style="margin-bottom:8px"><div style="font-size:9px;color:#666;margin-bottom:3px">${r.tipo} — Anexo ${r.anexo}</div><div style="display:flex;gap:6px;flex-wrap:wrap">${Object.entries(r.dist).map(([t, d]) => {
  const dedLabel = d.deduzido && d.valor === 0 ? (t === "ICMS" ? (r.tipo.includes("ST") ? "Rec. ant." : "Isento") : (t === "ISS" ? "Ret. tomador" : "Rec. ant.")) : "";
  return `<div style="background:#f5f7fa;border-radius:4px;padding:4px 8px;min-width:70px"><div style="font-size:7px;text-transform:uppercase;color:#888;font-weight:700">${t}</div><div style="font-size:10px;font-weight:700;${d.deduzido && d.valor === 0 ? "color:#c62828" : ""}">${dedLabel || fBRL(d.valor)}</div><div style="font-size:8px;color:#888;font-family:monospace">${fPct(d.pct)}</div></div>`;
}).join("")}</div></div>`).join("")}

${resultados.some(r => r.issRetido && r.valorISSRetido > 0) ? `<div style="font-size:11px;text-transform:uppercase;color:#1B3A5C;font-weight:700;margin:14px 0 6px;border-bottom:1px solid #ddd;padding-bottom:3px">ISS a ser Recolhido pelo Tomador</div>
${resultados.filter(r => r.issRetido && r.valorISSRetido > 0).map(r => `<div style="background:#fff8e1;border-left:3px solid #f57f17;padding:6px 10px;margin:3px 0;font-size:10px"><strong>${r.tipo}</strong> — Receita: ${fBRL(r.receita)} → <strong style="color:#f57f17">ISS Retido: ${fBRL(r.valorISSRetido)}</strong></div>`).join("")}` : ""}

${(res.quadroAliquotas && res.quadroAliquotas.length > 0) ? `<div style="font-size:11px;text-transform:uppercase;color:#1B3A5C;font-weight:700;margin:14px 0 6px;border-bottom:1px solid #ddd;padding-bottom:3px">Quadro de Alíquotas (Atual e Período Seguinte)</div>
<table style="width:100%;border-collapse:collapse;font-size:9px;margin-bottom:10px">
<thead><tr><th style="background:#1B3A5C;color:white;padding:5px 6px;text-align:left">Anexo</th><th style="background:#1B3A5C;color:white;padding:5px 6px;text-align:center">Alíq.Nom.</th><th style="background:#1B3A5C;color:white;padding:5px 6px;text-align:center">Alíq.Ef.</th><th style="background:#1B3A5C;color:white;padding:5px 6px;text-align:center">ICMS (créd.)</th><th style="background:#1B3A5C;color:white;padding:5px 6px;text-align:center">ISS</th><th style="background:#D4A843;color:white;padding:5px 6px;text-align:center">Alíq.Nom.Prox</th><th style="background:#D4A843;color:white;padding:5px 6px;text-align:center">Alíq.Ef.Prox</th><th style="background:#D4A843;color:white;padding:5px 6px;text-align:center">ICMS Prox</th><th style="background:#D4A843;color:white;padding:5px 6px;text-align:center">ISS Prox</th></tr></thead>
<tbody>${res.quadroAliquotas.map(q => `<tr><td style="padding:5px 6px;border-bottom:1px solid #e5e5e5;font-weight:600">${q.anexo} — ${q.nomeAnexo}</td><td style="padding:5px 6px;border-bottom:1px solid #e5e5e5;text-align:center;font-family:monospace">${fPct(q.atual.aliqNom)}</td><td style="padding:5px 6px;border-bottom:1px solid #e5e5e5;text-align:center;font-family:monospace;font-weight:700;color:#1B3A5C">${fPct(q.atual.aliqEf)}</td><td style="padding:5px 6px;border-bottom:1px solid #e5e5e5;text-align:center;font-family:monospace">${q.atual.icms > 0 ? fPct(q.atual.icms) : "—"}</td><td style="padding:5px 6px;border-bottom:1px solid #e5e5e5;text-align:center;font-family:monospace">${q.atual.iss > 0 ? fPct(q.atual.iss) : "—"}</td><td style="padding:5px 6px;border-bottom:1px solid #e5e5e5;text-align:center;font-family:monospace">${fPct(q.proximo.aliqNom)}</td><td style="padding:5px 6px;border-bottom:1px solid #e5e5e5;text-align:center;font-family:monospace;font-weight:700;color:#D4A843">${fPct(q.proximo.aliqEf)}</td><td style="padding:5px 6px;border-bottom:1px solid #e5e5e5;text-align:center;font-family:monospace">${q.proximo.icms > 0 ? fPct(q.proximo.icms) : "—"}</td><td style="padding:5px 6px;border-bottom:1px solid #e5e5e5;text-align:center;font-family:monospace">${q.proximo.iss > 0 ? fPct(q.proximo.iss) : "—"}</td></tr>`).join("")}</tbody></table>
<div style="font-size:8px;color:#999;font-style:italic">ICMS (créd.) = alíquota para fins de crédito (Art. 23 LC 123). ISS = alíquota para NFS-e. Período seguinte estimado.</div>` : ""}

<div style="background:#1B3A5C;color:white;border-radius:6px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;margin-top:10px">
  <div><div style="font-size:8px;text-transform:uppercase;opacity:0.7">Total Bruto</div><div style="font-size:14px;font-weight:700">${fBRL(res.totalBruto)}</div></div>
  <div style="text-align:right"><div style="font-size:8px;text-transform:uppercase;opacity:0.7">DAS a Recolher</div><div style="font-size:22px;font-weight:800;color:#D4A843">${fBRL(res.valorDAS)}</div></div>
</div>

<div style="margin-top:16px;padding-top:8px;border-top:1px solid #ddd;font-size:8px;color:#999;text-align:center">
  LionSolver — Software de Apuração do Simples Nacional | LC 123/2006 • LC 155/2016 • CGSN 140/2018
</div>
</div>`;
}

function buildXLSXWorkbook(res, emp, comp) {
  const compLabel = (comp || "").split("-").reverse().join("/");
  const resultados = res.resultados || [];
  const alertas = res.alertas || [];

  // Sheet 1 — Resumo
  const resumoAOA = [
    ["LIONSOLVER — APURAÇÃO DO SIMPLES NACIONAL"],
    [],
    ["Empresa", emp.razao || emp.empresa_nome || "", "CNPJ", emp.cnpj || ""],
    ["Competência", compLabel, "UF/Cidade", `${emp.uf || ""}/${emp.cidade || ""}`],
    ["RBT12", res.rbt12, "Fator r", `${(res.fatorR * 100).toFixed(2)}%`],
    ["DAS a Recolher", res.valorDAS],
  ];

  // Sheet 2 — Memória de Cálculo
  const memoriaAOA = [
    ["Subseção", "Anexo", "Faixa", "Receita", "Alíq.Nominal", "PD", "Alíq.Efetiva", "Valor"],
    ...resultados.map(r => [r.tipo, r.anexo, `${r.faixa}ª`, r.receita, `${(r.an * 100).toFixed(2)}%`, r.pd, `${(r.ae * 100).toFixed(4)}%`, r.valorLiquido.toFixed(2)]),
  ];

  // Sheet 3 — Distribuição por Tributo (linhas achatadas)
  const distAOA = [["Subseção", "Anexo", "Tributo", "Percentual", "Valor", "Deduzido"]];
  for (const r of resultados) {
    for (const [t, d] of Object.entries(r.dist)) {
      distAOA.push([r.tipo, r.anexo, t, `${(d.pct * 100).toFixed(2)}%`, d.valor.toFixed(2), d.deduzido ? "Sim" : "Não"]);
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumoAOA), "Resumo");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(memoriaAOA), "Memória de Cálculo");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(distAOA), "Distribuição");
  if (alertas.length > 0) {
    const alertasAOA = [["Severidade", "Mensagem"], ...alertas.map(a => [a.sev.toUpperCase(), a.msg])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(alertasAOA), "Alertas");
  }
  return wb;
}

// Shared state for report modal — will be used by ReportModal component
let _setReportModal = null;

function gerarPDF(res, emp, comp) {
  if (_setReportModal) _setReportModal({ type: "pdf", html: buildPDFHTML(res, emp, comp), title: `Apuração ${(comp || "").split("-").reverse().join("/")} — ${emp.fantasia || emp.razao || emp.empresa_nome || ""}` });
}

function gerarXLSX(res, emp, comp) {
  if (_setReportModal) {
    const wb = buildXLSXWorkbook(res, emp, comp);
    const b64 = XLSX.write(wb, { bookType: "xlsx", type: "base64" });
    const dataUri = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${b64}`;
    _setReportModal({ type: "xlsx", dataUri, filename: `LionSolver_${emp.fantasia || emp.razao || ""}_${comp}.xlsx`, title: "Exportar Planilha" });
  }
}

function ReportModal({ report, onClose }) {
  if (!report) return null;

  const handlePrint = () => {
    const content = document.getElementById("report-content");
    if (!content) return;
    const printHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${report.title}</title><style>@page{size:A4;margin:15mm}*{box-sizing:border-box}body{margin:0;padding:0}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${content.innerHTML}</body></html>`;

    // Create hidden iframe for printing
    let iframe = document.getElementById("print-frame");
    if (iframe) iframe.remove();
    iframe = document.createElement("iframe");
    iframe.id = "print-frame";
    iframe.style.cssText = "position:fixed;top:-10000px;left:-10000px;width:210mm;height:297mm;border:none;";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(printHTML);
    doc.close();

    // Wait for content to render then print
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      // Clean up after print dialog closes
      setTimeout(() => { if (iframe.parentNode) iframe.remove(); }, 1000);
    }, 300);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "12px", width: report.type === "pdf" ? "90vw" : "480px", maxWidth: 860, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #e5e5e5", position: "sticky", top: 0, background: "#fff", zIndex: 1, borderRadius: "12px 12px 0 0" }}>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a" }}>{report.title}</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {report.type === "pdf" && <button onClick={handlePrint} style={{ padding: "6px 14px", background: "#1B3A5C", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Imprimir / Salvar PDF</button>}
            {report.type === "xlsx" && <a href={report.dataUri} download={report.filename} style={{ padding: "6px 14px", background: "#1B3A5C", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>Baixar .XLSX</a>}
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#888" }}>✕</button>
          </div>
        </div>
        {report.type === "pdf" && <div id="report-content" dangerouslySetInnerHTML={{ __html: report.html }} />}
        {report.type === "xlsx" && <div style={{ padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: 12 }}>📊</div>
          <p style={{ fontSize: "14px", color: "#333", fontWeight: 600, margin: "0 0 8px" }}>Planilha pronta para download</p>
          <p style={{ fontSize: "12px", color: "#888", margin: "0 0 16px" }}>{report.filename}</p>
          <a href={report.dataUri} download={report.filename} style={{ display: "inline-block", padding: "10px 24px", background: "#1B3A5C", color: "#fff", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>Baixar Arquivo</a>
        </div>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   UI COMPONENTS
   ══════════════════════════════════════════════════════════════ */
function Badge({children,color="primary"}){const c={primary:{bg:T.pD,t:T.p},success:{bg:T.okD,t:T.ok},warning:{bg:T.wD,t:T.w},danger:{bg:T.errD,t:T.err},info:{bg:T.iD,t:T.i}}[color]||{bg:T.pD,t:T.p};return <span style={{display:"inline-flex",padding:"2px 9px",borderRadius:"14px",fontSize:"10px",fontWeight:600,background:c.bg,color:c.t,textTransform:"uppercase",letterSpacing:"0.03em"}}>{children}</span>;}
function Btn({children,v="primary",sz="md",icon:I,onClick,disabled,style:s}){const[h,sH]=useState(false);const base={display:"inline-flex",alignItems:"center",gap:6,border:"none",cursor:disabled?"not-allowed":"pointer",fontFamily:T.f,fontWeight:600,borderRadius:T.rs,transition:"all 0.22s cubic-bezier(0.16,1,0.3,1)",opacity:disabled?0.5:1,letterSpacing:"0.01em"};const szs={sm:{padding:"5px 12px",fontSize:"11px"},md:{padding:"9px 18px",fontSize:"12px"},lg:{padding:"12px 24px",fontSize:"13px"}};const vs={primary:{background:h?T.pH:T.p,color:T.pText||"#131313",boxShadow:h?`0 0 24px ${T.p}44,0 4px 12px ${T.p}22`:"none",transform:h?"translateY(-1px)":"none"},ghost:{background:h?"rgba(187,195,255,0.08)":"transparent",color:h?T.text:T.tm,border:"1px solid rgba(255,255,255,0.06)"},danger:{background:h?"rgba(255,180,171,0.18)":T.errD,color:T.err,border:`1px solid ${T.errD}`}};return <button onClick={onClick} disabled={disabled} onMouseEnter={()=>sH(true)} onMouseLeave={()=>sH(false)} style={{...base,...szs[sz],...vs[v],...s}}>{I&&<I size={sz==="sm"?12:14}/>}{children}</button>;}
function Inp({label,value,onChange,placeholder,mono,error,required,style:s,prefix,type="text"}){const[f,sF]=useState(false);return <div style={{display:"flex",flexDirection:"column",gap:4,...s}}>{label&&<label style={{fontSize:"10px",fontWeight:700,color:T.tm,letterSpacing:"0.05em",textTransform:"uppercase"}}>{label}{required&&<span style={{color:T.err}}>*</span>}</label>}<div style={{position:"relative"}}>{prefix&&<span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T.td,fontSize:"12px"}}>{prefix}</span>}<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} onFocus={()=>sF(true)} onBlur={()=>sF(false)} style={{padding:prefix?"9px 12px 9px 28px":"9px 12px",background:T.bgIn,border:`1px solid ${error?T.err:f?T.borderF:T.border}`,borderRadius:T.rs,color:T.text,fontSize:"13px",fontFamily:mono?T.fm:T.f,outline:"none",width:"100%",boxSizing:"border-box"}}/></div>{error&&<span style={{fontSize:"10px",color:T.err}}>{error}</span>}</div>;}
function Sel({label,value,onChange,options,required,style:s}){return <div style={{display:"flex",flexDirection:"column",gap:4,...s}}>{label&&<label style={{fontSize:"10px",fontWeight:700,color:T.tm,letterSpacing:"0.05em",textTransform:"uppercase"}}>{label}{required&&<span style={{color:T.err}}>*</span>}</label>}<select value={value} onChange={e=>onChange(e.target.value)} style={{padding:"9px 12px",background:T.bgIn,border:`1px solid ${T.border}`,borderRadius:T.rs,color:T.text,fontSize:"13px",fontFamily:T.f,outline:"none",cursor:"pointer",appearance:"none",width:"100%",boxSizing:"border-box"}}>{options.map(o=>typeof o==="string"?<option key={o} value={o}>{o}</option>:<option key={o.v} value={o.v}>{o.l}</option>)}</select></div>;}
function Modal({open,onClose,title,children,width=560}){if(!open)return null;return <div style={{position:"fixed",inset:0,zIndex:1e3,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.6)"}} onClick={onClose}><div onClick={e=>e.stopPropagation()} style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:T.r,width,maxWidth:"92vw",maxHeight:"88vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",borderBottom:`1px solid ${T.border}`}}><h3 style={{margin:0,fontSize:"15px",fontWeight:700,color:T.text}}>{title}</h3><button onClick={onClose} style={{background:"none",border:"none",color:T.tm,cursor:"pointer"}}><X size={16}/></button></div><div style={{padding:20}}>{children}</div></div></div>;}
function KPI({icon:I,label,value,sub,color=T.p}){return <div className="kpi-glass" style={{borderRadius:T.r,padding:"18px 20px",flex:1,minWidth:160}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{flex:1}}><p style={{margin:0,fontSize:"10px",color:T.tm,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",fontFamily:T.f}}>{label}</p><p style={{margin:"6px 0 0",fontSize:"24px",fontWeight:800,color:T.text,fontFamily:"'Manrope',sans-serif",letterSpacing:"-0.02em",lineHeight:1}}>{value}</p>{sub&&<p style={{margin:"4px 0 0",fontSize:"10px",color:T.tm,fontWeight:500}}>{sub}</p>}</div><div style={{width:38,height:38,borderRadius:"10px",background:`${color}18`,border:`1px solid ${color}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 0 16px ${color}22`}}><I size={17} style={{color}}/></div></div></div>;}

function Toggle({options,value,onChange,style:s}){return <div style={{display:"inline-flex",background:"rgba(255,255,255,0.03)",borderRadius:"100px",padding:4,gap:3,border:"1px solid rgba(255,255,255,0.07)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.04)",...s}}>{options.map(opt=>{const active=value===opt.v;return <button key={opt.v} onClick={()=>onChange(opt.v)} style={{padding:"7px 20px",borderRadius:"100px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:active?700:500,fontFamily:T.f,background:active?T.p:"transparent",color:active?"#131313":T.tm,transition:"all 0.25s cubic-bezier(0.16,1,0.3,1)",letterSpacing:"0.01em",boxShadow:active?`0 2px 14px ${T.p}50,inset 0 1px 0 rgba(255,255,255,0.2)`:"none"}}>{opt.l}</button>;})}</div>;}


/* ══════════════════════════════════════════════════════════════
   STORAGE — localStorage (works in Tauri WebView2 and browser)
   ══════════════════════════════════════════════════════════════ */
function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem("lionsolver_" + key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed !== null && parsed !== undefined) return parsed;
    }
  } catch (e) { /* ignore */ }
  return fallback;
}

function saveData(key, data) {
  try { localStorage.setItem("lionsolver_" + key, JSON.stringify(data)); } catch (e) { /* ignore */ }
}

function useDB() {
  const [empresas, setE] = useState(() => loadData("empresas", []));
  const [apuracoes, setA] = useState(() => loadData("apuracoes", []));

  useEffect(() => { saveData("empresas", empresas); }, [empresas]);
  useEffect(() => { saveData("apuracoes", apuracoes); }, [apuracoes]);

  const addE = useCallback(d => {
    const e = { ...d, id: genId(), ativa: true };
    setE(p => [...p, e]);
    return e;
  }, []);
  const updE = useCallback((id, d) => setE(p => p.map(e => e.id === id ? { ...e, ...d } : e)), []);
  const togE = useCallback(id => setE(p => p.map(e => e.id === id ? { ...e, ativa: !e.ativa } : e)), []);
  const delE = useCallback(id => setE(p => p.filter(e => e.id !== id)), []);
  const addA = useCallback(a => {
    const ap = { ...a, id: genId(), created_at: new Date().toISOString() };
    setA(p => [...p, ap]);
    return ap;
  }, []);
  const importData = useCallback((data) => {
    if (data.empresas) setE(data.empresas);
    if (data.apuracoes) setA(data.apuracoes);
  }, []);
  const clearAll = useCallback(() => {
    setE([]); setA([]);
    try { localStorage.removeItem("lionsolver_empresas"); localStorage.removeItem("lionsolver_apuracoes"); localStorage.removeItem("lionsolver_config"); } catch(e) {}
  }, []);

  return { empresas, apuracoes, addE, updE, togE, delE, addA, importData, clearAll };
}
/* ══════════════════════════════════════════════════════════════
   WIZARD DE APURAÇÃO
   ══════════════════════════════════════════════════════════════ */
function ApuracaoPage({db,navigate}){
  const[step,setStep]=useState(0);
  const[empId,setEmpId]=useState("");
  const[comp,setComp]=useState("2026-03");
  const[modoRBT,setModoRBT]=useState("simples");
  const[rbt12,setRbt12]=useState("");
  const[fs12,setFs12]=useState("");
  const[rbt12Meses,setRbt12Meses]=useState(Array(12).fill(""));
  const[fs12Meses,setFs12Meses]=useState(Array(12).fill(""));
  // Receitas: array of { anexo, subId, valor, issUF, issCidade }
  const[receitas,setReceitas]=useState([{anexo:"I",subId:"NORMAL",valor:"",issUF:"",issCidade:""}]);
  const[resultado,setResultado]=useState(null);

  const emp=db.empresas.find(e=>e.id===empId);
  const ativas=db.empresas.filter(e=>e.ativa);

  const addRec=()=>setReceitas(p=>[...p,{anexo:emp?.anexo||"I",subId:"NORMAL",valor:"",issUF:"",issCidade:""}]);
  const rmRec=i=>setReceitas(p=>p.filter((_,j)=>j!==i));
  const updRec=(i,k,v)=>setReceitas(p=>p.map((r,j)=>j===i?{...r,[k]:v}:r));

  // Get months labels for detailed RBT12 — respects company opening date
  const getMeses = () => {
    if (!comp) return [];
    const [y, m] = comp.split("-").map(Number);
    const ms = [];
    for (let i = 12; i >= 1; i--) {
      let mm = m - i, yy = y;
      while (mm <= 0) { mm += 12; yy--; }
      ms.push(`${yy}-${String(mm).padStart(2, "0")}`);
    }
    return ms;
  };

  // Check if a month is before company opening (should be disabled)
  const isMesAnteriorAbertura = (mesStr) => {
    if (!emp || !emp.abertura) return false;
    const ab = new Date(emp.abertura + "T00:00:00");
    const abMes = `${ab.getFullYear()}-${String(ab.getMonth() + 1).padStart(2, "0")}`;
    return mesStr < abMes;
  };

  // Count active months (from opening to competência)
  const getMesesAtivos = () => {
    return getMeses().filter(m => !isMesAnteriorAbertura(m)).length;
  };

  const getRBT12=()=>{
    if(modoRBT==="simples")return pM(rbt12);
    return rbt12Meses.reduce((s,v)=>s+pM(v),0);
  };
  const getFS12=()=>{
    if(modoRBT==="simples")return pM(fs12);
    return fs12Meses.reduce((s,v)=>s+pM(v),0);
  };

  const calcular=()=>{
    if(!emp)return;
    const rbt=getRBT12();
    const fs=getFS12();
    const fr=calcFatorR(fs,rbt);

    // Proporcionalização
    const prop=calcRBT12Proporcional(rbt,emp.abertura,comp);
    const rbt12Calc=prop.rbt12;

    // Benefício estadual
    const benUF=getICMSBeneficio(emp.uf,rbt12Calc);

    const resultados=[];
    let totalBruto=0;
    const alertas=[];

    for(const rec of receitas){
      const val=pM(rec.valor);
      if(val<=0)continue;
      let anexoKey=rec.anexo;
      if(anexoKey==="III/V")anexoKey=fr>=0.28?"III":"V";
      const sub=SUBSECOES[rec.anexo]?.find(s=>s.id===rec.subId);
      if(sub?.deduz?.includes("BASE")){continue;} // Devoluções reduzem base — handled separately

      const{ae,fx,an,pd}=calcAliqEfetiva(rbt12Calc,anexoKey);
      const valorBruto=val*ae;
      const ax=ANEXOS[anexoKey];

      // Build distribution
      const dist={};
      ax.tributos.forEach((t,ti)=>{
        let pct=ax.rep[fx][ti];
        let deduzido=false;
        // Apply deductions from subcategory (ST, monofásico, exportação)
        if(sub?.deduz?.includes(t)){pct=0;deduzido=true;}
        // Apply manual ICMS_UF deduction (subseção "Isenção/Redução Estadual")
        if(sub?.deduz?.includes("ICMS_UF")&&t==="ICMS"&&benUF.reducao>0){pct=0;deduzido=true;}
        // Apply automatic UF benefit — if state grants ICMS exemption, zero ICMS on ALL subcategories
        if(t==="ICMS"&&benUF.reducao>0&&!deduzido){pct=0;deduzido=true;}
        dist[t]={pct,valor:valorBruto*pct,deduzido};
      });

      const valorLiquido=Object.values(dist).reduce((s,d)=>s+d.valor,0);

      resultados.push({
        tipo:sub?.nome||"",anexo:anexoKey,anexoOrig:rec.anexo,
        receita:val,faixa:fx+1,an,pd,ae,valorBruto,valorLiquido,dist,
        issUF:rec.issUF,issCidade:rec.issCidade,issDomicilio:sub?.iss==="domicilio",
        issRetido:sub?.iss==="retido",
        valorISSRetido:sub?.iss==="retido"?(()=>{const issIdx=ax.tributos.indexOf("ISS");return issIdx>=0?val*ae*ax.rep[fx][issIdx]:0;})():0,
      });
      totalBruto+=valorLiquido;
    }

    // Devoluções
    const devs=receitas.filter(r=>SUBSECOES[r.anexo]?.find(s=>s.id===r.subId)?.deduz?.includes("BASE"));
    const totalDev=devs.reduce((s,r)=>s+pM(r.valor),0);

    const valorDAS=Math.max(0,totalBruto);

    if(rbt12Calc>3600000)alertas.push({sev:"critico",msg:"RBT12 ultrapassou sublimite R$ 3.600.000 — ICMS/ISS fora do Simples"});
    else if(rbt12Calc>3240000)alertas.push({sev:"aviso",msg:`RBT12 a ${fBRL(3600000-rbt12Calc)} do sublimite estadual`});
    if(rbt12Calc>4320000)alertas.push({sev:"critico",msg:`RBT12 a ${fBRL(4800000-rbt12Calc)} do limite de exclusão`});
    if(fr>=0.26&&fr<0.28)alertas.push({sev:"info",msg:`Fator r = ${fPct(fr)} — próximo do limiar de 28%`});
    if(prop.proporcional)alertas.push({sev:"info",msg:`RBT12 proporcionalizada: ${fBRL(prop.rbt12Real)} real → ${fBRL(prop.rbt12)} proporcional (${prop.meses} meses) — ${prop.base}`});
    if(benUF.reducao>0){
      let msg=`Benefício ICMS ${emp.uf}: isenção aplicada (${benUF.reducao===1?"100%":fPct(benUF.reducao)}) — ${benUF.base}`;
      if(benUF.reqME)msg+=` (válido apenas para ME)`;
      alertas.push({sev:"info",msg});
    }
    if(benUF.alertaReducao)alertas.push({sev:"aviso",msg:`${benUF.nota}`});
    if(benUF.reducao===0&&BENEFICIOS_UF[emp.uf]&&!benUF.alertaReducao){
      alertas.push({sev:"info",msg:`${emp.uf} possui benefício ICMS, mas RBT12 de ${fBRL(rbt12Calc)} excede o limite de ${fBRL(benUF.limiteRBT12)} — ${benUF.base}`});
    }

    setResultado({resultados,rbt12:rbt12Calc,rbt12Real:prop.rbt12Real||rbt12Calc,fs12:fs,fatorR:fr,totalBruto,totalDev,valorDAS,alertas,prop,benUF,
      // Quadro de alíquotas: use anexos from receitas (actual) or empresa cadastro
      quadroAliquotas: (()=>{
        // Collect unique anexos: from receitas of this apuração, or from empresa cadastro
        const anexosReceitas=[...new Set(receitas.filter(r=>pM(r.valor)>0).map(r=>{
          let ak=r.anexo; if(ak==="III/V")ak=fr>=0.28?"III":"V"; return ak;
        }))];
        const anexosEmpresa=(emp.anexos||[emp.anexo||"I"]).map(a=>{
          if(a==="III/V")return fr>=0.28?"III":"V"; return a;
        });
        const anexosUnicos=[...new Set([...anexosReceitas,...anexosEmpresa])];

        // Current period RBT12
        const receitaMesAtual=receitas.filter(r=>pM(r.valor)>0).reduce((s,r)=>s+pM(r.valor),0);
        // Next period: RBT12 shifts (add current month, conceptually remove 13th month back)
        const rbt12Prox=rbt12Calc+receitaMesAtual; // Simplified estimate

        return anexosUnicos.map(ak=>{
          const ax=ANEXOS[ak]; if(!ax)return null;
          const cur=calcAliqEfetiva(rbt12Calc,ak);
          const prox=calcAliqEfetiva(rbt12Prox,ak);
          // ICMS % within the effective rate
          const icmsIdx=ax.tributos.indexOf("ICMS");
          const issIdx=ax.tributos.indexOf("ISS");
          const icmsPctCur=icmsIdx>=0?cur.ae*ax.rep[cur.fx][icmsIdx]:0;
          const icmsPctProx=icmsIdx>=0?prox.ae*ax.rep[prox.fx][icmsIdx]:0;
          const issPctCur=issIdx>=0?cur.ae*ax.rep[cur.fx][issIdx]:0;
          const issPctProx=issIdx>=0?prox.ae*ax.rep[prox.fx][issIdx]:0;
          return{
            anexo:ak, nomeAnexo:ax.nome,
            atual:{aliqNom:cur.an,aliqEf:cur.ae,faixa:cur.fx+1,pd:cur.pd,icms:icmsPctCur,iss:issPctCur},
            proximo:{aliqNom:prox.an,aliqEf:prox.ae,faixa:prox.fx+1,pd:prox.pd,icms:icmsPctProx,iss:issPctProx,rbt12Est:rbt12Prox},
          };
        }).filter(Boolean);
      })(),
    });
    setStep(3);
  };

  const salvar = () => {
    // Save with FULL monthly breakdown (all 12 months of RBT12 + FS12)
    const meses = getMeses();
    const rbt12Detalhado = {};
    const fs12Detalhado = {};
    meses.forEach((m, i) => {
      if (!isMesAnteriorAbertura(m)) {
        const rv = modoRBT === "detalhado" ? pM(rbt12Meses[i]) : 0;
        const fv = modoRBT === "detalhado" ? pM(fs12Meses[i]) : 0;
        if (rv > 0) rbt12Detalhado[m] = rv;
        if (fv > 0) fs12Detalhado[m] = fv;
      }
    });
    // Also save the current month's revenue from receitas
    const receitaTotalMes = receitas.filter(r => pM(r.valor) > 0).reduce((s, r) => s + pM(r.valor), 0);

    db.addA({
      empresa_id: empId,
      empresa_nome: emp?.fantasia || emp?.razao,
      competencia: comp,
      receitaMes: receitaTotalMes,
      rbt12Detalhado,
      fs12Detalhado,
      ...resultado,
      status: "finalizado"
    });
    navigate("historico");
  };

  // Auto-fill from history: find the most recent apuração for this empresa
  // and pull its full monthly breakdown, shifting the window forward
  const preencherDoHistorico = () => {
    if (!empId || !comp) return 0;
    const meses = getMeses();
    const newRbt = Array(12).fill("");
    const newFs = Array(12).fill("");
    let filled = 0;

    // Collect ALL monthly data from ALL past apurações of this empresa
    const historicoMensal = {};
    const historicoFS = {};
    db.apuracoes
      .filter(a => a.empresa_id === empId)
      .forEach(a => {
        // From the full breakdown saved in the apuração
        if (a.rbt12Detalhado) {
          Object.entries(a.rbt12Detalhado).forEach(([m, v]) => { historicoMensal[m] = v; });
        }
        if (a.fs12Detalhado) {
          Object.entries(a.fs12Detalhado).forEach(([m, v]) => { historicoFS[m] = v; });
        }
        // Also use receitaMes for the apuração's own competência
        if (a.receitaMes && a.competencia) {
          historicoMensal[a.competencia] = a.receitaMes;
        }
      });

    // Fill each month from the collected history
    meses.forEach((m, i) => {
      if (isMesAnteriorAbertura(m)) return;
      if (historicoMensal[m] !== undefined && !newRbt[i]) {
        newRbt[i] = String(historicoMensal[m]);
        filled++;
      }
      if (historicoFS[m] !== undefined && !newFs[i]) {
        newFs[i] = String(historicoFS[m]);
      }
    });

    setRbt12Meses(newRbt);
    setFs12Meses(newFs);
    return filled;
  };

  const steps=["Empresa e Receitas","RBT12 e FS12","Resultado"];

  return <div>
    <h1 style={{fontSize:"28px",fontWeight:800,color:T.text,margin:"0 0 5px",fontFamily:"'Manrope',sans-serif",letterSpacing:"-0.03em",lineHeight:1.15}}>Nova Apuração</h1>
    <p style={{color:T.tm,fontSize:"13px",margin:"0 0 24px",fontWeight:500}}>Apuração mensal com subseções de receita e deduções integradas</p>

    {/* Stepper */}
    <div style={{display:"flex",gap:6,marginBottom:28}}>
      {steps.map((t,i)=><div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
        <div className="stepper-bar" style={{width:"100%",height:3,borderRadius:2,background:i<step?`linear-gradient(90deg,${T.p},${T.ok})`:i===step?T.p:"rgba(255,255,255,0.08)",boxShadow:i<=step?`0 0 8px ${T.p}44`:undefined}}/>
        <span style={{fontSize:"10px",fontWeight:i===step?700:500,color:i<step?T.ok:i===step?T.p:T.td,transition:"color 0.3s",letterSpacing:"0.03em"}}>{t}</span>
      </div>)}
    </div>

    <div className="card-glass" style={{borderRadius:T.r,padding:24}}>

      {/* ═══ STEP 0: Empresa + Receitas ═══ */}
      {step===0&&<div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14,marginBottom:20}}>
          <Sel label="Empresa" value={empId} onChange={v=>{setEmpId(v);const e=db.empresas.find(x=>x.id===v);if(e)setReceitas([{anexo:e.anexo,subId:"NORMAL",valor:"",issUF:"",issCidade:""}]);}} required options={[{v:"",l:"Selecione..."},...ativas.map(e=>({v:e.id,l:`${e.fantasia||e.razao} — ${e.cnpj}`}))]}/>
          <Inp label="Competência" value={comp} onChange={setComp} type="month" required/>
        </div>

        {empId&&<>
          <h4 style={{fontSize:"12px",fontWeight:700,color:T.tm,textTransform:"uppercase",letterSpacing:"0.05em",margin:"0 0 12px"}}>Receitas do Mês — Segregadas por Subseção</h4>

          {receitas.map((rec,i)=>{
            const anexoKey=rec.anexo==="III/V"?"III/V":rec.anexo;
            const subs=SUBSECOES[anexoKey]||SUBSECOES[rec.anexo]||[];
            const sub=subs.find(s=>s.id===rec.subId);
            const needsMunicipio=sub?.iss==="outro";

            return <div key={i} style={{padding:14,background:T.bgIn,borderRadius:T.rs,marginBottom:10,border:`1px solid ${T.border}`}}>
              <div style={{display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap"}}>
                <Sel label={i===0?"Anexo":""} value={rec.anexo} onChange={v=>{updRec(i,"anexo",v);updRec(i,"subId","NORMAL");}} options={ANEXO_OPTS} style={{minWidth:180}}/>
                <Sel label={i===0?"Subseção":""} value={rec.subId} onChange={v=>updRec(i,"subId",v)} options={subs.map(s=>({v:s.id,l:s.nome}))} style={{flex:2,minWidth:200}}/>
                <Inp label={i===0?"Valor (R$)":""} value={rec.valor} onChange={v=>updRec(i,"valor",v)} placeholder="0,00" mono prefix="R$" style={{flex:1,minWidth:130}}/>
                {receitas.length>1&&<Btn v="danger" sz="sm" icon={X} onClick={()=>rmRec(i)}/>}
              </div>

              {/* ISS outro município */}
              {needsMunicipio&&<div style={{display:"flex",gap:10,marginTop:10,paddingTop:10,borderTop:`1px solid ${T.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <MapPin size={13} style={{color:T.i}}/>
                  <span style={{fontSize:"11px",color:T.i,fontWeight:600}}>ISS devido a:</span>
                </div>
                <Sel label="" value={rec.issUF} onChange={v=>{updRec(i,"issUF",v);updRec(i,"issCidade","");}} options={[{v:"",l:"UF..."},...UFS.map(u=>({v:u,l:u}))]} style={{width:80}}/>
                {rec.issUF&&<Sel label="" value={rec.issCidade} onChange={v=>updRec(i,"issCidade",v)} options={[{v:"",l:"Município..."},...(MUNICIPIOS_POR_UF[rec.issUF]||[]).map(c=>({v:c,l:c}))]} style={{flex:1,minWidth:160}}/>}
              </div>}

              {/* Badge de deduções */}
              {sub&&sub.deduz.length>0&&sub.deduz[0]!=="BASE"&&<div style={{marginTop:8}}>
                <span style={{fontSize:"10px",color:T.tm}}>Deduções automáticas: </span>
                {sub.deduz.map(d=><Badge key={d} color="warning">{d==="ICMS_UF"?"ICMS (benef. UF)":d}</Badge>)}
              </div>}
              {sub?.deduz?.includes("BASE")&&<div style={{marginTop:8}}><Badge color="danger">Reduz base de cálculo</Badge></div>}
            </div>;
          })}

          <Btn v="ghost" sz="sm" icon={Plus} onClick={addRec} style={{marginTop:4}}>Adicionar subseção</Btn>
        </>}

        <div style={{display:"flex",justifyContent:"flex-end",marginTop:20}}>
          <Btn icon={ChevronRight} onClick={()=>setStep(1)} disabled={!empId||receitas.every(r=>!r.valor)}>Próximo</Btn>
        </div>
      </div>}

      {/* ═══ STEP 1: RBT12 + FS12 ═══ */}
      {step===1&&<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12}}>
          <div>
            <h3 style={{fontSize:"15px",fontWeight:700,color:T.text,margin:"0 0 3px"}}>RBT12 e Folha de Salários (FS12)</h3>
            <p style={{fontSize:"12px",color:T.tm,margin:0}}>Receita bruta acumulada dos 12 meses anteriores à competência</p>
          </div>
          <Toggle
            options={[{v:"simples",l:"Simplificado"},{v:"detalhado",l:"Detalhado — 12 meses"}]}
            value={modoRBT}
            onChange={v=>{setModoRBT(v);if(v==="detalhado")setTimeout(()=>preencherDoHistorico(),50);}}
          />
        </div>

        {modoRBT==="simples"?<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <Inp label="RBT12 (R$)" value={rbt12} onChange={setRbt12} placeholder="0,00" mono required prefix="R$"/>
          <Inp label="FS12 — Folha de Salários (R$)" value={fs12} onChange={setFs12} placeholder="0,00" mono prefix="R$"/>
        </div>:
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div>
              <p style={{fontSize:"11px",color:T.tm,margin:0}}>Preencha mês a mês. Meses anteriores à abertura da empresa ficam desabilitados.</p>
              {emp && emp.abertura && <p style={{fontSize:"10px",color:T.i,margin:"2px 0 0"}}>Abertura: {emp.abertura} — {getMesesAtivos()} meses de atividade</p>}
            </div>
            <Btn v="ghost" sz="sm" icon={History} onClick={() => { const n = preencherDoHistorico(); alert(n > 0 ? `${n} meses preenchidos do histórico de apurações.` : "Nenhuma apuração anterior encontrada para esta empresa."); }}>Puxar do Histórico</Btn>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
            {getMeses().map((m,i) => {
              const disabled = isMesAnteriorAbertura(m);
              const [yy,mm] = m.split("-");
              const monthNames = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
              const mlabel = `${monthNames[parseInt(mm)-1]} ${yy}`;
              return <div key={m} className={`month-cell${disabled?" month-disabled":""}`}>
              <span className="month-cell-label">{mlabel}{disabled&&<span style={{marginLeft:4,color:T.err,fontSize:"9px"}}>✕</span>}</span>
              <input className="month-cell-input" value={disabled?"":rbt12Meses[i]} onChange={e=>{if(disabled)return;const a=[...rbt12Meses];a[i]=e.target.value;setRbt12Meses(a);}} placeholder={disabled?"—":"Receita R$"} disabled={disabled}/>
              <input className="month-cell-input" value={disabled?"":fs12Meses[i]} onChange={e=>{if(disabled)return;const a=[...fs12Meses];a[i]=e.target.value;setFs12Meses(a);}} placeholder={disabled?"—":"Folha R$"} disabled={disabled}/>
            </div>;})}
          </div>
          <div style={{display:"flex",gap:24,marginTop:14,padding:"12px 16px",background:"linear-gradient(135deg,rgba(187,195,255,0.07),rgba(0,218,243,0.05))",borderRadius:T.rs,border:"1px solid rgba(255,255,255,0.07)",flexWrap:"wrap",alignItems:"center"}}>
            <span style={{fontSize:"12px",color:T.tm}}>RBT12: <strong style={{color:T.p,fontFamily:T.fm,fontSize:"13px"}}>{fBRL(rbt12Meses.reduce((s,v)=>s+pM(v),0))}</strong></span>
            <span style={{fontSize:"12px",color:T.tm}}>FS12: <strong style={{color:T.text,fontFamily:T.fm,fontSize:"13px"}}>{fBRL(fs12Meses.reduce((s,v)=>s+pM(v),0))}</strong></span>
            <span style={{fontSize:"12px",color:T.tm}}>Meses ativos: <strong style={{color:T.i,fontFamily:T.fm}}>{getMesesAtivos()}</strong></span>
          </div>
        </div>}

        {/* Proporcionalização alert */}
        {emp&&emp.abertura&&getRBT12()>0&&calcRBT12Proporcional(getRBT12(),emp.abertura,comp).proporcional&&<div style={{marginTop:12,padding:"10px 14px",background:T.iD,borderRadius:T.rs,fontSize:"12px",color:T.i}}>
          <TriangleAlert size={13} style={{display:"inline",marginRight:6}}/>
          <strong>RBT12 Proporcionalizada:</strong> Empresa com menos de 12 meses de atividade (abertura: {emp.abertura}). A RBT12 será ajustada automaticamente no cálculo. Base: LC 123/2006 Art.3º §2º
        </div>}

        {/* Fator r preview */}
        {getRBT12()>0&&getFS12()>0&&<div style={{marginTop:12,padding:"10px 14px",background:T.pD,borderRadius:T.rs,display:"flex",gap:16,alignItems:"center"}}>
          <span style={{fontSize:"12px",color:T.tm}}>Fator r =</span>
          <span style={{fontSize:"18px",fontWeight:800,fontFamily:T.fm,color:T.p}}>{fPct(calcFatorR(getFS12(),getRBT12()))}</span>
          <Badge color={calcFatorR(getFS12(),getRBT12())>=0.28?"success":"warning"}>{calcFatorR(getFS12(),getRBT12())>=0.28?"→ Anexo III":"→ Anexo V"}</Badge>
        </div>}

        <div style={{display:"flex",justifyContent:"space-between",marginTop:20}}>
          <Btn v="ghost" icon={ChevronLeft} onClick={()=>setStep(0)}>Voltar</Btn>
          <Btn icon={Calculator} onClick={calcular} disabled={getRBT12()<=0}>Calcular DAS</Btn>
        </div>
      </div>}

      {/* ═══ STEP 2: Resultado ═══ */}
      {step===3&&resultado&&<div>
        <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
          <KPI icon={DollarSign} label="DAS a Recolher" value={fBRL(resultado.valorDAS)} color={T.ok}/>
          <KPI icon={Calculator} label="RBT12" value={fBRL(resultado.rbt12)} sub={resultado.prop?.proporcional?`Proporcional (${resultado.prop.meses}m)`:undefined}/>
          <KPI icon={TrendingUp} label="Fator r" value={fPct(resultado.fatorR)} sub={resultado.fatorR>=0.28?"→ Anexo III":"→ Anexo V"} color={resultado.fatorR>=0.28?T.ok:T.w}/>
        </div>

        {/* Alertas */}
        {resultado.alertas.map((a,i)=><div key={i} style={{padding:"8px 12px",marginBottom:6,borderRadius:T.rs,background:a.sev==="critico"?T.errD:a.sev==="aviso"?T.wD:T.iD,display:"flex",gap:6,alignItems:"center"}}>
          <TriangleAlert size={12} style={{color:a.sev==="critico"?T.err:a.sev==="aviso"?T.w:T.i,flexShrink:0}}/>
          <span style={{fontSize:"11px",color:a.sev==="critico"?T.err:a.sev==="aviso"?T.w:T.i}}>{a.msg}</span>
        </div>)}

        {/* Memória de cálculo */}
        <h4 style={{fontSize:"11px",fontWeight:700,color:T.tm,textTransform:"uppercase",margin:"16px 0 8px"}}>Memória de Cálculo</h4>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:"11px"}}>
            <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
              {["Subseção","Anexo","Faixa","Receita","Alíq.Ef.","Valor","ISS Município"].map(h=><th key={h} style={{padding:"7px 8px",fontSize:"9px",fontWeight:700,color:T.td,textTransform:"uppercase",textAlign:"left"}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {resultado.resultados.map((r,i)=><tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:"8px",fontWeight:600,color:T.text,maxWidth:180}}>{r.tipo}{r.anexo!==r.anexoOrig&&<span style={{fontSize:"9px",color:T.i,marginLeft:4}}>via Fator r</span>}</td>
                <td style={{padding:"8px"}}><Badge>{r.anexo}</Badge></td>
                <td style={{padding:"8px",fontFamily:T.fm,color:T.tm}}>{r.faixa}ª</td>
                <td style={{padding:"8px",fontFamily:T.fm}}>{fBRL(r.receita)}</td>
                <td style={{padding:"8px",fontFamily:T.fm,color:T.p,fontWeight:700}}>{fPct(r.ae)}</td>
                <td style={{padding:"8px",fontFamily:T.fm,fontWeight:700}}>{fBRL(r.valorLiquido)}</td>
                <td style={{padding:"8px",fontSize:"10px",color:T.tm}}>
                  {r.issDomicilio?<span>{emp?.cidade}/{emp?.uf}</span>:
                   r.issCidade?<span style={{color:T.i}}>{r.issCidade}/{r.issUF}</span>:"—"}
                </td>
              </tr>)}
            </tbody>
          </table>
        </div>

        {/* Distribuição por tributo */}
        <h4 style={{fontSize:"11px",fontWeight:700,color:T.tm,textTransform:"uppercase",margin:"16px 0 8px"}}>Distribuição por Tributo</h4>
        {resultado.resultados.map((r,i)=><div key={i} style={{marginBottom:14}}>
          <p style={{fontSize:"11px",color:T.tm,margin:"0 0 6px"}}>{r.tipo} — Anexo {r.anexo}</p>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {Object.entries(r.dist).map(([t,{pct,valor,deduzido}])=>{
              const dedLabel=deduzido&&valor===0?(t==="ICMS"?(r.tipo.includes("ST")?"Recolhido ant.":"Isento/Reduzido"):(t==="ISS"?"Retido pelo tomador":"Recolhido ant.")):"";
              return <div key={t} style={{background:deduzido?T.errD:T.bgIn,borderRadius:T.rs,padding:"6px 10px",minWidth:80}}>
              <p style={{margin:0,fontSize:"9px",color:T.td,fontWeight:700,textTransform:"uppercase"}}>{t}</p>
              <p style={{margin:"1px 0 0",fontSize:"12px",fontWeight:700,fontFamily:T.fm,color:deduzido?T.err:valor>0?T.text:T.td}}>{dedLabel||fBRL(valor)}</p>
              <p style={{margin:0,fontSize:"9px",fontFamily:T.fm,color:T.tm}}>{fPct(pct)}</p>
            </div>;})}
          </div>
        </div>)}

        {/* ISS Retido pelo tomador */}
        {resultado.resultados.some(r=>r.issRetido&&r.valorISSRetido>0)&&<>
          <h4 style={{fontSize:"11px",fontWeight:700,color:T.tm,textTransform:"uppercase",margin:"16px 0 8px"}}>ISS a ser Recolhido pelo Tomador</h4>
          <div style={{background:T.wD,borderRadius:T.r,padding:"10px 14px",marginBottom:8}}>
            {resultado.resultados.filter(r=>r.issRetido&&r.valorISSRetido>0).map((r,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:i<resultado.resultados.filter(x=>x.issRetido).length-1?`1px solid ${T.border}`:"none"}}>
              <span style={{fontSize:"12px",color:T.text}}>{r.tipo} — {fBRL(r.receita)}</span>
              <span style={{fontSize:"14px",fontWeight:700,fontFamily:T.fm,color:T.w}}>ISS Retido: {fBRL(r.valorISSRetido)}</span>
            </div>)}
          </div>
        </>}

        {/* Quadro de Alíquotas */}
        {resultado.quadroAliquotas&&resultado.quadroAliquotas.length>0&&<>
          <h4 style={{fontSize:"11px",fontWeight:700,color:T.tm,textTransform:"uppercase",margin:"16px 0 8px"}}>Quadro de Alíquotas (Período Atual e Seguinte)</h4>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:"11px"}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                <th style={{padding:"7px 8px",fontSize:"9px",fontWeight:700,color:T.td,textTransform:"uppercase",textAlign:"left"}} rowSpan={2}>Anexo</th>
                <th style={{padding:"7px 8px",fontSize:"9px",fontWeight:700,color:T.p,textTransform:"uppercase",textAlign:"center",borderBottom:`1px solid ${T.border}`}} colSpan={4}>Período Atual</th>
                <th style={{padding:"7px 8px",fontSize:"9px",fontWeight:700,color:T.i,textTransform:"uppercase",textAlign:"center",borderBottom:`1px solid ${T.border}`}} colSpan={4}>Período Seguinte (estimativa)</th>
              </tr>
              <tr style={{borderBottom:`1px solid ${T.border}`}}>
                {["Alíq.Nom.","Alíq.Ef.","ICMS (créd.)","ISS","Alíq.Nom.","Alíq.Ef.","ICMS (créd.)","ISS"].map((h,i)=><th key={i} style={{padding:"5px 8px",fontSize:"8px",fontWeight:600,color:T.td,textTransform:"uppercase",textAlign:"center"}}>{h}</th>)}
              </tr></thead>
              <tbody>{resultado.quadroAliquotas.map((q,i)=><tr key={i} style={{borderBottom:`1px solid ${T.border}`}}>
                <td style={{padding:"8px",fontWeight:600,color:T.text}}><Badge>{q.anexo}</Badge> <span style={{fontSize:"10px",color:T.tm,marginLeft:4}}>{q.nomeAnexo}</span></td>
                <td style={{padding:"8px",fontFamily:T.fm,textAlign:"center"}}>{fPct(q.atual.aliqNom)}</td>
                <td style={{padding:"8px",fontFamily:T.fm,textAlign:"center",fontWeight:700,color:T.p}}>{fPct(q.atual.aliqEf)}</td>
                <td style={{padding:"8px",fontFamily:T.fm,textAlign:"center",color:q.atual.icms>0?T.ok:T.td}}>{q.atual.icms>0?fPct(q.atual.icms):"—"}</td>
                <td style={{padding:"8px",fontFamily:T.fm,textAlign:"center",color:q.atual.iss>0?T.i:T.td}}>{q.atual.iss>0?fPct(q.atual.iss):"—"}</td>
                <td style={{padding:"8px",fontFamily:T.fm,textAlign:"center"}}>{fPct(q.proximo.aliqNom)}</td>
                <td style={{padding:"8px",fontFamily:T.fm,textAlign:"center",fontWeight:700,color:T.i}}>{fPct(q.proximo.aliqEf)}</td>
                <td style={{padding:"8px",fontFamily:T.fm,textAlign:"center",color:q.proximo.icms>0?T.ok:T.td}}>{q.proximo.icms>0?fPct(q.proximo.icms):"—"}</td>
                <td style={{padding:"8px",fontFamily:T.fm,textAlign:"center",color:q.proximo.iss>0?T.i:T.td}}>{q.proximo.iss>0?fPct(q.proximo.iss):"—"}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <p style={{fontSize:"10px",color:T.td,margin:"6px 0 0",fontStyle:"italic"}}>ICMS (créd.) = alíquota de ICMS dentro do Simples para fins de crédito (Art. 23 LC 123). ISS = alíquota para informar na NFS-e. Período seguinte estimado com RBT12 de {fBRL(resultado.quadroAliquotas[0]?.proximo?.rbt12Est||0)}.</p>
        </>}

        {/* Resumo final */}
        <div style={{marginTop:20,padding:"18px 22px",background:"linear-gradient(135deg,rgba(187,195,255,0.08),rgba(0,218,243,0.06))",borderRadius:T.r,border:"1px solid rgba(255,255,255,0.08)",display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.06)"}}>
          <div>
            <p style={{margin:0,fontSize:"10px",color:T.tm,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>Total bruto</p>
            <p style={{margin:"4px 0 0",fontSize:"16px",fontFamily:T.fm,color:T.text,fontWeight:600}}>{fBRL(resultado.totalBruto)}</p>
          </div>
          <div style={{textAlign:"right"}}>
            <p style={{margin:0,fontSize:"10px",color:T.tm,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em"}}>DAS a recolher</p>
            <p className="das-value" style={{margin:"4px 0 0",fontSize:"30px",fontWeight:800,fontFamily:T.fm,letterSpacing:"-0.02em"}}>{fBRL(resultado.valorDAS)}</p>
          </div>
        </div>

        <div style={{display:"flex",justifyContent:"space-between",marginTop:20,flexWrap:"wrap",gap:8}}>
          <Btn v="ghost" icon={ChevronLeft} onClick={()=>setStep(1)}>Ajustar</Btn>
          <div style={{display:"flex",gap:8}}>
            <Btn v="ghost" icon={FileText} onClick={()=>gerarPDF(resultado,emp,comp)}>Gerar PDF</Btn>
            <Btn v="ghost" icon={BarChart3Fallback} onClick={()=>gerarXLSX(resultado,emp,comp)}>Exportar XLSX</Btn>
            <Btn icon={Check} onClick={salvar}>Finalizar e Salvar</Btn>
          </div>
        </div>
      </div>}
    </div>
  </div>;
}

/* ══════════════════════════════════════════════════════════════
   OUTRAS PÁGINAS
   ══════════════════════════════════════════════════════════════ */
function DashboardPage({db, navigate, config}) {
  const [empresaFiltro, setEmpresaFiltro] = useState("todas");
  const ativas = db.empresas.filter(e => e.ativa);
  const apuracoesFiltradas = empresaFiltro === "todas" ? db.apuracoes : db.apuracoes.filter(a => a.empresa_id === empresaFiltro);
  const ativasFiltradas = empresaFiltro === "todas" ? ativas : ativas.filter(e => e.id === empresaFiltro);

  const totalDas = apuracoesFiltradas.reduce((s, a) => s + a.valorDAS, 0);
  const recentes = [...apuracoesFiltradas].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);

  // DAS by month for chart
  const dasPorMes = {};
  apuracoesFiltradas.forEach(a => { dasPorMes[a.competencia] = (dasPorMes[a.competencia] || 0) + a.valorDAS; });
  const mesesChart = Object.keys(dasPorMes).sort().slice(-6);
  const maxDas = Math.max(...mesesChart.map(m => dasPorMes[m]), 1);

  // DAS by empresa
  const dasPorEmp = {};
  apuracoesFiltradas.forEach(a => { dasPorEmp[a.empresa_nome] = (dasPorEmp[a.empresa_nome] || 0) + a.valorDAS; });
  const empChart = Object.entries(dasPorEmp).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxEmpDas = Math.max(...empChart.map(e => e[1]), 1);

  // Pending apurações (empresas ativas sem apuração no mês atual)
  const mesAtual = "2026-03";
  const empComApuracao = new Set(apuracoesFiltradas.filter(a => a.competencia === mesAtual).map(a => a.empresa_id));
  const pendentes = ativasFiltradas.filter(e => !empComApuracao.has(e.id));

  // Alertas from filtered apurações
  const alertasRecentes = apuracoesFiltradas.flatMap(a => (a.alertas || []).map(al => ({...al, emp: a.empresa_nome, comp: a.competencia}))).slice(0, 4);

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
      <div>
        <h1 style={{fontSize:"28px",fontWeight:800,color:T.text,margin:"0 0 4px",fontFamily:"'Manrope',sans-serif",letterSpacing:"-0.03em",lineHeight:1.15}}>Dashboard</h1>
        <p style={{color:T.tm,fontSize:"13px",margin:0,fontWeight:500}}>{config.escritorio || "LionSolver"} <span style={{color:T.td,margin:"0 4px"}}>·</span> Março 2026</p>
      </div>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <Sel value={empresaFiltro} onChange={setEmpresaFiltro} options={[{v:"todas",l:"Todas as empresas"},...ativas.map(e => ({v:e.id,l:e.fantasia||e.razao}))]} style={{minWidth:190}}/>
        <Btn icon={ChevronRight} onClick={() => navigate("apuracao")}>Nova Apuração</Btn>
      </div>
    </div>

    {/* KPIs */}
    <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:22}}>
      <KPI icon={Building2} label="Empresas Ativas" value={ativasFiltradas.length} sub={`${db.empresas.length} cadastradas`}/>
      <KPI icon={DollarSign} label="DAS Total Apurado" value={fBRL(totalDas)} color={T.ok}/>
      <KPI icon={Calculator} label="Apurações" value={apuracoesFiltradas.length} sub="finalizadas" color={T.i}/>
      <KPI icon={TriangleAlert} label="Pendentes (03/2026)" value={pendentes.length} sub={pendentes.length > 0 ? "empresas sem apuração" : "tudo em dia"} color={pendentes.length > 0 ? T.w : T.ok}/>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
      {/* DAS mensal chart */}
      <div className="card-glass" style={{borderRadius:T.r,padding:"20px 24px"}}>
        <h3 className="section-label" style={{color:T.tm,margin:"0 0 18px"}}>DAS Mensal</h3>
        {mesesChart.length === 0 ? <p style={{fontSize:"12px",color:T.td,textAlign:"center",padding:"24px 0"}}>Nenhuma apuração ainda</p> :
        <div style={{display:"flex",alignItems:"flex-end",gap:10,height:130}}>
          {mesesChart.map(m => {
            const h = (dasPorMes[m] / maxDas) * 100;
            const label = m.split("-").reverse().join("/");
            return <div key={m} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
              <span style={{fontSize:"9px",fontFamily:T.fm,color:T.tm,textAlign:"center"}}>{fBRL(dasPorMes[m])}</span>
              <div className="chart-bar" style={{width:"100%",height:`${h}%`,minHeight:5,background:`linear-gradient(180deg,${T.p},${T.p}55)`,borderRadius:"5px 5px 3px 3px",boxShadow:`0 0 14px ${T.p}40`}}/>
              <span style={{fontSize:"9px",color:T.td,fontFamily:T.fm}}>{label}</span>
            </div>;
          })}
        </div>}
      </div>

      {/* DAS por empresa */}
      <div className="card-glass" style={{borderRadius:T.r,padding:"20px 24px"}}>
        <h3 className="section-label" style={{color:T.tm,margin:"0 0 18px"}}>DAS por Empresa</h3>
        {empChart.length === 0 ? <p style={{fontSize:"12px",color:T.td,textAlign:"center",padding:"24px 0"}}>Nenhuma apuração ainda</p> :
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {empChart.map(([nome, val]) => (
            <div key={nome}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:"12px",color:T.text,fontWeight:600,fontFamily:"'Manrope',sans-serif"}}>{nome}</span>
                <span style={{fontSize:"12px",fontFamily:T.fm,color:T.ok,fontWeight:700}}>{fBRL(val)}</span>
              </div>
              <div style={{width:"100%",height:5,background:"rgba(255,255,255,0.06)",borderRadius:3}}>
                <div style={{width:`${(val/maxEmpDas)*100}%`,height:"100%",background:`linear-gradient(90deg,${T.ok},${T.ok}88)`,borderRadius:3,boxShadow:`0 0 8px ${T.ok}40`}}/>
              </div>
            </div>
          ))}
        </div>}
      </div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      {/* Apurações recentes */}
      <div className="card-glass" style={{borderRadius:T.r,overflow:"hidden"}}>
        <div style={{padding:"14px 20px",borderBottom:`1px solid rgba(255,255,255,0.05)`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h3 className="section-label" style={{color:T.tm,margin:0}}>Apurações Recentes</h3>
          <Btn v="ghost" sz="sm" onClick={() => navigate("historico")}>Ver todas</Btn>
        </div>
        {recentes.length === 0 ? <p style={{fontSize:"12px",color:T.td,textAlign:"center",padding:24}}>Nenhuma</p> :
        recentes.map((a, i) => (
          <div key={a.id} className="hover-row" style={{padding:"11px 20px",borderBottom:i < recentes.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <p style={{margin:0,fontSize:"12px",fontWeight:700,color:T.text,fontFamily:"'Manrope',sans-serif"}}>{a.empresa_nome}</p>
              <p style={{margin:"2px 0 0",fontSize:"10px",color:T.tm,fontFamily:T.fm}}>{a.competencia.split("-").reverse().join("/")}</p>
            </div>
            <span style={{fontSize:"14px",fontWeight:800,fontFamily:T.fm,color:T.ok,letterSpacing:"-0.01em"}}>{fBRL(a.valorDAS)}</span>
          </div>
        ))}
      </div>

      {/* Pendentes + Alertas */}
      <div className="card-glass" style={{borderRadius:T.r,overflow:"hidden"}}>
        <div style={{padding:"14px 20px",borderBottom:`1px solid rgba(255,255,255,0.05)`}}>
          <h3 className="section-label" style={{color:T.tm,margin:0}}>Pendentes e Alertas</h3>
        </div>
        {pendentes.length > 0 && pendentes.slice(0, 3).map(e => (
          <div key={e.id} style={{padding:"8px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",gap:8,alignItems:"center"}}>
            <div style={{width:6,height:6,borderRadius:3,background:T.w,flexShrink:0}}/>
            <span style={{fontSize:"11px",color:T.text}}>{e.fantasia || e.razao}</span>
            <span style={{fontSize:"10px",color:T.tm,marginLeft:"auto"}}>sem apuração 03/2026</span>
          </div>
        ))}
        {alertasRecentes.map((a, i) => (
          <div key={i} style={{padding:"8px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",gap:8,alignItems:"flex-start"}}>
            <TriangleAlert size={11} style={{color:a.sev === "critico" ? T.err : a.sev === "aviso" ? T.w : T.i,flexShrink:0,marginTop:2}}/>
            <div>
              <span style={{fontSize:"10px",color:T.tm}}>{a.emp} ({a.comp})</span>
              <p style={{fontSize:"11px",color:T.text,margin:"1px 0 0"}}>{a.msg}</p>
            </div>
          </div>
        ))}
        {pendentes.length === 0 && alertasRecentes.length === 0 && <p style={{fontSize:"12px",color:T.td,textAlign:"center",padding:20}}>Tudo em dia</p>}
      </div>
    </div>
  </div>;
}

/* ── CONFIG PAGE ── */
function ConfigPage({config, setConfig, db}) {
  const [importMsg, setImportMsg] = useState("");

  const exportBackup = () => {
    const data = { version: "lionsolver-v3", exportDate: new Date().toISOString(), config, empresas: db.empresas, apuracoes: db.apuracoes };
    const json = JSON.stringify(data, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(json);
    if (_setReportModal) {
      _setReportModal({ type: "xlsx", dataUri, filename: `LionSolver_backup_${new Date().toISOString().slice(0,10)}.json`, title: "Exportar Backup" });
    }
  };

  const importBackup = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.version !== "lionsolver-v3") { setImportMsg("Arquivo invalido ou versao incompativel"); return; }
          if (data.config) setConfig(data.config);
          if (data.empresas || data.apuracoes) db.importData(data);
          setImportMsg("Backup importado com sucesso! Dados restaurados.");
        } catch (err) { setImportMsg("Erro ao ler arquivo: " + err.message); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return <div>
    <h1 style={{fontSize:"28px",fontWeight:800,color:T.text,margin:"0 0 5px",fontFamily:"'Manrope',sans-serif",letterSpacing:"-0.03em",lineHeight:1.15}}>Configurações</h1>
    <p style={{color:T.tm,fontSize:"13px",margin:"0 0 24px",fontWeight:500}}>Dados do escritório, preferências e backup</p>

    {/* Dados do escritório */}
    <div className="card-glass" style={{borderRadius:T.r,padding:22,marginBottom:16}}>
      <h3 className="section-label" style={{color:T.tm,margin:"0 0 16px"}}>Dados do Escritório</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Inp label="Nome do Escritório" value={config.escritorio} onChange={v => setConfig(c => ({...c, escritorio: v}))} placeholder="Ex: Meu Escritório Contábil" style={{gridColumn:"span 2"}}/>
        <Inp label="Contador Responsável" value={config.contador} onChange={v => setConfig(c => ({...c, contador: v}))} placeholder="Nome completo"/>
        <Inp label="CRC" value={config.crc} onChange={v => setConfig(c => ({...c, crc: v}))} placeholder="CRC/UF-000000" mono/>
      </div>
    </div>

    {/* Dados padrão */}
    <div className="card-glass" style={{borderRadius:T.r,padding:22,marginBottom:16}}>
      <h3 className="section-label" style={{color:T.tm,margin:"0 0 16px"}}>Dados Padrão para Novas Empresas</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
        <Sel label="UF Padrão" value={config.ufPadrao} onChange={v => setConfig(c => ({...c, ufPadrao: v}))} options={UFS.map(u => ({v: u, l: u}))}/>
        <Sel label="Cidade Padrão" value={config.cidadePadrao} onChange={v => setConfig(c => ({...c, cidadePadrao: v}))} options={[{v:"",l:"Selecione..."},...(MUNICIPIOS_POR_UF[config.ufPadrao] || []).map(c => ({v: c, l: c}))]}/>
        <Sel label="Regime Padrão" value={config.regimePadrao} onChange={v => setConfig(c => ({...c, regimePadrao: v}))} options={[{v:"caixa",l:"Caixa"},{v:"competencia",l:"Competência"}]}/>
      </div>
    </div>

    {/* Tema */}
    <div className="card-glass" style={{borderRadius:T.r,padding:22,marginBottom:16}}>
      <h3 className="section-label" style={{color:T.tm,margin:"0 0 16px"}}>Aparência</h3>
      <div style={{display:"flex",gap:10}}>
        <Btn v={config.tema === "escuro" ? "primary" : "ghost"} sz="sm" onClick={() => setConfig(c => ({...c, tema: "escuro"}))}>Tema Escuro</Btn>
        <Btn v={config.tema === "claro" ? "primary" : "ghost"} sz="sm" onClick={() => setConfig(c => ({...c, tema: "claro"}))}>Tema Claro</Btn>
      </div>
      {config.tema === "claro" && <p style={{fontSize:"11px",color:T.ok,margin:"8px 0 0"}}>Tema claro ativado.</p>}
    </div>

    {/* Backup */}
    <div className="card-glass" style={{borderRadius:T.r,padding:22}}>
      <h3 className="section-label" style={{color:T.tm,margin:"0 0 16px"}}>Backup e Restauração</h3>
      <p style={{fontSize:"12px",color:T.tm,margin:"0 0 14px"}}>Exporte todos os dados (empresas, apurações, configurações) em arquivo JSON. Importe para restaurar.</p>
      <div style={{display:"flex",gap:10}}>
        <Btn v="ghost" icon={Download} onClick={exportBackup}>Exportar Backup (JSON)</Btn>
        <Btn v="ghost" icon={Upload} onClick={importBackup}>Importar Backup</Btn>
      </div>
      {importMsg && <p style={{fontSize:"11px",color:importMsg.includes("sucesso") ? T.ok : T.err,margin:"10px 0 0"}}>{importMsg}</p>}
      <div style={{marginTop:14,padding:"10px 14px",background:T.bgIn,borderRadius:T.rs}}>
        <p style={{fontSize:"11px",color:T.td,margin:0}}>Estatísticas: {db.empresas.length} empresas • {db.apuracoes.length} apurações</p>
      </div>
    </div>
  </div>;
}

function EmpresasPage({db}){
  const[search,setSearch]=useState("");
  const[modal,setModal]=useState(false);
  const[editing,setEditing]=useState(null);
  const blank={cnpj:"",razao:"",fantasia:"",abertura:"",regime:"caixa",uf:"BA",cidade:"Salvador",sublimite:"3600000",anexos:["I"]};
  const[form,setForm]=useState(blank);

  const filtered=useMemo(()=>{
    let l=db.empresas;
    if(search){const s=search.toLowerCase();l=l.filter(e=>e.razao.toLowerCase().includes(s)||e.cnpj.includes(s)||(e.fantasia||"").toLowerCase().includes(s));}
    return l;
  },[db.empresas,search]);

  const openNew=()=>{setForm(blank);setEditing(null);setModal(true);};
  const openEdit=e=>{setForm({...e,sublimite:String(e.sublimite),anexos:e.anexos||[e.anexo||"I"]});setEditing(e.id);setModal(true);};
  const save=()=>{const d={...form,sublimite:Number(form.sublimite),anexo:(form.anexos||["I"])[0]};editing?db.updE(editing,d):db.addE(d);setModal(false);};

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
      <div>
        <h1 style={{fontSize:"28px",fontWeight:800,color:T.text,margin:"0 0 4px",fontFamily:"'Manrope',sans-serif",letterSpacing:"-0.03em",lineHeight:1.15}}>Empresas</h1>
        <p style={{color:T.tm,fontSize:"13px",margin:0,fontWeight:500}}>{db.empresas.filter(e=>e.ativa).length} ativas <span style={{color:T.td}}>·</span> {db.empresas.length} total</p>
      </div>
      <Btn icon={Plus} onClick={openNew}>Nova Empresa</Btn>
    </div>
    <div style={{position:"relative",maxWidth:340,marginBottom:18}}>
      <Search size={14} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:T.td}}/>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por nome, CNPJ..." className="inp-focus-glow" style={{width:"100%",padding:"10px 14px 10px 34px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:T.rs,color:T.text,fontSize:"13px",fontFamily:T.f,outline:"none",boxSizing:"border-box",backdropFilter:"blur(8px)"}}/>
    </div>
    <div className="card-glass" style={{borderRadius:T.r,overflow:"hidden"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
          {["CNPJ","Empresa","UF/Cidade","Anexo","Abertura","Status",""].map(h=><th key={h} style={{padding:"10px 12px",fontSize:"9px",fontWeight:700,color:T.td,textTransform:"uppercase",textAlign:"left"}}>{h}</th>)}
        </tr></thead>
        <tbody>{filtered.map(e=><tr key={e.id} className="hover-row" style={{borderBottom:`1px solid ${T.border}`}}>
          <td style={{padding:"10px 12px",fontFamily:T.fm,fontSize:"11px",color:T.text}}>{e.cnpj}</td>
          <td style={{padding:"10px 12px",fontSize:"12px",fontWeight:600,color:T.text}}>{e.fantasia||e.razao}</td>
          <td style={{padding:"10px 12px",fontSize:"11px",color:T.tm}}>{e.cidade}/{e.uf}</td>
          <td style={{padding:"10px 12px"}}>{(e.anexos||[e.anexo]).map(a=><Badge key={a}>{a}</Badge>)}</td>
          <td style={{padding:"10px 12px",fontSize:"11px",fontFamily:T.fm,color:T.tm}}>{e.abertura}</td>
          <td style={{padding:"10px 12px"}}><Badge color={e.ativa?"success":"danger"}>{e.ativa?"Ativa":"Inativa"}</Badge></td>
          <td style={{padding:"10px 12px"}}><div style={{display:"flex",gap:3}}>
            <Btn v="ghost" sz="sm" icon={Pencil} onClick={()=>openEdit(e)}/>
            <Btn v="ghost" sz="sm" icon={e.ativa?Archive:RotateCcw} onClick={()=>db.togE(e.id)}/>
            <Btn v="danger" sz="sm" icon={Trash2} onClick={()=>db.delE(e.id)}/>
          </div></td>
        </tr>)}</tbody>
      </table>
    </div>
    <Modal open={modal} onClose={()=>setModal(false)} title={editing?"Editar Empresa":"Nova Empresa"} width={620}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Inp label="CNPJ" value={form.cnpj} onChange={v=>setForm(f=>({...f,cnpj:fCNPJ(v)}))} mono required style={{gridColumn:"span 2"}}/>
        <Inp label="Razão Social" value={form.razao} onChange={v=>setForm(f=>({...f,razao:v}))} required style={{gridColumn:"span 2"}}/>
        <Inp label="Nome Fantasia" value={form.fantasia} onChange={v=>setForm(f=>({...f,fantasia:v}))}/>
        <Inp label="Data de Abertura" value={form.abertura} onChange={v=>setForm(f=>({...f,abertura:v}))} type="date" required/>
        <Sel label="UF" value={form.uf} onChange={v=>{setForm(f=>({...f,uf:v,cidade:""}));}} options={UFS.map(u=>({v:u,l:u}))} required/>
        <Sel label="Cidade (domicílio ISS)" value={form.cidade} onChange={v=>setForm(f=>({...f,cidade:v}))} options={[{v:"",l:"Selecione..."},...(MUNICIPIOS_POR_UF[form.uf]||[]).map(c=>({v:c,l:c}))]} required/>
        <Sel label="Regime" value={form.regime} onChange={v=>setForm(f=>({...f,regime:v}))} options={[{v:"caixa",l:"Caixa"},{v:"competencia",l:"Competência"}]}/>
      </div>
      <div style={{marginTop:14}}>
        <p style={{fontSize:"11px",fontWeight:700,color:T.tm,marginBottom:8}}>Anexos da Empresa (selecione todos que se aplicam)</p>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {ANEXO_OPTS.map(opt=>{
            const sel=(form.anexos||[]).includes(opt.v);
            return <button key={opt.v} onClick={()=>setForm(f=>{
              const cur=f.anexos||[];
              const next=sel?cur.filter(a=>a!==opt.v):[...cur,opt.v];
              return{...f,anexos:next.length>0?next:cur};
            })} style={{padding:"6px 12px",fontSize:"11px",fontWeight:sel?700:500,background:sel?T.pD:"transparent",color:sel?T.p:T.tm,border:`1px solid ${sel?T.p:T.border}`,borderRadius:T.rs,cursor:"pointer",fontFamily:T.f}}>{opt.l}</button>;
          })}
        </div>
      </div>
      {BENEFICIOS_UF[form.uf]&&<div style={{marginTop:14,padding:"8px 12px",background:T.okD,borderRadius:T.rs,fontSize:"11px",color:T.ok}}>
        <Check size={12} style={{display:"inline",marginRight:4}}/> Benefício ICMS {form.uf}: {BENEFICIOS_UF[form.uf].tipo} — {BENEFICIOS_UF[form.uf].base}
      </div>}
      <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:20,paddingTop:14,borderTop:`1px solid ${T.border}`}}>
        <Btn v="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
        <Btn icon={Check} onClick={save}>{editing?"Salvar":"Cadastrar"}</Btn>
      </div>
    </Modal>
  </div>;
}

function HistoricoPage({db}){
  const sorted=[...db.apuracoes].sort((a,b)=>b.created_at.localeCompare(a.created_at));
  return <div>
    <h1 style={{fontSize:"28px",fontWeight:800,color:T.text,margin:"0 0 5px",fontFamily:"'Manrope',sans-serif",letterSpacing:"-0.03em",lineHeight:1.15}}>Histórico</h1>
    <p style={{color:T.tm,fontSize:"13px",margin:"0 0 22px",fontWeight:500}}>{db.apuracoes.length} apurações finalizadas</p>
    {sorted.length===0?<div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:T.r,padding:"50px 20px",textAlign:"center"}}><History size={36} style={{color:T.td,marginBottom:10}}/><p style={{fontSize:"13px",color:T.tm}}>Nenhuma apuração ainda</p></div>:
    <div className="card-glass" style={{borderRadius:T.r,overflow:"hidden"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
          {["Empresa","Comp.","RBT12","Fator r","DAS","Data","Exportar"].map(h=><th key={h} style={{padding:"10px 12px",fontSize:"9px",fontWeight:700,color:T.td,textTransform:"uppercase",textAlign:"left"}}>{h}</th>)}
        </tr></thead>
        <tbody>{sorted.map(a=>{
          const emp = db.empresas.find(e => e.id === a.empresa_id) || { cnpj: "—", razao: a.empresa_nome, fantasia: a.empresa_nome, uf: "—", cidade: "—", anexo: "—", abertura: "—" };
          return <tr key={a.id} style={{borderBottom:`1px solid ${T.border}`}}>
          <td style={{padding:"10px 12px",fontSize:"12px",fontWeight:600,color:T.text}}>{a.empresa_nome}</td>
          <td style={{padding:"10px 12px",fontFamily:T.fm,fontSize:"11px"}}>{a.competencia}</td>
          <td style={{padding:"10px 12px",fontFamily:T.fm,fontSize:"11px",color:T.tm}}>{fBRL(a.rbt12)}</td>
          <td style={{padding:"10px 12px",fontFamily:T.fm,fontSize:"11px",color:T.tm}}>{fPct(a.fatorR)}</td>
          <td style={{padding:"10px 12px",fontFamily:T.fm,fontSize:"12px",fontWeight:700,color:T.ok}}>{fBRL(a.valorDAS)}</td>
          <td style={{padding:"10px 12px",fontSize:"11px",color:T.tm}}>{new Date(a.created_at).toLocaleDateString("pt-BR")}</td>
          <td style={{padding:"10px 12px"}}>
            <div style={{display:"flex",gap:4}}>
              <Btn v="ghost" sz="sm" icon={FileText} onClick={() => gerarPDF(a, emp, a.competencia)}>PDF</Btn>
              <Btn v="ghost" sz="sm" icon={BarChart3Fallback} onClick={() => gerarXLSX(a, emp, a.competencia)}>XLS</Btn>
            </div>
          </td>
        </tr>;})}
        </tbody>
      </table>
    </div>}
  </div>;
}

/* ══════════════════════════════════════════════════════════════
   SOBRE PAGE
   ══════════════════════════════════════════════════════════════ */
function SobrePage() {
  const CHANGELOG = [
    {v:"1.4.0", desc:"Cadastro multi-anexo, quadro de alíquotas, ISS retido pelo tomador, terminologia corrigida"},
    {v:"1.3.1", desc:"Teste de auto-update confirmado"},
    {v:"1.3.0", desc:"Tema claro/escuro, versão no rodapé, impressão PDF, código limpo"},
    {v:"1.1.0", desc:"Persistência de dados"},
    {v:"1.0.0", desc:"Primeira versão"},
  ];
  const TUTORIAL = [
    "Cadastre suas empresas em Empresas (selecione os anexos corretos)",
    "Inicie uma apuração em Apuração (selecione empresa e competência)",
    "Informe a RBT12 (simplificada ou detalhada mês a mês)",
    "Adicione as subseções de receita com os valores do mês",
    "Confira o resultado, quadro de alíquotas e exporte PDF/XLSX",
    "Finalize para salvar no histórico",
  ];
  return <div>
    {/* Cabeçalho */}
    <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:28}}>
      <div style={{width:52,height:52,borderRadius:"12px",background:`linear-gradient(135deg,${T.p},${T.pH})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",fontWeight:800,color:"#fff",flexShrink:0}}>L</div>
      <div>
        <h1 style={{fontSize:"26px",fontWeight:800,color:T.text,margin:0,lineHeight:1.1}}>LionSolver</h1>
        <p style={{color:T.tm,fontSize:"12px",margin:"3px 0 0"}}>Software de Apuração do Simples Nacional &nbsp;<span style={{fontFamily:T.fm,color:T.p}}>v{APP_VERSION}</span></p>
      </div>
    </div>

    {/* Sobre o aplicativo */}
    <div className="card-glass" style={{borderRadius:T.r,padding:20,marginBottom:16}}>
      <h3 style={{fontSize:"12px",fontWeight:700,color:T.tm,textTransform:"uppercase",letterSpacing:"0.04em",margin:"0 0 14px",display:"flex",alignItems:"center",gap:6}}><Info size={13} color={T.i}/>Sobre o Aplicativo</h3>
      <p style={{fontSize:"13px",color:T.text,lineHeight:1.7,margin:"0 0 12px"}}>
        O LionSolver calcula o DAS (Documento de Arrecadação do Simples Nacional) com suporte aos Anexos I–V, Fator R, benefícios de ICMS estaduais e ISS por município.
      </p>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
        <span style={{fontSize:"11px",padding:"3px 9px",borderRadius:T.rs,background:T.iD,color:T.i,fontWeight:600}}>LC 123/2006</span>
        <span style={{fontSize:"11px",padding:"3px 9px",borderRadius:T.rs,background:T.iD,color:T.i,fontWeight:600}}>LC 155/2016</span>
        <span style={{fontSize:"11px",padding:"3px 9px",borderRadius:T.rs,background:T.iD,color:T.i,fontWeight:600}}>CGSN 140/2018</span>
      </div>
      <p style={{fontSize:"12px",color:T.td,margin:0}}>Desenvolvido por <span style={{color:T.p,fontWeight:700}}>LionSolver</span></p>
    </div>

    {/* Changelog */}
    <div className="card-glass" style={{borderRadius:T.r,padding:20,marginBottom:16}}>
      <h3 style={{fontSize:"12px",fontWeight:700,color:T.tm,textTransform:"uppercase",letterSpacing:"0.04em",margin:"0 0 14px",display:"flex",alignItems:"center",gap:6}}><History size={13} color={T.p}/>Histórico de Versões</h3>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {CHANGELOG.map((c,i)=><div key={c.v} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"10px 12px",background:i===0?T.pD:T.bgIn,borderRadius:T.rs,border:i===0?`1px solid ${T.p}`:"none"}}>
          <span style={{fontFamily:T.fm,fontSize:"12px",fontWeight:700,color:i===0?T.p:T.tm,flexShrink:0}}>v{c.v}</span>
          <span style={{fontSize:"12px",color:T.text,lineHeight:1.5}}>{c.desc}</span>
          {i===0&&<span style={{fontSize:"10px",padding:"2px 7px",borderRadius:T.rs,background:T.p,color:T.pText,fontWeight:700,flexShrink:0,marginLeft:"auto",alignSelf:"center"}}>ATUAL</span>}
        </div>)}
      </div>
    </div>

    {/* Tutorial rápido */}
    <div className="card-glass" style={{borderRadius:T.r,padding:20,marginBottom:16}}>
      <h3 style={{fontSize:"12px",fontWeight:700,color:T.tm,textTransform:"uppercase",letterSpacing:"0.04em",margin:"0 0 14px",display:"flex",alignItems:"center",gap:6}}><FileText size={13} color={T.ok}/>Tutorial Rápido</h3>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {TUTORIAL.map((step,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"10px 12px",background:T.bgIn,borderRadius:T.rs}}>
          <span style={{width:22,height:22,borderRadius:"50%",background:T.okD,border:`1px solid ${T.ok}`,color:T.ok,fontSize:"11px",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</span>
          <span style={{fontSize:"12px",color:T.text,lineHeight:1.6,paddingTop:2}}>{step}</span>
        </div>)}
      </div>
    </div>

    {/* Contato / Suporte */}
    <div className="card-glass" style={{borderRadius:T.r,padding:20}}>
      <h3 style={{fontSize:"12px",fontWeight:700,color:T.tm,textTransform:"uppercase",letterSpacing:"0.04em",margin:"0 0 14px",display:"flex",alignItems:"center",gap:6}}><Settings size={13} color={T.tm}/>Contato & Suporte</h3>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        <p style={{fontSize:"12px",color:T.text,margin:0,display:"flex",alignItems:"center",gap:6}}><Check size={13} color={T.ok}/>Atualizações automáticas via internet</p>
        <p style={{fontSize:"12px",color:T.text,margin:0,display:"flex",alignItems:"center",gap:6}}><Info size={13} color={T.i}/>GitHub: <span style={{fontFamily:T.fm,color:T.p}}>github.com/adanviniciusfl/lionsolver</span></p>
      </div>
    </div>
  </div>;
}

/* ══════════════════════════════════════════════════════════════
   APP SHELL
   ══════════════════════════════════════════════════════════════ */
const NAV=[{id:"dashboard",label:"Dashboard",icon:LayoutDashboard},{id:"empresas",label:"Empresas",icon:Building2},{id:"apuracao",label:"Apuração",icon:Calculator},{id:"historico",label:"Histórico",icon:History},{id:"config",label:"Configurações",icon:Settings},{id:"sobre",label:"Sobre",icon:Info}];

export default function App(){
  const[page,setPage]=useState("dashboard");
  const[col,setCol]=useState(false);
  const[report,setReport]=useState(null);
  const[config,setConfigState]=useState(() => loadData("config", {escritorio:"",contador:"",crc:"",ufPadrao:"BA",cidadePadrao:"Salvador",regimePadrao:"caixa",tema:"escuro"}));
  const setConfig = useCallback((updater) => {
    setConfigState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveData("config", next);
      return next;
    });
  }, []);
  const[updateStatus,setUpdateStatus]=useState("idle");
  const db=useDB();

  // Wire up the global report modal setter
  _setReportModal = setReport;

  // Check for updates on startup (only works in Tauri desktop)
  useEffect(() => { checkForUpdates(setUpdateStatus); }, []);

  // Apply theme — robust fallback to escuro
  const currentTema = (config && config.tema === "claro") ? "claro" : "escuro";
  T = THEMES[currentTema];

  const render=()=>{switch(page){
    case"dashboard":return <DashboardPage db={db} navigate={setPage} config={config}/>;
    case"empresas":return <EmpresasPage db={db}/>;
    case"apuracao":return <ApuracaoPage db={db} navigate={setPage}/>;
    case"historico":return <HistoricoPage db={db}/>;
    case"config":return <ConfigPage config={config} setConfig={setConfig} db={db}/>;
    case"sobre":return <SobrePage />;
    default:return <DashboardPage db={db} navigate={setPage} config={config}/>;
  }};
  return <div style={{display:"flex",flexDirection:"column",height:"100vh",fontFamily:T.f,background:`radial-gradient(ellipse 80% 60% at 15% 80%, rgba(187,195,255,0.05) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 85% 20%, rgba(0,218,243,0.04) 0%, transparent 70%), ${T.bg}`,color:T.text,overflow:"hidden",position:"relative"}}>
    <ReportModal report={report} onClose={() => setReport(null)} />
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:3px}::-webkit-scrollbar-thumb:hover{background:rgba(187,195,255,0.25)}
      select option{background:${T.bgIn};color:${T.text}}input::placeholder{color:${T.td}}
      .floating-dock {
        position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
        display: flex; gap: 6px; padding: 10px 20px;
        background: rgba(14,14,14,0.82); backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%);
        border: 1px solid rgba(255,255,255,0.07); border-radius: 100px;
        box-shadow: 0 24px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06); z-index: 1000;
        transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
      }
      .dock-btn { transition: all 0.22s cubic-bezier(0.16,1,0.3,1) !important; }
      .dock-btn:hover { background: rgba(187,195,255,0.08) !important; color: #dee0ff !important; }
      .dock-hidden { transform: translate(-50%, 150%); opacity: 0; pointer-events: none; }
      .app-main { flex: 1; overflow: auto; padding: 28px 44px 110px; }
      .card-glass {
        background: rgba(22,21,21,0.60) !important;
        backdrop-filter: blur(24px) saturate(160%);
        -webkit-backdrop-filter: blur(24px) saturate(160%);
        border: 1px solid rgba(255,255,255,0.07) !important;
        box-shadow: 0 4px 24px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.05);
        transition: transform 0.28s cubic-bezier(0.16,1,0.3,1), box-shadow 0.28s ease, border-color 0.28s ease;
      }
      .card-glass:hover {
        transform: translateY(-2px);
        box-shadow: 0 16px 48px rgba(0,0,0,0.44), 0 0 0 1px rgba(187,195,255,0.12), inset 0 1px 0 rgba(255,255,255,0.08);
        border-color: rgba(187,195,255,0.16) !important;
      }
      .kpi-glass {
        background: rgba(22,21,21,0.60) !important;
        backdrop-filter: blur(24px) saturate(160%);
        -webkit-backdrop-filter: blur(24px) saturate(160%);
        border: 1px solid rgba(255,255,255,0.07) !important;
        box-shadow: 0 4px 24px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.05);
        transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease, border-color 0.3s ease;
        position: relative; overflow: hidden;
      }
      .kpi-glass::before {
        content: '';
        position: absolute; top: 0; left: 0; right: 0; height: 2px;
        background: linear-gradient(90deg, transparent, rgba(187,195,255,0.35), transparent);
        opacity: 0; transition: opacity 0.3s ease;
      }
      .kpi-glass:hover { transform: translateY(-4px) scale(1.012); }
      .kpi-glass:hover::before { opacity: 1; }
      .kpi-glass:hover { box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(187,195,255,0.16), inset 0 1px 0 rgba(255,255,255,0.09); border-color: rgba(187,195,255,0.2) !important; }
      .hover-row { transition: background 0.18s ease; cursor: default; }
      .hover-row:hover { background: rgba(187,195,255,0.04) !important; }
      .btn-primary { transition: all 0.22s cubic-bezier(0.16,1,0.3,1) !important; }
      .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 0 20px rgba(187,195,255,0.3), 0 4px 16px rgba(187,195,255,0.15) !important; }
      .btn-primary:active:not(:disabled) { transform: translateY(0px); }
      .month-cell {
        display: flex; flex-direction: column; gap: 5px;
        padding: 10px; border-radius: 10px;
        background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06);
        transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
      }
      .month-cell:hover:not(.month-disabled) { border-color: rgba(187,195,255,0.2); background: rgba(187,195,255,0.04); box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
      .month-cell.month-disabled { opacity: 0.28; }
      .month-cell-label { font-size: 10px; font-family: 'Inter', monospace; font-weight: 600; color: rgba(187,195,255,0.7); letter-spacing: 0.04em; }
      .month-cell-input {
        width: 100%; padding: 5px 7px;
        background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
        border-radius: 6px; color: #e5e2e1; font-size: 11px;
        font-family: 'Inter', monospace; outline: none; box-sizing: border-box;
        transition: border-color 0.2s, box-shadow 0.2s;
      }
      .month-cell-input:focus { border-color: rgba(187,195,255,0.4); box-shadow: 0 0 0 3px rgba(187,195,255,0.08); }
      .month-cell-input:disabled { cursor: not-allowed; background: transparent; border-color: transparent; color: rgba(255,255,255,0.2); }
      .month-cell-input::placeholder { color: rgba(255,255,255,0.2); }
      .section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; display: flex; align-items: center; gap: 8px; }
      .section-label::before { content:''; display:inline-block; width:3px; height:13px; border-radius:2px; background:linear-gradient(180deg,#bbc3ff,#00daf3); flex-shrink:0; }
      .inp-focus-glow:focus { box-shadow: 0 0 0 3px rgba(187,195,255,0.1) !important; border-color: #bbc3ff !important; }
      .chart-bar { transition: filter 0.2s, transform 0.2s; }
      .chart-bar:hover { filter: brightness(1.2); transform: scaleY(1.04); transform-origin: bottom; }
      .stepper-bar { transition: all 0.35s cubic-bezier(0.16,1,0.3,1); }
      .result-summary { background: linear-gradient(135deg,rgba(187,195,255,0.07),rgba(0,218,243,0.05)) !important; border: 1px solid rgba(255,255,255,0.07) !important; }
      @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
      .das-value { background: linear-gradient(90deg,#00daf3,#bbc3ff,#00daf3); background-size:200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 3s linear infinite; }
    `}</style>

    <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 44px",background:"rgba(14,14,14,0.4)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.04)",zIndex:10,flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:34,height:34,borderRadius:"10px",background:`linear-gradient(135deg,${T.p},${T.pH})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",fontWeight:900,color:"#131313",boxShadow:`0 0 20px ${T.p}40`}}>L</div>
        <div>
          <span style={{fontSize:"17px",fontWeight:800,letterSpacing:"-0.03em",fontFamily:"'Manrope',sans-serif",color:T.text}}>LionSolver</span>
          <span style={{fontSize:"10px",color:T.td,marginLeft:8,fontFamily:T.fm,letterSpacing:"0.02em"}}>v{APP_VERSION}</span>
        </div>
      </div>
      <div style={{display:"flex",gap:12,alignItems:"center"}}>
        <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(187,195,255,0.08)",border:"1px solid rgba(187,195,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:"13px",fontWeight:700,color:T.p,fontFamily:T.f}}>U</span></div>
      </div>
    </header>

    <main className="app-main" onMouseMove={(e) => {
      if (window.innerHeight - e.clientY < 180) setCol(false);
      else setCol(true);
    }}>{render()}</main>

    <div className={`floating-dock ${col ? 'dock-hidden' : ''}`} onMouseEnter={() => setCol(false)}>
      {NAV.map(n => {
        const a = page === n.id;
        return <button key={n.id} onClick={() => setPage(n.id)} title={n.label} className="dock-btn" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "9px 18px", background: a ? T.pD : "transparent",
          color: a ? T.p : T.tm, border: "none", borderRadius: "100px", cursor: "pointer",
          fontFamily: T.f, fontSize: "12px", fontWeight: a ? 700 : 500, transition: "all 0.25s",
          boxShadow: a ? `0 0 16px ${T.p}30` : "none"
        }}>
          <n.icon size={17} strokeWidth={a ? 2.5 : 1.8}/>
          {a && <span style={{letterSpacing:"0.01em"}}>{n.label}</span>}
        </button>;
      })}
    </div>
  </div>;
}
