"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface IAmQButtonProps {
  onClick: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  title?: string;
}

/**
 * Reusable I AM Q button component for charts and tables
 * Matches the style from the AI Summary tile
 */
export function IAmQButton({ onClick, className, size = "sm", title = "I A:M Q" }: IAmQButtonProps) {
  const { theme } = useTheme();
  const themeValue = (theme === "light" ? "light" : "dark") as "dark" | "light";
  
  const sizeClasses = {
    sm: "h-8 w-8 p-1.5",
    md: "h-10 w-10 p-2",
    lg: "h-12 w-12 p-2.5",
  };
  
  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg bg-[#00FF88] text-black hover:bg-[#00FF88] hover:border-black border-[#00FF88] border-2 font-semibold shadow-sm hover:shadow-md transition-all flex items-center justify-center",
        sizeClasses[size],
        themeValue === "light" && "hover:text-black",
        className
      )}
      title={title}
      aria-label="Open I A:M Q Chat"
    >
      <MessageCircle 
        className={cn(
          iconSizes[size],
          "scale-x-[-1] text-black",
          themeValue === "light" && "hover:text-black"
        )} 
      />
    </button>
  );
}
