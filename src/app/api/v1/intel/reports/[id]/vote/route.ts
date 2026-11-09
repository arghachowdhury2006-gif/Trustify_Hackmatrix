import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/store';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const report = db.threatReports.get(params.id);
    if (!report) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Threat report not found.' } },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const voteValue = Number(body?.value); // 1 or -1

    if (voteValue !== 1 && voteValue !== -1) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Vote value must be 1 (upvote) or -1 (downvote).' } },
        { status: 422 }
      );
    }

    const userId = body?.userId || req.headers.get('x-user-id') || 'analyst-user-session';

    const voteKey = `${userId}:${report.id}`;
    const prevVote = db.userVotes.get(voteKey) || 0; // 0 = not voted, 1 = upvoted, -1 = downvoted
    let newVote = 0;

    if (voteValue === 1) {
      if (prevVote === 1) {
        // Already liked: toggle/cancel like (decrease by 1)
        report.upvotes = Math.max(0, report.upvotes - 1);
        newVote = 0;
      } else if (prevVote === -1) {
        // Was disliked: switch from dislike to like
        report.downvotes = Math.max(0, report.downvotes - 1);
        report.upvotes += 1;
        newVote = 1;
      } else {
        // First time like: increase by 1
        report.upvotes += 1;
        newVote = 1;
      }
    } else if (voteValue === -1) {
      if (prevVote === -1) {
        // Already disliked: toggle/cancel dislike (decrease by 1)
        report.downvotes = Math.max(0, report.downvotes - 1);
        newVote = 0;
      } else if (prevVote === 1) {
        // Was liked: switch from like to dislike
        report.upvotes = Math.max(0, report.upvotes - 1);
        report.downvotes += 1;
        newVote = -1;
      } else {
        // First time dislike: increase by 1
        report.downvotes += 1;
        newVote = -1;
      }
    }

    db.userVotes.set(voteKey, newVote);

    // Auto verify if upvotes >= 3
    if (report.upvotes >= 3 && report.status === 'pending') {
      report.status = 'verified';
    }

    db.threatReports.set(report.id, report);

    return NextResponse.json({
      success: true,
      upvotes: report.upvotes,
      downvotes: report.downvotes,
      userVote: newVote,
      status: report.status,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
