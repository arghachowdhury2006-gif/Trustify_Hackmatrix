"""
Trustify / FraudGuard AI — Model Context Protocol (MCP) Server
Allows AI agents, IDE extensions, and automation scripts to interact with Trustify's security scanner.
"""

import os
import json
import urllib.request
import urllib.error

FRAUDGUARD_API_URL = os.environ.get("FRAUDGUARD_API_URL", "http://localhost:3000/api/v1")
FRAUDGUARD_API_KEY = os.environ.get("FRAUDGUARD_API_KEY", "")

def _make_request(endpoint: str, method: str = "GET", data: dict = None) -> dict:
    url = f"{FRAUDGUARD_API_URL}{endpoint}"
    headers = {
        "User-Agent": "Trustify-MCP-Client/1.0",
        "Content-Type": "application/json"
    }
    if FRAUDGUARD_API_KEY:
        headers["X-API-Key"] = FRAUDGUARD_API_KEY

    payload = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=payload, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return json.loads(err_body)
        except Exception:
            return {"error": {"code": "HTTP_ERROR", "message": str(e)}}
    except Exception as e:
        return {"error": {"code": "NETWORK_ERROR", "message": str(e)}}

def scan_url(url: str, deep: bool = False) -> dict:
    """
    Scan a URL for phishing, malicious lookalikes, certificate anomalies, and web security risks.
    Returns verdict, 0-100 score, reasons, and recommendations.
    """
    return _make_request("/scans", method="POST", data={"url": url, "deep": deep})

def check_certificate(host: str, port: int = 443) -> dict:
    """
    Deep cryptographic TLS certificate inspection, chain audit, and eMudhra weak-key analysis.
    """
    return _make_request("/certificates/check", method="POST", data={"host": host, "port": port})

def report_threat(url: str, category: str = "phishing", description: str = "") -> dict:
    """
    Report a malicious URL to the Trustify collaborative threat intelligence network.
    """
    return _make_request("/intel/reports", method="POST", data={
        "url": url,
        "category": category,
        "description": description
    })

def get_trending_threats(window: str = "24h") -> dict:
    """
    Fetch trending malicious targets, top impersonated brands, and category distributions.
    """
    return _make_request("/intel/trending", method="GET")

if __name__ == "__main__":
    print("Trustify MCP Server loaded. Ready to inspect web threats.")
    # Quick health check
    health = _make_request("/health")
    print(f"Connection Status: {health.get('status', 'offline')}")

