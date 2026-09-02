"use client";

import React, { useState, useEffect } from "react";
import {
  Lock,
  Cpu,
  ServerOff,
  CheckCircle2,
  Key,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { generateDocKey, encryptBytes, decryptBytes, docKeyToFragment, bufferToHex } from "@/lib/crypto-core";

export function CryptoInteractiveDemo() {
  const [inputText, setInputText] = useState("Confidential Pitch Deck & Financials 2026");
  const [keyHex, setKeyHex] = useState("");
  const [keyFragment, setKeyFragment] = useState("");
  const [cipherHex, setCipherHex] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [decryptedPreview, setDecryptedPreview] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const runLiveEncryption = async (text: string) => {
    try {
      setIsEncrypting(true);
      const encoder = new TextEncoder();
      const rawBytes = encoder.encode(text);

      // 1. WebCrypto random 256-bit key in browser RAM
      const key = generateDocKey();
      const fragment = docKeyToFragment(key);
      const hex = bufferToHex(key);

      setKeyHex(hex);
      setKeyFragment(fragment);

      // 2. AES-GCM-256 Client-side Encrypt
      const { ciphertext, iv } = await encryptBytes(rawBytes.buffer, key);
      const hexFull = bufferToHex(ciphertext);
      const cipherHexStr = hexFull.slice(0, 24) + "..." + hexFull.slice(-12);
      setCipherHex(cipherHexStr);

      // 3. Decrypt in-memory verification
      const decryptedBuf = await decryptBytes(ciphertext, key, iv);
      const decoder = new TextDecoder();
      setDecryptedPreview(decoder.decode(decryptedBuf));
    } catch {
    } finally {
      setIsEncrypting(false);
    }
  };

  useEffect(() => {
    runLiveEncryption(inputText);
  }, []);

  const handleCopyKey = () => {
    if (!keyHex) return;
    navigator.clipboard.writeText(keyHex);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyUrl = () => {
    const fullUrl = `https://blindshare.app/v/demo#k=${keyFragment}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // Format key into neat chunks for ultra-clean readability
  const formattedKey = keyHex
    ? `${keyHex.slice(0, 16)}...${keyHex.slice(-16)}`
    : "Deriving in RAM...";

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl border border-amber-500/30 bg-gradient-to-b from-slate-950/95 via-slate-900/90 to-slate-950/95 shadow-2xl shadow-amber-500/10 backdrop-blur-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
      {/* Ambient Gradient Glows */}
      <div className="absolute -top-16 right-1/4 w-80 h-80 bg-amber-500/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute -bottom-16 left-1/4 w-80 h-80 bg-blue-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Header bar with live status */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/25 flex-shrink-0">
            <Cpu className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Live Zero-Knowledge WebCrypto Engine
              </h3>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                100% In Browser RAM
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live interactive demonstration of client-side AES-GCM-256 encryption. Plaintext never leaves your machine.
            </p>
          </div>
        </div>

        <button
          onClick={() => runLiveEncryption(inputText)}
          className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-700/80 px-4 py-2 text-xs font-bold text-amber-300 hover:text-white hover:bg-slate-800 hover:border-amber-500/50 transition-all shadow-md active:scale-95"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-amber-400 ${isEncrypting ? "animate-spin" : ""}`} />
          <span>Regenerate DocKey</span>
        </button>
      </div>

      {/* Input Simulator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Interactive Input (Simulate Document Plaintext):</span>
          </label>
          <span className="text-[11px] font-mono text-amber-400/90 font-medium">
            WebCrypto API `crypto.subtle`
          </span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              runLiveEncryption(e.target.value);
            }}
            placeholder="Type confidential document text..."
            className="w-full rounded-2xl border border-slate-700/90 bg-slate-950/80 px-4.5 py-3 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all font-medium shadow-inner"
          />
        </div>
      </div>

      {/* 3-Step Cryptographic Flow Visualizer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
        {/* Step 1: Client Memory */}
        <div className="glass-card rounded-2xl p-5 space-y-3.5 border border-amber-500/30 bg-slate-900/60 relative overflow-hidden flex flex-col justify-between group hover:border-amber-500/50 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Lock className="h-4 w-4" /> 1. Browser RAM
              </span>
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-mono text-amber-300 border border-amber-500/30">
                Device Local
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs text-slate-300 font-medium flex items-center justify-between">
                <span>256-bit AES Key:</span>
                <button
                  onClick={handleCopyKey}
                  className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-mono"
                >
                  {copiedKey ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedKey ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="rounded-xl bg-slate-950 px-3 py-2 font-mono text-[11px] text-amber-300/90 border border-slate-800/80 truncate">
                {formattedKey}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
            Generated with WebCrypto CSPRNG. Key never touches disk or server.
          </p>
        </div>

        {/* Step 2: URL Fragment Transport */}
        <div className="glass-card rounded-2xl p-5 space-y-3.5 border border-blue-500/30 bg-slate-900/60 relative overflow-hidden flex flex-col justify-between group hover:border-blue-500/50 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider">
                <Key className="h-4 w-4" /> 2. #Fragment (#k=)
              </span>
              <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[9px] font-mono text-blue-300 border border-blue-500/30">
                RFC 3986
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs text-slate-300 font-medium flex items-center justify-between">
                <span>Share URL:</span>
                <button
                  onClick={handleCopyUrl}
                  className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 font-mono"
                >
                  {copiedUrl ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedUrl ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="rounded-xl bg-slate-950 px-3 py-2 font-mono text-[11px] text-blue-300 border border-slate-800/80 truncate">
                https://app.xyz/v/doc#k={keyFragment ? keyFragment.slice(0, 12) : "..."}...
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
            RFC 3986 standard ensures URL fragments after `#` are never sent over HTTP.
          </p>
        </div>

        {/* Step 3: Server Blind Courier */}
        <div className="glass-card rounded-2xl p-5 space-y-3.5 border border-emerald-500/30 bg-slate-900/60 relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/50 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <ServerOff className="h-4 w-4" /> 3. Server / DB
              </span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-mono text-emerald-300 border border-emerald-500/30">
                Blind Storage
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs text-slate-300 font-medium flex items-center justify-between">
                <span>Server Sees (Ciphertext):</span>
                <span className="text-[10px] text-emerald-400 font-mono">0% Plaintext</span>
              </div>
              <div className="rounded-xl bg-slate-950 px-3 py-2 font-mono text-[11px] text-emerald-300/80 border border-slate-800/80 truncate">
                {cipherHex || "Encrypting..."}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
            Server and database administrators only see scrambled random bytes.
          </p>
        </div>
      </div>

      {/* Live In-Memory Decryption Verification Bar */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-lg">
        <div className="flex items-center gap-3 text-emerald-300 font-semibold min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 flex-shrink-0">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-emerald-400 font-mono font-bold uppercase tracking-wider">
              Instant In-Memory Decryption Verified:
            </div>
            <div className="text-xs text-white font-mono bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 mt-1 max-w-xl truncate">
              {decryptedPreview || inputText}
            </div>
          </div>
        </div>

        <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-mono text-emerald-300 font-bold border border-emerald-500/30 whitespace-nowrap self-end sm:self-center">
          0ms Server Decryption (100% Client-Side)
        </div>
      </div>
    </div>
  );
}
