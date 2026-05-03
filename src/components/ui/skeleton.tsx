import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "line" | "circle" | "rect" | "card" | "text";
  width?: string;
  height?: string;
}

export function Skeleton({
  className,
  variant = "rect",
  width = "w-full",
  height = "h-4",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton",
        variant === "circle" && "rounded-full",
        variant === "line" && "rounded",
        variant === "rect" && "rounded-lg",
        variant === "card" && "rounded-2xl",
        variant === "text" && "rounded",
        width,
        height,
        className
      )}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={i === lines - 1 ? "h-3" : "h-4"}
          width={i === lines - 1 ? "w-3/4" : "w-full"}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton variant="rect" height="h-48" />
      <div className="space-y-2">
        <Skeleton variant="text" height="h-5" width="w-2/3" />
        <Skeleton variant="text" height="h-4" width="w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonImage() {
  return <Skeleton variant="rect" height="h-64" />;
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
