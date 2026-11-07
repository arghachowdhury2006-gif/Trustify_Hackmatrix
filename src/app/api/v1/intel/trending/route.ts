import { NextResponse } from 'next/server';
import { db } from '@/lib/store';

export async function GET() {
  const reports = Array.from(db.threatReports.values());

  const categoryCounts: Record<string, number> = {};
  for (const r of reports) {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
  }

  const topTargetedBrands = [
    { brand: 'PayPal', count: 184, trend: '+14%' },
    { brand: 'Apple ID', count: 142, trend: '+9%' },
    { brand: 'State Bank of India', count: 128, trend: '+22%' },
    { brand: 'Microsoft 365', count: 96, trend: '-3%' },
    { brand: 'Amazon Orders', count: 88, trend: '+5%' },
  ];

  const trendingDomains = reports.slice(0, 5).map(r => ({
    domain: r.domain,
    category: r.category,
    votes: r.upvotes,
    status: r.status,
  }));

  return NextResponse.json({
    topTargetedBrands,
    trendingDomains,
    categoryBreakdown: categoryCounts,
  });
}
