import { useState } from 'react'
import MetricCard from '../components/MetricCard'
import RecommendationCard from '../components/RecommendationCard'
import StatusBadge from '../components/StatusBadge'

interface Rec { type: 'success' | 'warning' | 'danger' | 'info'; text: string }
interface Campaign { id: string; name: string; spend: number; impressions: number; clicks: number; reach: number; ctr: number; cpc: number; cpm: number; cpp: number; frequency: number; uniqueClicks: number; uniqueCTR: number; results: number; resultType: string; cpa: number | null; recommendations: Rec[] }
interface Adset { id: string; name: string; campaignId: string; campaignName: string; spend: number; impressions: number; clicks: number; reach: number; ctr: number; cpc: number; cpm: number; frequency: number; results: number; resultType: string; cpa: number | null }
interface Account { id: string; name: string; status: string; totalSpend: number; totalImpressions: number; totalClicks: number; totalReach: number; avgCTR: number; avgCPC: number; avgCPM: number; avgFrequency: number; totalResults: number; resultType: string; avgCPA: number | null; campaigns: Campaign[]; adsets: Adset[]; recommendations: Rec[] }

function fmt(n: number) { return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtInt(n: number) { return n.toLocaleString('pt-BR') }

export default function AccountDetail({ account, onBack }: { account: Account; onBack: () => void }) {
  const [tab, setTab] = useState<'campaigns' | 'adsets'>('campaigns')
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null)

  const campaignAdsets = (campaignId: string) => account.adsets.filter(a => a.campaignId === campaignId)

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-gray-400 hover:text-white text-sm flex items-center gap-1 hover:bg-gray-800 px-2 py-1 rounded-lg transition-colors">
              ← Voltar
            </button>
            <div className="h-4 w-px bg-gray-700" />
            <div>
              <h1 className="font-bold text-lg text-white leading-none">{account.name}</h1>
              <p className="text-xs text-gray-400">01/04 – 17/04/2026 · {account.campaigns.length} campanhas · {account.adsets.length} conjuntos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Account KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <MetricCard label="Investimento" value={`R$${fmt(account.totalSpend)}`} color="blue" icon="💰" />
          <MetricCard label="Impressões" value={fmtInt(account.totalImpressions)} color="cyan" icon="👁️" />
          <MetricCard label="Alcance" value={fmtInt(account.totalReach)} color="purple" icon="📡" />
          <MetricCard label="Cliques" value={fmtInt(account.totalClicks)} color="yellow" icon="🖱️" />
          <MetricCard label="CTR Médio" value={`${account.avgCTR.toFixed(2)}%`} color={account.avgCTR >= 1.5 ? 'green' : account.avgCTR >= 0.8 ? 'yellow' : 'red'} icon="📊" />
          <MetricCard label="CPC Médio" value={`R$${fmt(account.avgCPC)}`} color={account.avgCPC <= 1.0 ? 'green' : account.avgCPC <= 2.0 ? 'yellow' : 'red'} icon="💵" />
          <MetricCard label="Resultados" value={fmtInt(account.totalResults)} sub={account.resultType} color="green" icon="🎯" />
          <MetricCard label="CPA" value={account.avgCPA ? `R$${fmt(account.avgCPA)}` : 'N/A'} sub="custo por resultado" color={account.avgCPA && account.avgCPA < 15 ? 'green' : account.avgCPA && account.avgCPA < 40 ? 'yellow' : 'red'} icon="🏆" />
        </div>

        {/* Account Recommendations */}
        <RecommendationCard recs={account.recommendations} title="Recomendações Gerais da Conta" />

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1 w-fit">
          <button onClick={() => setTab('campaigns')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'campaigns' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
            Campanhas ({account.campaigns.length})
          </button>
          <button onClick={() => setTab('adsets')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'adsets' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
            Conjuntos ({account.adsets.length})
          </button>
        </div>

        {/* Campaigns Tab */}
        {tab === 'campaigns' && (
          <div className="space-y-4">
            {account.campaigns.length === 0 ? (
              <div className="text-center py-12 text-gray-500">Nenhuma campanha encontrada no período.</div>
            ) : (
              account.campaigns.map(camp => {
                const isExpanded = expandedCampaign === camp.id
                const adsets = campaignAdsets(camp.id)
                const hasSaturation = camp.frequency > 2.5
                const hasHighCPA = camp.cpa && camp.cpa > 60

                return (
                  <div key={camp.id} className={`rounded-xl border ${hasSaturation || hasHighCPA ? 'border-red-500/30 bg-red-500/5' : 'border-gray-700/50 bg-gray-900/50'}`}>
                    {/* Campaign Header */}
                    <button
                      onClick={() => setExpandedCampaign(isExpanded ? null : camp.id)}
                      className="w-full text-left p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-white text-sm">{camp.name}</h3>
                            {hasSaturation && <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">🔥 Saturado</span>}
                            {camp.cpa && camp.cpa < 15 && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">✅ CPA Ótimo</span>}
                            {camp.ctr > 2 && <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30">🚀 CTR Alto</span>}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{adsets.length} conjunto{adsets.length !== 1 ? 's' : ''} de anúncios</p>
                        </div>
                        <div className="flex items-center gap-6 shrink-0">
                          <div className="text-right hidden md:block">
                            <p className="text-xs text-gray-500">Gasto</p>
                            <p className="font-semibold text-blue-400">R${fmt(camp.spend)}</p>
                          </div>
                          <div className="text-right hidden md:block">
                            <p className="text-xs text-gray-500">Resultados</p>
                            <p className="font-semibold text-emerald-400">{fmtInt(camp.results)}</p>
                            <p className="text-xs text-gray-500">{camp.resultType}</p>
                          </div>
                          <div className="text-right hidden lg:block">
                            <p className="text-xs text-gray-500">CPA</p>
                            <StatusBadge value={camp.cpa} type="cpa" />
                          </div>
                          <div className="text-right hidden lg:block">
                            <p className="text-xs text-gray-500">CTR</p>
                            <StatusBadge value={camp.ctr} type="ctr" />
                          </div>
                          <div className="text-right hidden lg:block">
                            <p className="text-xs text-gray-500">Freq</p>
                            <StatusBadge value={camp.frequency} type="freq" />
                          </div>
                          <span className={`text-gray-400 text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                        </div>
                      </div>

                      {/* Mobile metrics */}
                      <div className="flex gap-4 mt-3 md:hidden">
                        <div><p className="text-xs text-gray-500">Gasto</p><p className="font-semibold text-blue-400 text-sm">R${fmt(camp.spend)}</p></div>
                        <div><p className="text-xs text-gray-500">Resultados</p><p className="font-semibold text-emerald-400 text-sm">{fmtInt(camp.results)}</p></div>
                        <div><p className="text-xs text-gray-500">CTR</p><StatusBadge value={camp.ctr} type="ctr" /></div>
                        <div><p className="text-xs text-gray-500">CPA</p><StatusBadge value={camp.cpa} type="cpa" /></div>
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-gray-700/50 p-4 space-y-4">
                        {/* Campaign Full Metrics */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                          <MetricCard label="Gasto" value={`R$${fmt(camp.spend)}`} color="blue" />
                          <MetricCard label="Impressões" value={fmtInt(camp.impressions)} color="cyan" />
                          <MetricCard label="Alcance" value={fmtInt(camp.reach)} color="purple" />
                          <MetricCard label="Cliques" value={fmtInt(camp.clicks)} color="yellow" />
                          <MetricCard label="CTR" value={`${camp.ctr.toFixed(2)}%`} color={camp.ctr >= 2 ? 'green' : camp.ctr >= 1 ? 'yellow' : 'red'} />
                          <MetricCard label="CPC" value={camp.cpc > 0 ? `R$${fmt(camp.cpc)}` : 'N/A'} color={camp.cpc <= 1 ? 'green' : camp.cpc <= 2 ? 'yellow' : 'red'} />
                          <MetricCard label="CPM" value={`R$${fmt(camp.cpm)}`} color="purple" />
                          <MetricCard label="Frequência" value={camp.frequency.toFixed(2)} color={camp.frequency <= 1.5 ? 'green' : camp.frequency <= 2.5 ? 'yellow' : 'red'} />
                        </div>

                        {/* Recommendations */}
                        <RecommendationCard recs={camp.recommendations} title="Recomendações para esta campanha" />

                        {/* Adsets for this campaign */}
                        {adsets.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Conjuntos de Anúncios</h4>
                            <div className="overflow-x-auto rounded-lg border border-gray-700/30">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="bg-gray-800/50 border-b border-gray-700/30">
                                    <th className="text-left px-3 py-2 text-gray-400 font-semibold">Conjunto</th>
                                    <th className="text-right px-2 py-2 text-gray-400 font-semibold">Gasto</th>
                                    <th className="text-right px-2 py-2 text-gray-400 font-semibold">Impr.</th>
                                    <th className="text-right px-2 py-2 text-gray-400 font-semibold">Cliques</th>
                                    <th className="text-right px-2 py-2 text-gray-400 font-semibold">CTR</th>
                                    <th className="text-right px-2 py-2 text-gray-400 font-semibold">CPC</th>
                                    <th className="text-right px-2 py-2 text-gray-400 font-semibold">Freq.</th>
                                    <th className="text-right px-2 py-2 text-gray-400 font-semibold">Resultados</th>
                                    <th className="text-right px-2 py-2 text-gray-400 font-semibold">CPA</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {adsets.map((ad, i) => (
                                    <tr key={ad.id} className={`border-b border-gray-700/20 ${i % 2 === 0 ? '' : 'bg-gray-800/20'}`}>
                                      <td className="px-3 py-2 text-gray-200 font-medium max-w-xs truncate">{ad.name}</td>
                                      <td className="px-2 py-2 text-right text-blue-400">R${fmt(ad.spend)}</td>
                                      <td className="px-2 py-2 text-right text-gray-300">{fmtInt(ad.impressions)}</td>
                                      <td className="px-2 py-2 text-right text-gray-300">{fmtInt(ad.clicks)}</td>
                                      <td className="px-2 py-2 text-right"><StatusBadge value={ad.ctr} type="ctr" /></td>
                                      <td className="px-2 py-2 text-right"><StatusBadge value={ad.cpc} type="cpc" /></td>
                                      <td className="px-2 py-2 text-right"><StatusBadge value={ad.frequency} type="freq" /></td>
                                      <td className="px-2 py-2 text-right">
                                        <div className="flex flex-col items-end">
                                          <span className="text-emerald-400 font-semibold">{fmtInt(ad.results)}</span>
                                          <span className="text-gray-500 text-xs">{ad.resultType}</span>
                                        </div>
                                      </td>
                                      <td className="px-2 py-2 text-right"><StatusBadge value={ad.cpa} type="cpa" /></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Adsets Tab */}
        {tab === 'adsets' && (
          <div className="rounded-xl border border-gray-700/50 bg-gray-900/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700/50 bg-gray-800/50">
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Campanha</th>
                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-semibold uppercase tracking-wider">Conjunto</th>
                    <th className="text-right px-3 py-3 text-xs text-gray-400 font-semibold uppercase">Gasto</th>
                    <th className="text-right px-3 py-3 text-xs text-gray-400 font-semibold uppercase">Impr.</th>
                    <th className="text-right px-3 py-3 text-xs text-gray-400 font-semibold uppercase">Cliques</th>
                    <th className="text-right px-3 py-3 text-xs text-gray-400 font-semibold uppercase">CTR</th>
                    <th className="text-right px-3 py-3 text-xs text-gray-400 font-semibold uppercase">CPC</th>
                    <th className="text-right px-3 py-3 text-xs text-gray-400 font-semibold uppercase">CPM</th>
                    <th className="text-right px-3 py-3 text-xs text-gray-400 font-semibold uppercase">Freq.</th>
                    <th className="text-right px-3 py-3 text-xs text-gray-400 font-semibold uppercase">Resultados</th>
                    <th className="text-right px-3 py-3 text-xs text-gray-400 font-semibold uppercase">CPA</th>
                  </tr>
                </thead>
                <tbody>
                  {account.adsets.map((ad, i) => (
                    <tr key={ad.id} className={`border-b border-gray-700/30 ${i % 2 === 0 ? '' : 'bg-gray-800/20'}`}>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{ad.campaignName}</td>
                      <td className="px-4 py-3 font-medium text-gray-200 text-sm max-w-xs truncate">{ad.name}</td>
                      <td className="px-3 py-3 text-right text-blue-400 font-semibold">R${fmt(ad.spend)}</td>
                      <td className="px-3 py-3 text-right text-gray-300">{fmtInt(ad.impressions)}</td>
                      <td className="px-3 py-3 text-right text-gray-300">{fmtInt(ad.clicks)}</td>
                      <td className="px-3 py-3 text-right"><StatusBadge value={ad.ctr} type="ctr" /></td>
                      <td className="px-3 py-3 text-right"><StatusBadge value={ad.cpc} type="cpc" /></td>
                      <td className="px-3 py-3 text-right text-gray-300">R${fmt(ad.cpm)}</td>
                      <td className="px-3 py-3 text-right"><StatusBadge value={ad.frequency} type="freq" /></td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-emerald-400 font-semibold">{fmtInt(ad.results)}</span>
                          <span className="text-xs text-gray-500">{ad.resultType}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right"><StatusBadge value={ad.cpa} type="cpa" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
