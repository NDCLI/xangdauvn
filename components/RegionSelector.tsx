import React from 'react';

interface RegionSelectorProps {
  current: string;
  onChange: (region: string) => void;
}

export default function RegionSelector({ current, onChange }: RegionSelectorProps) {
  const regions = [
    { id: 'vung-1', name: 'Vùng 1 (Đô thị & Cận cảng)' },
    { id: 'vung-2', name: 'Vùng 2 (Xa cảng & Miền núi)' },
  ];

  return (
    <div className="region-pills">
      {regions.map(r => (
        <button
          key={r.id}
          className={`pill ${r.id === current ? 'active' : ''}`}
          onClick={() => onChange(r.id)}
        >
          {r.name}
        </button>
      ))}
    </div>
  );
}
