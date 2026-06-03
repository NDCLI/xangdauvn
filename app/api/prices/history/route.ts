import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get('region') || 'vung-1';
  const normalizedRegion = region === 'vung-2' ? 'vung-2' : 'vung-1';

  try {
    const q = query(
      collection(db, 'fuel_price_history'),
      orderBy('crawledAt', 'desc'),
      limit(100)
    );

    const snap = await getDocs(q);
    let history = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    // Filter by region and exclude corrupt snapshots (with decimal price values < 1000)
    history = history.filter((item: any) => {
      if (item.region !== normalizedRegion) return false;
      return !Object.values(item.prices || {}).some((p: any) => p !== null && p < 1000);
    });

    // Slice to the last 15 snapshots
    history = history.slice(0, 15);

    // Sort ascending for chronological chart plotting
    history.sort((a: any, b: any) => a.crawledAt - b.crawledAt);

    return NextResponse.json(history);
  } catch (error) {
    console.error('Failed to fetch history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}
