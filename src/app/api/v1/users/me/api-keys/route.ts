import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/store';
import { ApiKeyRecord } from '@/lib/types';

export async function GET() {
  const keys = Array.from(db.apiKeys.values()).map(k => ({
    id: k.id,
    name: k.name,
    prefix: k.prefix,
    createdAt: k.createdAt,
    lastUsedAt: k.lastUsedAt,
  }));
  return NextResponse.json({ items: keys });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = body?.name || 'API Client Key';

  const randomHex = crypto.randomBytes(16).toString('hex');
  const fullKey = `tf_live_${randomHex}`;
  const prefix = fullKey.substring(0, 11);

  const newKey: ApiKeyRecord = {
    id: 'key-' + crypto.randomUUID().slice(0, 8),
    name,
    prefix,
    key: fullKey,
    createdAt: new Date().toISOString(),
  };

  db.apiKeys.set(newKey.id, newKey);

  return NextResponse.json(newKey, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id && db.apiKeys.has(id)) {
    db.apiKeys.delete(id);
    return NextResponse.json({ success: true, message: 'API key revoked.' });
  }

  return NextResponse.json(
    { error: { code: 'NOT_FOUND', message: 'Key not found.' } },
    { status: 404 }
  );
}
