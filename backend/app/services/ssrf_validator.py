import ipaddress
import socket
from urllib.parse import urlparse
from typing import Tuple

BLOCKED_HOSTNAMES = {
    "localhost",
    "metadata.google.internal",
    "metadata.internal",
    "169.254.169.254",
    "instance-data"
}

def validate_safe_url(url: str) -> Tuple[bool, str]:
    """
    Validates a URL to prevent Server-Side Request Forgery (SSRF).
    Only allows public http:// and https:// destinations.
    Rejects loopback, private networks, cloud metadata, and invalid schemes.
    """
    if not url:
        return False, "Target URL cannot be empty."

    try:
        parsed = urlparse(url)
    except Exception as e:
        return False, f"Malformed URL: {str(e)}"

    if parsed.scheme.lower() not in ("http", "https"):
        return False, f"Unsupported scheme '{parsed.scheme}'. Only HTTP and HTTPS are permitted."

    hostname = parsed.hostname
    if not hostname:
        return False, "URL must include a valid hostname."

    hostname_clean = hostname.strip().lower()

    if hostname_clean in BLOCKED_HOSTNAMES or hostname_clean.endswith(".local") or hostname_clean.endswith(".internal"):
        return False, f"Target '{hostname_clean}' is a restricted local or internal address."

    # Resolve hostname to IP to verify against private IP blocks
    try:
        # Get all resolved addresses (IPv4 and IPv6)
        addr_info = socket.getaddrinfo(hostname_clean, parsed.port or (443 if parsed.scheme == "https" else 80))
        for item in addr_info:
            ip_str = item[4][0]
            ip_obj = ipaddress.ip_address(ip_str)

            if ip_obj.is_loopback:
                return False, f"Resolved IP {ip_str} is a loopback address (disallowed)."
            if ip_obj.is_private:
                return False, f"Resolved IP {ip_str} is within a private network range (disallowed)."
            if ip_obj.is_link_local:
                return False, f"Resolved IP {ip_str} is a link-local address (disallowed)."
            if ip_obj.is_multicast:
                return False, f"Resolved IP {ip_str} is a multicast address (disallowed)."
            if ip_obj.is_reserved:
                return False, f"Resolved IP {ip_str} is a reserved IP address (disallowed)."
            if str(ip_obj) == "169.254.169.254":
                return False, "Access to cloud metadata endpoints is strictly blocked."

    except socket.gaierror:
        # Could not resolve host, e.g. fictitious or dead domain
        return False, f"Unable to resolve hostname '{hostname_clean}'. DNS lookup failed."
    except Exception as e:
        return False, f"DNS verification error for '{hostname_clean}': {str(e)}"

    return True, ""
