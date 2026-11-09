import { NextResponse } from 'next/server';
import { getDashboardSummary } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const summary = getDashboardSummary();
  return NextResponse.json(summary);
}

