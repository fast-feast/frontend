import { motion } from "framer-motion"
import { UtensilsCrossed, ChefHat, Loader2Icon } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────

type AnimationVariant =
  | "spinner"       // Classic spinning ring + utensil icon
  | "dots"          // Three bouncing gradient dots
  | "bounce"        // Bouncing utensil icon with shadow
  | "pulse"         // Pulsing glow ring
  | "skeleton"      // Shimmer skeleton placeholder
  | "fullscreen"    // Full page overlay with orbiting food emojis
  | "card"          // Card skeleton with multiple lines

interface LoadingAnimationProps {
  variant?: AnimationVariant
  message?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

// ─── Sub-components ──────────────────────────────────────

/** Spinning ring with a utensil icon in the center */
function SpinnerLoader({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const dimensions = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }
  const iconSizes = { sm: 14, md: 20, lg: 26 }

  return (
    <div className={cn("relative flex items-center justify-center", dimensions[size], className)}>
      {/* Outer spinning ring */}
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-transparent"
        style={{
          borderTopColor: "#FF6B35",
          borderRightColor: "#D94A5A",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      />
      {/* Inner counter-spinning ring */}
      <motion.div
        className="absolute inset-1 rounded-full border-2 border-transparent opacity-60"
        style={{
          borderBottomColor: "#FF6B35",
          borderLeftColor: "#D94A5A",
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      />
      {/* Center icon */}
      <ChefHat size={iconSizes[size]} className="text-[#FF6B35] relative z-10" />
    </div>
  )
}

/** Three bouncing dots with gradient colors */
function DotsLoader({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const dotSizes = { sm: "w-1.5 h-1.5", md: "w-2 h-2", lg: "w-3 h-3" }
  const colors = ["#FF6B35", "#D94A5A", "#FF9B4A"]

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {colors.map((color, i) => (
        <motion.div
          key={i}
          className={cn("rounded-full", dotSizes[size])}
          style={{ backgroundColor: color }}
          animate={{
            y: [0, -8, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

/** Bouncing utensil icon with shadow */
function BounceLoader({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const dimensions = { sm: "w-8 h-8", md: "w-12 h-12", lg: "w-16 h-16" }
  const iconSizes = { sm: 16, md: 22, lg: 30 }

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <motion.div
        className={cn("rounded-full food-gradient flex items-center justify-center", dimensions[size])}
        style={{ boxShadow: "0 0 20px rgba(255, 107, 53, 0.3)" }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <UtensilsCrossed size={iconSizes[size]} className="text-white" />
      </motion.div>
      {/* Shadow */}
      <motion.div
        className="mt-1 rounded-full bg-black/30"
        style={{
          width: "80%",
          height: 4,
          filter: "blur(2px)",
        }}
        animate={{ scaleX: [1, 0.6, 1], opacity: [0.3, 0.15, 0.3] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  )
}

/** Pulsing glow ring animation */
function PulseLoader({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const dimensions = { sm: "w-8 h-8", md: "w-12 h-12", lg: "w-16 h-16" }

  return (
    <div className={cn("relative flex items-center justify-center", dimensions[size], className)}>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,107,53,0.3) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-1 rounded-full border-2 border-[#FF6B35]/40"
        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="w-3 h-3 rounded-full food-gradient"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  )
}

/** Enhanced shimmer skeleton with gradient sweep */
function SkeletonLoader({
  className,
  count = 1,
  ...props
}: React.ComponentProps<"div"> & { count?: number; variant?: "card" | "line" }) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="relative overflow-hidden rounded-xl bg-card">
          <motion.div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.06), transparent)",
              transform: "skewX(-20deg)",
            }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
          />
          <div className="h-full w-full bg-card" />
        </div>
      ))}
    </div>
  )
}

/** Full-page loading overlay with orbiting food emojis */
const FOOD_EMOJIS = ["🍔", "🍕", "🌮", "🥗", "☕", "🍩", "🍜", "🍣", "🥘", "🧁"]

// Inject keyframes for orbit animations
const ORBIT_STYLES = FOOD_EMOJIS.map(
  (_, i) =>
    `@keyframes orbit-${i} {
      0% { transform: rotate(${i * 60}deg) translateX(${70 + i * 4}px) rotate(-${i * 60}deg); }
      100% { transform: rotate(${i * 60 + 360}deg) translateX(${70 + i * 4}px) rotate(-${i * 60 + 360}deg); }
    }`
).join("\n")

function FullscreenLoader({ message, className }: { message?: string; className?: string }) {
  return (
    <div
      className={cn(
        "screen-surface h-full flex flex-col items-center justify-center relative overflow-hidden",
        className,
      )}
    >
      {/* Orbit styles */}
      <style>{ORBIT_STYLES}</style>

      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#E83F4D]/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[#E83F4D]/8 blur-[100px] pointer-events-none" />

      {/* Orbiting food emojis */}
      <div className="relative w-[160px] h-[160px] flex items-center justify-center mb-2">
        {FOOD_EMOJIS.slice(0, 6).map((emoji, i) => (
          <motion.div
            key={i}
            className="absolute text-lg"
            style={{
              left: "50%",
              top: "50%",
              marginLeft: -10,
              marginTop: -10,
              animation: `orbit-${i} ${3 + i * 0.3}s linear infinite`,
            }}
            animate={{
              scale: [1, 1.15, 1],
            }}
            transition={{
              scale: {
                duration: 1.5 + i * 0.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.2,
              },
            }}
          >
            {emoji}
          </motion.div>
        ))}

        {/* Center spinner */}
        <SpinnerLoader size="md" />
      </div>

      {/* Message */}
      {message && (
        <motion.p
          className="text-xs text-[#6B6B6B] mt-4 font-medium tracking-wide"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {message}
        </motion.p>
      )}
    </div>
  )
}

/** Card skeleton: simulates a card with image, title, and description */
function CardSkeleton({ count = 1, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("flex gap-3 overflow-x-auto no-scrollbar pb-2", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex-shrink-0 w-[260px] xs:w-[280px] sm:w-[300px] md:w-[320px] lg:w-[340px] rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(30,30,54,0.8), rgba(40,40,72,0.6))",
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          {/* Image placeholder */}
          <div className="relative h-[100px] xs:h-[110px] md:h-[130px] lg:h-[150px] overflow-hidden">
            <motion.div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.08), transparent)",
                transform: "skewX(-20deg)",
              }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
            />
            <div className="w-full h-full bg-card" />
          </div>

          {/* Content placeholders */}
          <div className="p-3 space-y-2">
            <div className="h-4 w-3/4 rounded-md bg-card overflow-hidden relative">
              <motion.div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.06), transparent)",
                  transform: "skewX(-20deg)",
                }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
            <div className="h-3 w-1/2 rounded-md bg-card/60 overflow-hidden relative">
              <motion.div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.04), transparent)",
                  transform: "skewX(-20deg)",
                }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.1 }}
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="h-5 w-16 rounded-md bg-card overflow-hidden relative">
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.06), transparent)",
                    transform: "skewX(-20deg)",
                  }}
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                />
              </div>
              <div className="h-4 w-12 rounded-md bg-card/60 overflow-hidden relative">
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.04), transparent)",
                    transform: "skewX(-20deg)",
                  }}
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.15 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Inline skeleton components for various layouts ──────

