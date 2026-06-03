'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { FuelType, FUEL_LABELS, FUEL_COLORS } from '@/lib/fuel-types';

interface PriceChartProps {
  data: any[];
  fuelType: FuelType;
}

export default function PriceChart({ data, fuelType }: PriceChartProps) {
  const accentColor = FUEL_COLORS[fuelType] || '#3b82f6';

  if (!data || data.length === 0) {
    return (
      <div className="chart-empty">
        Chưa có dữ liệu lịch sử cho mặt hàng này
      </div>
    );
  }

  // Format data for Recharts, ensuring price values are clean numbers
  const chartData = data
    .map(item => ({
      crawledAt: item.crawledAt,
      price: item.prices[fuelType] || null,
    }))
    .filter(item => item.price !== null);

  const formatXAxis = (tickItem: number) => {
    return new Date(tickItem).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dateStr = new Date(payload[0].payload.crawledAt).toLocaleString('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      return (
        <div className="chart-tooltip">
          <p className="tooltip-date">{dateStr}</p>
          <p className="tooltip-price" style={{ color: accentColor }}>
            {payload[0].value?.toLocaleString('vi-VN')} ₫/lít
          </p>
        </div>
      );
    }
    return null;
  };

  // Find dynamic min/max to keep chart focused on price variance
  const prices = chartData.map(d => d.price as number);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const yDomain = [
    Math.floor(minPrice * 0.98),
    Math.ceil(maxPrice * 1.02),
  ];

  return (
    <div className="chart-container-card">
      <div className="chart-header">
        <h3 className="chart-title">Xu hướng giá {FUEL_LABELS[fuelType]}</h3>
        <span className="chart-subtitle">Lịch sử 15 phiên điều chỉnh gần nhất</span>
      </div>
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id={`colorPrice-${fuelType}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accentColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={accentColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis
              dataKey="crawledAt"
              tickFormatter={formatXAxis}
              stroke="rgba(255,255,255,0.2)"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={yDomain}
              stroke="rgba(255,255,255,0.2)"
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v.toLocaleString('vi-VN')}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={accentColor}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#colorPrice-${fuelType})`}
              activeDot={{ r: 6, stroke: '#0f172a', strokeWidth: 2, fill: accentColor }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
