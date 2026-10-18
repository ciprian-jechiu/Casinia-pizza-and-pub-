import Image from "next/image";

/** Logo-ul oficial Casinia (frunza verde + „CASINIA / PIZZA PUB”), fișierul original, fundal transparent. */
export const LOGO_SRC =
  "https://img.ps.me/cdn-cgi/image/width=600,format=png/https://img.ps.me/30836/3061f583-5766-4211-b6ff-1bf8cb49937c_image.png";
/** proporțiile fișierului original (4636 × 4472) */
const RATIO = 4636 / 4472;

export function Logo({ height = 56, className = "", priority = false }: { height?: number; className?: string; priority?: boolean }) {
  return (
    <Image
      src={LOGO_SRC}
      alt="Casinia Pizza Pub"
      width={Math.round(height * RATIO)}
      height={height}
      priority={priority}
      className={`block select-none ${className}`}
      style={{ height, width: "auto" }}
    />
  );
}
