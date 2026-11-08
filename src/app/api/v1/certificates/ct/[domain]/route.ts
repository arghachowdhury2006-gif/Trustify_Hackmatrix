import { NextRequest, NextResponse } from 'next/server';
import { inspectCertificate } from '@/lib/engines/certificateEngine';
import { validateUrlForSSRF } from '@/lib/engines/ssrfGuard';

export async function GET(
  req: NextRequest,
  { params }: { params: { domain: string } }
) {
  try {
    const domain = params.domain.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0].trim();

    // SSRF Guard Check
    const ssrfCheck = await validateUrlForSSRF(`https://${domain}`);
    if (!ssrfCheck.safe) {
      return NextResponse.json(
        {
          error: {
            code: 'SSRF_BLOCKED',
            message: ssrfCheck.reason || 'Target domain blocked by security policy (SSRF protection).',
          },
        },
        { status: 400 }
      );
    }

    const certAnalysis = await inspectCertificate(domain, 443, 4000);

    return NextResponse.json({
      domain,
      ct: certAnalysis.summary.ct,
      unexpected_issuers: certAnalysis.summary.ct?.unexpectedIssuers || [],
      entries: certAnalysis.summary.ct?.entries || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: err.message || 'CT log query failed' } },
      { status: 500 }
    );
  }
}

