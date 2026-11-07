import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/store';

export async function GET() {
  return NextResponse.json(db.userProfile);
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.name && typeof body.name === 'string') {
      db.userProfile.name = body.name.trim();
    }
    if (body.email && typeof body.email === 'string') {
      db.userProfile.email = body.email.trim();
    }
    if (body.role && typeof body.role === 'string') {
      db.userProfile.role = body.role.trim();
    }

    return NextResponse.json(db.userProfile);
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: err.message || 'Failed to update profile' } },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  return PATCH(req);
}

