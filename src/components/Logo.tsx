export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-2 leading-none ${className}`}>
      <span className="font-script text-[2rem] text-ottone">Casinia</span>
      <span className="text-[0.7rem] font-semibold tracking-[0.18em] text-crema-dim">PIZZA PUB</span>
    </span>
  );
}
