const fs = require('fs');
const path = require('path');

const DATA_DIR = 'C:/Users/trafe/.claude/meta-dashboard/data';

const ACCOUNT_NAMES = {
  'act_267770730525130': 'Helena Coelho',
  'act_2410626089217011': '2410626089217011',
  'act_1182499605271369': 'MM Protege',
  'act_655917871724513': 'Ergy Diesel',
  'act_196598645524416': 'Marcelo Costa',
  'act_297842908343350': 'CA 01 - Arapongas Centro do Sorriso',
  'act_404664394554450': 'Anúncios Saniteck',
  'act_558494692916247': 'Lady Livretos',
  'act_839314777805875': 'Centro do Sorriso Campo Mourão ADS',
  'act_1047813853024474': 'CHEFLERA ADS',
  'act_1559065974904383': 'CA01 | Clínica Moliah',
  'act_279095665284636': 'CA - Sleep Backup',
  'act_985077316316981': 'Arezzo Ads',
  'act_1463630264317907': 'Ana Capri',
  'act_1648225505751115': 'CA - Comunidade Trindade Santa',
  'act_864538029208474': 'INSTA - MONIQUE',
  'act_557811123855687': 'CA - Loja Trindade Santa',
  'act_2029226410831026': 'CA - HELENA',
  'act_1205207067848409': 'CA 01 - Rolândia Centro do Sorriso',
  'act_1303967340832416': 'Conta de Anúncio - Odonto Bless Londrina',
  'act_668541309479669': 'CA - Castro e Figueira',
  'act_1908379856581665': 'CA - Carol Meirelles 2',
  'act_1575227266844090': 'Vedoi',
  'act_877477095207362': 'Star Veículos'
};

function extractResult(actions) {
  if (!actions) return { type: 'N/A', value: 0 };
  const RESULT_TYPES = [
    { key: 'onsite_conversion.total_messaging_connection', label: 'Mensagens' },
    { key: 'onsite_conversion.lead', label: 'Leads' },
    { key: 'lead', label: 'Leads' },
    { key: 'offsite_complete_registration_add_meta_leads', label: 'Cadastros' },
    { key: 'onsite_web_lead', label: 'Leads Web' },
    { key: 'onsite_conversion.messaging_conversation_started_7d', label: 'Conv. WhatsApp' },
    { key: 'link_click', label: 'Cliques no Link' },
  ];
  for (const rt of RESULT_TYPES) {
    const act = actions.find(a => a.action_type === rt.key);
    if (act && parseInt(act.value) > 0) {
      return { type: rt.label, value: parseInt(act.value) };
    }
  }
  const pe = actions.find(a => a.action_type === 'post_engagement');
  return { type: 'Engajamento', value: parseInt((pe || { value: '0' }).value) };
}

function getCPA(costPerAction) {
  if (!costPerAction) return null;
  const RESULT_TYPES = [
    'onsite_conversion.total_messaging_connection',
    'onsite_conversion.lead',
    'lead',
    'offsite_complete_registration_add_meta_leads',
    'onsite_web_lead',
    'link_click',
  ];
  for (const rt of RESULT_TYPES) {
    const c = costPerAction.find(a => a.action_type === rt);
    if (c) return parseFloat(c.value);
  }
  return null;
}

