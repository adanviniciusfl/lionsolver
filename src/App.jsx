import { useState, useCallback, useMemo } from "react";
import { Search, Plus, Edit3, Trash2, Building2, LayoutDashboard, Calculator, FileText, History, ChevronRight, ChevronLeft, X, Check, AlertTriangle, TrendingUp, DollarSign, Archive, RotateCcw, Menu, MapPin, Settings, Download, Upload } from "lucide-react";

/* ══════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ══════════════════════════════════════════════════════════════ */
const T = {
  bg:"#0F1117",bgCard:"#181B25",bgHov:"#1E2230",bgSide:"#0A0C12",bgIn:"#141720",
  border:"#252A36",borderF:"#D4A843",text:"#E8E6E1",tm:"#7A7F8E",td:"#4A4F5E",
  p:"#D4A843",pH:"#E0B84F",pD:"rgba(212,168,67,0.15)",
  ok:"#34D399",okD:"rgba(52,211,153,0.12)",
  w:"#FBBF24",wD:"rgba(251,191,36,0.12)",
  err:"#F87171",errD:"rgba(248,113,113,0.12)",
  i:"#60A5FA",iD:"rgba(96,165,250,0.12)",
  r:"10px",rs:"6px",f:"'DM Sans','Segoe UI',sans-serif",fm:"'JetBrains Mono',monospace",
};

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
    {id:"ST",nome:"ICMS ST",deduz:["ICMS"]},
    {id:"ST_MONO",nome:"ICMS ST + PIS/Cofins Monofásico",deduz:["ICMS","PIS","Cofins"]},
    {id:"MONO",nome:"PIS/Cofins Monofásico",deduz:["PIS","Cofins"]},
    {id:"DEV",nome:"Devoluções",deduz:["BASE"]},
    {id:"EXP",nome:"Exportação",deduz:["ICMS","PIS","Cofins"]},
    {id:"ISEN",nome:"Isenção/Redução Estadual ICMS",deduz:["ICMS_UF"]},
  ],
  II:[
    {id:"NORMAL",nome:"ICMS/IPI Normal",deduz:[]},
    {id:"ST",nome:"ICMS ST",deduz:["ICMS"]},
    {id:"ST_MONO",nome:"ICMS ST + PIS/Cofins Mono",deduz:["ICMS","PIS","Cofins"]},
    {id:"MONO",nome:"PIS/Cofins Monofásico",deduz:["PIS","Cofins"]},
    {id:"DEV",nome:"Devoluções",deduz:["BASE"]},
    {id:"EXP",nome:"Exportação",deduz:["ICMS","IPI","PIS","Cofins"]},
    {id:"ISEN",nome:"Isenção/Redução Estadual ICMS",deduz:["ICMS_UF"]},
  ],
  III:[
    {id:"NORMAL",nome:"ISS Normal (domicílio)",deduz:[],iss:"domicilio"},
    {id:"ISS_OUTRO",nome:"ISS devido a outro município",deduz:[],iss:"outro"},
    {id:"ISS_RET",nome:"ISS Retido na Fonte",deduz:["ISS"]},
    {id:"DEV",nome:"Devoluções/Cancelamentos",deduz:["BASE"]},
    {id:"EXP",nome:"Exportação de Serviços",deduz:["ISS","PIS","Cofins"]},
  ],
  "III/V":[
    {id:"NORMAL",nome:"ISS Normal — Fator r (domicílio)",deduz:[],iss:"domicilio"},
    {id:"ISS_OUTRO",nome:"ISS devido a outro município — Fator r",deduz:[],iss:"outro"},
    {id:"ISS_RET",nome:"ISS Retido — Fator r",deduz:["ISS"]},
    {id:"DEV",nome:"Devoluções/Cancelamentos",deduz:["BASE"]},
    {id:"EXP",nome:"Exportação de Serviços",deduz:["ISS","PIS","Cofins"]},
  ],
  IV:[
    {id:"NORMAL",nome:"ISS Normal (domicílio)",deduz:[],iss:"domicilio"},
    {id:"ISS_OUTRO",nome:"ISS devido a outro município",deduz:[],iss:"outro"},
    {id:"ISS_RET",nome:"ISS Retido na Fonte",deduz:["ISS"]},
    {id:"DEV",nome:"Devoluções/Cancelamentos",deduz:["BASE"]},
  ],
  V:[
    {id:"NORMAL",nome:"ISS Normal (domicílio)",deduz:[],iss:"domicilio"},
    {id:"ISS_OUTRO",nome:"ISS devido a outro município",deduz:[],iss:"outro"},
    {id:"ISS_RET",nome:"ISS Retido na Fonte",deduz:["ISS"]},
    {id:"DEV",nome:"Devoluções/Cancelamentos",deduz:["BASE"]},
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
${resultados.map(r => `<div style="margin-bottom:8px"><div style="font-size:9px;color:#666;margin-bottom:3px">${r.tipo} — Anexo ${r.anexo}</div><div style="display:flex;gap:6px;flex-wrap:wrap">${Object.entries(r.dist).map(([t, d]) => `<div style="background:#f5f7fa;border-radius:4px;padding:4px 8px;min-width:70px"><div style="font-size:7px;text-transform:uppercase;color:#888;font-weight:700">${t}</div><div style="font-size:10px;font-weight:700;${d.deduzido && d.valor === 0 ? "color:#c62828" : ""}">${d.deduzido && d.valor === 0 ? "ISENTO" : fBRL(d.valor)}</div><div style="font-size:8px;color:#888;font-family:monospace">${fPct(d.pct)}</div></div>`).join("")}</div></div>`).join("")}

<div style="background:#1B3A5C;color:white;border-radius:6px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;margin-top:10px">
  <div><div style="font-size:8px;text-transform:uppercase;opacity:0.7">Total Bruto</div><div style="font-size:14px;font-weight:700">${fBRL(res.totalBruto)}</div></div>
  <div style="text-align:right"><div style="font-size:8px;text-transform:uppercase;opacity:0.7">DAS a Recolher</div><div style="font-size:22px;font-weight:800;color:#D4A843">${fBRL(res.valorDAS)}</div></div>
</div>

<div style="margin-top:16px;padding-top:8px;border-top:1px solid #ddd;font-size:8px;color:#999;text-align:center">
  LionSolver — Software de Apuração do Simples Nacional | LC 123/2006 • LC 155/2016 • CGSN 140/2018
</div>
</div>`;
}

function buildXLSVData(res, emp, comp) {
  const compLabel = (comp || "").split("-").reverse().join("/");
  const sep = "\t";
  let csv = "LIONSOLVER — APURAÇÃO DO SIMPLES NACIONAL\n";
  csv += `Empresa${sep}${emp.razao || emp.empresa_nome || ""}${sep}CNPJ${sep}${emp.cnpj || ""}\n`;
  csv += `Competência${sep}${compLabel}${sep}UF${sep}${emp.uf || ""}/${emp.cidade || ""}\n`;
  csv += `RBT12${sep}${res.rbt12}${sep}Fator r${sep}${(res.fatorR * 100).toFixed(2)}%\n`;
  csv += `DAS a Recolher${sep}${res.valorDAS}\n\n`;
  csv += "MEMÓRIA DE CÁLCULO\n";
  csv += `Subseção${sep}Anexo${sep}Faixa${sep}Receita${sep}Alíq.Nominal${sep}PD${sep}Alíq.Efetiva${sep}Valor\n`;
  for (const r of (res.resultados || [])) {
    csv += `${r.tipo}${sep}${r.anexo}${sep}${r.faixa}ª${sep}${r.receita}${sep}${(r.an * 100).toFixed(2)}%${sep}${r.pd}${sep}${(r.ae * 100).toFixed(4)}%${sep}${r.valorLiquido.toFixed(2)}\n`;
  }
  csv += "\nDISTRIBUIÇÃO POR TRIBUTO\n";
  for (const r of (res.resultados || [])) {
    csv += `\n${r.tipo} — Anexo ${r.anexo}\n`;
    csv += `Tributo${sep}Percentual${sep}Valor${sep}Deduzido\n`;
    for (const [t, d] of Object.entries(r.dist)) {
      csv += `${t}${sep}${(d.pct * 100).toFixed(2)}%${sep}${d.valor.toFixed(2)}${sep}${d.deduzido ? "Sim" : "Não"}\n`;
    }
  }
  if ((res.alertas || []).length > 0) {
    csv += "\nALERTAS FISCAIS\n";
    for (const a of res.alertas) csv += `${a.sev.toUpperCase()}${sep}${a.msg}\n`;
  }
  return csv;
}

// Shared state for report modal — will be used by ReportModal component
let _setReportModal = null;

function gerarPDF(res, emp, comp) {
  if (_setReportModal) _setReportModal({ type: "pdf", html: buildPDFHTML(res, emp, comp), title: `Apuração ${(comp || "").split("-").reverse().join("/")} — ${emp.fantasia || emp.razao || emp.empresa_nome || ""}` });
}

function gerarXLSX(res, emp, comp) {
  if (_setReportModal) {
    const csv = buildXLSVData(res, emp, comp);
    const dataUri = "data:application/vnd.ms-excel;charset=utf-8," + encodeURIComponent("\uFEFF" + csv);
    _setReportModal({ type: "xlsx", dataUri, filename: `LionSolver_${emp.fantasia || emp.razao || ""}_${comp}.xls`, title: "Exportar Planilha" });
  }
}

function ReportModal({ report, onClose }) {
  if (!report) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "12px", width: report.type === "pdf" ? "90vw" : "480px", maxWidth: 860, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #e5e5e5", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a" }}>{report.title}</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {report.type === "pdf" && <button onClick={() => { const w = document.getElementById("report-content"); if (w) { const pw = window.open("", "_blank"); if (pw) { pw.document.write("<html><head><title>" + report.title + "</title></head><body>" + w.innerHTML + "</body></html>"); pw.document.close(); pw.print(); } } }} style={{ padding: "6px 14px", background: "#1B3A5C", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Imprimir / Salvar PDF</button>}
            {report.type === "xlsx" && <a href={report.dataUri} download={report.filename} style={{ padding: "6px 14px", background: "#1B3A5C", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>Baixar .XLS</a>}
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
function Btn({children,v="primary",sz="md",icon:I,onClick,disabled,style:s}){const[h,sH]=useState(false);const base={display:"inline-flex",alignItems:"center",gap:6,border:"none",cursor:disabled?"not-allowed":"pointer",fontFamily:T.f,fontWeight:600,borderRadius:T.rs,transition:"all 0.2s",opacity:disabled?0.5:1};const szs={sm:{padding:"5px 11px",fontSize:"11px"},md:{padding:"8px 16px",fontSize:"12px"},lg:{padding:"11px 22px",fontSize:"13px"}};const vs={primary:{background:h?T.pH:T.p,color:T.bg},ghost:{background:h?"rgba(255,255,255,0.06)":"transparent",color:T.tm},danger:{background:h?"rgba(248,113,113,0.2)":T.errD,color:T.err}};return <button onClick={onClick} disabled={disabled} onMouseEnter={()=>sH(true)} onMouseLeave={()=>sH(false)} style={{...base,...szs[sz],...vs[v],...s}}>{I&&<I size={sz==="sm"?12:14}/>}{children}</button>;}
function Inp({label,value,onChange,placeholder,mono,error,required,style:s,prefix,type="text"}){const[f,sF]=useState(false);return <div style={{display:"flex",flexDirection:"column",gap:4,...s}}>{label&&<label style={{fontSize:"10px",fontWeight:700,color:T.tm,letterSpacing:"0.05em",textTransform:"uppercase"}}>{label}{required&&<span style={{color:T.err}}>*</span>}</label>}<div style={{position:"relative"}}>{prefix&&<span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T.td,fontSize:"12px"}}>{prefix}</span>}<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} onFocus={()=>sF(true)} onBlur={()=>sF(false)} style={{padding:prefix?"9px 12px 9px 28px":"9px 12px",background:T.bgIn,border:`1px solid ${error?T.err:f?T.borderF:T.border}`,borderRadius:T.rs,color:T.text,fontSize:"13px",fontFamily:mono?T.fm:T.f,outline:"none",width:"100%",boxSizing:"border-box"}}/></div>{error&&<span style={{fontSize:"10px",color:T.err}}>{error}</span>}</div>;}
function Sel({label,value,onChange,options,required,style:s}){return <div style={{display:"flex",flexDirection:"column",gap:4,...s}}>{label&&<label style={{fontSize:"10px",fontWeight:700,color:T.tm,letterSpacing:"0.05em",textTransform:"uppercase"}}>{label}{required&&<span style={{color:T.err}}>*</span>}</label>}<select value={value} onChange={e=>onChange(e.target.value)} style={{padding:"9px 12px",background:T.bgIn,border:`1px solid ${T.border}`,borderRadius:T.rs,color:T.text,fontSize:"13px",fontFamily:T.f,outline:"none",cursor:"pointer",appearance:"none",width:"100%",boxSizing:"border-box"}}>{options.map(o=>typeof o==="string"?<option key={o} value={o}>{o}</option>:<option key={o.v} value={o.v}>{o.l}</option>)}</select></div>;}
function Modal({open,onClose,title,children,width=560}){if(!open)return null;return <div style={{position:"fixed",inset:0,zIndex:1e3,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.6)"}} onClick={onClose}><div onClick={e=>e.stopPropagation()} style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:T.r,width,maxWidth:"92vw",maxHeight:"88vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",borderBottom:`1px solid ${T.border}`}}><h3 style={{margin:0,fontSize:"15px",fontWeight:700,color:T.text}}>{title}</h3><button onClick={onClose} style={{background:"none",border:"none",color:T.tm,cursor:"pointer"}}><X size={16}/></button></div><div style={{padding:20}}>{children}</div></div></div>;}
function KPI({icon:I,label,value,sub,color=T.p}){return <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:T.r,padding:"16px 18px",flex:1,minWidth:160}}><div style={{display:"flex",justifyContent:"space-between"}}><div><p style={{margin:0,fontSize:"10px",color:T.tm,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</p><p style={{margin:"4px 0 0",fontSize:"22px",fontWeight:800,color:T.text}}>{value}</p>{sub&&<p style={{margin:"2px 0 0",fontSize:"10px",color:T.tm}}>{sub}</p>}</div><div style={{width:34,height:34,borderRadius:"8px",background:`${color}18`,display:"flex",alignItems:"center",justifyContent:"center"}}><I size={16} style={{color}}/></div></div></div>;}

/* ══════════════════════════════════════════════════════════════
   DATABASE
   ══════════════════════════════════════════════════════════════ */
const INIT_EMP=[
  {id:"e1",cnpj:"12.345.678/0001-90",razao:"Tech Solutions Ltda",fantasia:"TechSol",abertura:"2019-03-15",regime:"caixa",uf:"BA",cidade:"Salvador",sublimite:3600000,anexo:"III/V",ativa:true},
  {id:"e2",cnpj:"98.765.432/0001-10",razao:"Comércio Nordeste Eireli",fantasia:"NordesteCom",abertura:"2020-07-22",regime:"competencia",uf:"BA",cidade:"Camaçari",sublimite:3600000,anexo:"I",ativa:true},
  {id:"e3",cnpj:"11.222.333/0001-44",razao:"IBA Foods Ltda",fantasia:"IBA Foods",abertura:"2025-10-20",regime:"caixa",uf:"BA",cidade:"Salvador",sublimite:3600000,anexo:"II",ativa:true},
];

function useDB(){
  const[empresas,setE]=useState(INIT_EMP);
  const[apuracoes,setA]=useState([]);
  const addE=useCallback(d=>{const e={...d,id:genId(),ativa:true};setE(p=>[...p,e]);return e;},[]);
  const updE=useCallback((id,d)=>setE(p=>p.map(e=>e.id===id?{...e,...d}:e)),[]);
  const togE=useCallback(id=>setE(p=>p.map(e=>e.id===id?{...e,ativa:!e.ativa}:e)),[]);
  const delE=useCallback(id=>setE(p=>p.filter(e=>e.id!==id)),[]);
  const addA=useCallback(a=>{const ap={...a,id:genId(),created_at:new Date().toISOString()};setA(p=>[...p,ap]);return ap;},[]);
  return{empresas,apuracoes,addE,updE,togE,delE,addA};
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

    setResultado({resultados,rbt12:rbt12Calc,rbt12Real:prop.rbt12Real||rbt12Calc,fs12:fs,fatorR:fr,totalBruto,totalDev,valorDAS,alertas,prop,benUF});
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
    <h1 style={{fontSize:"24px",fontWeight:800,color:T.text,margin:"0 0 6px"}}>Nova Apuração</h1>
    <p style={{color:T.tm,fontSize:"13px",margin:"0 0 20px"}}>Apuração mensal com subseções de receita e deduções integradas</p>

    {/* Stepper */}
    <div style={{display:"flex",gap:4,marginBottom:24}}>
      {steps.map((t,i)=><div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
        <div style={{width:"100%",height:3,borderRadius:2,background:i<=step?T.p:T.border,transition:"all 0.3s"}}/>
        <span style={{fontSize:"10px",fontWeight:i===step?700:500,color:i<=step?T.p:T.td}}>{t}</span>
      </div>)}
    </div>

    <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:T.r,padding:24}}>

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
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <Btn v={modoRBT==="simples"?"primary":"ghost"} sz="sm" onClick={()=>setModoRBT("simples")}>Simplificado</Btn>
          <Btn v={modoRBT==="detalhado"?"primary":"ghost"} sz="sm" onClick={()=>{setModoRBT("detalhado");setTimeout(()=>preencherDoHistorico(),50);}}>Detalhado (mês a mês)</Btn>
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
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
            {getMeses().map((m,i) => {
              const disabled = isMesAnteriorAbertura(m);
              return <div key={m} style={{display:"flex",flexDirection:"column",gap:2,opacity:disabled?0.35:1}}>
              <span style={{fontSize:"10px",fontFamily:T.fm,color:disabled?T.td:T.tm}}>{m}{disabled?" ✕":""}</span>
              <div style={{display:"flex",gap:4}}>
                <input value={disabled?"":rbt12Meses[i]} onChange={e=>{if(disabled)return;const a=[...rbt12Meses];a[i]=e.target.value;setRbt12Meses(a);}} placeholder={disabled?"—":"Receita"} disabled={disabled} style={{flex:1,padding:"6px 8px",background:disabled?"transparent":T.bgIn,border:`1px solid ${disabled?"transparent":T.border}`,borderRadius:T.rs,color:disabled?T.td:T.text,fontSize:"11px",fontFamily:T.fm,outline:"none",width:"100%",boxSizing:"border-box",cursor:disabled?"not-allowed":"text"}}/>
                <input value={disabled?"":fs12Meses[i]} onChange={e=>{if(disabled)return;const a=[...fs12Meses];a[i]=e.target.value;setFs12Meses(a);}} placeholder={disabled?"—":"Folha"} disabled={disabled} style={{flex:1,padding:"6px 8px",background:disabled?"transparent":T.bgIn,border:`1px solid ${disabled?"transparent":T.border}`,borderRadius:T.rs,color:disabled?T.td:T.text,fontSize:"11px",fontFamily:T.fm,outline:"none",width:"100%",boxSizing:"border-box",cursor:disabled?"not-allowed":"text"}}/>
              </div>
            </div>;})}
          </div>
          <div style={{display:"flex",gap:20,marginTop:12,padding:"10px 14px",background:T.pD,borderRadius:T.rs,flexWrap:"wrap"}}>
            <span style={{fontSize:"12px",color:T.tm}}>RBT12: <strong style={{color:T.text,fontFamily:T.fm}}>{fBRL(rbt12Meses.reduce((s,v)=>s+pM(v),0))}</strong></span>
            <span style={{fontSize:"12px",color:T.tm}}>FS12: <strong style={{color:T.text,fontFamily:T.fm}}>{fBRL(fs12Meses.reduce((s,v)=>s+pM(v),0))}</strong></span>
            <span style={{fontSize:"12px",color:T.tm}}>Meses ativos: <strong style={{color:T.i}}>{getMesesAtivos()}</strong></span>
          </div>
        </div>}

        {/* Proporcionalização alert */}
        {emp&&emp.abertura&&getRBT12()>0&&calcRBT12Proporcional(getRBT12(),emp.abertura,comp).proporcional&&<div style={{marginTop:12,padding:"10px 14px",background:T.iD,borderRadius:T.rs,fontSize:"12px",color:T.i}}>
          <AlertTriangle size={13} style={{display:"inline",marginRight:6}}/>
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
          <AlertTriangle size={12} style={{color:a.sev==="critico"?T.err:a.sev==="aviso"?T.w:T.i,flexShrink:0}}/>
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
            {Object.entries(r.dist).map(([t,{pct,valor,deduzido}])=><div key={t} style={{background:deduzido?T.errD:T.bgIn,borderRadius:T.rs,padding:"6px 10px",minWidth:80}}>
              <p style={{margin:0,fontSize:"9px",color:T.td,fontWeight:700,textTransform:"uppercase"}}>{t}</p>
              <p style={{margin:"1px 0 0",fontSize:"12px",fontWeight:700,fontFamily:T.fm,color:deduzido?T.err:valor>0?T.text:T.td}}>{deduzido&&valor===0?"ISENTO":fBRL(valor)}</p>
              <p style={{margin:0,fontSize:"9px",fontFamily:T.fm,color:T.tm}}>{fPct(pct)}</p>
            </div>)}
          </div>
        </div>)}

        {/* Resumo final */}
        <div style={{marginTop:16,padding:"14px 18px",background:`linear-gradient(135deg,${T.pD},${T.okD})`,borderRadius:T.r,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <p style={{margin:0,fontSize:"11px",color:T.tm,fontWeight:600,textTransform:"uppercase"}}>Total bruto</p>
            <p style={{margin:"2px 0",fontSize:"15px",fontFamily:T.fm,color:T.text}}>{fBRL(resultado.totalBruto)}</p>
          </div>
          <div style={{textAlign:"right"}}>
            <p style={{margin:0,fontSize:"11px",color:T.tm,fontWeight:600,textTransform:"uppercase"}}>DAS a recolher</p>
            <p style={{margin:"2px 0 0",fontSize:"26px",fontWeight:800,fontFamily:T.fm,color:T.ok}}>{fBRL(resultado.valorDAS)}</p>
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
  const ativas = db.empresas.filter(e => e.ativa);
  const totalDas = db.apuracoes.reduce((s, a) => s + a.valorDAS, 0);
  const recentes = [...db.apuracoes].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);

  // DAS by month for chart
  const dasPorMes = {};
  db.apuracoes.forEach(a => { dasPorMes[a.competencia] = (dasPorMes[a.competencia] || 0) + a.valorDAS; });
  const mesesChart = Object.keys(dasPorMes).sort().slice(-6);
  const maxDas = Math.max(...mesesChart.map(m => dasPorMes[m]), 1);

  // DAS by empresa
  const dasPorEmp = {};
  db.apuracoes.forEach(a => { dasPorEmp[a.empresa_nome] = (dasPorEmp[a.empresa_nome] || 0) + a.valorDAS; });
  const empChart = Object.entries(dasPorEmp).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxEmpDas = Math.max(...empChart.map(e => e[1]), 1);

  // Pending apurações (empresas ativas sem apuração no mês atual)
  const mesAtual = "2026-03";
  const empComApuracao = new Set(db.apuracoes.filter(a => a.competencia === mesAtual).map(a => a.empresa_id));
  const pendentes = ativas.filter(e => !empComApuracao.has(e.id));

  // Alertas from recent apurações
  const alertasRecentes = db.apuracoes.flatMap(a => (a.alertas || []).map(al => ({...al, emp: a.empresa_nome, comp: a.competencia}))).slice(0, 4);

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
      <div>
        <h1 style={{fontSize:"24px",fontWeight:800,color:T.text,margin:"0 0 4px"}}>Dashboard</h1>
        <p style={{color:T.tm,fontSize:"13px",margin:0}}>{config.escritorio || "LionSolver"} — Março 2026</p>
      </div>
      <Btn icon={ChevronRight} onClick={() => navigate("apuracao")}>Nova Apuração</Btn>
    </div>

    {/* KPIs */}
    <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:20}}>
      <KPI icon={Building2} label="Empresas Ativas" value={ativas.length} sub={`${db.empresas.length} cadastradas`}/>
      <KPI icon={DollarSign} label="DAS Total Apurado" value={fBRL(totalDas)} color={T.ok}/>
      <KPI icon={Calculator} label="Apurações" value={db.apuracoes.length} sub="finalizadas" color={T.i}/>
      <KPI icon={AlertTriangle} label="Pendentes (03/2026)" value={pendentes.length} sub={pendentes.length > 0 ? "empresas sem apuração" : "tudo em dia"} color={pendentes.length > 0 ? T.w : T.ok}/>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
      {/* DAS mensal chart */}
      <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:T.r,padding:"16px 20px"}}>
        <h3 style={{fontSize:"12px",fontWeight:700,color:T.tm,textTransform:"uppercase",margin:"0 0 14px",letterSpacing:"0.04em"}}>DAS Mensal</h3>
        {mesesChart.length === 0 ? <p style={{fontSize:"12px",color:T.td,textAlign:"center",padding:20}}>Nenhuma apuração ainda</p> :
        <div style={{display:"flex",alignItems:"flex-end",gap:8,height:120}}>
          {mesesChart.map(m => {
            const h = (dasPorMes[m] / maxDas) * 100;
            const label = m.split("-").reverse().join("/");
            return <div key={m} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <span style={{fontSize:"9px",fontFamily:T.fm,color:T.tm}}>{fBRL(dasPorMes[m])}</span>
              <div style={{width:"100%",height:`${h}%`,minHeight:4,background:`linear-gradient(180deg, ${T.p}, ${T.p}66)`,borderRadius:"4px 4px 2px 2px"}}/>
              <span style={{fontSize:"9px",color:T.td}}>{label}</span>
            </div>;
          })}
        </div>}
      </div>

      {/* DAS por empresa */}
      <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:T.r,padding:"16px 20px"}}>
        <h3 style={{fontSize:"12px",fontWeight:700,color:T.tm,textTransform:"uppercase",margin:"0 0 14px",letterSpacing:"0.04em"}}>DAS por Empresa</h3>
        {empChart.length === 0 ? <p style={{fontSize:"12px",color:T.td,textAlign:"center",padding:20}}>Nenhuma apuração ainda</p> :
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {empChart.map(([nome, val]) => (
            <div key={nome}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontSize:"11px",color:T.text,fontWeight:600}}>{nome}</span>
                <span style={{fontSize:"11px",fontFamily:T.fm,color:T.tm}}>{fBRL(val)}</span>
              </div>
              <div style={{width:"100%",height:6,background:T.border,borderRadius:3}}>
                <div style={{width:`${(val/maxEmpDas)*100}%`,height:"100%",background:T.ok,borderRadius:3}}/>
              </div>
            </div>
          ))}
        </div>}
      </div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      {/* Apurações recentes */}
      <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:T.r,overflow:"hidden"}}>
        <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h3 style={{fontSize:"12px",fontWeight:700,color:T.tm,textTransform:"uppercase",margin:0}}>Apurações Recentes</h3>
          <Btn v="ghost" sz="sm" onClick={() => navigate("historico")}>Ver todas</Btn>
        </div>
        {recentes.length === 0 ? <p style={{fontSize:"12px",color:T.td,textAlign:"center",padding:20}}>Nenhuma</p> :
        recentes.map((a, i) => (
          <div key={a.id} style={{padding:"10px 16px",borderBottom:i < recentes.length - 1 ? `1px solid ${T.border}` : "none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <p style={{margin:0,fontSize:"12px",fontWeight:600,color:T.text}}>{a.empresa_nome}</p>
              <p style={{margin:"1px 0 0",fontSize:"10px",color:T.tm}}>{a.competencia.split("-").reverse().join("/")}</p>
            </div>
            <span style={{fontSize:"13px",fontWeight:700,fontFamily:T.fm,color:T.ok}}>{fBRL(a.valorDAS)}</span>
          </div>
        ))}
      </div>

      {/* Pendentes + Alertas */}
      <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:T.r,overflow:"hidden"}}>
        <div style={{padding:"12px 16px",borderBottom:`1px solid ${T.border}`}}>
          <h3 style={{fontSize:"12px",fontWeight:700,color:T.tm,textTransform:"uppercase",margin:0}}>Pendentes e Alertas</h3>
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
            <AlertTriangle size={11} style={{color:a.sev === "critico" ? T.err : a.sev === "aviso" ? T.w : T.i,flexShrink:0,marginTop:2}}/>
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
          if (data.version !== "lionsolver-v3") { setImportMsg("Arquivo inválido ou versão incompatível"); return; }
          if (data.config) setConfig(data.config);
          setImportMsg("Backup importado com sucesso! Recarregue o app para ver os dados de empresas e apurações.");
        } catch (err) { setImportMsg("Erro ao ler arquivo: " + err.message); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return <div>
    <h1 style={{fontSize:"24px",fontWeight:800,color:T.text,margin:"0 0 6px"}}>Configurações</h1>
    <p style={{color:T.tm,fontSize:"13px",margin:"0 0 24px"}}>Dados do escritório, preferências e backup</p>

    {/* Dados do escritório */}
    <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:T.r,padding:20,marginBottom:16}}>
      <h3 style={{fontSize:"12px",fontWeight:700,color:T.tm,textTransform:"uppercase",margin:"0 0 14px",letterSpacing:"0.04em"}}>Dados do Escritório</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Inp label="Nome do Escritório" value={config.escritorio} onChange={v => setConfig(c => ({...c, escritorio: v}))} placeholder="Ex: Meu Escritório Contábil" style={{gridColumn:"span 2"}}/>
        <Inp label="Contador Responsável" value={config.contador} onChange={v => setConfig(c => ({...c, contador: v}))} placeholder="Nome completo"/>
        <Inp label="CRC" value={config.crc} onChange={v => setConfig(c => ({...c, crc: v}))} placeholder="CRC/UF-000000" mono/>
      </div>
    </div>

    {/* Dados padrão */}
    <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:T.r,padding:20,marginBottom:16}}>
      <h3 style={{fontSize:"12px",fontWeight:700,color:T.tm,textTransform:"uppercase",margin:"0 0 14px",letterSpacing:"0.04em"}}>Dados Padrão para Novas Empresas</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
        <Sel label="UF Padrão" value={config.ufPadrao} onChange={v => setConfig(c => ({...c, ufPadrao: v}))} options={UFS.map(u => ({v: u, l: u}))}/>
        <Sel label="Cidade Padrão" value={config.cidadePadrao} onChange={v => setConfig(c => ({...c, cidadePadrao: v}))} options={[{v:"",l:"Selecione..."},...(MUNICIPIOS_POR_UF[config.ufPadrao] || []).map(c => ({v: c, l: c}))]}/>
        <Sel label="Regime Padrão" value={config.regimePadrao} onChange={v => setConfig(c => ({...c, regimePadrao: v}))} options={[{v:"caixa",l:"Caixa"},{v:"competencia",l:"Competência"}]}/>
      </div>
    </div>

    {/* Tema */}
    <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:T.r,padding:20,marginBottom:16}}>
      <h3 style={{fontSize:"12px",fontWeight:700,color:T.tm,textTransform:"uppercase",margin:"0 0 14px",letterSpacing:"0.04em"}}>Aparência</h3>
      <div style={{display:"flex",gap:10}}>
        <Btn v={config.tema === "escuro" ? "primary" : "ghost"} sz="sm" onClick={() => setConfig(c => ({...c, tema: "escuro"}))}>Tema Escuro</Btn>
        <Btn v={config.tema === "claro" ? "primary" : "ghost"} sz="sm" onClick={() => setConfig(c => ({...c, tema: "claro"}))}>Tema Claro</Btn>
      </div>
      {config.tema === "claro" && <p style={{fontSize:"11px",color:T.w,margin:"8px 0 0"}}>O tema claro será implementado na versão desktop (Tauri). No protótipo, o tema escuro é o padrão.</p>}
    </div>

    {/* Backup */}
    <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:T.r,padding:20}}>
      <h3 style={{fontSize:"12px",fontWeight:700,color:T.tm,textTransform:"uppercase",margin:"0 0 14px",letterSpacing:"0.04em"}}>Backup e Restauração</h3>
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
  const blank={cnpj:"",razao:"",fantasia:"",abertura:"",regime:"caixa",uf:"BA",cidade:"Salvador",sublimite:"3600000",anexo:"I"};
  const[form,setForm]=useState(blank);

  const filtered=useMemo(()=>{
    let l=db.empresas;
    if(search){const s=search.toLowerCase();l=l.filter(e=>e.razao.toLowerCase().includes(s)||e.cnpj.includes(s)||(e.fantasia||"").toLowerCase().includes(s));}
    return l;
  },[db.empresas,search]);

  const openNew=()=>{setForm(blank);setEditing(null);setModal(true);};
  const openEdit=e=>{setForm({...e,sublimite:String(e.sublimite)});setEditing(e.id);setModal(true);};
  const save=()=>{const d={...form,sublimite:Number(form.sublimite)};editing?db.updE(editing,d):db.addE(d);setModal(false);};

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
      <div><h1 style={{fontSize:"24px",fontWeight:800,color:T.text,margin:0}}>Empresas</h1><p style={{color:T.tm,fontSize:"13px",margin:"4px 0 0"}}>{db.empresas.filter(e=>e.ativa).length} ativas</p></div>
      <Btn icon={Plus} onClick={openNew}>Nova Empresa</Btn>
    </div>
    <div style={{position:"relative",maxWidth:320,marginBottom:16}}>
      <Search size={14} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:T.td}}/>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." style={{width:"100%",padding:"9px 12px 9px 32px",background:T.bgIn,border:`1px solid ${T.border}`,borderRadius:T.rs,color:T.text,fontSize:"12px",fontFamily:T.f,outline:"none",boxSizing:"border-box"}}/>
    </div>
    <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:T.r,overflow:"hidden"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
          {["CNPJ","Empresa","UF/Cidade","Anexo","Abertura","Status",""].map(h=><th key={h} style={{padding:"10px 12px",fontSize:"9px",fontWeight:700,color:T.td,textTransform:"uppercase",textAlign:"left"}}>{h}</th>)}
        </tr></thead>
        <tbody>{filtered.map(e=><tr key={e.id} style={{borderBottom:`1px solid ${T.border}`}} onMouseEnter={ev=>ev.currentTarget.style.background=T.bgHov} onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
          <td style={{padding:"10px 12px",fontFamily:T.fm,fontSize:"11px",color:T.text}}>{e.cnpj}</td>
          <td style={{padding:"10px 12px",fontSize:"12px",fontWeight:600,color:T.text}}>{e.fantasia||e.razao}</td>
          <td style={{padding:"10px 12px",fontSize:"11px",color:T.tm}}>{e.cidade}/{e.uf}</td>
          <td style={{padding:"10px 12px"}}><Badge>{e.anexo}</Badge></td>
          <td style={{padding:"10px 12px",fontSize:"11px",fontFamily:T.fm,color:T.tm}}>{e.abertura}</td>
          <td style={{padding:"10px 12px"}}><Badge color={e.ativa?"success":"danger"}>{e.ativa?"Ativa":"Inativa"}</Badge></td>
          <td style={{padding:"10px 12px"}}><div style={{display:"flex",gap:3}}>
            <Btn v="ghost" sz="sm" icon={Edit3} onClick={()=>openEdit(e)}/>
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
        <Sel label="Anexo Padrão" value={form.anexo} onChange={v=>setForm(f=>({...f,anexo:v}))} options={ANEXO_OPTS} required/>
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
    <h1 style={{fontSize:"24px",fontWeight:800,color:T.text,margin:"0 0 6px"}}>Histórico</h1>
    <p style={{color:T.tm,fontSize:"13px",margin:"0 0 20px"}}>{db.apuracoes.length} apurações</p>
    {sorted.length===0?<div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:T.r,padding:"50px 20px",textAlign:"center"}}><History size={36} style={{color:T.td,marginBottom:10}}/><p style={{fontSize:"13px",color:T.tm}}>Nenhuma apuração ainda</p></div>:
    <div style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:T.r,overflow:"hidden"}}>
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
   APP SHELL
   ══════════════════════════════════════════════════════════════ */
const NAV=[{id:"dashboard",label:"Dashboard",icon:LayoutDashboard},{id:"empresas",label:"Empresas",icon:Building2},{id:"apuracao",label:"Apuração",icon:Calculator},{id:"historico",label:"Histórico",icon:History},{id:"config",label:"Configurações",icon:Settings}];

export default function App(){
  const[page,setPage]=useState("dashboard");
  const[col,setCol]=useState(false);
  const[report,setReport]=useState(null);
  const[config,setConfig]=useState({escritorio:"",contador:"",crc:"",ufPadrao:"BA",cidadePadrao:"Salvador",regimePadrao:"caixa",tema:"escuro"});
  const db=useDB();

  // Wire up the global report modal setter
  _setReportModal = setReport;

  const render=()=>{switch(page){
    case"dashboard":return <DashboardPage db={db} navigate={setPage} config={config}/>;
    case"empresas":return <EmpresasPage db={db}/>;
    case"apuracao":return <ApuracaoPage db={db} navigate={setPage}/>;
    case"historico":return <HistoricoPage db={db}/>;
    case"config":return <ConfigPage config={config} setConfig={setConfig} db={db}/>;
    default:return <DashboardPage db={db} navigate={setPage} config={config}/>;
  }};
  return <div style={{display:"flex",height:"100vh",fontFamily:T.f,background:T.bg,color:T.text,overflow:"hidden"}}>
    <ReportModal report={report} onClose={() => setReport(null)} />
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px}
      select option{background:${T.bgIn};color:${T.text}}input::placeholder{color:${T.td}}
    `}</style>

    <aside style={{width:col?56:200,background:T.bgSide,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",transition:"width 0.25s",flexShrink:0,overflow:"hidden"}}>
      <div style={{padding:col?"14px 8px":"14px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:30,height:30,borderRadius:"7px",background:`linear-gradient(135deg,${T.p},${T.pH})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"14px",fontWeight:800,color:T.bg}}>L</div>
        {!col&&<div><p style={{fontSize:"13px",fontWeight:800,color:T.text,margin:0}}>LionSolver</p><p style={{fontSize:"8px",color:T.td,margin:0,letterSpacing:"0.08em",textTransform:"uppercase"}}>Simples Nacional v3</p></div>}
      </div>
      <nav style={{flex:1,padding:"8px 4px",display:"flex",flexDirection:"column",gap:1}}>
        {NAV.map(n=>{const a=page===n.id;return <button key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",alignItems:"center",gap:8,padding:col?"9px 0":"9px 10px",justifyContent:col?"center":"flex-start",background:a?T.pD:"transparent",color:a?T.p:T.tm,border:"none",borderRadius:T.rs,cursor:"pointer",fontFamily:T.f,fontSize:"12px",fontWeight:a?700:500,width:"100%",borderLeft:a?`3px solid ${T.p}`:"3px solid transparent"}}><n.icon size={15}/>{!col&&n.label}</button>;})}
      </nav>
      <div style={{padding:"8px 4px",borderTop:`1px solid ${T.border}`}}>
        <button onClick={()=>setCol(!col)} style={{display:"flex",alignItems:"center",justifyContent:"center",width:"100%",padding:6,background:"transparent",border:"none",color:T.td,cursor:"pointer",borderRadius:T.rs,fontSize:"10px",fontFamily:T.f}}><Menu size={13}/>{!col&&<span style={{marginLeft:6}}>Recolher</span>}</button>
      </div>
    </aside>

    <main style={{flex:1,overflow:"auto",padding:"24px 28px"}}>{render()}</main>
  </div>;
}
