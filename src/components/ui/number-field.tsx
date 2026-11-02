"use client";

import { useState, type InputHTMLAttributes } from "react";

type Props = {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "min" | "max" | "type">;

/**
 * A whole-number input that lets you type freely and only clamps when you leave the field.
 * (Clamping on every keystroke makes some numbers impossible to type: with a minimum of 7,
 * the "1" of "182" would instantly become 7.)
 */
export function NumberField({ value, min, max, onChange, onFocus, onBlur, onKeyDown, ...rest }: Props) {
  const [text, setText] = useState<string | null>(null); // null = not editing, show `value`
  const clamp = (n: number) => Math.max(min, Math.min(max, Math.round(n)));

  return (
    <input
      {...rest}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={text ?? String(value)}
      onFocus={(e) => {
        setText(String(value));
        onFocus?.(e);
      }}
      onChange={(e) => {
        const t = e.target.value;
        setText(t);
        const n = Number(t);
        if (t !== "" && Number.isFinite(n) && n >= min && n <= max) onChange(Math.round(n));
      }}
      onBlur={(e) => {
        const n = Number(text);
        if (text !== null && text !== "" && Number.isFinite(n)) onChange(clamp(n));
        setText(null);
        onBlur?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        onKeyDown?.(e);
      }}
    />
  );
}
