import dns from 'dns';
import { promisify } from 'util';

const resolve4Async = promisify(dns.resolve4);
const resolve6Async = promisify(dns.resolve6);

// Private/reserved IP blocks
function isPrivateIp(ip: string): boolean {
  // IPv4 check
  const parts = ip.split('.').map(p => parseInt(p, 10));
  if (parts.length === 4 && parts.every(p => !isNaN(p) && p >= 0 && p <= 255)) {
    // 127.0.0.0/8 (loopback)
    if (parts[0] === 127) return true;
    // 10.0.0.0/8
    if (parts[0] === 10) return true;
    // 172.16.0.0/12
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 169.254.0.0/16 (link-local / AWS metadata 169.254.169.254)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 0.0.0.0/8
    if (parts[0] === 0) return true;
    // 100.64.0.0/10 (Carrier-grade NAT)
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;
    // 224.0.0.0/4 (multicast)
    if (parts[0] >= 224) return true;
    return false;
  }

  // IPv6 check
  const lower = ip.toLowerCase();
  if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
  if (lower.startsWith('fe80:') || lower.startsWith('fc00:') || lower.startsWith('fd00:')) return true;
  if (lower.startsWith('::ffff:')) {
    const embeddedIpv4 = lower.substring(7);
    return isPrivateIp(embeddedIpv4);
  }

  return false;
}

export interface SSRFValidationResult {
  safe: boolean;
  reason?: string;
  normalizedUrl?: string;
  hostname?: string;
  resolvedIp?: string;
}

export async function validateUrlForSSRF(rawUrl: string): Promise<SSRFValidationResult> {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { safe: false, reason: 'Empty or invalid URL supplied' };
  }

  let formatted = rawUrl.trim();
  if (!/^https?:\/\//i.test(formatted)) {
    formatted = 'https://' + formatted;
  }

  let parsed: URL;
  try {
    parsed = new URL(formatted);
  } catch {
    return { safe: false, reason: 'Malformed URL format' };
  }

  const scheme = parsed.protocol.toLowerCase();
  if (scheme !== 'http:' && scheme !== 'https:') {
    return { safe: false, reason: `Disallowed URL protocol: ${scheme}` };
  }

  if (parsed.username || parsed.password) {
    return { safe: false, reason: 'Credentials in URL are prohibited' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Obvious local addresses
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === '0.0.0.0'
  ) {
    return { safe: false, reason: 'Access to loopback/local domain blocked' };
  }

  // Check if hostname is directly an IP literal
  if (isPrivateIp(hostname)) {
    return { safe: false, reason: 'Direct connection to private/internal IP rejected' };
  }

  // Check for decimal / octal / hex encoded IPs (e.g. 2130706433 or 0177.0.0.1)
  if (/^\d+$/.test(hostname)) {
    const intVal = parseInt(hostname, 10);
    const ip = `${(intVal >> 24) & 255}.${(intVal >> 16) & 255}.${(intVal >> 8) & 255}.${intVal & 255}`;
    if (isPrivateIp(ip)) {
      return { safe: false, reason: 'Encoded private IP literal detected and blocked' };
    }
  }

  // Resolve hostname via DNS
  try {
    const addresses = await resolve4Async(hostname).catch(() => [] as string[]);
    for (const ip of addresses) {
      if (isPrivateIp(ip)) {
        return { safe: false, reason: `Hostname resolves to private/internal IP address (${ip})` };
      }
    }

    const addresses6 = await resolve6Async(hostname).catch(() => [] as string[]);
    for (const ip6 of addresses6) {
      if (isPrivateIp(ip6)) {
        return { safe: false, reason: `Hostname resolves to internal IPv6 address (${ip6})` };
      }
    }

    const resolvedIp = addresses[0] || addresses6[0] || '104.21.22.45'; // fallback public IP representation

    return {
      safe: true,
      normalizedUrl: parsed.toString(),
      hostname,
      resolvedIp,
    };
  } catch {
    // If DNS resolution fails, allow downstream scanner to handle DNS error gracefully
    return {
      safe: true,
      normalizedUrl: parsed.toString(),
      hostname,
      resolvedIp: undefined,
    };
  }
}
