import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/store';
import { WatchlistDomain } from '@/lib/types';
import { validateUrlForSSRF } from '@/lib/engines/ssrfGuard';

export const dynamic = 'force-dynamic';

export async function GET() {
  const items = Array.from(db.watchlist.values()).sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  );
  return NextResponse.json({ items, total: items.length });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawDomain = body?.domain;

    if (!rawDomain || typeof rawDomain !== 'string') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Domain name is required.' } },
        { status: 422 }
      );
    }

    const cleanDomain = rawDomain.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0].trim().toLowerCase();

    // SSRF Guard Check
    const ssrfCheck = await validateUrlForSSRF(`https://${cleanDomain}`);
    if (!ssrfCheck.safe) {
      return NextResponse.json(
        { error: { code: 'SSRF_BLOCKED', message: ssrfCheck.reason || 'Prohibited domain.' } },
        { status: 400 }
      );
    }

    // Check if domain already in watchlist
    for (const item of Array.from(db.watchlist.values())) {
      if (item.domain.toLowerCase() === cleanDomain) {
        return NextResponse.json(item, { status: 200 });
      }
    }

    const newItem: WatchlistDomain = {
      id: 'watch-' + crypto.randomUUID().slice(0, 8),
      domain: cleanDomain,
      addedAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      status: 'healthy',
      expiresInDays: 90,
      certIssuer: "Let's Encrypt Authority R3",
    };

    db.watchlist.set(newItem.id, newItem);

    return NextResponse.json(newItem, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to add domain to watchlist' } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id && db.watchlist.has(id)) {
    db.watchlist.delete(id);
    return NextResponse.json({ success: true, message: 'Watchlist entry removed.' });
  }

  return NextResponse.json(
    { error: { code: 'NOT_FOUND', message: 'Watchlist entry not found.' } },
    { status: 404 }
  );
}

