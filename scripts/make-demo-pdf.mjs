#!/usr/bin/env node
/**
 * BLINDSHARE — demo PDF generator
 * Writes a valid multi-page PDF (no external libs) so the whole E2EE pipeline can be
 * exercised end-to-end on a fresh install:  node scripts/make-demo-pdf.mjs [outfile]
 */
import { writeFileSync } from "node:fs";

const out = process.argv[2] || "/tmp/blindshare-demo.pdf";

const PAGES = [
  { title: "BlindShare", lines: ["Zero-Knowledge Secure Document Sharing", "AES-GCM-256 in your browser · server stays blind", "This file is a locally generated demo PDF", "Page 1 of 3"] },
  { title: "What the server never sees", lines: ["- The decryption key lives only in #k=... of the URL", "- Raw HTTP requests never include URL fragments", "- Only ciphertext bytes transit the server", "Page 2 of 3"] },
  { title: "Analytics you get", lines: ["- Per-page dwell seconds (10s batched heartbeat)", "- Completion %, UA class, coarse country", "- CSV export + blind admin dashboards", "Page 3 of 3"] },
];

const esc = (s) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

function contentStream(page, index) {
  let ops = "BT /F1 22 Tf 60 730 Td (" + esc(page.title) + ") Tj ET\n";
  ops += "0.96 0.62 0.04 rg 60 716 492 3 re f\n0 0 0 rg\n";
  let y = 676;
  for (const line of page.lines) {
    ops += "BT /F1 13 Tf 60 " + y + " Td (" + esc(line) + ") Tj ET\n";
    y -= 26;
  }
  ops += "BT /F1 9 Tf 60 60 Td (BlindShare demo - deterrent watermarks are overlaid live by the viewer) Tj ET\n";
  ops += "BT /F1 9 Tf 470 60 Td (page " + (index + 1) + ") Tj ET\n";
  return ops;
}

const n = PAGES.length;
const kids = PAGES.map((_, i) => `${4 + i * 2} 0 R`).join(" ");

const objs = [];
objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
objs[2] = "<< /Type /Pages /Kids [" + kids + "] /Count " + n + " >>";
objs[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
PAGES.forEach((p, i) => {
  const pageId = 4 + i * 2;
  const contId = 5 + i * 2;
  const stream = contentStream(p, i);
  objs[pageId] =
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents " +
    contId +
    " 0 R >>";
  objs[contId] = "<< /Length " + Buffer.byteLength(stream, "latin1") + " >>\nstream\n" + stream + "endstream";
});

const chunks = [];
let offset = 0;
const push = (s) => {
  const b = Buffer.from(s, "latin1");
  chunks.push(b);
  offset += b.length;
  return b.length;
};

push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
const offsets = [];
for (let i = 1; i < objs.length; i++) {
  if (!objs[i]) continue;
  offsets[i] = offset;
  push(`${i} 0 obj\n${objs[i]}\nendobj\n`);
}
const xrefStart = offset;
let xref = `xref\n0 ${objs.length}\n0000000000 65535 f \n`;
for (let i = 1; i < objs.length; i++) {
  xref += offsets[i] ? String(offsets[i]).padStart(10, "0") + " 00000 n \n" : "0000000000 65535 f \n";
}
xref += `trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
push(xref);

writeFileSync(out, Buffer.concat(chunks));
console.log(`✅ Wrote ${n}-page demo PDF → ${out} (${offset} bytes)`);
console.log("   next: node scripts/quicklink.mjs " + out);
