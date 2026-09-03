import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Encrypted Document | BlindShare Zero-Knowledge Courier",
  description: "Secure client-side decrypted document. Plaintext bytes and keys are never accessible to servers or search engines.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-video-preview": 0,
      "max-image-preview": "none",
      "max-snippet": 0,
    },
  },
};

export default function ViewerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
