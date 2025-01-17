import { clsx } from "clsx";

export function InitialAvatar(props: {
  ref?: React.Ref<HTMLDivElement>;
  className?: string;
  size?: number;
  color: string;
  initial: string;
  alt?: string;
}) {
  const size = props.size ?? 32;
  return (
    <div
      ref={props.ref}
      className={clsx(
        props.className,
        "flex select-none items-center justify-center rounded-full",
      )}
      style={{
        backgroundColor: props.color,
        width: size,
        height: size,
      }}
      role="img"
      aria-label={props.alt}
    >
      <svg width="100%" height="100%" viewBox="-50 -66 100 100">
        <text
          fill="white"
          fontWeight="600"
          textAnchor="middle"
          fontSize="50"
          fontFamily="Inter, sans-serif"
        >
          {props.initial}
        </text>
      </svg>
    </div>
  );
}
