# Plan: GitHub Sponsors + "Ủng hộ" page, and delete companyProject (2026-10-19)

## Context

The audit (below) recommended voluntary donations for Hán Ngữ Studio: GitHub Sponsors first (Vietnam is a supported region, 0 % fee on personal sponsorships, verified on docs.github.com), plus VietQR bank transfer for Vietnamese users without international cards. Donations are allowed on Vercel Hobby. The owner also said `companyProject` (GitHub `backend` + `employmanagament`, local `C:\Users\nhann\Documents\companyProject`, 721 MB) can be deleted.

Decisions: VietQR on the page (owner supplies the QR image or bank, account number, holder name); tiers $2 / $5 / $10 monthly + one-time $5 / $20, thank-you only.

Step 0: move the audit report below into `docs/plans/2026-10-19-oss-audit.md` (local, not committed: it describes other repos) so this file holds only the plan.

## Part 1 — GitHub Sponsors (owner does the account steps; I prepare everything)

Account steps only the owner can do (identity, bank, tax, 2FA), in order:
1. Enable 2FA on GitHub if not on (Settings → Password and authentication); the API cannot show its status with the current token.
2. github.com/sponsors → **Get sponsored** → personal account → contact info → payout: **bank account** → accept terms → Submit.
3. Dashboard → **Stripe Connect account**: residence and bank must both be Vietnam; check every field before submitting.
4. Dashboard → Overview → tax form: **W-8BEN** (non-US individual; Vietnam has no US tax treaty, so leave treaty fields empty).
5. Paste the profile text and create the tiers I prepare (below), then **Request approval** (GitHub reviews in a few days).

What I prepare:
- `docs/sponsors-profile.md` (committed): short bio, introduction (what Hán Ngữ Studio is, what money pays for: domain/time/clean data licensing; "every tool stays free, donations unlock nothing"), featured repos (han-ngu-studio, HanziTracePDFGenerator, chinese-easy-tool), and tier texts:
  - Monthly $2 "Ủng hộ cà phê / Coffee" — thanks.
  - Monthly $5 "Người ủng hộ / Supporter" — thanks + name in the release notes if wanted.
  - Monthly $10 "Nhà tài trợ / Sponsor" — name listed in README "Sponsors" section (with consent).
  - One-time $5 and $20 — thanks.
  No services, priorities or features promised (keeps it a donation, not a sale).

## Part 2 — Site changes in han-ngu-studio (after approval, so links work)

- `.github/FUNDING.yml`: `github: khanhnhanbk` (shows the Sponsor button on all my repos via the repo; add to HanziTracePDFGenerator and chinese-easy-tool too).
- New page **`/ung-ho`** (+ `/en/ung-ho`), same pattern as `/giay-phep` (`app/giay-phep/page.tsx`, `components/legal/LegalPage.tsx`, `alternates()` in `lib/i18n/metadata.ts`): `components/support/SupportPage.tsx`, i18n block `support` in `lib/i18n/vi.ts` + `en.ts`.
  - Content: why support (costs, time), "donations are voluntary and unlock nothing", two cards: **VietQR** (static image `public/ung-ho/vietqr.png` + bank name/holder as text) and **GitHub Sponsors** link (`https://github.com/sponsors/khanhnhanbk`); a manual "Mục tiêu tháng" line only if the owner gives real numbers (no invented figures).
  - No tracking, no popups, no paywall; plain links.
- Footer: add "Ủng hộ dự án / Support the project" to the resources column (`components/Footer.tsx`, `dict.footer.links`).
- README "Support" section with the same wording.
- `/giay-phep` privacy list: one line that donating happens on GitHub / your bank, not on this site.
- userguide/README.md: one line linking the page.
- Not doing now (audit's later experiments): the post-export thank-you line, funding goal tracker.

## Part 3 — Delete companyProject

1. Backup first: `git bundle --all` of both repos into `~/repo-backups-2026-10-19/` (code only; skip `env/`, `node_modules`, `db.sqlite3`).
2. GitHub: delete `khanhnhanbk/backend` and `khanhnhanbk/employmanagament`. The gh token lacks `delete_repo`; owner runs `gh auth refresh -h github.com -s delete_repo` once (browser approval), then I run `gh repo delete … --yes`. (Or owner deletes in Settings → Danger zone.)
3. Local: delete `C:\Users\nhann\Documents\companyProject` (721 MB) after the bundles verify (`git bundle verify`).
4. Remove the companyProject lines from the audit status table.

## Verification

- `pnpm test`, `pnpm lint`, `pnpm build` pass; `/ung-ho` and `/en/ung-ho` render (Playwright screenshot, mobile + dark mode, no horizontal scroll, QR readable); footer link works in both locales.
- After approval: `https://github.com/sponsors/khanhnhanbk` returns 200 and the Sponsor button appears on the repo.
- `gh repo view khanhnhanbk/backend` → not found; bundles listed by `git bundle list-heads`.

