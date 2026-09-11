# العائلة الناجحة — ملاحظات للعمل على هذا المستودع

- Stack: Expo (Expo Router) + TypeScript + Supabase (Postgres/Auth/RLS) + react-query + zustand + i18next.
- Path alias `@/*` → `src/*` (configured in `tsconfig.json` and `babel.config.js`).
- All Supabase access goes through `src/services/*` — screens never call `supabase.from(...)` directly except inside a service file.
- Any table touching points/approvals/redemptions is writable only via the RPC functions in `supabase/migrations/0003_functions.sql` — never add a direct client INSERT/UPDATE for those.
- Admin/owner features live under `app/(owner)/` and `src/services/admin.service.ts`. Ownership is never granted by matching an email in app code — only via the one-time `supabase/owner_bootstrap.sql`. New admin-writable tables should get the `audit_table_change` trigger (see `0005_admin_rbac.sql`) so changes are auditable for free.
- No payment provider is connected yet (deferred by the user's own request) — `payments` rows are always `pending_provider`. Don't wire real charging without being asked; keep that fact visible in the UI.
- i18n resources live in `src/i18n/locales/{ar,en}.json`; add new keys to both files.
- See `README.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md` before making structural changes.

@AGENTS.md