/** Menu item skeleton — simulates a food menu card */
function MenuItemSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2 max-w-3xl">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="bg-card rounded-2xl p-3 flex gap-3 overflow-hidden relative"
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.04), transparent)",
              transform: "skewX(-20deg)",
            }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Image */}
          <div className="w-16 xs:w-20 h-16 xs:h-20 rounded-xl bg-card-elevated flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 w-3/4 rounded bg-card-elevated" />
            <div className="h-3 w-full rounded bg-card-elevated/60" />
            <div className="flex items-center gap-2">
              <div className="h-5 w-16 rounded bg-card-elevated" />
              <div className="h-4 w-14 rounded bg-card-elevated/60" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/** List item skeleton — for order lists, profile lists etc. */
function ListItemSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="bg-card rounded-2xl p-4 space-y-2 overflow-hidden relative"
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.04), transparent)",
              transform: "skewX(-20deg)",
            }}
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.08 }}
          />
          <div className="flex items-center justify-between">
            <div className="h-5 w-24 rounded bg-card-elevated" />
            <div className="h-4 w-16 rounded bg-card-elevated/60" />
          </div>
          <div className="h-3 w-full rounded bg-card-elevated/40" />
          <div className="flex items-center justify-between pt-1">
            <div className="h-5 w-20 rounded bg-card-elevated" />
            <div className="h-7 w-16 rounded-full bg-card-elevated/60" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}

/** Order tracking skeleton */
function OrderTrackingSkeleton() {
  return (
    <div className="space-y-4 px-4 md:px-6 lg:px-8">
      {/* Token card */}
      <div className="bg-card rounded-2xl p-4 md:p-5 flex items-center justify-between overflow-hidden relative">
        <motion.div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,107,53,0.04), transparent)",
            transform: "skewX(-20deg)",
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="space-y-2">
          <div className="h-10 w-32 rounded bg-card-elevated" />
          <div className="h-3 w-40 rounded bg-card-elevated/60" />
        </div>
        <div className="w-16 h-16 rounded-xl bg-card-elevated" />
      </div>

      {/* Timeline steps */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-card-elevated flex-shrink-0" />
          <div className="flex-1 space-y-1.5 pt-2">
            <div className="h-4 w-28 rounded bg-card-elevated" />
            <div className="h-3 w-20 rounded bg-card-elevated/60" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Login button loading state */
function ButtonLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2Icon size={16} className="animate-spin" />
      <span className="text-sm font-medium">Signing in...</span>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────

function LoadingAnimation({
  variant = "spinner",
  message,
  size = "md",
  className,
}: LoadingAnimationProps) {
  // Fullscreen is rendered directly (handles its own full-page layout)
  if (variant === "fullscreen") {
    return <FullscreenLoader message={message} className={className} />
  }

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      {variant === "spinner" && <SpinnerLoader size={size} />}
      {variant === "dots" && <DotsLoader size={size} />}
      {variant === "bounce" && <BounceLoader size={size} />}
      {variant === "pulse" && <PulseLoader size={size} />}
      {variant === "skeleton" && <SkeletonLoader count={3} />}
      {variant === "card" && <CardSkeleton count={3} />}
      {message && (
        <motion.p
          className="text-xs text-[#6B6B6B] mt-3 font-medium tracking-wide"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {message}
        </motion.p>
      )}
    </div>
  )
}

export {
  LoadingAnimation,
  SpinnerLoader,
  DotsLoader,
  BounceLoader,
  PulseLoader,
  SkeletonLoader,
  FullscreenLoader,
  CardSkeleton,
  MenuItemSkeleton,
  ListItemSkeleton,
  OrderTrackingSkeleton,
  ButtonLoader,
}
