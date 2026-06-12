import { clsx } from "clsx";

type HicotechLogoProps = {
  compact?: boolean;
  inverse?: boolean;
  size?: "sm" | "md" | "lg";
};

export function HicotechLogo({ compact = false, inverse = false, size = "md" }: HicotechLogoProps) {
  const sizes = {
    sm: "w-36",
    md: "w-48",
    lg: "w-72"
  };

  return (
    <div className={clsx("select-none", compact ? "w-40" : sizes[size])} aria-label="HICOTECH Informatique Simplifiée">
      <div
        className={clsx(
          "relative border-[5px] border-b-0 px-1 pt-1",
          inverse ? "border-cyan-200 bg-white" : "border-cyan-200 bg-white"
        )}
      >
        <div className="flex items-end justify-center gap-[2px] leading-none">
          <span className="font-display text-[clamp(1.8rem,18vw,3.5rem)] font-black text-[#079ad1]">H</span>
          <span className="font-display text-[clamp(1.8rem,18vw,3.5rem)] font-black text-black">ICOTEC</span>
          <span className="font-display text-[clamp(1.8rem,18vw,3.5rem)] font-black text-cyan-200">H</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-3 translate-y-full bg-[#079ad1]" />
      </div>
      {!compact && (
        <div
          className={clsx(
            "mt-4 text-center font-display text-sm font-bold uppercase tracking-[0.08em]",
            inverse ? "text-white" : "text-black"
          )}
        >
          Informatique Simplifiée
        </div>
      )}
    </div>
  );
}
