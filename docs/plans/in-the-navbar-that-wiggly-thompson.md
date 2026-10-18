# Remove "Tính năng" link from the Navbar

## Context
The Navbar has both a "Tính năng" link (`/#features`) and a "Công cụ" dropdown listing every tool. They duplicate each other, so the "Tính năng" link is no longer needed.

## Change
- [components/Navbar.tsx](../../components/Navbar.tsx): delete `{ href: "/#features", label: dict.nav.features }` from the `links` array. That removes it from both the desktop nav and the mobile menu, since both render `links`.
- Keep `dict.nav.features` in `lib/i18n/vi.ts`, because `components/Features.tsx:12` still uses it as the section eyebrow. The `#features` section on the landing page stays.
- No userguide changes: it doesn't mention the nav link.

## Verification
- `pnpm run lint` and `pnpm run build` pass.
- `pnpm run dev`: check that the desktop nav and the mobile menu no longer show "Tính năng" and that "Công cụ" still works.
- Commit on main.
