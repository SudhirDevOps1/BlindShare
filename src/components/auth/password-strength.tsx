"use client";

import React from "react";
import { CheckCircle2, Circle } from "lucide-react";

export interface PasswordRuleResult {
  label: string;
  met: boolean;
}

export function evaluatePassword(password: string, minLength = 10): PasswordRuleResult[] {
  return [
    { label: `At least ${minLength} characters`, met: password.length >= minLength },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One digit", met: /[0-9]/.test(password) },
    { label: "One symbol (!@#$…)", met: /[^A-Za-z0-9]/.test(password) },
  ];
}

export function PasswordStrengthMeter({ password, minLength = 10 }: { password: string; minLength?: number }) {
  const rules = evaluatePassword(password, minLength);
  const metCount = rules.filter((r) => r.met).length;
  const percent = (metCount / rules.length) * 100;

  const barColor =
    metCount <= 1 ? "bg-red-500" : metCount <= 3 ? "bg-amber-500" : metCount === 4 ? "bg-amber-400" : "bg-emerald-500";
  const label = metCount <= 1 ? "Weak" : metCount <= 3 ? "Fair" : metCount === 4 ? "Good" : "Strong";

  if (password.length === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <span>Password strength</span>
        <span
          className={`font-semibold ${
            metCount <= 1 ? "text-red-400" : metCount <= 3 ? "text-amber-400" : "text-emerald-400"
          }`}
        >
          {label}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full transition-all duration-300 ${barColor}`} style={{ width: `${percent}%` }} />
      </div>
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {rules.map((r) => (
          <li key={r.label} className="flex items-center gap-1.5 text-[10px] text-slate-400">
            {r.met ? (
              <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" />
            ) : (
              <Circle className="h-3 w-3 shrink-0 text-slate-600" />
            )}
            <span className={r.met ? "text-slate-300" : ""}>{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
