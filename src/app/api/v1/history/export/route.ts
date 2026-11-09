import { NextResponse } from 'next/server';
import { db } from '@/lib/store';

export const dynamic = 'force-dynamic';

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET() {
  const scans = Array.from(db.scans.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const header = 'id,input_url,verdict,score,confidence,created_at,duration_ms\n';
  const rows = scans.map(s => 
    [
      escapeCsvCell(s.id),
      escapeCsvCell(s.inputUrl),
      escapeCsvCell(s.verdict),
      typeof s.score === 'number' ? s.score : escapeCsvCell(s.score),
      typeof s.confidence === 'number' ? s.confidence : escapeCsvCell(s.confidence),
      escapeCsvCell(s.createdAt),
      typeof s.durationMs === 'number' ? s.durationMs : escapeCsvCell(s.durationMs),
    ].join(',')
  ).join('\n');

  return new Response(header + rows, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="trustify_scan_history.csv"',
    },
  });
}

