import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').toLowerCase();
  const verdict = searchParams.get('verdict');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(50, parseInt(searchParams.get('pageSize') || '20', 10));

  let scans = Array.from(db.scans.values());

  if (q) {
    scans = scans.filter(s => 
      s.inputUrl.toLowerCase().includes(q) ||
      s.domain.name.toLowerCase().includes(q)
    );
  }

  if (verdict && verdict !== 'all') {
    scans = scans.filter(s => s.verdict === verdict);
  }

  scans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = scans.length;
  const startIndex = (page - 1) * pageSize;
  const items = scans.slice(startIndex, startIndex + pageSize);

  return NextResponse.json({
    items,
    page,
    page_size: pageSize,
    total,
  });
}

export async function DELETE() {
  db.scans.clear();
  return NextResponse.json({ success: true, message: 'Scan history cleared.' });
}
