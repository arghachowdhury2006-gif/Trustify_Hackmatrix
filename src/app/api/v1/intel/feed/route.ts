import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const sort = searchParams.get('sort') || 'new';

  let reports = Array.from(db.threatReports.values());

  if (category && category !== 'all') {
    reports = reports.filter(r => r.category === category);
  }

  if (sort === 'top') {
    reports.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
  } else {
    reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return NextResponse.json({
    items: reports,
    total: reports.length,
  });
}
