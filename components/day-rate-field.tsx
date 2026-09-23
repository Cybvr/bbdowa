"use client";

import * as React from "react";
import { Field, SelectField } from "@/components/detail-editor";
import { CREATOR_RATE_OPTIONS, type RateCurrency } from "@/lib/users";

export function DayRateField({
  currency,
  rateMin,
  onCurrencyChange,
  onRateMinChange,
}: {
  currency: RateCurrency;
  rateMin: number | null;
  onCurrencyChange: (currency: RateCurrency) => void;
  onRateMinChange: (rateMin: number | null) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Currency">
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Rate currency">
          {(["NGN", "USD"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={currency === option}
              onClick={() => {
                onCurrencyChange(option);
                onRateMinChange(null);
              }}
              className={`h-10 rounded-md border text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${currency === option ? "border-foreground bg-foreground text-background" : "border-border bg-background text-muted-foreground hover:border-foreground/50 hover:text-foreground"}`}
            >
              {option}
            </button>
          ))}
        </div>
      </Field>
      <SelectField
        label="Day rate range"
        value={rateMin === null ? undefined : String(rateMin)}
        onChange={(value) => onRateMinChange(Number(value))}
        options={CREATOR_RATE_OPTIONS[currency].map((option) => ({ value: String(option.value), label: option.label }))}
      />
    </div>
  );
}
