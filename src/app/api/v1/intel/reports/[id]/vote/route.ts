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

    const body = await req.json();
    const voteValue = Number(body?.value); // 1 or -1

    if (voteValue === 1) {
      report.upvotes += 1;
    } else if (voteValue === -1) {
      report.downvotes += 1;
    }

    // Auto verify if upvotes >= 3
    if (report.upvotes >= 3 && report.status === 'pending') {
      report.status = 'verified';
    }

    db.threatReports.set(report.id, report);

    return NextResponse.json({
      success: true,
      upvotes: report.upvotes,
      downvotes: report.downvotes,
      status: report.status,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}

