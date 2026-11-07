import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const sort = searchParams.get('sort') || 'new';
  const userId = req.headers.get('x-user-id') || 'analyst-user-session';

  let reports = Array.from(db.threatReports.values()).map(r => {
    const userVote = db.userVotes.get(`${userId}:${r.id}`) || 0;
    return {
      ...r,
      userVoted: userVote === 1 ? 1 : userVote === -1 ? -1 : undefined,
    };
  });

  if (category && category !== 'all') {
    reports = reports.filter(r => r.category === category);
  }

  if (sort === 'top') {
    reports.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
  } else {
    reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return NextResponse.json({
    items: reports,
    total: reports.length,
  });
}
