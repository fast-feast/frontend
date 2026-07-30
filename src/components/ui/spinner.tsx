import { cn } from "@/lib/utils"
import { SpinnerLoader } from "./loading-animation"

function Spinner({ className, size, ...props }: { className?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("flex items-center justify-center", className)}
      {...props}
    >
      <SpinnerLoader size={size || "sm"} />
    </div>
  )
}

export { Spinner }
