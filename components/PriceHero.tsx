'use client';

import { useEffect, useState } from 'react';
import FuelCard from './FuelCard';
import RegionSelector from './RegionSelector';
import PriceChart from './PriceChart';
import { FuelSnapshot, FUEL_LABELS, FuelType, FUEL_COLORS } from '@/lib/fuel-types';
import { comparePrices, PriceChange } from '@/lib/price-comparison';
import { getPreviousSnapshot, savePriceSnapshot } from '@/lib/price-history';

interface PriceHeroProps {
  snapshot: FuelSnapshot | null;
  history: any[];
  loading: boolean;
  region: string;
  onRegionChange: (r: string) => void;
}

const fuelOrder: FuelType[] = ['ron95', 'e10ron95', 'e5ron92', 'do005s', 'do001s'];

export default function PriceHero({ snapshot, history, loading, region, onRegionChange }: PriceHeroProps) {
  const [changes, setChanges] = useState<PriceChange[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [selectedFuel, setSelectedFuel] = useState<FuelType>('ron95');

  useEffect(() => {
    try {
      const LOCAL_KEY = 'xangdau:priceHistory_v2';
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        const isCorrupt = arr.some((item: any) =>
          Object.values(item.prices || {}).some((p: any) => p !== null && p < 1000)
        );
        if (isCorrupt) {
          localStorage.removeItem(LOCAL_KEY);
          window.location.reload();
        }
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  useEffect(() => {
    if (!snapshot) return;
    let canceled = false;

    async function runComparison() {
      if (!snapshot) return;
      const previous = await getPreviousSnapshot(snapshot.region, snapshot.crawledAt);
      if (canceled) return;
      if (previous) {
        const diff = comparePrices(snapshot.prices, previous.prices);
        setChanges(diff);
        setShowToast(diff.length > 0);
      } else {
        setChanges([]);
        setShowToast(false);
      }
      await savePriceSnapshot(snapshot);
    }

    runComparison();
    return () => { canceled = true; };
  }, [snapshot]);

  const deltaByFuel = Object.fromEntries(changes.map(c => [c.fuel, c.delta])) as Partial<Record<FuelType, number>>;

  if (loading) {
    return (
      <section className="container" style={{minHeight:420}}>
        <div className="header">
          <div className="source-badge">Đang tải dữ liệu...</div>
          <h1 className="hero-title" style={{marginTop:12}}>Giá xăng dầu Việt Nam</h1>
        </div>
        <div className="grid-cards">
          {fuelOrder.map((fuel) => <div key={fuel} className="fuel-card" style={{height:120,opacity:.6}} />)}
        </div>
      </section>
    );
  }

  if (!snapshot) {
    return (
      <section className="container">
        <div className="header">
          <span className="source-badge">Không có dữ liệu</span>
          <h1 className="hero-title" style={{marginTop:12}}>Giá xăng dầu Việt Nam</h1>
          <p className="fuel-name">Vui lòng tải lại trang.</p>
        </div>
      </section>
    );
  }

  const updated = new Date(snapshot.crawledAt).toLocaleString('vi-VN');

  return (
    <section className="container">
      {showToast && changes.length > 0 && (
        <div className="chart-toast">
          <div style={{fontWeight:700}}>Giá xăng dầu có thay đổi</div>
          <div style={{fontSize:13,color:'#94a3b8',marginTop:4}}>{changes.length} mặt hàng thay đổi so với lần cập nhật trước.</div>
          <button onClick={() => setShowToast(false)} className="toast-close-btn">Đóng</button>
        </div>
      )}

      <div className="header">
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          <span className="source-badge">Nguồn: {snapshot.source.toUpperCase()}</span>
          <span className="source-badge">Hiệu lực: {new Date(snapshot.effectiveDate).toLocaleDateString('vi-VN')}</span>
          <span className="source-badge">Cập nhật: {updated}</span>
          {changes.length > 0 && <span className="source-badge">{changes.length} thay đổi</span>}
        </div>
        <h1 className="hero-title" style={{margin:'14px 0 6px'}}>Giá xăng dầu hiện tại</h1>
        <p style={{color:'var(--muted)',margin:0}}>Theo dõi 5 mặt hàng xăng dầu chính, cập nhật tự động cho MVP cá nhân.</p>
      </div>

      <div style={{marginTop:10, marginBottom: 20}}>
        <div style={{fontSize:13,color:'var(--muted)',marginBottom:8}}>Khu vực phân vùng giá</div>
        <RegionSelector current={region} onChange={onRegionChange} />
      </div>

      <div className="grid-cards" aria-live="polite">
        {fuelOrder.map((fuel) => (
          <FuelCard key={fuel} type={fuel} label={FUEL_LABELS[fuel]} price={snapshot.prices[fuel]} delta={deltaByFuel[fuel]} />
        ))}
      </div>

      {changes.length > 0 && (
        <div className="fuel-card" style={{marginTop:18}}>
          <div style={{fontWeight:700,marginBottom:10}}>So sánh với lần cập nhật trước</div>
          <div style={{display:'grid',gap:8}}>
            {changes.map(c => (
              <div key={c.fuel} style={{display:'flex',justifyContent:'space-between',gap:12,fontSize:14,color:'#cbd5e1'}}>
                <span>{FUEL_LABELS[c.fuel]}</span>
                <span style={{color:c.delta > 0 ? '#ff6b6b' : '#4ecdc4',fontWeight:700}}>{c.delta > 0 ? '+' : ''}{c.delta}₫ ({c.percent}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart Section */}
      <div style={{ marginTop: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>Chọn mặt hàng hiển thị biểu đồ:</span>
          <div className="fuel-pills">
            {fuelOrder.map(fuel => (
              <button
                key={fuel}
                className={`fuel-pill-btn ${selectedFuel === fuel ? 'active' : ''}`}
                style={{
                  '--accent': FUEL_COLORS[fuel],
                } as React.CSSProperties}
                onClick={() => setSelectedFuel(fuel)}
              >
                {FUEL_LABELS[fuel].replace('Xăng ', '').replace('Dầu ', '')}
              </button>
            ))}
          </div>
        </div>
        <PriceChart data={history} fuelType={selectedFuel} />
      </div>

    </section>
  );
}
