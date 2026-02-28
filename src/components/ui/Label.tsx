import React from "react";

export default function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={"text-sm font-medium " + (props.className ?? "")} />;
}
