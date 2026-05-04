#!/usr/bin/env node
/**
 * Meta Ads Weekly Dashboard Generator
 * Uso: node fetch_and_generate.js [data_inicio] [data_fim]
 * Ex:  node fetch_and_generate.js 2026-04-20 2026-04-27
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const ACCESS_TOKEN = 'EAAddAZBQXZBVgBRUZA99A0RPMeJupq5ySe6tYsBZCDkwEKM07sQlLCEUTfUJUyhKELJxInueHeSWmzQrdctYPazkZAbTRAEQZBWcN0z3hy9j1kt0WAayl6sHCIxAG3Jnatz5VqoSUdn95zKT3mAflqZBCrzqbxgjQLf4UiNxdd1EnRGO0OkhWZBZA7M6WEvWgt063QRVhNnJwGy7Nanf84AvQVPVGzgDEjFHk3MVF';

const ACCOUNTS = [
  { id: 'act_101403706860167', name: 'Perfiletto' },
  { id: 'act_267770730525130', name: 'Helena Coelho' },
  { id: 'act_2410626089217011', name: 'Conta 2410' },
  { id: 'act_1182499605271369', name: 'MM Protege' },
  { id: 'act_655917871724513', name: 'Ergy Diesel' },
  { id: 'act_196598645524416', name: 'Marcelo Costa' },
  { id: 'act_297842908343350', name: 'Centro do Sorriso Arapongas' },
  { id: 'act_404664394554450', name: 'Saniteck' },
  { id: 'act_558494692916247', name: 'Lady Livretos' },
  { id: 'act_839314777805875', name: 'Centro do Sorriso Campo Mourão' },
  { id: 'act_1047813853024474', name: 'Cheflera' },
  { id: 'act_1559065974904383', name: 'Clínica Moliah' },
  { id: 'act_985077316316981', name: 'Arezzo' },
  { id: 'act_1463630264317907', name: 'Ana Capri' },
  { id: 'act_1648225505751115', name: 'Comunidade Trindade Santa' },
  { id: 'act_864538029208474', name: 'Monique' },
  { id: 'act_557811123855687', name: 'Loja Trindade Santa' },
  { id: 'act_2029226410831026', name: 'CA - Helena' },
  { id: 'act_1205207067848409', name: 'Centro do Sorriso Rolândia' },
  { id: 'act_1303967340832416', name: 'Odonto Bless Londrina' },
  { id: 'act_668541309479669', name: 'Castro e Figueira' },
  { id: 'act_1908379856581665', name: 'Carol Meirelles' },
  { id: 'act_1575227266844090', name: 'Vedoi' },
  { id: 'act_877477095207362', name: 'Star Veículos' },
];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve({ data: [], error: 'parse error' }); }
      });
    }).on('error', err => resolve({ data: [], error: err.message }));
  });
}

async function fetchInsights(accountId, dateStart, dateEnd) {
  const params = new URLSearchParams({
    fields: 'spend,impressions,clicks,ctr,cpm,cpc,actions,cost_per_action_type,reach',
    time_range: JSON.stringify({ since: dateStart, until: dateEnd }),
    level: 'account',
    access_token: ACCESS_TOKEN,
  });
  return fetchUrl(`https://graph.facebook.com/v19.0/${accountId}/insights?${params}`);
}

async function fetchCampaigns(accountId, dateStart, dateEnd) {
  const params = new URLSearchParams({
    fields: 'campaign_name,spend,impressions,clicks,ctr,cpc,actions',
    time_range: JSON.stringify({ since: dateStart, until: dateEnd }),
    level: 'campaign',
    access_token: ACCESS_TOKEN,
    limit: '50',
  });
  return fetchUrl(`https://graph.facebook.com/v19.0/${accountId}/insights?${params}`);
}

function getAction(actions, type) {
  if (!actions) return 0;
  const a = actions.find(x => x.action_type === type);
  return a ? parseFloat(a.value) : 0;
}

function getCost(costs, type) {
  if (!costs) return 0;
  const c = costs.find(x => x.action_type === type);
  return c ? parseFloat(c.value) : 0;
}

function fmtBRL(v) {
  if (!v || v === 0) return 'R$ 0,00';
  return 'R$ ' + parseFloat(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtNum(v) {
  if (!v || v === 0) return '0';
  return parseInt(v).toLocaleString('pt-BR');
}
function fmtPct(v) {
  return parseFloat(v || 0).toFixed(2) + '%';
}

function analyze(account, insightsData, campaignsData) {
  const d = (insightsData.data || [])[0] || {};
  const spend = parseFloat(d.spend || 0);
  const impressions = parseInt(d.impressions || 0);
  const clicks = parseInt(d.clicks || 0);
  const ctr = parseFloat(d.ctr || 0);
  const cpm = parseFloat(d.cpm || 0);
  const cpc = parseFloat(d.cpc || 0);
  const reach = parseInt(d.reach || 0);
  const actions = d.actions || [];
  const costs = d.cost_per_action_type || [];

  const leads = Math.max(
    getAction(actions, 'lead'),
    getAction(actions, 'offsite_conversion.fb_pixel_lead'),
    getAction(actions, 'onsite_conversion.lead_grouped')
  );
  const messages = getAction(actions, 'onsite_conversion.messaging_conversation_started_7d');
  const totalLeads = Math.round(leads + messages);
  const costPerLead = totalLeads > 0 ? spend / totalLeads : 0;

  const campaigns = campaignsData.data || [];
  const lowPerf = campaigns.filter(c => {
    const cSpend = parseFloat(c.spend || 0);
    const cClicks = parseInt(c.clicks || 0);
    const cImpr = parseInt(c.impressions || 0);
    const cCtr = parseFloat(c.ctr || 0);
    return (cSpend > 50 && cClicks === 0) || (cImpr > 5000 && cCtr < 0.5);
  }).map(c => ({
    name: c.campaign_name || 'Campanha',
    spend: parseFloat(c.spend || 0),
    reason: parseInt(c.clicks || 0) === 0 ? 'Gasto sem cliques' : `CTR baixo (${parseFloat(c.ctr || 0).toFixed(2)}%)`,
  }));

  return {
    name: account.name,
    spend, impressions, clicks, ctr, cpm, cpc, reach,
    leads: totalLeads,
    costPerLead,
    messages: Math.round(messages),
    rawLeads: Math.round(leads),
    lowPerf,
    hasData: spend > 0 || impressions > 0,
  };
}

function suggestions(acc) {
  const s = [];
  if (acc.spend === 0) return ['⚠️ Conta sem investimento no período — verificar se campanhas estão ativas.'];
  if (acc.ctr > 0 && acc.ctr < 0.8) s.push('📌 CTR abaixo de 0,8% — testar novos criativos para melhorar engajamento.');
  if (acc.cpm > 30) s.push('📌 CPM elevado (>R$30) — revisar segmentação de público para reduzir custos.');
  if (acc.cpc > 5) s.push('📌 CPC alto — otimizar landing page e CTA dos anúncios.');
  if (acc.costPerLead > 80 && acc.leads > 0) s.push(`📌 Custo por lead elevado (${fmtBRL(acc.costPerLead)}) — revisar funil e qualidade do público.`);
  if (acc.leads === 0 && acc.spend > 100) s.push('🚨 Nenhum lead gerado com investimento significativo — revisar objetivo das campanhas.');
  if (acc.ctr > 2) s.push('✅ CTR excelente — escalar orçamento para maximizar resultados.');
  if (acc.costPerLead > 0 && acc.costPerLead < 30) s.push('✅ Custo por lead eficiente — aumentar orçamento para escalar captação.');
  if (acc.messages > 0 && acc.rawLeads === 0) s.push('💡 Conversões via mensagens detectadas — criar campanha específica de WhatsApp.');
  if (acc.impressions > 100000 && acc.clicks < 500) s.push('💡 Alto alcance mas poucos cliques — refinar segmentação por interesse.');
  acc.lowPerf.forEach(c => s.push(`🔴 Pausar campanha "${c.name.substring(0, 50)}" — ${c.reason} (${fmtBRL(c.spend)} investidos).`));
  if (s.length === 0) s.push('✅ Conta com desempenho estável. Manter estratégia e monitorar semanalmente.');
  return s;
}

function newCampaignIdeas(acc) {
  const ideas = [];
  if (acc.messages > 20) ideas.push('📲 Campanha de Mensagens Avançada — criar fluxo automatizado no WhatsApp para nurturing.');
  if (acc.spend > 500 && acc.leads > 10) ideas.push('🎯 Retargeting — criar público personalizado de visitantes/engajadores para remarketing.');
  if (acc.impressions > 50000) ideas.push('👥 Lookalike Audience — criar público semelhante baseado nos melhores leads.');
  if (acc.ctr > 1.5) ideas.push('🚀 Escalar campanha com melhor CTR — duplicar conjunto e aumentar orçamento.');
  if (ideas.length === 0) ideas.push('🧪 Teste A/B de Criativos — criar 3 variações de anúncio para identificar melhor performance.');
  return ideas;
}

function generateHTML(accountsData, dateStart, dateEnd) {
  const fmtDate = d => d.split('-').reverse().join('/');
  const ds = fmtDate(dateStart);
  const de = fmtDate(dateEnd);
  const now = new Date().toLocaleString('pt-BR');

  const totalSpend = accountsData.reduce((s, a) => s + a.spend, 0);
  const totalImpr = accountsData.reduce((s, a) => s + a.impressions, 0);
  const totalClicks = accountsData.reduce((s, a) => s + a.clicks, 0);
  const totalLeads = accountsData.reduce((s, a) => s + a.leads, 0);
  const activeAcc = accountsData.filter(a => a.hasData).length;
  const avgCtr = totalImpr > 0 ? (totalClicks / totalImpr * 100) : 0;
  const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0;

  const cards = accountsData.map(acc => {
    const sug = suggestions(acc);
    const ideas = newCampaignIdeas(acc);
    let statusBadge, statusClass;
    if (!acc.hasData) {
      statusBadge = '<span class="badge badge-inactive">Sem dados</span>';
      statusClass = 'card-inactive';
    } else if (acc.ctr > 1.5 && acc.costPerLead < 50 && acc.leads > 0) {
      statusBadge = '<span class="badge badge-good">Performance Boa</span>';
      statusClass = 'card-good';
    } else if ((acc.ctr < 0.5 && acc.ctr > 0) || acc.costPerLead > 80) {
      statusBadge = '<span class="badge badge-bad">Atenção</span>';
      statusClass = 'card-bad';
    } else {
      statusBadge = '<span class="badge badge-ok">Normal</span>';
      statusClass = 'card-ok';
    }

    const ctrClass = acc.ctr > 1.5 ? 'ctr-good' : (acc.ctr < 0.5 && acc.ctr > 0 ? 'ctr-bad' : '');
    const cplClass = acc.costPerLead > 0 && acc.costPerLead < 50 ? 'cpl-good' : (acc.costPerLead > 80 ? 'cpl-bad' : '');

    const sugHtml = sug.map(s => `<li>${s}</li>`).join('');
    const ideaHtml = ideas.map(i => `<li>${i}</li>`).join('');
    const lowPerfHtml = acc.lowPerf.length ? `
      <div class="section-block warning-block">
        <h4>🔴 Campanhas para Pausar/Revisar</h4>
        <ul>${acc.lowPerf.map(c => `<li>🔴 <strong>${c.name.substring(0, 60)}</strong> — ${c.reason}</li>`).join('')}</ul>
      </div>` : '';

    return `
    <div class="client-card ${statusClass}">
      <div class="card-header">
        <div class="client-info">
          <div class="client-avatar">${acc.name[0].toUpperCase()}</div>
          <div>
            <h3>${acc.name}</h3>
            <span class="period-label">📅 ${ds} → ${de}</span>
          </div>
        </div>
        ${statusBadge}
      </div>
      <div class="metrics-grid">
        <div class="metric-block meta-color">
          <div class="metric-section-title">💰 META ADS</div>
          <div class="metric-row"><span class="metric-label">Investimento</span><span class="metric-value highlight">${fmtBRL(acc.spend)}</span></div>
          <div class="metric-row"><span class="metric-label">Impressões</span><span class="metric-value">${fmtNum(acc.impressions)}</span></div>
          <div class="metric-row"><span class="metric-label">Cliques</span><span class="metric-value">${fmtNum(acc.clicks)}</span></div>
          <div class="metric-row"><span class="metric-label">Conversas Iniciadas</span><span class="metric-value">${fmtNum(acc.messages)}</span></div>
          <div class="metric-row"><span class="metric-label">CTR</span><span class="metric-value ${ctrClass}">${fmtPct(acc.ctr)}</span></div>
          <div class="metric-row"><span class="metric-label">Custo por Mil (CPM)</span><span class="metric-value">${fmtBRL(acc.cpm)}</span></div>
          <div class="metric-row"><span class="metric-label">Custo por Clique</span><span class="metric-value">${fmtBRL(acc.cpc)}</span></div>
          <div class="metric-row"><span class="metric-label">Todos os Leads</span><span class="metric-value highlight">${fmtNum(acc.leads)}</span></div>
          <div class="metric-row"><span class="metric-label">Custo por Lead</span><span class="metric-value ${cplClass}">${fmtBRL(acc.costPerLead)}</span></div>
          <div class="metric-row"><span class="metric-label">Alcance</span><span class="metric-value">${fmtNum(acc.reach)}</span></div>
        </div>
      </div>
      <div class="analysis-section">
        ${lowPerfHtml}
        <div class="section-block suggestions-block">
          <h4>💡 Sugestões de Melhoria</h4>
          <ul>${sugHtml}</ul>
        </div>
        <div class="section-block campaigns-block">
          <h4>🚀 Novas Campanhas a Criar</h4>
          <ul>${ideaHtml}</ul>
        </div>
      </div>
    </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard Meta Ads — ${ds} a ${de}</title>
  <style>
    :root{--blue:#1877F2;--dark:#0d0d0d;--card:#141414;--border:#2a2a2a;--text:#e8e8e8;--muted:#888;--green:#00d67a;--red:#ff4444;--yellow:#ffd700;--purple:#b388ff}
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--dark);color:var(--text);min-height:100vh}
    .top-banner{background:linear-gradient(135deg,#1877F2 0%,#0050c8 50%,#003a9e 100%);padding:30px 40px;text-align:center;position:relative;overflow:hidden}
    .top-banner::before{content:'';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(255,255,255,.05) 0%,transparent 60%);animation:pulse 4s ease-in-out infinite}
    @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
    .banner-logo{font-size:13px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,.6);margin-bottom:8px}
    .banner-title{font-size:34px;font-weight:800;color:#fff;margin-bottom:6px}
    .banner-period{font-size:16px;color:rgba(255,255,255,.85)}
    .banner-generated{font-size:12px;color:rgba(255,255,255,.45);margin-top:8px}
    .summary-bar{display:flex;justify-content:center;background:#111;border-bottom:1px solid var(--border);flex-wrap:wrap}
    .summary-item{padding:20px 28px;text-align:center;border-right:1px solid var(--border);min-width:130px}
    .summary-item:last-child{border-right:none}
    .summary-num{font-size:22px;font-weight:800;color:var(--blue)}
    .summary-label{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-top:4px}
    .controls{padding:16px 40px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;background:#111;border-bottom:1px solid var(--border)}
    .filter-btn{padding:7px 16px;border-radius:20px;border:1px solid var(--border);background:transparent;color:var(--text);cursor:pointer;font-size:13px;transition:all .2s}
    .filter-btn:hover,.filter-btn.active{background:var(--blue);border-color:var(--blue)}
    .search-box{padding:7px 16px;border-radius:20px;border:1px solid var(--border);background:#1a1a1a;color:var(--text);font-size:13px;width:220px;outline:none}
    .search-box:focus{border-color:var(--blue)}
    .dashboard-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(560px,1fr));gap:20px;padding:30px 40px;max-width:1600px;margin:0 auto}
    .client-card{background:var(--card);border-radius:16px;overflow:hidden;border:1px solid var(--border);transition:transform .2s,box-shadow .2s}
    .client-card:hover{transform:translateY(-2px);box-shadow:0 8px 40px rgba(24,119,242,.15)}
    .card-good{border-left:4px solid var(--green)}
    .card-bad{border-left:4px solid var(--red)}
    .card-ok{border-left:4px solid var(--blue)}
    .card-inactive{border-left:4px solid #444;opacity:.55}
    .card-header{padding:18px 20px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);background:linear-gradient(to right,#1a1a1a,#141414)}
    .client-info{display:flex;align-items:center;gap:14px}
    .client-avatar{width:44px;height:44px;border-radius:12px;background:var(--blue);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;flex-shrink:0}
    .client-info h3{font-size:16px;font-weight:700;color:#fff}
    .period-label{font-size:11px;color:var(--muted);margin-top:2px;display:block}
    .badge{padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
    .badge-good{background:rgba(0,214,122,.15);color:var(--green);border:1px solid rgba(0,214,122,.3)}
    .badge-bad{background:rgba(255,68,68,.15);color:var(--red);border:1px solid rgba(255,68,68,.3)}
    .badge-ok{background:rgba(24,119,242,.15);color:var(--blue);border:1px solid rgba(24,119,242,.3)}
    .badge-inactive{background:rgba(100,100,100,.15);color:#666;border:1px solid #333}
    .metrics-grid{padding:16px 20px}
    .metric-block{border-radius:10px;overflow:hidden;border:1px solid rgba(255,255,255,.06)}
    .metric-section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;padding:10px 14px;background:rgba(24,119,242,.08);color:#5b9cf6;border-bottom:1px solid rgba(24,119,242,.15)}
    .metric-row{display:flex;justify-content:space-between;align-items:center;padding:9px 14px;border-bottom:1px solid rgba(255,255,255,.04);transition:background .15s}
    .metric-row:hover{background:rgba(255,255,255,.03)}
    .metric-row:last-child{border-bottom:none}
    .metric-label{font-size:13px;color:var(--muted)}
    .metric-value{font-size:14px;font-weight:600;color:var(--text)}
    .metric-value.highlight{color:var(--yellow);font-size:15px}
    .ctr-good{color:var(--green)!important}
    .ctr-bad{color:var(--red)!important}
    .cpl-good{color:var(--green)!important}
    .cpl-bad{color:var(--red)!important}
    .analysis-section{padding:0 20px 18px}
    .section-block{border-radius:10px;margin-top:12px;overflow:hidden}
    .section-block h4{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:10px 14px}
    .section-block ul{list-style:none;padding:0}
    .section-block li{padding:8px 14px;font-size:13px;line-height:1.5;border-bottom:1px solid rgba(255,255,255,.04);color:#ccc}
    .section-block li:last-child{border-bottom:none;padding-bottom:10px}
    .suggestions-block{background:rgba(24,119,242,.05);border:1px solid rgba(24,119,242,.15)}
    .suggestions-block h4{color:#5b9cf6;background:rgba(24,119,242,.08)}
    .campaigns-block{background:rgba(155,89,182,.05);border:1px solid rgba(155,89,182,.15)}
    .campaigns-block h4{color:var(--purple);background:rgba(155,89,182,.08)}
    .warning-block{background:rgba(255,68,68,.05);border:1px solid rgba(255,68,68,.15)}
    .warning-block h4{color:var(--red);background:rgba(255,68,68,.08)}
    .footer{text-align:center;padding:30px;color:var(--muted);font-size:12px;border-top:1px solid var(--border);margin-top:20px}
    .hidden{display:none!important}
    @media(max-width:768px){.dashboard-grid{grid-template-columns:1fr;padding:15px}.summary-bar{justify-content:flex-start;overflow-x:auto}.controls{padding:15px}.banner-title{font-size:22px}}
  </style>
</head>
<body>

<div class="top-banner">
  <div class="banner-logo">Ao Cubo Marketing · Relatório Semanal</div>
  <div class="banner-title">📊 Dashboard Meta Ads</div>
  <div class="banner-period">Período: ${ds} — ${de}</div>
  <div class="banner-generated">Gerado em ${now}</div>
</div>

<div class="summary-bar">
  <div class="summary-item"><div class="summary-num">${activeAcc}</div><div class="summary-label">Contas Ativas</div></div>
  <div class="summary-item"><div class="summary-num">${fmtBRL(totalSpend)}</div><div class="summary-label">Investimento Total</div></div>
  <div class="summary-item"><div class="summary-num">${fmtNum(totalImpr)}</div><div class="summary-label">Impressões</div></div>
  <div class="summary-item"><div class="summary-num">${fmtNum(totalClicks)}</div><div class="summary-label">Cliques</div></div>
  <div class="summary-item"><div class="summary-num">${fmtNum(totalLeads)}</div><div class="summary-label">Leads Totais</div></div>
  <div class="summary-item"><div class="summary-num">${fmtPct(avgCtr)}</div><div class="summary-label">CTR Médio</div></div>
  <div class="summary-item"><div class="summary-num">${fmtBRL(avgCpl)}</div><div class="summary-label">CPL Médio</div></div>
</div>

<div class="controls">
  <input class="search-box" type="text" placeholder="🔍 Buscar cliente..." oninput="filterCards(this.value)" />
  <button class="filter-btn active" onclick="filterStatus('all',this)">Todos</button>
  <button class="filter-btn" onclick="filterStatus('good',this)">✅ Boa performance</button>
  <button class="filter-btn" onclick="filterStatus('bad',this)">⚠️ Atenção</button>
  <button class="filter-btn" onclick="filterStatus('inactive',this)">📴 Sem dados</button>
</div>

<div class="dashboard-grid" id="grid">
${cards}
</div>

<div class="footer">
  Dashboard gerado automaticamente · Ao Cubo Marketing · ${now}<br>
  Dados via Meta Ads API v19.0 · Período: ${ds} a ${de}
</div>

<script>
function filterCards(q){q=q.toLowerCase();document.querySelectorAll('.client-card').forEach(c=>{c.classList.toggle('hidden',!c.querySelector('h3').textContent.toLowerCase().includes(q))})}
function filterStatus(s,btn){document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');document.querySelectorAll('.client-card').forEach(c=>{c.classList.toggle('hidden',s!=='all'&&!c.classList.contains('card-'+s))})}
</script>
</body>
</html>`;
}

async function main() {
  let dateStart, dateEnd;

  if (process.argv[2] && process.argv[3]) {
    dateStart = process.argv[2];
    dateEnd = process.argv[3];
  } else {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToLastMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + 7;
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - daysToLastMonday);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    dateStart = lastMonday.toISOString().split('T')[0];
    dateEnd = lastSunday.toISOString().split('T')[0];
  }

  console.log('\n' + '='.repeat(62));
  console.log(`  META ADS DASHBOARD — ${dateStart} a ${dateEnd}`);
  console.log('='.repeat(62));
  console.log(`  Buscando dados de ${ACCOUNTS.length} contas...\n`);

  const accountsData = [];
  for (let i = 0; i < ACCOUNTS.length; i++) {
    const account = ACCOUNTS[i];
    const label = `[${String(i+1).padStart(2,'0')}/${ACCOUNTS.length}] ${account.name.padEnd(38)}`;
    process.stdout.write(`  ${label} → `);

    const [insights, campaigns] = await Promise.all([
      fetchInsights(account.id, dateStart, dateEnd),
      fetchCampaigns(account.id, dateStart, dateEnd),
    ]);

    const data = analyze(account, insights, campaigns);
    accountsData.push(data);

    const status = data.hasData
      ? `R$ ${data.spend.toFixed(0)} | ${data.leads} leads`
      : 'sem dados';
    console.log(status);
  }

  accountsData.sort((a, b) => b.spend - a.spend);

  const html = generateHTML(accountsData, dateStart, dateEnd);
  const outDir = __dirname;
  const filename = `dashboard_${dateStart}_${dateEnd}.html`;
  const filepath = path.join(outDir, filename);
  const latestPath = path.join(outDir, 'dashboard_latest.html');

  fs.writeFileSync(filepath, html, 'utf8');
  fs.writeFileSync(latestPath, html, 'utf8');

  const total = accountsData.reduce((s, a) => s + a.spend, 0);
  const leads = accountsData.reduce((s, a) => s + a.leads, 0);

  console.log('\n' + '='.repeat(62));
  console.log(`  ✅ Dashboard gerado: ${filename}`);
  console.log(`  💰 Total investido: R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
  console.log(`  🎯 Total de leads: ${leads}`);
  console.log(`  📁 Arquivo: ${filepath}`);
  console.log('='.repeat(62) + '\n');
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
