import * as React from "react";

export const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => <input ref={ref} type="checkbox" className="h-4 w-4 rounded border" {...props} />
);

Checkbox.displayName = "Checkbox";
