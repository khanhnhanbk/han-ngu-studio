"use client";

import {
  useRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type FocusEvent,
  type ForwardRefExoticComponent,
  type MouseEvent,
  type RefAttributes,
} from "react";

/** Imperative handle every animateicons icon exposes. */
export interface AnimatedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

export type AnimatedIcon = ForwardRefExoticComponent<
  { size?: number; className?: string; "aria-hidden"?: boolean } & RefAttributes<AnimatedIconHandle>
>;

/**
 * Plays an icon while the pointer is over (or focus is in) the surrounding
 * element, not just the small SVG. Same idea as animateicons' useIconHover,
 * which we don't install because the icons are copied in.
 */
export function useIconTrigger() {
  const ref = useRef<AnimatedIconHandle>(null);
  const start = () => ref.current?.startAnimation();
  const stop = () => ref.current?.stopAnimation();
  return {
    ref,
    triggerProps: {
      onMouseEnter: start,
      onMouseLeave: stop,
      onFocus: start,
      onBlur: stop,
    },
  };
}

type Handlers<E> = {
  onMouseEnter?: (e: MouseEvent<E>) => void;
  onMouseLeave?: (e: MouseEvent<E>) => void;
  onFocus?: (e: FocusEvent<E>) => void;
  onBlur?: (e: FocusEvent<E>) => void;
};

/** Calls the caller's handlers as well as the icon trigger's. */
function merge<E>(own: Handlers<E>, trigger: ReturnType<typeof useIconTrigger>["triggerProps"]) {
  return {
    onMouseEnter: (e: MouseEvent<E>) => {
      trigger.onMouseEnter();
      own.onMouseEnter?.(e);
    },
    onMouseLeave: (e: MouseEvent<E>) => {
      trigger.onMouseLeave();
      own.onMouseLeave?.(e);
    },
    onFocus: (e: FocusEvent<E>) => {
      trigger.onFocus();
      own.onFocus?.(e);
    },
    onBlur: (e: FocusEvent<E>) => {
      trigger.onBlur();
      own.onBlur?.(e);
    },
  };
}

type IconProps = { icon: AnimatedIcon; iconSize?: number; iconClassName?: string };

/** A button with a decorative animated icon before its label. */
export function IconButton({
  icon: Icon,
  iconSize = 16,
  iconClassName,
  children,
  type = "button",
  ...props
}: IconProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  const { ref, triggerProps } = useIconTrigger();
  return (
    <button type={type} {...props} {...merge(props, triggerProps)}>
      <Icon ref={ref} size={iconSize} className={iconClassName} aria-hidden />
      {children}
    </button>
  );
}

/** A link with a decorative animated icon; `iconAfter` puts it after the label. */
export function IconLink({
  icon: Icon,
  iconSize = 16,
  iconClassName,
  iconAfter = false,
  children,
  ...props
}: IconProps & { iconAfter?: boolean } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { ref, triggerProps } = useIconTrigger();
  const icon = <Icon ref={ref} size={iconSize} className={iconClassName} aria-hidden />;
  return (
    <a {...props} {...merge(props, triggerProps)}>
      {!iconAfter && icon}
      {children}
      {iconAfter && icon}
    </a>
  );
}
