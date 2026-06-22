import { cn } from "@/lib/utils";

interface Props {
  current: number;
  max: number;
  className?: string;
}

export function CharCounter({ current, max, className }: Props) {
  const over = current > max;
  return (
    <div
      className={cn(
        "mt-1 text-right text-xs tabular-nums text-muted-foreground",
        over && "text-destructive",
        className,
      )}
    >
      {current} / {max}
    </div>
  );
}
