import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantClasses = {
    default: "border-transparent bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30",
    secondary: "border-transparent bg-gray-500/20 text-gray-300 border border-gray-500/30 hover:bg-gray-500/30",
    destructive: "border-transparent bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30",
    outline: "text-gray-300 border-gray-500/30",
  }

  return (
    <div 
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900",
        variantClasses[variant],
        className
      )} 
      {...props} 
    />
  )
}

export { Badge }