function generateCampaignRecommendations(camp) {
  const recs = [];

  if (camp.ctr < 0.5) {
    recs.push({ type: 'warning', text: `CTR muito baixo (${camp.ctr.toFixed(2)}%) — Teste novos criativos com chamada para ação mais direta. Considere vídeos curtos com gancho nos primeiros 3 segundos.` });
  } else if (camp.ctr > 2.0) {
    recs.push({ type: 'success', text: `CTR excelente (${camp.ctr.toFixed(2)}%) — Aumente o orçamento para escalar os resultados desta campanha.` });
  }

  if (camp.cpc > 2.0) {
    recs.push({ type: 'warning', text: `CPC alto (R$${camp.cpc.toFixed(2)}) — Refine a segmentação de público ou ative Advantage+ para otimização automática.` });
  } else if (camp.cpc > 0 && camp.cpc < 0.5) {
    recs.push({ type: 'success', text: `CPC baixo (R$${camp.cpc.toFixed(2)}) — Ótima eficiência! Escale o investimento com cautela.` });
  }

  if (camp.frequency > 2.5) {
    recs.push({ type: 'danger', text: `Frequência alta (${camp.frequency.toFixed(1)}x) — Público saturado! Expanda o público ou renove os criativos urgentemente para evitar fadiga.` });
  } else if (camp.frequency > 1.8) {
    recs.push({ type: 'warning', text: `Frequência moderada-alta (${camp.frequency.toFixed(1)}x) — Prepare novos criativos para substituição em breve.` });
  }

  if (camp.cpa && camp.cpa > 80) {
    recs.push({ type: 'danger', text: `CPA muito elevado (R$${camp.cpa.toFixed(2)}) — Revise landing page, oferta e segmentação urgentemente.` });
  } else if (camp.cpa && camp.cpa > 40) {
    recs.push({ type: 'warning', text: `CPA elevado (R$${camp.cpa.toFixed(2)}) — Revise a landing page e o fluxo de conversão para melhorar o custo.` });
  } else if (camp.cpa && camp.cpa < 15) {
    recs.push({ type: 'success', text: `CPA excelente (R$${camp.cpa.toFixed(2)}) — Aumente o investimento para multiplicar resultados!` });
  }

  if (camp.impressions > 0 && camp.clicks === 0) {
    recs.push({ type: 'danger', text: 'Zero cliques com impressões — Verifique se os anúncios estão ativos e se o criativo está aprovado.' });
  }

  if (recs.length === 0) {
    recs.push({ type: 'info', text: 'Performance estável. Monitore diariamente e teste novos criativos a cada 14 dias para evitar fadiga de anúncio.' });
  }

  return recs;
}

function generateAccountRecommendations(campaigns) {
  const recs = [];
  if (campaigns.length === 0) return [{ type: 'info', text: 'Nenhuma campanha ativa no período 01/04 - 17/04/2026.' }];

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const saturated = campaigns.filter(c => c.frequency > 2.5);
  const highCTR = campaigns.filter(c => c.ctr > 1.5);
  const lowCPA = campaigns.filter(c => c.cpa && c.cpa < 20);
  const highCPA = campaigns.filter(c => c.cpa && c.cpa > 60);

  if (saturated.length > 0) {
    recs.push({ type: 'danger', text: `${saturated.length} campanha(s) com frequência acima de 2.5x — renovação de criativos urgente.` });
  }
  if (highCTR.length > 0) {
    recs.push({ type: 'success', text: `${highCTR.length} campanha(s) com CTR acima de 1.5% — excelente engajamento, considere escalar orçamento.` });
  }
  if (lowCPA.length > 0) {
    recs.push({ type: 'success', text: `${lowCPA.length} campanha(s) com CPA abaixo de R$20 — performance excelente, escale investimento!` });
  }
  if (highCPA.length > 0) {
    recs.push({ type: 'warning', text: `${highCPA.length} campanha(s) com CPA acima de R$60 — revise segmentação e landing pages.` });
  }
  if (recs.length === 0) {
    recs.push({ type: 'info', text: `R$${totalSpend.toFixed(2)} investidos no período. Performance dentro do esperado — otimize continuamente.` });
  }

  return recs;
}

const allAccounts = [];

