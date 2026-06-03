import React from 'react';
import { FuelType, FUEL_COLORS } from '@/lib/fuel-types';

export default function FuelCard({ label, price, type, delta }: { label: string; price?: number | null; type: FuelType; delta?: number }) {
  const accent = FUEL_COLORS[type] || '#ffffff';
  const deltaText = delta == null ? null : (delta > 0 ? `+${delta}` : `${delta}`);
  const deltaColor = delta == null ? '#94a3b8' : delta > 0 ? '#ff6b6b' : '#4ecdc4';

  return (
    <div className="fuel-card" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div className="fuel-icon">⛽</div>
          <div className="fuel-name">{label}</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div className="fuel-price" style={{color:accent}}>{price ? price.toLocaleString('vi-VN') : '-'}</div>
          <div className="fuel-unit">₫/lít</div>
        </div>
      </div>
      {deltaText && (
        <div style={{marginTop:10,fontSize:12,color:deltaColor,fontWeight:600}}>{deltaText}₫</div>
      )}
    </div>
  );
}
