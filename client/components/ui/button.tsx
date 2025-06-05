import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border border-gray-700 bg-transparent hover:bg-gray-800 hover:text-white",
        secondary: "bg-black/40 backdrop-blur-sm border border-white/10 text-white hover:bg-white/10 hover:border-purple-500/30",
        ghost: "hover:bg-white/10 hover:text-white",
        link: "text-purple-400 underline-offset-4 hover:underline",
        premium: "bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200",
        glow: "relative group shadow-lg hover:shadow-xl overflow-hidden",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8",
        icon: "h-9 w-9",
        full: "w-full h-12 px-6 py-3"
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  glowEffect?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, glowEffect = false, children, ...props }, ref) => {
    if (glowEffect && variant === 'glow') {
      return (
        <button
          className={cn("w-full px-6 py-3 relative group", className)}
          ref={ref}
          {...props}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
          <span className="relative block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl py-3">
            {children}
          </span>
        </button>
      );
    }
    
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants }; 