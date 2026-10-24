import type { InputHTMLAttributes, ReactNode } from "react";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
}

export function Checkbox({ label, id, ...props }: CheckboxProps) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 text-sm text-slate-700">
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 accent-primary"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}
