import { NextRequest, NextResponse } from 'next/server';
import { crawlPetrolimex, crawlPVOil } from '@/lib/crawlers/petrolimex';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get('region') || 'vung-1';
  const normalizedRegion = region === 'vung-2' ? 'vung-2' : 'vung-1';

  try {
    const [petrolimex, pvoil] = await Promise.all([
      crawlPetrolimex(normalizedRegion),
      crawlPVOil(normalizedRegion),
    ]);

    // Prefer Petrolimex (live crawled data) over PVOil (fails/fallback)
    const latest = petrolimex || pvoil || null;

    if (!latest) {
      return NextResponse.json(
        { error: 'Failed to fetch fuel prices' },
        { status: 500 }
      );
    }

    latest.region = normalizedRegion;
    return NextResponse.json(latest);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
