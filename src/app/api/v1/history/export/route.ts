import { NextResponse } from 'next/server';
import { db } from '@/lib/store';

export async function GET() {
  const scans = Array.from(db.scans.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const header = 'id,input_url,verdict,score,confidence,created_at,duration_ms\n';
  const rows = scans.map(s => 
    `"${s.id}","${s.inputUrl}","${s.verdict}",${s.score},${s.confidence},"${s.createdAt}",${s.durationMs}`
  ).join('\n');

  return new Response(header + rows, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="trustify_scan_history.csv"',
    },
  });
}

