import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "terminal";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-green disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const variants = {
    primary:
      "bg-neon-green text-black hover:bg-[#00e67a] active:bg-[#00cc6c] font-semibold shadow-[0_0_15px_rgba(0,255,136,0.3)] hover:shadow-[0_0_20px_rgba(0,255,136,0.5)]",
    secondary:
      "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 active:bg-zinc-600 border border-zinc-700",
    danger:
      "bg-red-950/80 text-red-200 border border-red-800/80 hover:bg-red-900/80 active:bg-red-800",
    ghost:
      "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 active:bg-zinc-800",
    terminal:
      "bg-black border border-neon-green/50 text-neon-green hover:bg-neon-green/10 hover:border-neon-green font-mono shadow-[0_0_10px_rgba(0,255,136,0.15)]",
  };

  const sizes = {
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3.5 py-1.5 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
