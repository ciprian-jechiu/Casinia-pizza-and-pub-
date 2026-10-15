/**
 * Semnătura „Casinia” (culoarea exactă din logo) cu „PIZZA PUB” dedesubt,
 * așezate ca un monogram centrat. `tone="light"` = pe fundal crem.
 */
export function Logo({ className = "", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <span className={`inline-flex flex-col items-center leading-none ${className}`}>
      <span className={`font-script text-[1.9rem] transition-colors duration-500 ${tone === "light" ? "text-sabbia-scura" : "text-sabbia"}`}>
        Casinia
      </span>
      <span className="-mt-0.5 text-[0.5rem] font-semibold tracking-[0.42em] opacity-70">PIZZA PUB</span>
    </span>
  );
}
