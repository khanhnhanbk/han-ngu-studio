# Animated icons

Copied from [animateicons](https://github.com/Avijit07x/animateicons) (MIT) with
`npx animateicons add lu-<name>`. Icon shapes come from [Lucide](https://lucide.dev) (ISC).
Animations use `motion` and stay still when the OS "reduce motion" setting is on.

Local edits after copying: the `onMouseEnter?.(e as any)` / `onMouseLeave?.(e as any)`
casts were removed so the files pass `@typescript-eslint/no-explicit-any`.

`trigger.tsx` is ours: `useIconTrigger` plays an icon while the whole button, link or
card is hovered or focused, and `IconButton` / `IconLink` wrap that for common cases.

To add an icon: `npx animateicons search <term>`, then `npx animateicons add lu-<name>`,
then apply the same `as any` fix.
