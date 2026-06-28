import { Logo } from "@/components/logo";

type HicotechLogoProps = {
  compact?: boolean;
  inverse?: boolean;
  markOnly?: boolean;
  size?: "sm" | "md" | "lg" | "full";
};

export function HicotechLogo({ compact = false, inverse = false, markOnly = false, size = "md" }: HicotechLogoProps) {
  return (
    <Logo
      variant={markOnly ? "icon" : "full"}
      tone={inverse ? "dark" : "light"}
      size={compact ? "full" : size}
    />
  );
}
