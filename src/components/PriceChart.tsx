'use client';

interface PriceChartProps {
  history: { date: string; price: number }[];
  threshold?: number;
}

export default function PriceChart({ history, threshold }: PriceChartProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No price data yet. Price tracking starts when you set status to &quot;Watching&quot;.
      </div>
    );
  }

  const prices = history.map((h) => h.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;
  const latestPrice = prices[prices.length - 1];
  const firstPrice = prices[0];
  const trend = latestPrice < firstPrice ? 'down' : latestPrice > firstPrice ? 'up' : 'flat';

  // SVG dimensions
  const width = 280;
  const height = 80;
  const padding = 4;

  const points = history.map((h, i) => {
    const x = padding + (i / Math.max(history.length - 1, 1)) * (width - 2 * padding);
    const y = height - padding - ((h.price - minPrice) / range) * (height - 2 * padding);
    return { x, y, price: h.price, date: h.date };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-2xl font-black text-gray-900">${latestPrice}</span>
        <span className={`text-sm font-semibold ${
          trend === 'down' ? 'text-emerald-600' : trend === 'up' ? 'text-red-500' : 'text-gray-400'
        }`}>
          {trend === 'down' ? '↓' : trend === 'up' ? '↑' : '→'}
          {' '}
          {trend === 'down' ? 'Dropping' : trend === 'up' ? 'Rising' : 'Stable'}
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20">
        {/* Gradient fill */}
        <defs>
          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={trend === 'down' ? '#10b981' : '#ef4444'} stopOpacity="0.2" />
            <stop offset="100%" stopColor={trend === 'down' ? '#10b981' : '#ef4444'} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area */}
        <path d={areaPath} fill="url(#priceGrad)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={trend === 'down' ? '#10b981' : trend === 'up' ? '#ef4444' : '#9ca3af'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Threshold line */}
        {threshold && (
          <line
            x1={padding}
            y1={height - padding - ((threshold - minPrice) / range) * (height - 2 * padding)}
            x2={width - padding}
            y2={height - padding - ((threshold - minPrice) / range) * (height - 2 * padding)}
            stroke="#3b82f6"
            strokeWidth="1"
            strokeDasharray="4 2"
            opacity="0.5"
          />
        )}

        {/* Last point dot */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="3"
          fill={trend === 'down' ? '#10b981' : trend === 'up' ? '#ef4444' : '#9ca3af'}
        />
      </svg>

      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
        <span>Low: ${minPrice}</span>
        {threshold && <span className="text-blue-400">Target: ${threshold}</span>}
        <span>High: ${maxPrice}</span>
      </div>
    </div>
  );
}
