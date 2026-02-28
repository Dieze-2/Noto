import React from "react";

export default function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={
        "w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300 " +
        (props.className ?? "")
      }
    />
  );
}
