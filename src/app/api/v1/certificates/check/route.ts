import { NextRequest, NextResponse } from 'next/server';
import { inspectCertificate } from '@/lib/engines/certificateEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let host = body?.host || body?.domain || '';
    const port = Number(body?.port) || 443;

    if (!host) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Host is required.' } },
        { status: 422 }
      );
    }

    // Strip scheme if present
    host = host.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];

    const result = await inspectCertificate(host, port, 6000);

    return NextResponse.json({
      host,
      valid: result.summary.valid,
      risk: result.certRisk,
      chain: result.summary.chain,
      sans: result.summary.sans,
      flags: result.summary.flags.map(f => {
        const matchingReason = result.reasons.find(r => r.code === f);
        return {
          code: f,
          severity: matchingReason?.severity || 'medium',
          detail: matchingReason?.detail || f,
        };
      }),
      weak_key_analysis: result.summary.weakKeyAnalysis,
      ct: result.summary.ct,
      summary: result.summary,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to inspect certificate' } },
      { status: 500 }
    );
  }
}

