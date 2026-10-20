"use client";

import { motion } from "motion/react";
import type { ComponentPropsWithoutRef, ElementType, MouseEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const movingMap = {
  TOP: "radial-gradient(20.7% 50% at 50% 0%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
  LEFT: "radial-gradient(16.6% 43.1% at 0% 50%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
  BOTTOM: "radial-gradient(20.7% 50% at 50% 100%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
  RIGHT: "radial-gradient(16.2% 41.2% at 100% 50%, hsl(0, 0%, 100%) 0%, rgba(255, 255, 255, 0) 100%)",
} as const;

type HoverBorderGradientProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  duration?: number;
  animateOnHoverOnly?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

export function HoverBorderGradient<T extends ElementType = "button">({
  as,
  children,
  className,
  containerClassName,
  duration = 1,
  animateOnHoverOnly = false,
  ...props
}: HoverBorderGradientProps<T>) {
  const [direction, setDirection] = useState<keyof typeof movingMap>("TOP");
  const [hovered, setHovered] = useState(false);
  const Component = motion.create((as ?? "button") as ElementType);

  useEffect(() => {
    if (hovered || animateOnHoverOnly) return;

    // Check prefers-reduced-motion
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let intervalId: number | null = null;

    const startInterval = () => {
      if (intervalId !== null) clearInterval(intervalId);
      intervalId = window.setInterval(() => {
        setDirection((current) => {
          const directions = Object.keys(movingMap) as Array<keyof typeof movingMap>;
          return directions[(directions.indexOf(current) + 1) % directions.length];
        });
      }, duration * 1000);
    };

    const stopInterval = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopInterval();
      } else {
        startInterval();
      }
    };

    if (!document.hidden) {
      startInterval();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopInterval();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [duration, hovered]);

  return (
    <Component
      {...props}
      onMouseEnter={(event: MouseEvent<HTMLElement>) => {
        setHovered(true);
        props.onMouseEnter?.(event);
      }}
      onMouseLeave={(event: MouseEvent<HTMLElement>) => {
        setHovered(false);
        props.onMouseLeave?.(event);
      }}
      onFocus={(event: any) => {
        setHovered(true);
        props.onFocus?.(event);
      }}
      onBlur={(event: any) => {
        setHovered(false);
        props.onBlur?.(event);
      }}
      className={cn(
        "relative isolate inline-flex w-fit items-center justify-center overflow-visible rounded-full border border-white/25 bg-black/20 p-px text-sm transition duration-500 hover:bg-black/10 dark:bg-white/20",
        containerClassName,
      )}
    >
      <motion.span
        className="pointer-events-none absolute -inset-1 z-0 overflow-hidden rounded-[inherit]"
        style={{ filter: "blur(6px)" }}
        animate={{ background: hovered ? "radial-gradient(75% 181.16% at 50% 50%, #3275F8 0%, rgba(255, 255, 255, 0) 100%)" : movingMap[direction] }}
        transition={{ duration: 0.35 }}
      />
      <span className={cn("relative z-10 flex w-auto items-center justify-center rounded-[inherit] bg-white px-4 py-2 text-black", className)}>
        {children}
      </span>
    </Component>
  );
}

export default HoverBorderGradient;
