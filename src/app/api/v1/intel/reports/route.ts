import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/store';
import { ThreatReport } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, category, description } = body;

    if (!url || !category) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'URL and category are required.' } },
        { status: 422 }
      );
    }

    let domain = url;
    try {
      domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    } catch {
      domain = url;
    }

    const report: ThreatReport = {
      id: 'rep-' + crypto.randomUUID().slice(0, 8),
      url,
      domain,
      category,
      description: description || 'Community user reported suspicious threat activity.',
      status: 'pending',
      upvotes: 1,
      downvotes: 0,
      reporterReputation: 60,
      createdAt: new Date().toISOString(),
    };

    db.threatReports.set(report.id, report);

    return NextResponse.json(report, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to submit threat report' } },
      { status: 500 }
    );
  }
}

