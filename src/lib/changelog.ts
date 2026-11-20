export interface ChangelogCategory {
  category: "features" | "security" | "branding" | "performance";
  titleEn: string;
  titleHi: string;
  itemsEn: string[];
  itemsHi: string[];
}

export interface ReleaseNote {
  version: string;
  date: string;
  tag: string;
  isLatest?: boolean;
  titleEn: string;
  titleHi: string;
  bannerBadgeEn: string;
  bannerBadgeHi: string;
  bannerHeadlineEn: string;
  bannerHeadlineHi: string;
  highlightsEn: string[];
  highlightsHi: string[];
  categories: ChangelogCategory[];
}

export const RELEASES_HISTORY: ReleaseNote[] = [
  {
    version: "0.1.2",
    date: "2026-11-20",
    tag: "blindshare-v0.1.2",
    isLatest: true,
    titleEn: "Cyber-Gold Vault Brand & Zero-Trust Edge Security",
    titleHi: "साइबर-गोल्ड वॉल्ट ब्रांड और ज़ीरो-ट्रस्ट एज सुरक्षा",
    bannerBadgeEn: "What's New in v0.1.2",
    bannerBadgeHi: "v0.1.2 में नया क्या है",
    bannerHeadlineEn: "Sleek Cyber-Gold Vault Emblem & Zero-Trust Edge Hardening",
    bannerHeadlineHi: "नया साइबर-गोल्ड वॉल्ट एम्बलम और ज़ीरो-ट्रस्ट सुरक्षा",
    highlightsEn: [
      "Pure SVG geometric vault emblem with cyber-gold gradients and dual courier orbit nodes",
      "Strict Same-Origin Edge CSRF guard blocking external forged mutating requests",
      "Anti-spoofing IP sanitizer enforcing RFC-compliant IPv4/IPv6 validation",
      "Strict Referrer Zero-Leakage policy on secret document viewer routes",
      "Edge payload size bounds: 1MB JSON API cap and 50MB direct streaming limit",
    ],
    highlightsHi: [
      "साइबर-गोल्ड ग्रेडिएंट और दोहरे कूरियर ऑर्बिट नोड्स के साथ प्योर SVG ज्योमैट्रिक वॉल्ट एम्बलम",
      "बाहरी जाली अनुरोधों को ब्लॉक करने वाला सख्त सेम-ओरिजिन एज CSRF गार्ड",
      "RFC-मानक IPv4/IPv6 वैलिडेशन लागू करने वाला एंटी-स्पूफिंग IP सैनिटाइज़र",
      "सीक्रेट डॉक्यूमेंट व्यूअर रूट्स पर सख्त रेफरर ज़ीरो-लीकेज पॉलिसी",
      "एज पेलोड साइज सीमा: 1MB JSON API कैप और 50MB डायरेक्ट स्ट्रीमिंग लिमिट",
    ],
    categories: [
      {
        category: "branding",
        titleEn: "Brand Identity & Visual Design",
        titleHi: "ब्रांड पहचान और विज़ुअल डिज़ाइन",
        itemsEn: [
          "Redesigned SVG Favicon, App Icons (512x512), and Full Wordmark with obsidian vault shield",
          "Confidential triple iris shutter slits symbolizing client-side zero-knowledge encryption",
          "Balanced Dark & Light theme variants with ultra-sharp vector rendering at any scale",
        ],
        itemsHi: [
          "ओब्सिडियन वॉल्ट शील्ड के साथ नया SVG फेविकॉन, ऐप आइकन और वर्डमार्क",
          "क्लाइंट-साइड ज़ीरो-नॉलेज एन्क्रिप्शन दर्शाने वाली ट्रिपल आइरिस शटर स्लॉट्स",
          "किसी भी स्क्रीन साइज पर शार्प वेक्टर रेंडरिंग हेतु डार्क और लाइट थीम वेरिएंट",
        ],
      },
      {
        category: "security",
        titleEn: "Zero-Trust Edge Defense",
        titleHi: "ज़ीरो-ट्रस्ट एज डिफ़ेंस",
        itemsEn: [
          "Same-Origin check against Host/X-Forwarded-Host to eliminate Papermark-style CSRF flaws",
          "Input length boundary on public Q&A questions (max 2,000 chars) to prevent resource exhaustion",
          "Hardened CSP connect-src restricting WebSocket and network calls to approved hosts only",
        ],
        itemsHi: [
          "पेपरमार्क जैसी CSRF कमियों को रोकने के लिए Host/X-Forwarded-Host के खिलाफ सेम-ओरिजिन चेक",
          "सार्वजनिक Q&A प्रश्नों पर 2,000 अक्षरों की सख्त इनपुट सीमा",
          "सख्त CSP connect-src जो नेटवर्क कॉल्स को केवल स्वीकृत होस्ट्स तक सीमित रखता है",
        ],
      },
    ],
  },
  {
    version: "0.1.1",
    date: "2026-11-20",
    tag: "blindshare-v0.1.1",
    titleEn: "Single-Source Universal Version Parity & CI Automation",
    titleHi: "सिंगल-सोर्स यूनिवर्सल वर्शन पैरिटी और CI ऑटोमेशन",
    bannerBadgeEn: "v0.1.1 Release",
    bannerBadgeHi: "v0.1.1 रिलीज़",
    bannerHeadlineEn: "Automated Single-Source Versioning across 27 Markdown Docs & Workspaces",
    bannerHeadlineHi: "27 डॉक्स और वर्कस्पेस में ऑटोमेटेड सिंगल-सोर्स वर्शनिंग",
    highlightsEn: [
      "Single-source-of-truth version sync across package.json, src/lib/version.ts, and all docs",
      "Release-Please workflow automation with automated changelog generation and SemVer bumps",
      "Zero-Knowledge cryptographic invariants self-check enforcing 0 server-side decrypt calls",
    ],
    highlightsHi: [
      "package.json, src/lib/version.ts और सभी 27 डॉक्स में सिंगल-सोर्स वर्शन सिंक",
      "ऑटोमेटेड चेंजलॉग और SemVer बम्प्स के साथ Release-Please वर्कफ़्लो ऑटोमेशन",
      "ज़ीरो-नॉलेज क्रिप्टोग्राफ़िक सेल्फ़-चेक जो 0 सर्वर-साइड डिक्रिप्ट कॉल्स सुनिश्चित करता है",
    ],
    categories: [
      {
        category: "performance",
        titleEn: "CI/CD & Architecture Automation",
        titleHi: "CI/CD और आर्किटेक्चर ऑटोमेशन",
        itemsEn: [
          "Generic release-please parser updating both TypeScript runtime constants and manifest",
          "Automated verification suite running 65 enterprise tests in under 3.5 seconds",
        ],
        itemsHi: [
          "टाइपस्क्रिप्ट रनटाइम कॉन्स्टेंट्स और मेनिफेस्ट दोनों को अपडेट करने वाला रिलीज़ पार्सर",
          "3.5 सेकंड में 65 एंटरप्राइज टेस्ट्स पूरा करने वाला ऑटोमेटेड वेरिफिकेशन सुइट",
        ],
      },
    ],
  },
  {
    version: "0.1.0",
    date: "2026-11-20",
    tag: "blindshare-v0.1.0",
    titleEn: "Genesis Open-Source Release — Zero-Knowledge Document Vault",
    titleHi: "प्रारंभिक ओपन-सोर्स रिलीज़ — ज़ीरो-नॉलेज डॉक्यूमेंट वॉल्ट",
    bannerBadgeEn: "Genesis Release",
    bannerBadgeHi: "प्रारंभिक रिलीज़",
    bannerHeadlineEn: "100% Free-Tier Client-Side E2EE Document Sharing & Deep Pitch Analytics",
    bannerHeadlineHi: "100% मुफ़्त क्लाइंट-साइड E2EE डॉक्यूमेंट शेयरिंग और गहन एनालिटिक्स",
    highlightsEn: [
      "Client-side WebCrypto AES-GCM-256 with URL #k= fragment key transport (never sent to server)",
      "Bitwarden-grade PBKDF2 100k rounds Master Key Vault with cross-device sync",
      "DuckDB-powered per-page dwell time percentiles (p50, p90, p99) and reading heatmaps",
      "Indelibly stamped dynamic watermarks burned into rendered PDF canvas",
      "Real-time in-document Q&A inbox with zero cryptographic key exposure",
    ],
    highlightsHi: [
      "क्लाइंट-साइड WebCrypto AES-GCM-256 और URL #k= फ़्रैगमेंट की ट्रांसपोर्ट (सर्वर को कभी नहीं भेजा जाता)",
      "बिटवार्डन-ग्रेड PBKDF2 100k राउंड्स मास्टर की वॉल्ट",
      "डकबीड आधारित प्रति-पेज ड्वेल टाइम और रीडिंग हीटमैप्स (p50, p90, p99)",
      "रेंडर्ड PDF कैनवस पर जलने वाले डायनामिक वाटरमार्क्स",
      "बिना की-एक्सपोज़र के रियल-टाइम इन-डॉक्यूमेंट Q&A इनबॉक्स",
    ],
    categories: [
      {
        category: "features",
        titleEn: "Core Cryptographic & Analytics Features",
        titleHi: "प्रमुख क्रिप्टोग्राफ़िक और एनालिटिक्स फीचर्स",
        itemsEn: [
          "Post-quantum hybrid secret support (Classical ECDH + Lattice Secret)",
          "Forensic steganography constellation with CRC verification",
          "Self-hosted ALTCHA Proof-of-Work anti-bot protection across all 4 entry vectors",
        ],
        itemsHi: [
          "पोस्ट-क्वांटम हाइब्रिड सीक्रेट सपोर्ट (ECDH + लेटिस सीक्रेट)",
          "CRC वेरिफिकेशन के साथ फॉरेंसिक स्टेग्नोग्राफी तारामंडल",
          "सभी 4 एंट्री वेक्टर्स पर सेल्फ-होस्टेड ALTCHA बॉट डिफ़ेंस",
        ],
      },
    ],
  },
];

export function getLatestRelease(targetVersion?: string): ReleaseNote {
  if (targetVersion) {
    const found = RELEASES_HISTORY.find((r) => r.version === targetVersion);
    if (found) return { ...found, isLatest: true };
  }
  return { ...RELEASES_HISTORY[0], isLatest: true };
}
