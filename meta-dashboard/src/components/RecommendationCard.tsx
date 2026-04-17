interface Rec {
  type: 'success' | 'warning' | 'danger' | 'info'
  text: string
}

const styles = {
  success: { bg: 'bg-emerald-500/10 border-emerald-500/30', icon: '✅', text: 'text-emerald-300' },
  warning: { bg: 'bg-yellow-500/10 border-yellow-500/30', icon: '⚠️', text: 'text-yellow-300' },
  danger: { bg: 'bg-red-500/10 border-red-500/30', icon: '🚨', text: 'text-red-300' },
  info: { bg: 'bg-blue-500/10 border-blue-500/30', icon: '💡', text: 'text-blue-300' },
}

export default function RecommendationCard({ recs, title }: { recs: Rec[], title?: string }) {
  if (!recs || recs.length === 0) return null
  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/30 p-4">
      {title && <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider">{title}</h4>}
      <div className="space-y-2">
        {recs.map((rec, i) => {
          const s = styles[rec.type] || styles.info
          return (
            <div key={i} className={`flex gap-2 items-start rounded-lg border p-3 ${s.bg}`}>
              <span className="text-base mt-0.5 shrink-0">{s.icon}</span>
              <p className={`text-sm leading-relaxed ${s.text}`}>{rec.text}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
