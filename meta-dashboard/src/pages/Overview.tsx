import { useState, useMemo } from 'react'
import MetricCard from '../components/MetricCard'
import StatusBadge from '../components/StatusBadge'

interface Rec { type: string; text: string }
interface Campaign { id: string; name: string; spend: number; impressions: number; clicks: number; reach: number; ctr: number; cpc: number; cpm: number; frequency: number; results: number; resultType: string; cpa: number | null; recommendations: Rec[] }
interface Account { id: string; name: string; status: string; totalSpend: number; totalImpressions: number; totalClicks: number; totalReach: number; avgCTR: number; avgCPC: number; avgCPM: number; avgFrequency: number; totalResults: number; resultType: string; avgCPA: number | null; campaigns: Campaign[]; adsets: any[]; recommendations: Rec[] }

function fmt(n: number) { return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtInt(n: number) { return n.toLocaleString('pt-BR') }

// Contas removidas da exibição
const EXCLUDED_IDS = new Set([
  'act_985077316316981', // Arezzo Ads
  'act_668541309479669', // CA - Castro e Figueira
])

// Contas inativas que devem aparecer
const ALLOWED_INACTIVE_IDS = new Set([
  'act_864538029208474', // INSTA - MONIQUE
  'act_1575227266844090', // Vedoi
  'act_655917871724513',  // Ergy Diesel
  'act_2410626089217011', // 2410626089217011
])

function getResultAlerts(accounts: Account[]) {
  const alerts: { account: Account; level: 'danger' | 'warning'; actions: string[] }[] = []

  for (const a of accounts.filter(a => a.status === 'active')) {
    const isMessageCampaign = a.resultType === 'Mensagens' || a.resultType === 'Conv. WhatsApp'
    const isLeadCampaign = a.resultType === 'Leads' || a.resultType === 'Leads Web' || a.resultType === 'Cadastros'
    const isTrafficCampaign = a.resultType === 'Cliques no Link'

    const lowCTR = a.avgCTR < 0.6
    const veryLowCTR = a.avgCTR < 0.45
    const highCPA = a.avgCPA !== null && (
      (isMessageCampaign && a.avgCPA > 18) ||
      (isLeadCampaign && a.avgCPA > 10) ||
      (isTrafficCampaign && a.avgCPA > 1.5)
    )
    const fewResults = isMessageCampaign && a.totalResults < 60
    const highSpendLowResults = a.totalSpend > 800 && a.totalResults < 80 && isMessageCampaign

    if (!lowCTR && !highCPA && !fewResults && !highSpendLowResults) continue

    const actions: string[] = []
    const level: 'danger' | 'warning' = (veryLowCTR || highSpendLowResults) ? 'danger' : 'warning'

    if (veryLowCTR) {
      actions.push(`CTR de ${a.avgCTR.toFixed(2)}% está muito abaixo do esperado — trocar criativos é prioridade máxima. Teste imagens com rosto humano, depoimento em vídeo ou oferta com prazo.`)
    } else if (lowCTR) {
      actions.push(`CTR de ${a.avgCTR.toFixed(2)}% indica que o criativo não está capturando atenção — teste pelo menos 3 variações de copy e imagem diferentes.`)
    }

    if (highCPA && isMessageCampaign) {
      actions.push(`CPA de R$${fmt(a.avgCPA!)} por mensagem é alto — revise o texto do anúncio para deixar a oferta mais clara antes do clique, e verifique se o botão está levando direto ao WhatsApp.`)
    }

    if (fewResults && !highSpendLowResults) {
      actions.push(`Apenas ${fmtInt(a.totalResults)} mensagens em 17 dias — considere ampliar o público (raio geográfico ou faixa etária) e ativar Advantage+ Audience para deixar o algoritmo encontrar novos perfis.`)
    }

    if (highSpendLowResults) {
      actions.push(`R$${fmt(a.totalSpend)} investidos com apenas ${fmtInt(a.totalResults)} resultados — custo muito alto por resultado. Pausa as campanhas com frequência > 2 e redistribua o orçamento para os melhores conjuntos.`)
    }

    if (a.avgFrequency > 2.0) {
      actions.push(`Frequência média de ${a.avgFrequency.toFixed(1)}x indica público parcialmente saturado — expanda o público ou adicione públicos similares (Lookalike 2–5%).`)
    }

    if (actions.length > 0) alerts.push({ account: a, level, actions })
  }

  return alerts.sort((a, b) => (b.level === 'danger' ? 1 : 0) - (a.level === 'danger' ? 1 : 0))
}

export default function Overview({ accounts: rawAccounts, onSelectAccount }: { accounts: Account[], onSelectAccount: (id: string) => void }) {
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'spend' | 'ctr' | 'cpa' | 'results'>('spend')
  const [search, setSearch] = useState('')

  // Apply account filters
  const accounts = useMemo(() => rawAccounts.filter(a => {
    if (EXCLUDED_IDS.has(a.id)) return false
    if (a.status === 'inactive' && !ALLOWED_INACTIVE_IDS.has(a.id)) return false
    return true
  }), [rawAccounts])

  const active = accounts.filter(a => a.status === 'active')
  const totalSpend = active.reduce((s, a) => s + a.totalSpend, 0)
  const totalImpressions = active.reduce((s, a) => s + a.totalImpressions, 0)
  const totalClicks = active.reduce((s, a) => s + a.totalClicks, 0)
  const totalResults = active.reduce((s, a) => s + a.totalResults, 0)
  const avgCTR = active.length > 0 ? active.reduce((s, a) => s + a.avgCTR, 0) / active.length : 0
  const avgCPC = active.length > 0 ? active.reduce((s, a) => s + a.avgCPC, 0) / active.length : 0
  const globalCPA = totalResults > 0 ? totalSpend / totalResults : null

  const filtered = useMemo(() => {
    let list = accounts
    if (filter !== 'all') list = list.filter(a => a.status === filter)
    if (search) list = list.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
    return [...list].sort((a, b) => {
      if (sortBy === 'spend') return b.totalSpend - a.totalSpend
      if (sortBy === 'ctr') return b.avgCTR - a.avgCTR
      if (sortBy === 'results') return b.totalResults - a.totalResults
      if (sortBy === 'cpa') {
        if (a.avgCPA === null) return 1
        if (b.avgCPA === null) return -1
        return a.avgCPA - b.avgCPA
      }
      return 0
    })
  }, [accounts, filter, sortBy, search])

  const alertAccounts = active.filter(a => a.campaigns.some(c => c.frequency > 2.5 || (c.cpa && c.cpa > 60)))
  const resultAlerts = useMemo(() => getResultAlerts(active), [active])

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold">M</div>
            <div>
              <h1 className="font-bold text-lg text-white leading-none">Meta Ads Dashboard</h1>
              <p className="text-xs text-gray-400">01/04 – 17/04/2026 · {accounts.length} contas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {alertAccounts.length > 0 && (
              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
                🚨 {alertAccounts.length} alerta{alertAccounts.length > 1 ? 's' : ''}
              </span>
            )}
            {resultAlerts.length > 0 && (
              <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full border border-orange-500/30">
                📉 {resultAlerts.length} baixo desempenho
              </span>
            )}
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30">
              {active.length} ativas
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Global KPIs */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Visão Geral — Todas as Contas Ativas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <MetricCard label="Investimento" value={`R$ ${fmt(totalSpend)}`} sub="total período" color="blue" icon="💰" />
            <MetricCard label="Impressões" value={fmtInt(totalImpressions)} sub="alcance bruto" color="cyan" icon="👁️" />
            <MetricCard label="Cliques" value={fmtInt(totalClicks)} sub="total" color="purple" icon="🖱️" />
            <MetricCard label="CTR Médio" value={`${avgCTR.toFixed(2)}%`} sub="taxa de clique" color={avgCTR >= 1.5 ? 'green' : avgCTR >= 0.8 ? 'yellow' : 'red'} icon="📊" />
            <MetricCard label="CPC Médio" value={`R$ ${fmt(avgCPC)}`} sub="custo por clique" color={avgCPC <= 1.0 ? 'green' : avgCPC <= 2.0 ? 'yellow' : 'red'} icon="💵" />
            <MetricCard label="Resultados" value={fmtInt(totalResults)} sub="leads/mensagens/cliques" color="green" icon="🎯" />
            <MetricCard label="CPA Global" value={globalCPA ? `R$ ${fmt(globalCPA)}` : 'N/A'} sub="custo por resultado" color={globalCPA && globalCPA < 15 ? 'green' : globalCPA && globalCPA < 40 ? 'yellow' : 'red'} icon="🏆" />
          </div>
        </div>

        {/* 🚨 Alertas — Frequência / CPA Técnico */}
        {alertAccounts.length > 0 && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
            <h3 className="text-sm font-semibold text-red-400 mb-2">🚨 Alertas que precisam de atenção</h3>
            <div className="space-y-1">
              {alertAccounts.map(a => {
                const saturated = a.campaigns.filter(c => c.frequency > 2.5)
                const highCPA = a.campaigns.filter(c => c.cpa && c.cpa > 60)
                return (
                  <button key={a.id} onClick={() => onSelectAccount(a.id)} className="w-full text-left text-sm text-red-300 hover:text-red-200 flex items-center gap-2 hover:bg-red-500/10 px-2 py-1.5 rounded">
                    <span className="shrink-0">→</span>
                    <span className="font-medium">{a.name}</span>
                    {saturated.length > 0 && (
                      <span className="text-xs bg-red-500/20 border border-red-500/30 px-1.5 py-0.5 rounded">
                        Frequência alta {saturated.map(c => c.frequency.toFixed(1) + 'x').join(', ')}
                      </span>
                    )}
                    {highCPA.length > 0 && (
                      <span className="text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30 px-1.5 py-0.5 rounded">
                        CPA R${fmt(highCPA[0].cpa!)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 📉 Alertas nos Resultados — Poucos leads */}
        {resultAlerts.length > 0 && (
          <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-orange-400">📉 Alertas nos resultados — Contas com baixo volume de leads</h3>
              <p className="text-xs text-gray-500 mt-0.5">Contas com CTR baixo, CPA elevado ou poucos resultados em relação ao investimento — com ações recomendadas para cada uma.</p>
            </div>

            <div className="space-y-3">
              {resultAlerts.map(({ account, level, actions }) => (
                <div
                  key={account.id}
                  className={`rounded-lg border p-4 ${level === 'danger' ? 'border-red-500/30 bg-red-500/5' : 'border-orange-500/30 bg-orange-500/5'}`}
                >
                  {/* Account header row */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <button
                      onClick={() => onSelectAccount(account.id)}
                      className="flex items-center gap-2 hover:opacity-80"
                    >
                      <span className={`text-base ${level === 'danger' ? '🔴' : '🟡'}`}>
                        {level === 'danger' ? '🔴' : '🟡'}
                      </span>
                      <span className={`font-semibold text-sm ${level === 'danger' ? 'text-red-300' : 'text-orange-300'}`}>
                        {account.name}
                      </span>
                      <span className="text-gray-500 text-xs">→ ver detalhes</span>
                    </button>
                    <div className="flex gap-3 shrink-0 text-xs">
                      <div className="text-right">
                        <p className="text-gray-500">Investido</p>
                        <p className="text-blue-400 font-semibold">R${fmt(account.totalSpend)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500">Resultados</p>
                        <p className="text-emerald-400 font-semibold">{fmtInt(account.totalResults)}</p>
                        <p className="text-gray-500">{account.resultType}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500">CTR</p>
                        <StatusBadge value={account.avgCTR} type="ctr" />
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500">CPA</p>
                        <StatusBadge value={account.avgCPA} type="cpa" />
                      </div>
                    </div>
                  </div>

                  {/* Action items */}
                  <div className="space-y-2">
                    {actions.map((action, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="text-orange-400 font-bold text-xs mt-0.5 shrink-0">{i + 1}.</span>
                        <p className="text-xs text-gray-300 leading-relaxed">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar conta..."
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 w-48"
          />
          <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
            {(['all', 'active', 'inactive'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
                {f === 'all' ? 'Todas' : f === 'active' ? 'Ativas' : 'Inativas'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Ordenar:</span>
            <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
              {([['spend', 'Gasto'], ['ctr', 'CTR'], ['cpa', 'CPA'], ['results', 'Resultados']] as const).map(([k, l]) => (
                <button key={k} onClick={() => setSortBy(k)} className={`px-2 py-1 rounded-md text-xs transition-colors ${sortBy === k ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Accounts Table */}
        <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/50 bg-gray-800/50">
                  <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Conta</th>
                  <th className="text-right px-3 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Gasto</th>
                  <th className="text-right px-3 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Impressões</th>
                  <th className="text-right px-3 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Alcance</th>
                  <th className="text-right px-3 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Cliques</th>
                  <th className="text-right px-3 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">CTR</th>
                  <th className="text-right px-3 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">CPC</th>
                  <th className="text-right px-3 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">CPM</th>
                  <th className="text-right px-3 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Freq</th>
                  <th className="text-right px-3 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Resultados</th>
                  <th className="text-right px-3 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">CPA</th>
                  <th className="text-right px-3 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Camps.</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((account, i) => {
                  const hasResultAlert = resultAlerts.some(r => r.account.id === account.id)
                  return (
                    <tr
                      key={account.id}
                      onClick={() => account.status === 'active' && onSelectAccount(account.id)}
                      className={`border-b border-gray-700/30 transition-colors ${account.status === 'active' ? 'hover:bg-gray-800/50 cursor-pointer' : 'opacity-40'} ${i % 2 === 0 ? '' : 'bg-gray-800/20'}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${account.status === 'active' ? 'bg-emerald-400' : 'bg-gray-600'}`} />
                          <span className="font-medium text-gray-200 text-sm">{account.name}</span>
                          {hasResultAlert && <span className="text-xs text-orange-400">📉</span>}
                          {account.status === 'active' && <span className="text-gray-500 text-xs">→</span>}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right text-blue-400 font-semibold">
                        {account.totalSpend > 0 ? `R$${fmt(account.totalSpend)}` : '—'}
                      </td>
                      <td className="px-3 py-3 text-right text-gray-300">{account.totalImpressions > 0 ? fmtInt(account.totalImpressions) : '—'}</td>
                      <td className="px-3 py-3 text-right text-gray-300">{account.totalReach > 0 ? fmtInt(account.totalReach) : '—'}</td>
                      <td className="px-3 py-3 text-right text-gray-300">{account.totalClicks > 0 ? fmtInt(account.totalClicks) : '—'}</td>
                      <td className="px-3 py-3 text-right"><StatusBadge value={account.avgCTR || null} type="ctr" /></td>
                      <td className="px-3 py-3 text-right"><StatusBadge value={account.avgCPC || null} type="cpc" /></td>
                      <td className="px-3 py-3 text-right text-gray-300 text-sm">{account.avgCPM > 0 ? `R$${fmt(account.avgCPM)}` : '—'}</td>
                      <td className="px-3 py-3 text-right"><StatusBadge value={account.avgFrequency || null} type="freq" /></td>
                      <td className="px-3 py-3 text-right">
                        {account.totalResults > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="text-emerald-400 font-semibold">{fmtInt(account.totalResults)}</span>
                            <span className="text-xs text-gray-500">{account.resultType}</span>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-3 text-right"><StatusBadge value={account.avgCPA} type="cpa" /></td>
                      <td className="px-3 py-3 text-right text-gray-400 text-sm">{account.campaigns.length > 0 ? account.campaigns.length : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <h3 className="text-sm font-semibold text-emerald-400 mb-3">🏆 Melhor CPA</h3>
            {[...active].filter(a => a.avgCPA !== null).sort((a, b) => (a.avgCPA ?? 999) - (b.avgCPA ?? 999)).slice(0, 3).map(a => (
              <button key={a.id} onClick={() => onSelectAccount(a.id)} className="w-full text-left flex justify-between items-center py-1.5 hover:bg-emerald-500/10 px-1 rounded">
                <span className="text-sm text-gray-300 truncate">{a.name}</span>
                <span className="text-emerald-400 font-semibold text-sm ml-2 shrink-0">R${fmt(a.avgCPA!)}</span>
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <h3 className="text-sm font-semibold text-blue-400 mb-3">📊 Melhor CTR</h3>
            {[...active].sort((a, b) => b.avgCTR - a.avgCTR).slice(0, 3).map(a => (
              <button key={a.id} onClick={() => onSelectAccount(a.id)} className="w-full text-left flex justify-between items-center py-1.5 hover:bg-blue-500/10 px-1 rounded">
                <span className="text-sm text-gray-300 truncate">{a.name}</span>
                <span className="text-blue-400 font-semibold text-sm ml-2 shrink-0">{a.avgCTR.toFixed(2)}%</span>
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
            <h3 className="text-sm font-semibold text-purple-400 mb-3">🎯 Mais Resultados</h3>
            {[...active].sort((a, b) => b.totalResults - a.totalResults).slice(0, 3).map(a => (
              <button key={a.id} onClick={() => onSelectAccount(a.id)} className="w-full text-left flex justify-between items-center py-1.5 hover:bg-purple-500/10 px-1 rounded">
                <span className="text-sm text-gray-300 truncate">{a.name}</span>
                <span className="text-purple-400 font-semibold text-sm ml-2 shrink-0">{fmtInt(a.totalResults)}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-600 text-center pb-4">
          Dados extraídos via Meta Graph API v21.0 · Período: 01/04/2026 – 17/04/2026 · Helena Coelho (agencia@aocubomarketing.com)
        </p>
      </div>
    </div>
  )
}
