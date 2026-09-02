"use client";

import React, { useState, useEffect } from "react";
import {
  Lock,
  Cpu,
  ServerOff,
  CheckCircle2,
  Key,
  RefreshCw,
} from "lucide-react";
import { generateDocKey, encryptBytes, decryptBytes, docKeyToFragment, bufferToHex } from "@/lib/crypto-core";

export function CryptoInteractiveDemo() {
  const [inputText, setInputText] = useState("Confidential Financial Projections 2026 - Q4 Deal Terms");
  const [keyHex, setKeyHex] = useState("");
  const [keyFragment, setKeyFragment] = useState("");
  const [cipherHex, setCipherHex] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [decryptedPreview, setDecryptedPreview] = useState("");

  const runLiveEncryption = async (text: string) => {
    try {
      setIsEncrypting(true);
      const encoder = new TextEncoder();
      const rawBytes = encoder.encode(text);

      // 1. WebCrypto random 256-bit key
      const key = generateDocKey();
      const fragment = docKeyToFragment(key);
      const hex = bufferToHex(key);

      setKeyHex(hex);
      setKeyFragment(fragment);

      // 2. AES-GCM-256 Client-side Encrypt
      const { ciphertext, iv } = await encryptBytes(rawBytes.buffer, key);
      const cipherHexStr = bufferToHex(ciphertext.slice(0, 32)) + "...";
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

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl border border-amber-500/30 bg-slate-950/80 shadow-2xl shadow-amber-500/10 backdrop-blur-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-500/10 blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-blue-500/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Header bar with live status */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-md">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Live Zero-Knowledge WebCrypto Simulator
              </h3>
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active in Browser RAM
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Type anything below to see real-time AES-GCM-256 client encryption before server transit.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => runLiveEncryption(inputText)}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-amber-500/40 transition-all shadow-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-amber-400 ${isEncrypting ? "animate-spin" : ""}`} />
            <span>Regenerate Key</span>
          </button>
        </div>
      </div>

      {/* Input Simulator */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span>Test Input Document Content:</span>
          <span className="text-[11px] text-amber-400/90 font-mono">WebCrypto API `crypto.subtle`</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              runLiveEncryption(e.target.value);
            }}
            placeholder="Type confidential document text..."
            className="w-full rounded-2xl border border-slate-700/90 bg-slate-900/90 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all font-medium shadow-inner"
          />
        </div>
      </div>

      {/* 3-Step Cryptographic Flow Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
        {/* Step 1: Client Memory */}
        <div className="glass-card rounded-2xl p-4.5 space-y-3 border border-amber-500/20 bg-slate-900/50 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              <Lock className="h-3.5 w-3.5" /> 1. Browser RAM
            </span>
            <span className="text-[10px] font-mono text-slate-500">Device Local</span>
          </div>
          <div className="space-y-1.5">
            <div className="text-xs text-slate-300 font-medium">Generated 256-bit Key:</div>
            <div className="rounded-xl bg-slate-950 p-2.5 font-mono text-[10px] text-amber-300/90 border border-slate-800 break-all select-all">
              {keyHex || "Deriving in RAM..."}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Generated via CSPRNG `crypto.getRandomValues(32)`. Never leaves device memory.
          </p>
        </div>

        {/* Step 2: URL Fragment Transport */}
        <div className="glass-card rounded-2xl p-4.5 space-y-3 border border-blue-500/20 bg-slate-900/50 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 uppercase tracking-wider">
              <Key className="h-3.5 w-3.5" /> 2. #Fragment (#k=)
            </span>
            <span className="text-[10px] font-mono text-emerald-400">RFC 3986 Safe</span>
          </div>
          <div className="space-y-1.5">
            <div className="text-xs text-slate-300 font-medium">Recipient Share URL:</div>
            <div className="rounded-xl bg-slate-950 p-2.5 font-mono text-[10px] text-blue-300 border border-slate-800 break-all select-all">
              https://app.xyz/v/demo#k={keyFragment ? keyFragment.slice(0, 16) : "..."}...
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            URL fragments after `#` are strictly client-side and never transmitted over HTTP.
          </p>
        </div>

        {/* Step 3: Server Blind Courier */}
        <div className="glass-card rounded-2xl p-4.5 space-y-3 border border-emerald-500/20 bg-slate-900/50 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              <ServerOff className="h-3.5 w-3.5" /> 3. Server / DB
            </span>
            <span className="text-[10px] font-mono text-amber-400">Blind Courier</span>
          </div>
          <div className="space-y-1.5">
            <div className="text-xs text-slate-300 font-medium">Server Sees (Ciphertext):</div>
            <div className="rounded-xl bg-slate-950 p-2.5 font-mono text-[10px] text-emerald-300/80 border border-slate-800 break-all select-all">
              {cipherHex || "Encrypting..."}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Unreadable random bytes. The server has ZERO access to plaintext or keys.
          </p>
        </div>
      </div>

      {/* Live Decryption Check */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-emerald-300 font-medium">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Instant In-Memory Decryption Verification:</span>
          <span className="font-mono text-white bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 max-w-md truncate">
            {decryptedPreview}
          </span>
        </div>
        <div className="text-[11px] font-mono text-emerald-400/90 font-bold">
          0ms Server Decryption Time (100% Client-Side)
        </div>
      </div>
    </div>
  );
}
