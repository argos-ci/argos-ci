import { ComponentPropsWithRef, useContext } from "react";
import { invariant } from "@argos/util/invariant";
import { clsx } from "clsx";
import {
  Heading,
  OverlayTriggerStateContext,
  Dialog as RACDialog,
  DialogProps as RACDialogProps,
} from "react-aria-components";
import type { OverlayTriggerState } from "react-stately";

import { Button, ButtonProps } from "./Button";

export { DialogTrigger } from "react-aria-components";

export function DialogFooter(props: ComponentPropsWithRef<"div">) {
  return (
    <div
      {...props}
      className={clsx(
        "bg-subtle flex items-center justify-end gap-4 border-t p-4",
        props.className,
      )}
    />
  );
}

export function DialogText(props: ComponentPropsWithRef<"p">) {
  return <p {...props} className={clsx("my-4", props.className)} />;
}

export function DialogBody(
  props: ComponentPropsWithRef<"div"> & {
    confirm?: boolean;
  },
) {
  return (
    <div
      {...props}
      className={clsx("p-4", props.confirm && "text-center", props.className)}
    />
  );
}

export function DialogTitle(props: {
  ref?: React.Ref<HTMLHeadingElement>;
  children: React.ReactNode;
}) {
  return (
    <Heading ref={props.ref} slot="title" className="mb-4 text-xl font-medium">
      {props.children}
    </Heading>
  );
}

export function useOverlayTriggerState(): OverlayTriggerState {
  const ctx = useContext(OverlayTriggerStateContext);
  invariant(
    ctx,
    "useOverlayTriggerState must be used within an OverlayTrigger",
  );
  return ctx;
}

export function DialogDismiss(props: {
  ref?: React.Ref<HTMLButtonElement>;
  children: React.ReactNode;
  onPress?: ButtonProps["onPress"];
  single?: boolean;
}) {
  const state = useOverlayTriggerState();
  return (
    <Button
      ref={props.ref}
      className={props.single ? "flex-1 justify-center" : undefined}
      variant="secondary"
      onPress={(event) => {
        props.onPress?.(event);
        state.close();
      }}
      autoFocus
    >
      {props.children}
    </Button>
  );
}

type DialogProps = RACDialogProps & {
  ref?: React.Ref<HTMLDivElement>;
  size?: "auto" | "medium";
};

export function Dialog({ className, size = "auto", ...props }: DialogProps) {
  return (
    <RACDialog
      ref={props.ref}
      className={clsx(
        className,
        "relative max-h-[inherit] overflow-auto focus:outline-none",
        size === "medium" && "w-[36rem]",
      )}
      {...props}
    />
  );
}
