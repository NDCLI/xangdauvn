'use client';

import { useState, useEffect } from 'react';
import PriceHero from '@/components/PriceHero';
import { FuelSnapshot } from '@/lib/fuel-types';

export default function Home() {
  const [snapshot, setSnapshot] = useState<FuelSnapshot | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState('vung-1');

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [priceRes, historyRes] = await Promise.all([
          fetch(`/api/prices?region=${region}`),
          fetch(`/api/prices/history?region=${region}`),
        ]);

        const priceData = await priceRes.json();
        const historyData = await historyRes.json();

        if (active) {
          if (priceData && !priceData.error) setSnapshot(priceData);
          if (historyData && !historyData.error && Array.isArray(historyData)) setHistory(historyData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [region]);

  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(180deg,#0f172a,#071029)',display:'flex',flexDirection:'column'}}>
      <PriceHero
        snapshot={snapshot}
        history={history}
        loading={loading}
        region={region}
        onRegionChange={setRegion}
      />
      <footer style={{marginTop:'auto',textAlign:'center',padding:'24px 16px',borderTop:'1px solid rgba(255,255,255,0.04)',fontSize:12,color:'#94a3b8'}}>
        <p>MVP · Phiên bản cá nhân · Cập nhật giá từ Petrolimex / PVOil</p>
        <p style={{margin:'6px 0 0'}}>Đang phát triển: Lịch sử giá, Biểu đồ, Thông báo</p>
      </footer>
    </main>
  );
}

