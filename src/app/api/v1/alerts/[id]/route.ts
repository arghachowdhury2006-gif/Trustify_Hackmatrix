import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/store';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const alert = db.alerts.get(params.id);
  if (!alert) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Alert not found.' } },
      { status: 404 }
    );
  }

  const body = await req.json();
  if (typeof body?.isRead === 'boolean') {
    alert.isRead = body.isRead;
  }
  if (typeof body?.isDismissed === 'boolean') {
    alert.isDismissed = body.isDismissed;
  }

  db.alerts.set(alert.id, alert);

  return NextResponse.json(alert);
}
