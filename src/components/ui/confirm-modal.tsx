"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, X, ShieldAlert } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onCancel]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={loading ? undefined : onCancel}
      />

      {/* Dialog Box */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/80 animate-in zoom-in-95 duration-150 space-y-4">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              variant === "danger"
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            }`}
          >
            {variant === "danger" ? <Trash2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          </div>

          <div className="flex-1">
            <h3 className="text-base font-bold text-white leading-snug">{title}</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{message}</p>
          </div>

          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-40"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-md disabled:opacity-50 ${
              variant === "danger"
                ? "bg-red-600 text-white hover:bg-red-500 shadow-red-600/20"
                : "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20"
            }`}
          >
            {loading && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            <span>{loading ? "Processing..." : confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
