import Image from "next/image";
import { clsx } from "clsx";
import { branding } from "@/lib/branding";

type LogoProps = {
  variant?: "full" | "icon";
  tone?: "light" | "dark";
  size?: "sm" | "md" | "lg" | "full";
  showProductName?: boolean;
  className?: string;
};

const fullSizeClasses = {
  sm: "h-14 w-40",
  md: "h-20 w-56",
  lg: "h-28 w-80",
  full: "h-full w-full"
};

const iconSizeClasses = {
  sm: "size-12",
  md: "size-16",
  lg: "size-20",
  full: "size-full"
};

export function Logo({
  variant = "full",
  tone = "light",
  size = "md",
  showProductName = false,
  className
}: LogoProps) {
  const iconOnly = variant === "icon";

  return (
    <div className={clsx("max-w-full select-none", className)}>
      <div
        className={clsx(
          "relative overflow-hidden",
          iconOnly ? iconSizeClasses[size] : fullSizeClasses[size],
          tone === "dark" ? "text-white" : "text-hicotech-navy"
        )}
      >
        <Image
          src={iconOnly ? branding.assets.logo.icon : branding.assets.logo.full}
          alt={branding.assets.logo.alt}
          fill
          sizes={iconOnly ? "80px" : "(max-width: 768px) 180px, 320px"}
          className="object-contain"
          priority={size === "lg"}
        />
      </div>
      {showProductName && !iconOnly && (
        <p className="mt-3 text-center font-display text-sm font-bold">
          {branding.productName}
        </p>
      )}
    </div>
  );
}
