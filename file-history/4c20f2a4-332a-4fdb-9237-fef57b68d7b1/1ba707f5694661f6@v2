export default function StatusBadge({ value, type }: { value: number | null, type: 'ctr' | 'cpc' | 'cpa' | 'freq' }) {
  if (value === null || value === undefined) return <span className="text-gray-500 text-sm">N/A</span>

  let color = 'text-gray-300'

  if (type === 'ctr') {
    if (value >= 2) color = 'text-emerald-400 font-semibold'
    else if (value >= 1) color = 'text-yellow-400'
    else color = 'text-red-400'
  } else if (type === 'cpc') {
    if (value <= 0.5) color = 'text-emerald-400 font-semibold'
    else if (value <= 1.5) color = 'text-yellow-400'
    else color = 'text-red-400'
  } else if (type === 'cpa') {
    if (value <= 15) color = 'text-emerald-400 font-semibold'
    else if (value <= 40) color = 'text-yellow-400'
    else color = 'text-red-400'
  } else if (type === 'freq') {
    if (value <= 1.5) color = 'text-emerald-400'
    else if (value <= 2.2) color = 'text-yellow-400'
    else color = 'text-red-400 font-semibold'
  }

  return <span className={`text-sm ${color}`}>{value.toFixed(2)}</span>
}
