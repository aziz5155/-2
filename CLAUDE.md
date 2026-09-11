# العائلة الناجحة — ملاحظات للعمل على هذا المستودع

- Stack: Expo (Expo Router) + TypeScript + Supabase (Postgres/Auth/RLS) + react-query + zustand + i18next.
- Path alias `@/*` → `src/*` (configured in `tsconfig.json` and `babel.config.js`).
- All Supabase access goes through `src/services/*` — screens never call `supabase.from(...)` directly except inside a service file.
- Any table touching points/approvals/redemptions is writable only via the RPC functions in `supabase/migrations/0003_functions.sql` — never add a direct client INSERT/UPDATE for those.
- i18n resources live in `src/i18n/locales/{ar,en}.json`; add new keys to both files.
- See `README.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md` before making structural changes.

@AGENTS.md
