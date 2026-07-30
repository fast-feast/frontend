import { cn } from "@/lib/utils"
import { SkeletonLoader } from "./loading-animation"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("rounded-md", className)}
      {...props}
    >
      <SkeletonLoader count={1} className="h-full w-full" />
    </div>
  )
}

export { Skeleton }
