import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export default function Button({ variant = "primary", className = "", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const styles: Record<string, string> = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-400",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 focus:ring-slate-300",
    ghost: "bg-transparent text-slate-900 hover:bg-slate-100 focus:ring-slate-300",
    danger: "bg-red-600 text-white hover:bg-red-500 focus:ring-red-300",
  };

  return <button className={`${base} ${styles[variant]} ${className}`} {...props} />;
}
