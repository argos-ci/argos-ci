import { ComponentPropsWithRef, useId } from "react";
import { clsx } from "clsx";

export function FormCheckbox({
  className,
  id: idProp,
  label,
  ...props
}: ComponentPropsWithRef<"input"> & {
  label: React.ReactNode;
}) {
  const genId = useId();
  const id = idProp ?? genId;
  return (
    <div className={clsx(className, "flex gap-2")}>
      <input
        type="checkbox"
        id={id}
        className="disabled:opacity-disabled peer"
        {...props}
      />
      <label
        htmlFor={id}
        className="peer-disabled:opacity-disabled inline-block select-none font-medium"
      >
        {label}
      </label>
    </div>
  );
}
