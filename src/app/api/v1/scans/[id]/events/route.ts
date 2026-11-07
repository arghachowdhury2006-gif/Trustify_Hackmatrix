import { NextRequest } from 'next/server';
import { db } from '@/lib/store';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const encoder = new TextEncoder();
  const scan = db.scans.get(params.id);

  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(event: string, data: any) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      }

      // Staged progress timeline events
      sendEvent('stage', { stage: 'resolve', state: 'completed', progress: 0.2, label: 'DNS & Host Resolution' });
      await new Promise(r => setTimeout(r, 200));

      sendEvent('stage', { stage: 'certificate', state: 'completed', progress: 0.4, label: 'TLS Certificate Validation' });
      await new Promise(r => setTimeout(r, 200));

      sendEvent('stage', { stage: 'websec', state: 'completed', progress: 0.6, label: 'Web Security Assessment' });
      await new Promise(r => setTimeout(r, 200));

      sendEvent('stage', { stage: 'threat', state: 'completed', progress: 0.8, label: 'Threat & Brand Analysis' });
      await new Promise(r => setTimeout(r, 200));

      sendEvent('stage', { stage: 'scoring', state: 'completed', progress: 1.0, label: 'Unified Trust Scoring' });
      await new Promise(r => setTimeout(r, 100));

      if (scan) {
        sendEvent('done', {
          scan_id: scan.id,
          verdict: scan.verdict,
          score: scan.score,
          url: scan.normalizedUrl,
        });
      } else {
        sendEvent('done', { scan_id: params.id, status: 'completed' });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

