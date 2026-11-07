import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: '1.0.0',
    platform: 'Trustify - AI-Powered Web Threat Detection & Digital Trust Intelligence',
    timestamp: new Date().toISOString(),
    engines: {
      threat: 'operational',
      certificate: 'operational',
      websec: 'operational',
      intel: 'operational',
      ssrfGuard: 'active',
    },
  });
}
