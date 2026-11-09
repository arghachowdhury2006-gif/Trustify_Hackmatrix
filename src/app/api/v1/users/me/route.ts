import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/store';

export async function GET() {
  return NextResponse.json(db.userProfile);
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.name && typeof body.name === 'string') {
      const sanitizedName = body.name.replace(/[<>]/g, '').trim().slice(0, 100);
      if (sanitizedName) db.userProfile.name = sanitizedName;
    }
    if (body.email && typeof body.email === 'string') {
      const trimmedEmail = body.email.trim().toLowerCase().slice(0, 200);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return NextResponse.json(
          { error: { code: 'INVALID_EMAIL', message: 'A valid email address is required.' } },
          { status: 422 }
        );
      }
      db.userProfile.email = trimmedEmail;
    }
    if (body.role && typeof body.role === 'string') {
      const sanitizedRole = body.role.replace(/[<>]/g, '').trim().slice(0, 50);
      if (sanitizedRole) db.userProfile.role = sanitizedRole;
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

