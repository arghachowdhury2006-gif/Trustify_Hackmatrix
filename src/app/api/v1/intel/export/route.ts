import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'json';
  const reports = Array.from(db.threatReports.values());

  if (format === 'csv') {
    const headers = 'id,url,domain,category,status,upvotes,created_at\n';
    const rows = reports.map(r => 
      `"${r.id}","${r.url}","${r.domain}","${r.category}","${r.status}",${r.upvotes},"${r.createdAt}"`
    ).join('\n');

    return new Response(headers + rows, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="trustify_threat_intel_ioc.csv"',
      },
    });
  }

  if (format === 'stix') {
    const stixBundle = {
      type: 'bundle',
      id: 'bundle--trustify-threat-feed',
      spec_version: '2.1',
      objects: reports.map(r => ({
        type: 'indicator',
        spec_version: '2.1',
        id: `indicator--${r.id}`,
        created: r.createdAt,
        name: `Malicious URL Indicator: ${r.domain}`,
        pattern: `[url:value = '${r.url}']`,
        pattern_type: 'stix',
        valid_from: r.createdAt,
        confidence: 85,
        indicator_types: [r.category === 'phishing' ? 'malicious-activity' : 'anomalous-activity'],
      })),
    };
    return NextResponse.json(stixBundle);
  }

  return NextResponse.json({
    feed_name: 'Trustify Threat Intelligence Feed',
    exported_at: new Date().toISOString(),
    total_indicators: reports.length,
    indicators: reports,
  });
}