for (const [actId, actName] of Object.entries(ACCOUNT_NAMES)) {
  const insightFile = path.join(DATA_DIR, `${actId}_insights.json`);
  const campaignFile = path.join(DATA_DIR, `${actId}_campaigns.json`);

  let adsets = [];
  let campaigns = [];

  if (fs.existsSync(insightFile)) {
    const raw = JSON.parse(fs.readFileSync(insightFile, 'utf8'));
    adsets = raw.data || [];
  }

  if (fs.existsSync(campaignFile)) {
    const raw = JSON.parse(fs.readFileSync(campaignFile, 'utf8'));
    campaigns = raw.data || [];
  }

  if (adsets.length === 0 && campaigns.length === 0) {
    allAccounts.push({
      id: actId,
      name: actName,
      status: 'inactive',
      totalSpend: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalReach: 0,
      avgCTR: 0,
      avgCPC: 0,
      avgCPM: 0,
      avgFrequency: 0,
      totalResults: 0,
      resultType: 'N/A',
      avgCPA: null,
      campaigns: [],
      adsets: [],
      recommendations: [{ type: 'info', text: 'Nenhuma campanha ativa no período 01/04 - 17/04/2026.' }]
    });
    continue;
  }

  const processedAdsets = adsets.map(ad => {
    const result = extractResult(ad.actions);
    const cpa = getCPA(ad.cost_per_action_type);
    return {
      id: ad.adset_id,
      name: ad.adset_name,
      campaignId: ad.campaign_id,
      campaignName: ad.campaign_name,
      impressions: parseInt(ad.impressions || 0),
      clicks: parseInt(ad.clicks || 0),
      spend: parseFloat(ad.spend || 0),
      reach: parseInt(ad.reach || 0),
      ctr: parseFloat(ad.ctr || 0),
      cpc: parseFloat(ad.cpc || 0),
      cpm: parseFloat(ad.cpm || 0),
      cpp: parseFloat(ad.cpp || 0),
      frequency: parseFloat(ad.frequency || 0),
      uniqueClicks: parseInt(ad.unique_clicks || 0),
      uniqueCTR: parseFloat(ad.unique_ctr || 0),
      results: result.value,
      resultType: result.type,
      cpa: cpa
    };
  });

  const processedCampaigns = campaigns.map(camp => {
    const result = extractResult(camp.actions);
    const cpa = getCPA(camp.cost_per_action_type);
    const processed = {
      id: camp.campaign_id,
      name: camp.campaign_name,
      impressions: parseInt(camp.impressions || 0),
      clicks: parseInt(camp.clicks || 0),
      spend: parseFloat(camp.spend || 0),
      reach: parseInt(camp.reach || 0),
      ctr: parseFloat(camp.ctr || 0),
      cpc: parseFloat(camp.cpc || 0),
      cpm: parseFloat(camp.cpm || 0),
      cpp: parseFloat(camp.cpp || 0),
      frequency: parseFloat(camp.frequency || 0),
      uniqueClicks: parseInt(camp.unique_clicks || 0),
      uniqueCTR: parseFloat(camp.unique_ctr || 0),
      results: result.value,
      resultType: result.type,
      cpa: cpa,
      recommendations: []
    };
    processed.recommendations = generateCampaignRecommendations(processed);
    return processed;
  });

  const totalSpend = processedAdsets.reduce((s, a) => s + a.spend, 0);
  const totalImpressions = processedAdsets.reduce((s, a) => s + a.impressions, 0);
  const totalClicks = processedAdsets.reduce((s, a) => s + a.clicks, 0);
  const totalReach = processedAdsets.reduce((s, a) => s + a.reach, 0);
  const avgCTR = processedAdsets.length > 0 ? processedAdsets.reduce((s, a) => s + a.ctr, 0) / processedAdsets.length : 0;
  const avgCPC = processedAdsets.length > 0 ? processedAdsets.reduce((s, a) => s + a.cpc, 0) / processedAdsets.length : 0;
  const avgCPM = processedAdsets.length > 0 ? processedAdsets.reduce((s, a) => s + a.cpm, 0) / processedAdsets.length : 0;
  const avgFrequency = processedAdsets.length > 0 ? processedAdsets.reduce((s, a) => s + a.frequency, 0) / processedAdsets.length : 0;

  const allResults = processedAdsets.reduce((s, a) => s + a.results, 0);
  const resultTypes = processedAdsets.map(a => a.resultType).filter(t => t !== 'N/A' && t !== 'Engajamento');
  const mainResultType = resultTypes[0] || (processedAdsets[0] && processedAdsets[0].resultType) || 'N/A';
  const avgCPA = allResults > 0 ? totalSpend / allResults : null;

  allAccounts.push({
    id: actId,
    name: actName,
    status: 'active',
    totalSpend,
    totalImpressions,
    totalClicks,
    totalReach,
    avgCTR,
    avgCPC,
    avgCPM,
    avgFrequency,
    totalResults: allResults,
    resultType: mainResultType,
    avgCPA,
    campaigns: processedCampaigns,
    adsets: processedAdsets,
    recommendations: generateAccountRecommendations(processedCampaigns)
  });
}

fs.writeFileSync(
  path.join(DATA_DIR, 'combined_raw.json'),
  JSON.stringify(allAccounts, null, 2),
  'utf8'
);

const active = allAccounts.filter(a => a.status === 'active');
console.log('Total accounts:', allAccounts.length);
console.log('Active accounts:', active.length);
console.log('Total spend: R$', active.reduce((s, a) => s + a.totalSpend, 0).toFixed(2));
active.forEach(a => {
  console.log(`  [${a.name}]: R$${a.totalSpend.toFixed(2)} | CTR:${a.avgCTR.toFixed(2)}% | CPC:R$${a.avgCPC.toFixed(2)} | ${a.totalResults} resultados (${a.resultType}) | CPA:${a.avgCPA ? 'R$' + a.avgCPA.toFixed(2) : 'N/A'}`);
});
console.log('\nDone! combined_raw.json saved.');
