import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const severity = searchParams.get('severity');
  const unreadOnly = searchParams.get('unread') === 'true';

  let alerts = Array.from(db.alerts.values()).filter(a => !a.isDismissed);

  if (severity && severity !== 'all') {
    alerts = alerts.filter(a => a.severity === severity);
  }

  if (unreadOnly) {
    alerts = alerts.filter(a => !a.isRead);
  }

  alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = Array.from(db.alerts.values()).filter(a => !a.isRead && !a.isDismissed).length;

  return NextResponse.json({
    items: alerts,
    total: alerts.length,
    unread_count: unreadCount,
  });
}

export async function POST(req: NextRequest) {
  // Mark all read
  Array.from(db.alerts.values()).forEach(alert => {
    alert.isRead = true;
  });
  return NextResponse.json({ success: true, message: 'All alerts marked as read.' });
}
