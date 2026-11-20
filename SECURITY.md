# Security Policy & Vulnerability Disclosure

BlindShare is committed to delivering enterprise-grade, zero-knowledge encrypted document sharing and analytics. We take the security and privacy of our users, their confidential documents, and their cryptographic keys with the utmost seriousness.

---

## Supported Versions

Only the current active release series receives proactive security fixes and patches:

| Version | Supported | Status | Notes |
| :--- | :---: | :---: | :--- |
| **`1.4.x`** | :white_check_mark: | **Active** | Current Enterprise Stable Release (`v1.4.2`) |
| `< 1.4.0` | :x: | End of Life | Unsupported. Upgrade to `v1.4.2` immediately. |

---

## Core Zero-Knowledge Invariants

Every release of BlindShare is cryptographically verified against seven foundational zero-knowledge invariants:

1. **Zero-Knowledge Architecture**: The BlindShare backend server NEVER receives, stores, or processes unencrypted document bytes or plaintext document encryption keys.
2. **Strict URL Fragment Isolation (RFC 3986)**: Master decryption keys are passed exclusively via the URL hash fragment (`https://domain.com/v/slug#k=BASE64_KEY`). Hash fragments are never sent over HTTP request headers, TLS handshakes, or server access logs.
3. **RAM Ephemerality & Memory Zeroing**: Cryptographic keys are imported as non-extractable (`extractable: false`) WebCrypto primitives. All temporary Uint8Array key buffers in memory are wiped with zeros (`zeroizeBuffer()`) immediately after use.
4. **Zero-Storage Decryption Shield**: Decrypted document bytes and keys are NEVER persisted in `localStorage`, `sessionStorage`, or IndexedDB. Viewer rendering occurs strictly in volatile memory.
5. **Signed Storage Authorization**: Local and cloud storage downloads enforce cryptographically signed HMAC-SHA256 bearer tokens with short lifespans and anti-replay protection.
6. **SSRF & Metadata Service Defense**: All outbound webhooks enforce internal IP blocking (`127.0.0.1`, `169.254.169.254`, private RFC 1918 CIDRs) and explicitly disable HTTP redirects (`redirect: "error"`).
7. **Post-Quantum Forward Resilience**: Hybrid key encapsulation (ML-KEM-768 + ECDH P-256) protects shared documents against future "Harvest Now, Decrypt Later" adversaries.

---

## Reporting a Vulnerability

> [!IMPORTANT]
> **DO NOT disclose vulnerabilities publicly in open GitHub issues, public pull requests, or community discussions.**

If you discover or suspect a security vulnerability in BlindShare, please disclose it responsibly using one of the private channels below:

### 1. GitHub Private Vulnerability Reporting (Preferred)
Submit a confidential advisory directly to the maintainers via:
👉 **[Open a Private Security Advisory](https://github.com/SudhirDevOps1/BlindShare/security/advisories/new)**

### 2. Direct Security Contact
If you cannot use GitHub Advisories, email the security lead directly:
✉️ **`security@blindshare.io`**

Please include:
- A descriptive summary of the vulnerability (e.g. key leakage, auth bypass, SSRF, DoS).
- Step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
- Affected versions and deployment configuration (Vercel, Docker, Cloudflare, etc.).
- Potential impact and any suggested mitigations.

---

## Response SLAs & Vulnerability Lifecycle

We adhere to standard coordinated disclosure timelines:

- **Initial Acknowledgment**: Within **24 to 48 hours** of report receipt.
- **Triage & Impact Assessment**: Within **72 hours** of confirmation.
- **Patch Development & Testing**: Critical vulnerabilities prioritized for hotfix within **7 to 14 days**.
- **Coordinated Public Disclosure**: Once a patched release is published, we publish a GitHub Security Advisory and credit the researcher.

---

## Security Hall of Fame & Attribution

We believe in celebrating the ethical security research community. Researchers who report verified, actionable vulnerabilities in accordance with this policy will be:
- Credited in the official **Release Notes** (`docs/CHANGELOG.md`).
- Added to our **Security Hall of Fame** in repository documentation.
- Assigned formal CVE credit when applicable.

Thank you for helping keep BlindShare and its users secure!
