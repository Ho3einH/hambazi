import Image from "next/image";

export function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span className={`avatar avatar-${size}`} aria-label={name}>
      {src ? <Image src={src} alt="" fill sizes="(max-width: 600px) 52px, 72px" /> : initials}
    </span>
  );
}
