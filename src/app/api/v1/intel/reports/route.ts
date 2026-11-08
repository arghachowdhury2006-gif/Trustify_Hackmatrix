import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/store';
import { ThreatCategory, ThreatReport } from '@/lib/types';

const ALLOWED_CATEGORIES: Set<ThreatCategory> = new Set([
  'phishing',
  'malware',
  'spyware',
  'scam',
  'fake_recruitment',
  'fake_payment',
  'impersonation',
  'other',
]);

function sanitizeString(input: string, maxLen = 1000): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .trim()
    .slice(0, maxLen);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const sort = searchParams.get('sort') || 'new';

  let reports = Array.from(db.threatReports.values());

  if (category && category !== 'all' && ALLOWED_CATEGORIES.has(category as ThreatCategory)) {
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl = body?.url;
    const rawCategory = body?.category;
    const rawDescription = body?.description;

    if (!rawUrl || typeof rawUrl !== 'string' || !rawCategory) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'URL and category are required.' } },
        { status: 422 }
      );
    }

    const cleanCategory = String(rawCategory).toLowerCase().trim() as ThreatCategory;
    if (!ALLOWED_CATEGORIES.has(cleanCategory)) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_CATEGORY',
            message: `Invalid category. Allowed: ${Array.from(ALLOWED_CATEGORIES).join(', ')}`,
          },
        },
        { status: 422 }
      );
    }

    const cleanUrl = sanitizeString(rawUrl, 500);
    const cleanDesc = sanitizeString(rawDescription || 'Community user reported suspicious threat activity.', 1000);

    let domain = cleanUrl;
    try {
      domain = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`).hostname;
    } catch {
      domain = cleanUrl.split('/')[0];
    }

    const report: ThreatReport = {
      id: 'rep-' + crypto.randomUUID().slice(0, 8),
      url: cleanUrl,
      domain,
      category: cleanCategory,
      description: cleanDesc,
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

