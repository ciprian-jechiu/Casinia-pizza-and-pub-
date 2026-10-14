import type { ReactNode } from "react";

export function Field({
  id,
  label,
  error,
  children,
  hint,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm text-crema-dim">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-crema-dim">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-[#e0836c]">
          {error}
        </p>
      )}
    </div>
  );
}

/** Mapează codurile de eroare de la API/zod la mesajele din dicționar. */
export function errorText(code: string | undefined, errors: Record<string, string>) {
  if (!code) return undefined;
  return errors[code] ?? errors.required;
}
