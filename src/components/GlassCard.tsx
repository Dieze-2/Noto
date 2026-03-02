import React from "react";

type GlassCardProps =
  | (React.ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" })
  | (React.HTMLAttributes<HTMLDivElement> & { as?: "div" });

export default function GlassCard(props: GlassCardProps & { className?: string; children: React.ReactNode }) {
  const { className = "", children } = props as any;

  const isClickable =
    typeof (props as any).onClick === "function" ||
    (props as any).role === "button" ||
    (props as any).tabIndex !== undefined;

  // Force button si cliquable sauf si as="div" explicit
  const as = (props as any).as ?? (isClickable ? "button" : "div");

  if (as === "button") {
    const { as: _as, ...rest } = props as React.ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" };
    return (
      <button
        type={(rest as any).type ?? "button"}
        {...rest}
        className={`glass-card text-left w-full ${className}`}
      >
        {children}
      </button>
    );
  }

  const { as: _as, ...rest } = props as React.HTMLAttributes<HTMLDivElement> & { as?: "div" };
  return (
    <div {...rest} className={`glass-card ${className}`}>
      {children}
    </div>
  );
}
