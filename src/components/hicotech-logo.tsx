import { clsx } from "clsx";

type HicotechLogoProps = {
  compact?: boolean;
  inverse?: boolean;
  markOnly?: boolean;
  size?: "sm" | "md" | "lg" | "full";
};

export function HicotechLogo({ compact = false, inverse = false, markOnly = false, size = "md" }: HicotechLogoProps) {
  const sizes = {
    sm: "w-36",
    md: "w-48",
    lg: "w-72",
    full: "w-full"
  };

  return (
    <div
      className={clsx("max-w-full select-none [container-type:inline-size]", compact ? "w-full" : sizes[size])}
      aria-label="HICOTECH Informatique Simplifiée"
    >
      <div
        className={clsx(
          "relative overflow-visible border-[4px] border-b-0 bg-white px-1 pb-1 pt-1",
          inverse ? "border-cyan-200 bg-white" : "border-cyan-200 bg-white"
        )}
      >
        <div className="flex items-end justify-center gap-[1px] leading-none">
          <span className="font-display text-[clamp(1.25rem,16cqw,3.2rem)] font-black text-[#079ad1]">H</span>
          {!markOnly && (
            <span className="font-display text-[clamp(1.25rem,16cqw,3.2rem)] font-black text-black">ICOTEC</span>
          )}
          <span className="font-display text-[clamp(1.25rem,16cqw,3.2rem)] font-black text-cyan-200">H</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-2 translate-y-full bg-[#079ad1]" />
      </div>
      {!markOnly && (
        <div
          className={clsx(
            compact
              ? "mt-3 text-center font-display text-[10px] font-bold uppercase tracking-[0.08em]"
              : "mt-4 text-center font-display text-sm font-bold uppercase tracking-[0.08em]",
            inverse ? "text-white" : "text-black"
          )}
        >
          Informatique Simplifiée
        </div>
      )}
    </div>
  );
}
