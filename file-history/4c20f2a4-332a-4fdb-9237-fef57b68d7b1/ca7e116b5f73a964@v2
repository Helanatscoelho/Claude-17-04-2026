interface MetricCardProps {
  label: string
  value: string
  sub?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'cyan'
  icon?: string
}

const colors = {
  blue: 'border-blue-500/30 bg-blue-500/10',
  green: 'border-emerald-500/30 bg-emerald-500/10',
  yellow: 'border-yellow-500/30 bg-yellow-500/10',
  red: 'border-red-500/30 bg-red-500/10',
  purple: 'border-purple-500/30 bg-purple-500/10',
  cyan: 'border-cyan-500/30 bg-cyan-500/10',
}

const textColors = {
  blue: 'text-blue-400',
  green: 'text-emerald-400',
  yellow: 'text-yellow-400',
  red: 'text-red-400',
  purple: 'text-purple-400',
  cyan: 'text-cyan-400',
}

export default function MetricCard({ label, value, sub, color = 'blue', icon }: MetricCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-lg">{icon}</span>}
        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${textColors[color]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}
