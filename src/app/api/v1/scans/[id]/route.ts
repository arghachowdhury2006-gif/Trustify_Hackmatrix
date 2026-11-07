import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/store';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const scan = db.scans.get(params.id);
  if (!scan) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: `Scan '${params.id}' not found.` } },
      { status: 404 }
    );
  }
  return NextResponse.json(scan);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const exists = db.scans.has(params.id);
  if (!exists) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: `Scan '${params.id}' not found.` } },
      { status: 404 }
    );
  }
  db.scans.delete(params.id);
  return NextResponse.json({ success: true, message: 'Scan deleted successfully.' });
}
